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
            ? `End the ${revokeTarget.deviceLabel || 'active'} session for ${revokeTarget.user?.email ?? 'this user'}? They will need to sign in again on that device.`
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
        <ul className="max-h-[32rem] divide-y overflow-auto text-sm">
          {sessions.length === 0 && (
            <li className="py-4 text-center text-gray-500">No active sessions</li>
          )}
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-gray-900">
                    {s.user?.name || s.user?.email || 'Unknown user'}
                  </p>
                  {s.deviceType && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {s.deviceType}
                    </span>
                  )}
                  {s.isTrusted && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Trusted
                    </span>
                  )}
                  {s.mfaUsed && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      MFA
                    </span>
                  )}
                </div>
                {s.user?.email && s.user?.name && (
                  <p className="truncate text-xs text-gray-500">{s.user.email}</p>
                )}
                <p className="mt-1 font-medium text-gray-800">
                  {s.deviceLabel || 'Unknown device'}
                </p>
                <div className="mt-1 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
                  {s.browser && (
                    <span>Browser: {s.browser}{s.os ? '' : ''}</span>
                  )}
                  {s.os && <span>OS: {s.os}</span>}
                  {s.ipAddress && <span>IP: {s.ipAddress}</span>}
                  {s.location && <span>Location: {s.location}</span>}
                  {s.createdAt && <span>Signed in: {formatRelativeTime(s.createdAt)}</span>}
                  {s.lastActivity && (
                    <span>Last active: {formatRelativeTime(s.lastActivity)}</span>
                  )}
                  {s.riskLevel && <span>Risk: {s.riskLevel}</span>}
                </div>
                {s.userAgent && (
                  <p className="mt-2 truncate text-[11px] text-gray-400" title={s.userAgent}>
                    {s.userAgent}
                  </p>
                )}
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
