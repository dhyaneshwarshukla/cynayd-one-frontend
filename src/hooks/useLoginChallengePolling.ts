'use client';

import { useEffect, useRef } from 'react';

export type LoginChallengePollStatus = {
  status: string;
  code?: string;
  accessToken?: string;
  pollAfterMs?: number;
};

export type UseLoginChallengePollingOptions = {
  challengeId: string | null;
  nonce: string | null;
  rememberMe: boolean;
  enabled: boolean;
  poll: (id: string, nonce: string, rememberMe: boolean) => Promise<LoginChallengePollStatus>;
  onApproved: (status: LoginChallengePollStatus) => void | Promise<void>;
  onTerminal: (status: LoginChallengePollStatus) => void;
};

const DEFAULT_POLL_MS = 2000;

/**
 * Adaptive login-approval polling using pollAfterMs from the API (2s → 5s → 10s).
 */
export function useLoginChallengePolling({
  challengeId,
  nonce,
  rememberMe,
  enabled,
  poll,
  onApproved,
  onTerminal,
}: UseLoginChallengePollingOptions): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onApprovedRef = useRef(onApproved);
  const onTerminalRef = useRef(onTerminal);
  const pollRef = useRef(poll);

  useEffect(() => {
    onApprovedRef.current = onApproved;
    onTerminalRef.current = onTerminal;
    pollRef.current = poll;
  });

  useEffect(() => {
    const clearScheduled = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (!enabled || !challengeId || !nonce) {
      clearScheduled();
      return;
    }

    let cancelled = false;

    const scheduleNext = (delayMs: number) => {
      clearScheduled();
      timeoutRef.current = setTimeout(() => {
        void tick();
      }, delayMs);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        const status = await pollRef.current(challengeId, nonce, rememberMe);
        if (cancelled) return;

        if (status.status === 'approved' && status.accessToken) {
          clearScheduled();
          await onApprovedRef.current(status);
          return;
        }

        if (
          status.status === 'rejected' ||
          status.status === 'cancelled' ||
          status.status === 'expired' ||
          status.code === 'CHALLENGE_EXPIRED' ||
          status.code === 'LOGIN_REJECTED' ||
          status.code === 'CHALLENGE_CANCELLED'
        ) {
          clearScheduled();
          onTerminalRef.current(status);
          return;
        }

        const nextMs =
          typeof status.pollAfterMs === 'number' && status.pollAfterMs > 0
            ? status.pollAfterMs
            : DEFAULT_POLL_MS;
        scheduleNext(nextMs);
      } catch {
        if (!cancelled) {
          scheduleNext(DEFAULT_POLL_MS);
        }
      }
    };

    void tick();

    return () => {
      cancelled = true;
      clearScheduled();
    };
  }, [enabled, challengeId, nonce, rememberMe]);
}

export const MOBILE_APPROVAL_SETUP_STORAGE_KEY = 'prompt_mobile_approval_setup';

export function markMobileApprovalSetupPrompt(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(MOBILE_APPROVAL_SETUP_STORAGE_KEY, '1');
  }
}

export function clearMobileApprovalSetupPrompt(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(MOBILE_APPROVAL_SETUP_STORAGE_KEY);
  }
}

export function shouldShowMobileApprovalSetupPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(MOBILE_APPROVAL_SETUP_STORAGE_KEY) === '1';
}
