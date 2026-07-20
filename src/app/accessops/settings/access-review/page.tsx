'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { accessOpsClient } from '../../../../lib/accessops/client';
import { LiveErrorRegion, LiveStatusRegion } from '../../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../../components/common/Button';

export default function AccessReviewPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [name, setName] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCampaigns(await accessOpsClient.listReviewCampaigns());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load access reviews');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await accessOpsClient.createReviewCampaign({ name, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined, scope: { type: 'ALL_ACTIVE_ACCESS' } });
      setName('');
      setDueAt('');
      setStatus('Access review campaign created.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create access review');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Access review</h1><p className="mt-1 text-sm text-gray-600">Periodically confirm that application access is still needed.</p></div>
      <LiveErrorRegion message={error} onRetry={load} /><LiveStatusRegion message={status} />
      <form onSubmit={create} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-3">
        <label className="text-sm sm:col-span-2">Campaign name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" /></label>
        <label className="text-sm">Due date<input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" /></label>
        <div className="sm:col-span-3"><Button type="submit" loading={busy}>Create review</Button></div>
      </form>
      <ul className="divide-y rounded-lg border bg-white">
        {campaigns.map((campaign, index) => (
          <li key={String(campaign.id ?? index)} className="flex justify-between gap-3 p-4">
            <div><span className="font-medium">{String(campaign.name ?? 'Access review')}</span><p className="text-sm text-gray-500">{String(campaign.status ?? 'Draft')}</p></div>
            {String(campaign.status ?? '').toUpperCase() === 'DRAFT' && <Button type="button" size="sm" variant="outline" onClick={async () => { await accessOpsClient.startReviewCampaign(String(campaign.id)); setStatus('Review started.'); await load(); }}>Start</Button>}
          </li>
        ))}
        {campaigns.length === 0 && <li className="p-4 text-sm text-gray-500">No review campaigns.</li>}
      </ul>
    </div>
  );
}
