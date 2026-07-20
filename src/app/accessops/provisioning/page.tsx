'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { accessOpsClient } from '../../../lib/accessops/client';
import { LiveErrorRegion } from '../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../components/common/Button';

interface ProvisioningRow {
  id: string;
  user: string;
  application: string;
  status: string;
  updatedAt?: string;
}

export default function AccessOpsProvisioningPage() {
  const [rows, setRows] = useState<ProvisioningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await accessOpsClient.provisioning.list();
      const items = result.items as Array<Record<string, unknown>>;
      setRows(items.map((item) => ({
        id: String(item.id ?? item.commandId ?? crypto.randomUUID()),
        user: String(item.userName ?? item.userId ?? 'unknown'),
        application: String(item.applicationName ?? item.installedAppId ?? 'application'),
        status: String(item.status ?? 'PENDING'),
        updatedAt: String(item.updatedAt ?? item.timestamp ?? ''),
      })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load provisioning queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Provisioning</h1>
          <p className="mt-1 text-sm text-gray-600">Track pending grants, retries, and dead-letter operations.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <LiveErrorRegion message={error} onRetry={load} />
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Application', 'Status', 'Updated'].map((label) => (
                <th key={label} className="px-4 py-3 text-left font-medium text-gray-600">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.user}</td>
                <td className="px-4 py-3">{row.application}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 text-gray-500">{row.updatedAt || '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No provisioning work in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
