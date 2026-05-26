'use client';

import { useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { apiClient } from '../../lib/api-client';

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

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await apiClient.performStepUp(password, mfaToken || undefined);
      sessionStorage.setItem('step_up_token', token);
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
          Re-enter your password to continue with this sensitive action.
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="MFA code (if enabled)"
            className="w-full rounded border px-3 py-2"
            value={mfaToken}
            onChange={(e) => setMfaToken(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
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
