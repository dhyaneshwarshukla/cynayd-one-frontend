'use client';

import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { SecurityEvent } from '@/lib/api-client';

interface RejectedLoginAlertsProps {
  events: SecurityEvent[];
  userEmail?: string;
  onSecureAccount?: (eventId: string) => Promise<void>;
  securingEventId?: string | null;
}

export function RejectedLoginAlerts({
  events,
  userEmail,
  onSecureAccount,
  securingEventId,
}: RejectedLoginAlertsProps) {
  const rejected = useMemo(
    () =>
      events.filter(
        (e) =>
          e.eventType === 'login_challenge_rejected' ||
          e.eventType === 'SUSPICIOUS_ACTIVITY'
      ),
    [events]
  );

  if (rejected.length === 0) return null;

  return (
    <Card className="mb-6 border-red-200 bg-red-50 p-4">
      <h3 className="text-base font-semibold text-red-900">Suspicious sign-in activity</h3>
      <p className="mt-1 text-sm text-red-800">
        {rejected.length} recent sign-in attempt{rejected.length === 1 ? '' : 's'} were denied.
        {userEmail ? ` (${userEmail})` : ''}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-red-900">
        {rejected.slice(0, 3).map((event) => (
          <li key={event.id} className="rounded-md border border-red-100 bg-white/70 px-3 py-2">
            <div className="font-medium">{event.eventType}</div>
            <div className="text-red-800">
              {event.ipAddress ? `From ${event.ipAddress}` : 'Unknown source'}
              {event.timestamp ? ` · ${new Date(event.timestamp).toLocaleString()}` : ''}
            </div>
            {onSecureAccount ? (
              <Button
                type="button"
                className="mt-2"
                variant="outline"
                size="sm"
                onClick={() => void onSecureAccount(event.id)}
                loading={securingEventId === event.id}
                disabled={securingEventId === event.id}
              >
                This wasn&apos;t me — secure account
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {onSecureAccount ? null : null}
    </Card>
  );
}
