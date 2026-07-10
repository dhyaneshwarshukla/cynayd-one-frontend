'use client';

import { ShieldAlert } from 'lucide-react';

interface AwaitingSecurityReviewPanelProps {
  message?: string;
  riskLevel?: string;
  riskReasons?: string[];
}

export function AwaitingSecurityReviewPanel({
  message,
  riskLevel,
  riskReasons,
}: AwaitingSecurityReviewPanelProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <ShieldAlert className="h-6 w-6 text-amber-700" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Administrator approval required</h3>
      <p className="mt-2 text-sm text-gray-600">
        {message ??
          'This sign-in needs administrator security review. This page will continue automatically when approved.'}
      </p>
      {riskLevel ? (
        <p className="mt-3 text-xs text-amber-800">
          Risk level: <span className="font-medium">{riskLevel}</span>
        </p>
      ) : null}
      {riskReasons && riskReasons.length > 0 ? (
        <p className="mt-1 text-xs text-amber-700">{riskReasons.join(', ')}</p>
      ) : null}
      <div className="mt-4 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    </div>
  );
}
