'use client';

import { EyeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { SecurityEvent } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  formatEventTypeLabel,
  normalizeSeverity,
  severityBadgeClass,
  summarizeEventDetails,
} from './security-event-utils';

interface SecurityEventCardProps {
  event: SecurityEvent;
  onInvestigate: (event: SecurityEvent) => void;
  onWhitelistIp: (ip: string) => void;
}

export function SecurityEventCard({
  event,
  onInvestigate,
  onWhitelistIp,
}: SecurityEventCardProps) {
  const summary = summarizeEventDetails(event);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {formatEventTypeLabel(event.eventType)}
            </h4>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${severityBadgeClass(event.severity)}`}
            >
              {normalizeSeverity(event.severity)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{summary}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-500">
            {event.user?.name && <span>{event.user.name}</span>}
            {event.ipAddress && <span className="font-mono">{event.ipAddress}</span>}
            <time dateTime={new Date(event.timestamp).toISOString()}>
              {new Date(event.timestamp).toLocaleString()}
            </time>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {event.ipAddress && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onWhitelistIp(event.ipAddress!)}
            >
              <ShieldCheckIcon className="mr-1 h-4 w-4" aria-hidden />
              Whitelist IP
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onInvestigate(event)}
          >
            <EyeIcon className="mr-1 h-4 w-4" aria-hidden />
            Investigate
          </Button>
        </div>
      </div>
    </Card>
  );
}
