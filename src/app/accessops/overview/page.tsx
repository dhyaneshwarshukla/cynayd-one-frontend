'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { accessOpsClient, AccessOpsOverviewSummary } from '../../../lib/accessops/client';
import { buildOverviewSummaryCards } from '../../../lib/accessops/ui-helpers';
import { LiveErrorRegion } from '../../../components/accessops/LiveErrorRegion';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export default function AccessOpsOverviewPage() {
  const [summary, setSummary] = useState<AccessOpsOverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await accessOpsClient.getOverviewSummary());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Access overview</h1>
        <p className="mt-1 text-sm text-gray-600">A focused view of access that needs your attention.</p>
      </div>
      <LiveErrorRegion message={error} onRetry={load} />
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500" role="status">
          <LoadingSpinner size="sm" /> Loading overview…
        </div>
      )}
      {summary && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Access summary">
          {buildOverviewSummaryCards(summary).map((card) => (
            <Link
              key={card.key}
              href={card.href}
              data-summary-key={card.key}
              className="rounded-lg border bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="text-sm text-gray-500">{card.label}</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
