'use client';

import { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { apiClient } from '../../lib/api-client';
import { useSessionEmailMfa } from '@/hooks/useSessionEmailMfa';

interface StepUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export function StepUpModal({ isOpen, onClose, onSuccess }: StepUpModalProps) {
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasEmailMfa, setHasEmailMfa] = useState(false);
  const [hasTotpMfa, setHasTotpMfa] = useState(false);
  const {
    challengeId,
    emailCodeSent,
    isSending,
    sendError,
    sendEmailCode,
    resetEmailMfa,
  } = useSessionEmailMfa();

  const emailOnly = hasEmailMfa && !hasTotpMfa;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    void apiClient
      .getMFAStatus()
      .then((status) => {
        if (!cancelled) {
          setHasEmailMfa(status.methods.includes('email'));
          setHasTotpMfa(status.hasSecret);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasEmailMfa(false);
          setHasTotpMfa(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setPassword('');
    setMfaToken('');
    setError(null);
    resetEmailMfa();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (emailOnly && mfaToken && !challengeId) {
        setError('Send a verification code to your email first');
        return;
      }

      const token = await apiClient.performStepUp(
        password,
        mfaToken || undefined,
        challengeId ?? undefined
      );
      apiClient.cacheStepUpToken(token);
      resetForm();
      onSuccess(token);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Step-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">Confirm your identity</h2>
        <p className="text-sm text-gray-600 mb-4">
          Re-enter your password and MFA verification to continue with this sensitive action.
        </p>
        {(error || sendError) && <p className="text-sm text-red-600 mb-3">{error || sendError}</p>}
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {hasEmailMfa && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <p className="text-sm font-medium text-gray-900">Email verification code</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void sendEmailCode()}
                disabled={loading || isSending}
                className="w-full"
              >
                {isSending ? 'Sending…' : emailCodeSent ? 'Resend code' : 'Send code to email'}
              </Button>
              {emailCodeSent && (
                <p className="text-xs text-green-700">A verification code was sent to your email.</p>
              )}
            </div>
          )}

          <input
            type="text"
            placeholder={
              emailOnly
                ? '6-digit email code'
                : hasTotpMfa && hasEmailMfa
                  ? 'Authenticator, backup, or email code'
                  : 'MFA code (if enabled)'
            }
            className="w-full rounded border px-3 py-2"
            value={mfaToken}
            onChange={(e) => setMfaToken(e.target.value)}
            disabled={loading}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !password}>
              {loading ? 'Verifying…' : 'Continue'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
