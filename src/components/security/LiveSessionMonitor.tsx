'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface SessionRow {
  id: string;
  ipAddress?: string;
  lastActivity?: string;
  user?: { email?: string; name?: string };
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
    const token = apiClient.getAuthToken();
    let es: EventSource | null = null;

    if (token) {
      try {
        es = new EventSource(
          `${base}/api/admin/sessions/live?token=${encodeURIComponent(token)}`
        );
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
    }

    const interval = setInterval(() => {
      if (modeRef.current === 'poll') void load();
    }, 5000);

    return () => {
      clearInterval(interval);
      es?.close();
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
    <>
      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => void handleRevoke()}
        title="Revoke session?"
        message={
          revokeTarget
            ? `End the active session for ${revokeTarget.user?.email ?? 'this user'}? They will need to sign in again.`
            : ''
        }
        confirmText="Revoke session"
        variant="danger"
        isLoading={revoking}
      />
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Live sessions</h3>
          <span className="text-xs text-gray-500">{mode === 'sse' ? 'Live' : 'Polling'}</span>
        </div>
        <ul className="max-h-80 divide-y overflow-auto text-sm">
          {sessions.length === 0 && (
            <li className="py-4 text-center text-gray-500">No active sessions</li>
          )}
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {s.user?.name || s.user?.email || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {s.user?.email && s.user?.name ? s.user.email : null}
                  {s.ipAddress && (
                    <span className={s.user?.email ? ' · ' : ''}>{s.ipAddress}</span>
                  )}
                  {s.lastActivity && (
                    <span>
                      {' '}
                      · Last active{' '}
                      {new Date(s.lastActivity).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setRevokeTarget(s)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
