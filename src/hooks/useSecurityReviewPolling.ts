'use client';

import { useEffect, useRef } from 'react';

export type SecurityReviewPollStatus = {
  status: string;
  resumeToken?: string;
  challengeSessionId?: string;
  userId?: string;
  loginAttemptId?: string;
  pollAfterMs?: number;
  message?: string;
  code?: string;
};

export type UseSecurityReviewPollingOptions = {
  reviewId: string | null;
  nonce: string | null;
  loginAttemptId?: string | null;
  challengeSessionId?: string | null;
  userId?: string | null;
  rememberMe?: boolean;
  enabled: boolean;
  poll: (
    reviewId: string,
    nonce: string,
    loginAttemptId?: string
  ) => Promise<SecurityReviewPollStatus>;
  onApproved: (status: SecurityReviewPollStatus) => void | Promise<void>;
  onTerminal: (status: SecurityReviewPollStatus) => void;
};

const DEFAULT_POLL_MS = 3000;

export function useSecurityReviewPolling({
  reviewId,
  nonce,
  loginAttemptId,
  enabled,
  poll,
  onApproved,
  onTerminal,
}: UseSecurityReviewPollingOptions): void {
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

    if (!enabled || !reviewId || !nonce) {
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
        const status = await pollRef.current(
          reviewId,
          nonce,
          loginAttemptId ?? undefined
        );
        if (cancelled) return;

        if (status.status === 'approved' && status.resumeToken) {
          clearScheduled();
          await onApprovedRef.current(status);
          return;
        }

        if (
          status.status === 'denied' ||
          status.status === 'expired' ||
          status.code === 'SECURITY_REVIEW_EXPIRED'
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
  }, [enabled, reviewId, nonce, loginAttemptId]);
}
