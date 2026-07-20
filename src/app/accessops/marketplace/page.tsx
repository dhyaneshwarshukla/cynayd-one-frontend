'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { accessOpsClient } from '../../../lib/accessops/client';
import { LiveErrorRegion } from '../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../components/common/Button';

interface MarketplaceApp {
  id: string;
  name: string;
  provider?: string;
  category?: string;
  installStatus?: string;
}

export default function AccessOpsMarketplacePage() {
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await accessOpsClient.marketplace.list();
      const rows = result.apps as Array<Record<string, unknown>>;
      setApps(
        rows.map((row) => ({
          id: String(row.id ?? row.slug ?? row.name),
          name: String(row.name ?? row.displayName ?? row.id),
          provider: String(row.provider ?? row.connectorId ?? 'internal'),
          category: String(row.category ?? 'application'),
          installStatus: String(row.marketplaceInstallStatus ?? row.status ?? 'AVAILABLE'),
        }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  }, []);

  const install = async (id: string) => {
    setInstalling(id);
    setError(null);
    try {
      await accessOpsClient.marketplace.install(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to install application');
    } finally {
      setInstalling(null);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Marketplace</h1>
        <p className="mt-1 text-sm text-gray-600">Browse installable applications and connectors.</p>
      </div>
      <LiveErrorRegion message={error} onRetry={load} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <article key={app.id} className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">{app.name}</h2>
            <p className="mt-1 text-sm text-gray-600">{app.provider}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">{app.category}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-700">{app.installStatus}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={app.installStatus === 'INSTALLED' || installing === app.id}
                onClick={() => void install(app.id)}
              >
                {installing === app.id ? 'Installing…' : 'Install'}
              </Button>
            </div>
          </article>
        ))}
        {!loading && apps.length === 0 && (
          <p className="text-sm text-gray-500">No marketplace applications available yet.</p>
        )}
      </div>
    </div>
  );
}
