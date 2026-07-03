'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function useSessionEmailMfa() {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const sendEmailCode = useCallback(async () => {
    setIsSending(true);
    setSendError(null);
    try {
      const response = await apiClient.sendSessionMfaEmailCode();
      setChallengeId(response.challengeId);
      setEmailCodeSent(true);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to send email code');
    } finally {
      setIsSending(false);
    }
  }, []);

  const resetEmailMfa = useCallback(() => {
    setChallengeId(null);
    setEmailCodeSent(false);
    setSendError(null);
  }, []);

  return {
    challengeId,
    emailCodeSent,
    isSending,
    sendError,
    sendEmailCode,
    resetEmailMfa,
  };
}
