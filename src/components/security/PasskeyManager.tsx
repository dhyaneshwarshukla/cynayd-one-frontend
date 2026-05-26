'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { apiClient } from '@/lib/api-client';
import { registerPasskey } from '@/lib/webauthn';

interface CredentialRow {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

interface PasskeyManagerProps {
  onMessage?: (text: string, type: 'success' | 'error') => void;
}

export function PasskeyManager({ onMessage }: PasskeyManagerProps) {
  const [deviceName, setDeviceName] = useState('');
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiClient.listWebAuthnCredentials();
      setCredentials(list);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRegister = async () => {
    setBusy(true);
    try {
      const options = await apiClient.webauthnRegisterStart();
      const response = await registerPasskey(
        options as import('@simplewebauthn/browser').PublicKeyCredentialCreationOptionsJSON
      );
      await apiClient.webauthnRegisterFinish(
        response as unknown as Record<string, unknown>,
        deviceName || 'My device'
      );
      onMessage?.('Passkey registered successfully.', 'success');
      setDeviceName('');
      await load();
    } catch (e) {
      onMessage?.(e instanceof Error ? e.message : 'Registration failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await apiClient.deleteWebAuthnCredential(id);
      onMessage?.('Passkey removed.', 'success');
      await load();
    } catch {
      onMessage?.('Failed to remove passkey.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Passkeys</h3>

      {loading ? (
        <p className="text-sm text-gray-500">Loading passkeys…</p>
      ) : credentials.length === 0 ? (
        <p className="text-sm text-gray-500">No passkeys registered yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {credentials.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{c.deviceName || 'Unnamed device'}</p>
                <p className="text-xs text-gray-500">
                  Added {new Date(c.createdAt).toLocaleDateString()}
                  {c.lastUsedAt
                    ? ` · Last used ${new Date(c.lastUsedAt).toLocaleString()}`
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                className="border-red-200 text-red-700"
                onClick={() => void handleDelete(c.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t pt-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">Register new passkey</p>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Device name (optional)"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />
        <Button onClick={() => void handleRegister()} disabled={busy} loading={busy}>
          Register passkey
        </Button>
      </div>
    </div>
  );
}
