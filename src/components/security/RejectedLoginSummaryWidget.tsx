'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { apiClient } from '@/lib/api-client';

interface RejectedLoginSummary {
  total7d: number;
  total30d: number;
  secureAccountCount7d: number;
  secureAccountCount30d: number;
  topIps: Array<{ ip: string; count: number; lastSeenAt: string }>;
  daily: Array<{ date: string; count: number; secureAccountCount: number }>;
}

export function RejectedLoginSummaryWidget() {
  const [summary, setSummary] = useState<RejectedLoginSummary | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void apiClient
      .getRejectedLoginSummary(days)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading && !summary) {
    return <Card className="p-4 text-sm text-gray-500">Loading rejected-login trends…</Card>;
  }

  if (!summary) return null;

  return (
    <Card className="mb-6 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">Rejected login trends</h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value) as 7 | 30 | 90)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-md bg-gray-50 p-3">
          <div className="text-xs text-gray-500">Rejected (7d)</div>
          <div className="text-xl font-semibold">{summary.total7d}</div>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <div className="text-xs text-gray-500">Rejected (30d)</div>
          <div className="text-xl font-semibold">{summary.total30d}</div>
        </div>
        <div className="rounded-md bg-red-50 p-3">
          <div className="text-xs text-red-700">Secure account (7d)</div>
          <div className="text-xl font-semibold text-red-900">{summary.secureAccountCount7d}</div>
        </div>
        <div className="rounded-md bg-red-50 p-3">
          <div className="text-xs text-red-700">Secure account (30d)</div>
          <div className="text-xl font-semibold text-red-900">{summary.secureAccountCount30d}</div>
        </div>
      </div>
      {summary.topIps.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-800">Top source IPs</h4>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {summary.topIps.slice(0, 5).map((row) => (
              <li key={row.ip} className="flex justify-between gap-2">
                <span>{row.ip}</span>
                <span>
                  {row.count} · {new Date(row.lastSeenAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
