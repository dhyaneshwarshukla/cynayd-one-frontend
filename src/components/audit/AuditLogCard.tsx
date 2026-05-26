'use client';

import { EyeIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  formatActionLabel,
  getActionTone,
  parseAuditDetails,
  summarizeAuditDetails,
} from './audit-log-utils';
import type { AuditLogDetail } from './AuditLogDetailModal';

interface AuditLogCardProps {
  log: AuditLogDetail;
  onViewDetails: (log: AuditLogDetail) => void;
}

export function AuditLogCard({ log, onViewDetails }: AuditLogCardProps) {
  const tone = getActionTone(log.action);
  const parsed = parseAuditDetails(log.details);
  const summary = summarizeAuditDetails(log.action, parsed);
  const userLabel = log.user?.name || log.user?.email || 'System';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-lg"
          aria-hidden
        >
          {tone.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`text-sm font-semibold ${tone.title}`}>
              {formatActionLabel(log.action)}
            </h4>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.badge}`}
            >
              {log.resource}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{summary}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-gray-700">{userLabel}</span>
            </span>
            {log.ipAddress && (
              <span className="font-mono">{log.ipAddress}</span>
            )}
            <time dateTime={new Date(log.timestamp).toISOString()}>
              {new Date(log.timestamp).toLocaleString()}
            </time>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => onViewDetails(log)}
        >
          <EyeIcon className="mr-1.5 h-4 w-4" aria-hidden />
          Details
        </Button>
      </div>
    </Card>
  );
}
