'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { accessOpsClient, AccessOpsDeadLetter } from '../../../../lib/accessops/client';
import { LiveErrorRegion, LiveStatusRegion } from '../../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../../components/common/Button';

const tabs = ['evidence', 'reconciliation', 'dead-letters', 'diagnostics', 'manual-setup'] as const;
type Tab = (typeof tabs)[number];

export default function AdvancedSettingsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const requestedTab = params.get('tab');
  const tab: Tab = tabs.includes(requestedTab as Tab) ? (requestedTab as Tab) : 'evidence';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [deadLetters, setDeadLetters] = useState<AccessOpsDeadLetter[]>([]);
  const [manualTasks, setManualTasks] = useState<Record<string, unknown>[]>([]);
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [manual, setManual] = useState({
    provider: 'MICROSOFT',
    name: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    domain: '',
    customerId: '',
    clientEmail: '',
    refreshToken: '',
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      if (tab === 'evidence') {
        setRows(
          await accessOpsClient.listEvidence({
            subjectType: params.get('subjectType') ?? undefined,
            subjectId: params.get('subjectId') ?? undefined,
          })
        );
      } else if (tab === 'reconciliation') {
        const dashboard = await accessOpsClient.getDiscoveryDashboard();
        setRows(
          Array.isArray(dashboard.findings)
            ? (dashboard.findings as Record<string, unknown>[])
            : []
        );
      } else if (tab === 'dead-letters') {
        const [dlq, tasks] = await Promise.all([
          accessOpsClient.listDeadLetters(),
          accessOpsClient.listManualTasks(),
        ]);
        setDeadLetters(dlq);
        setManualTasks(tasks);
      } else if (tab === 'diagnostics') {
        const [features, capabilities] = await Promise.all([
          accessOpsClient.getFeatures(),
          accessOpsClient.getConnectorCapabilities(),
        ]);
        setDiagnostics({ features, capabilities });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load advanced settings');
    }
  }, [params, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runReconciliation() {
    setBusy(true);
    setError(null);
    try {
      await accessOpsClient.runReconciliation();
      await accessOpsClient.runDiscoveryScan();
      setStatus('Reconciliation and discovery scan finished.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reconciliation failed');
    } finally {
      setBusy(false);
    }
  }

  async function createManual(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const google = manual.provider === 'GOOGLE';
      await accessOpsClient.createConnector({
        provider: manual.provider,
        name: manual.name,
        tenantConfig: google
          ? {
              domain: manual.domain || undefined,
              customerId: manual.customerId || undefined,
              clientEmail: manual.clientEmail || undefined,
              clientId: manual.clientId || undefined,
            }
          : { tenantId: manual.tenantId, clientId: manual.clientId },
        clientSecret: manual.clientSecret,
        refreshToken: manual.refreshToken || undefined,
      });
      setStatus('Manual connection created. Test it under Settings → Connections before relying on it.');
      setManual({
        provider: 'MICROSOFT',
        name: '',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        domain: '',
        customerId: '',
        clientEmail: '',
        refreshToken: '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Advanced</h1>
        <p className="mt-1 text-sm text-gray-600">
          Operational evidence, troubleshooting tools, and customer-owned credential setup.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => router.push(`/accessops/settings/advanced?tab=${value}`)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${
              tab === value ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {value.replace('-', ' ')}
          </button>
        ))}
      </div>
      <LiveErrorRegion message={error} onRetry={load} />
      <LiveStatusRegion message={status} />

      {tab === 'evidence' && <GenericRows rows={rows} empty="No evidence records match this filter." />}
      {tab === 'reconciliation' && (
        <>
          <Button type="button" loading={busy} onClick={() => void runReconciliation()}>
            Run reconciliation
          </Button>
          <GenericRows rows={rows} empty="No reconciliation findings." />
        </>
      )}
      {tab === 'dead-letters' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            <h2 className="font-semibold">Dead letters</h2>
            <ul className="mt-3 divide-y rounded-lg border bg-white">
              {deadLetters.map((item) => (
                <li key={item.id} className="p-4 text-sm">
                  <span className="block font-medium">
                    {item.originalOperation ?? 'Failed operation'}
                  </span>
                  <span className="text-gray-500">
                    {item.reasonCategory} · {item.resolutionStatus}
                  </span>
                  {item.retryEligible !== false && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 block"
                      onClick={async () => {
                        await accessOpsClient.requeueDeadLetter(item.id);
                        setStatus('Retry queued.');
                        await load();
                      }}
                    >
                      Retry
                    </Button>
                  )}
                </li>
              ))}
              {deadLetters.length === 0 && (
                <li className="p-4 text-sm text-gray-500">No dead letters.</li>
              )}
            </ul>
          </section>
          <section>
            <h2 className="font-semibold">Manual tasks</h2>
            <ul className="mt-3 divide-y rounded-lg border bg-white">
              {manualTasks.map((task, index) => (
                <li key={String(task.id ?? index)} className="p-4 text-sm">
                  <span className="block font-medium">
                    {String(task.taskType ?? task.title ?? 'Manual access task')}
                  </span>
                  <span className="text-gray-500">{String(task.status ?? '')}</span>
                  {String(task.status).toUpperCase() !== 'VERIFIED' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 block"
                      onClick={async () => {
                        await accessOpsClient.verifyManualTask(String(task.id));
                        setStatus('Task verified.');
                        await load();
                      }}
                    >
                      Verify
                    </Button>
                  )}
                </li>
              ))}
              {manualTasks.length === 0 && (
                <li className="p-4 text-sm text-gray-500">No manual tasks.</li>
              )}
            </ul>
          </section>
        </div>
      )}
      {tab === 'diagnostics' && (
        <pre className="overflow-x-auto rounded-lg border bg-gray-950 p-4 text-xs text-gray-100">
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      )}
      {tab === 'manual-setup' && (
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">Manual provider credentials</h2>
          <p className="mt-1 text-sm text-gray-600">
            Use only for customer-owned Microsoft app registrations or customer-owned Google
            service accounts with domain-wide delegation. Prefer managed connection under
            Connections when available. Do not store admin OAuth refresh tokens as production
            automation credentials.
          </p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createManual}>
            <label className="text-sm">
              Provider
              <select
                value={manual.provider}
                onChange={(e) => setManual((v) => ({ ...v, provider: e.target.value }))}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="MICROSOFT">Microsoft (customer app)</option>
                <option value="GOOGLE">Google (customer service account)</option>
              </select>
            </label>
            <Field
              label="Connection name"
              value={manual.name}
              onChange={(name) => setManual((v) => ({ ...v, name }))}
              required
            />
            {manual.provider === 'MICROSOFT' ? (
              <Field
                label="Tenant ID"
                value={manual.tenantId}
                onChange={(tenantId) => setManual((v) => ({ ...v, tenantId }))}
                required
              />
            ) : (
              <>
                <Field
                  label="Workspace domain"
                  value={manual.domain}
                  onChange={(domain) => setManual((v) => ({ ...v, domain }))}
                />
                <Field
                  label="Customer ID"
                  value={manual.customerId}
                  onChange={(customerId) => setManual((v) => ({ ...v, customerId }))}
                />
                <Field
                  label="Service account email"
                  value={manual.clientEmail}
                  onChange={(clientEmail) => setManual((v) => ({ ...v, clientEmail }))}
                />
              </>
            )}
            <Field
              label="Client ID"
              value={manual.clientId}
              onChange={(clientId) => setManual((v) => ({ ...v, clientId }))}
              required={manual.provider === 'MICROSOFT'}
            />
            <Field
              label={
                manual.provider === 'GOOGLE' && manual.clientEmail
                  ? 'Private key'
                  : 'Client secret'
              }
              type="password"
              value={manual.clientSecret}
              onChange={(clientSecret) => setManual((v) => ({ ...v, clientSecret }))}
              required
            />
            {manual.provider === 'GOOGLE' && !manual.clientEmail && (
              <Field
                label="Refresh token (legacy onboarding only)"
                type="password"
                value={manual.refreshToken}
                onChange={(refreshToken) => setManual((v) => ({ ...v, refreshToken }))}
              />
            )}
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>
                Create manual connection
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border px-3 py-2"
      />
    </label>
  );
}

function GenericRows({ rows, empty }: { rows: Record<string, unknown>[]; empty: string }) {
  return (
    <ul className="divide-y rounded-lg border bg-white">
      {rows.map((row, index) => (
        <li key={String(row.id ?? index)} className="p-4 text-sm">
          <span className="block font-medium">
            {String(row.eventType ?? row.findingType ?? row.type ?? 'Record')}
          </span>
          <span className="text-gray-500">
            {String(row.status ?? row.severity ?? row.createdAt ?? '')}
          </span>
        </li>
      ))}
      {rows.length === 0 && <li className="p-4 text-sm text-gray-500">{empty}</li>}
    </ul>
  );
}
