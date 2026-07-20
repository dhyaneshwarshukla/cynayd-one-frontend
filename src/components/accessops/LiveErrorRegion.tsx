'use client';

import React from 'react';
import { Button } from '../common/Button';

export function LiveErrorRegion({
  message,
  title,
  onRetry,
  retryLabel = 'Retry',
}: {
  message: string | null;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {title && <p className="font-semibold">{title}</p>}
          <p>{message}</p>
        </div>
        {onRetry && (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function LiveStatusRegion({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" aria-live="polite" className="text-sm text-gray-600">
      {message}
    </p>
  );
}
