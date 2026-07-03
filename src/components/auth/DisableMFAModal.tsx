'use client';

import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';

interface DisableMFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisableMFAModal({ isOpen, onClose, onSuccess }: DisableMFAModalProps) {
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setPassword('');
    setMfaToken('');
    setError(null);
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
      setError('Enter your current authenticator code or a backup code');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.disableMFA(password, mfaToken.trim());
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
          Enter your account password and a current authenticator code (or backup code) to turn off
          MFA. Your account will be less protected.
        </p>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
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

          <div>
            <label htmlFor="disable-mfa-token" className="block text-sm font-medium text-gray-700 mb-1">
              MFA code
            </label>
            <input
              id="disable-mfa-token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code or backup code"
              className="w-full rounded border px-3 py-2"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use the code from your authenticator app now, or a backup code you saved when MFA was
              enabled.
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
