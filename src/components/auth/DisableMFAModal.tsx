'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';
import { useSessionEmailMfa } from '@/hooks/useSessionEmailMfa';

interface DisableMFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type MfaStatus = {
  enabled: boolean;
  hasSecret: boolean;
  methods: string[];
};

export function DisableMFAModal({ isOpen, onClose, onSuccess }: DisableMFAModalProps) {
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const {
    challengeId,
    emailCodeSent,
    isSending,
    sendError,
    sendEmailCode,
    resetEmailMfa,
  } = useSessionEmailMfa();

  const hasEmailMfa = mfaStatus?.methods.includes('email') ?? false;
  const hasTotpMfa = mfaStatus?.hasSecret ?? false;
  const emailOnly = hasEmailMfa && !hasTotpMfa;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    void apiClient
      .getMFAStatus()
      .then((status) => {
        if (!cancelled) {
          setMfaStatus({
            enabled: status.enabled,
            hasSecret: status.hasSecret,
            methods: status.methods ?? [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) setMfaStatus({ enabled: true, hasSecret: true, methods: ['totp'] });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (!mfaToken.trim()) {
      setError(
        emailOnly
          ? 'Enter the 6-digit code sent to your email'
          : 'Enter your authenticator code, backup code, or email code'
      );
      return;
    }

    if (emailOnly && !challengeId) {
      setError('Send a verification code to your email first');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.disableMFA(
        password,
        mfaToken.trim(),
        challengeId ?? undefined
      );
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">Disable multi-factor authentication</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your account password and verify with your active MFA method to turn off MFA. Your
          account will be less protected.
        </p>

        {(error || sendError) && (
          <Alert variant="error" className="mb-4">
            {error || sendError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="disable-mfa-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="disable-mfa-password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {hasEmailMfa && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-3">
              <p className="text-sm font-medium text-gray-900">Email verification code</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void sendEmailCode()}
                disabled={isLoading || isSending}
                className="w-full"
              >
                {isSending ? 'Sending…' : emailCodeSent ? 'Resend code' : 'Send code to email'}
              </Button>
              {emailCodeSent && (
                <p className="text-xs text-green-700">A verification code was sent to your email.</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="disable-mfa-token" className="block text-sm font-medium text-gray-700 mb-1">
              MFA code
            </label>
            <input
              id="disable-mfa-token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={
                emailOnly
                  ? '6-digit email code'
                  : hasTotpMfa && hasEmailMfa
                    ? 'Authenticator, backup, or email code'
                    : '6-digit code or backup code'
              }
              className="w-full rounded border px-3 py-2"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {emailOnly
                ? 'Use the code from your email. Codes expire after about 10 minutes.'
                : hasTotpMfa && hasEmailMfa
                  ? 'Use your authenticator app, a backup code, or the email code you requested above.'
                  : 'Use the code from your authenticator app now, or a backup code you saved when MFA was enabled.'}
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500"
              disabled={isLoading || !password.trim() || !mfaToken.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Disabling…
                </span>
              ) : (
                'Disable MFA'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
