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
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

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
  const consecutiveErrorsRef = useRef(0);

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
      consecutiveErrorsRef.current = 0;
      return;
    }

    let cancelled = false;
    consecutiveErrorsRef.current = 0;

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

        consecutiveErrorsRef.current = 0;

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
      } catch (error) {
        if (cancelled) return;
        consecutiveErrorsRef.current += 1;
        const responseStatus = (error as { response?: { status?: number } })?.response?.status;
        if (
          consecutiveErrorsRef.current >= MAX_CONSECUTIVE_POLL_ERRORS ||
          responseStatus === 401 ||
          responseStatus === 403
        ) {
          clearScheduled();
          onTerminalRef.current({
            status: 'expired',
            code: 'SECURITY_REVIEW_POLL_FAILED',
            message:
              'Unable to check security review status. Please sign in again or contact your administrator.',
          });
          return;
        }
        scheduleNext(DEFAULT_POLL_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      clearScheduled();
    };
  }, [enabled, reviewId, nonce, loginAttemptId]);
}
