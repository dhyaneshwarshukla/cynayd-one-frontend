'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface SessionRow {
  id: string;
  ipAddress?: string;
  lastActivity?: string;
  createdAt?: string;
  userAgent?: string;
  location?: string;
  deviceLabel?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  isTrusted?: boolean;
  mfaUsed?: boolean;
  riskLevel?: string;
  user?: { email?: string; name?: string };
}

function formatRelativeTime(value?: string): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

export function LiveSessionMonitor() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [mode, setMode] = useState<'sse' | 'poll'>('poll');
  const [revokeTarget, setRevokeTarget] = useState<SessionRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const modeRef = useRef<'sse' | 'poll'>('poll');

  const load = useCallback(async () => {
    const data = await apiClient.getAdminSessions();
    setSessions((data.sessions as SessionRow[]) ?? []);
  }, []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    void load();
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    let es: EventSource | null = null;

    try {
      es = new EventSource(`${base}/api/admin/sessions/live`, {
        withCredentials: true,
      });
      setMode('sse');
      modeRef.current = 'sse';
      es.addEventListener('sessions', (ev) => {
        try {
          const data = JSON.parse(ev.data) as { sessions?: SessionRow[] };
          if (data.sessions) setSessions(data.sessions);
        } catch {
          /* ignore */
        }
      });
      es.onerror = () => {
        es?.close();
        setMode('poll');
        modeRef.current = 'poll';
      };
    } catch {
      setMode('poll');
      modeRef.current = 'poll';
    }

    const interval = setInterval(() => {
      if (modeRef.current === 'poll') {
        void load();
      }
    }, 5000);

    return () => {
      es?.close();
      clearInterval(interval);
    };
  }, [load]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiClient.revokeAdminSession(revokeTarget.id);
      setRevokeTarget(null);
      await load();
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Live updates: {mode === 'sse' ? 'connected' : 'polling'}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Device</th>
              <th className="py-2 pr-4">IP</th>
              <th className="py-2 pr-4">Last active</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b">
                <td className="py-3 pr-4">{session.user?.email ?? 'Unknown'}</td>
                <td className="py-3 pr-4">{session.deviceLabel ?? session.userAgent ?? 'Unknown'}</td>
                <td className="py-3 pr-4">{session.ipAddress ?? '—'}</td>
                <td className="py-3 pr-4">{formatRelativeTime(session.lastActivity)}</td>
                <td className="py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRevokeTarget(session)}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => void handleRevoke()}
        title="Revoke session"
        message={`Revoke the session for ${revokeTarget?.user?.email ?? 'this user'}?`}
        confirmText={revoking ? 'Revoking…' : 'Revoke'}
        isLoading={revoking}
        variant="danger"
      />
    </div>
  );
}
