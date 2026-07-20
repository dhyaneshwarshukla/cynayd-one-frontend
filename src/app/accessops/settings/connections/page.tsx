'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { accessOpsClient, AccessOpsConnector } from '../../../../lib/accessops/client';
import { humanizeConnectorStatus } from '../../../../lib/accessops/labels';
import { LiveErrorRegion, LiveStatusRegion } from '../../../../components/accessops/LiveErrorRegion';
import { ConfirmDialog } from '../../../../components/accessops/ConfirmDialog';
import { Button } from '../../../../components/common/Button';
import Link from 'next/link';

const GOOGLE_SETUP_STATES = [
  { key: 'marketplaceInstallStatus', label: 'Marketplace installation' },
  { key: 'domainWideDelegationStatus', label: 'Domain-wide delegation' },
  { key: 'delegatedAdminEmail', label: 'Delegated administrator' },
  { key: 'scopes', label: 'Required scopes' },
  { key: 'capabilityStatus', label: 'Connector capabilities' },
] as const;

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [connectors, setConnectors] = useState<AccessOpsConnector[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [disconnecting, setDisconnecting] = useState<AccessOpsConnector | null>(null);
  const [managingGoogle, setManagingGoogle] = useState<AccessOpsConnector | null>(null);
  const [googleForm, setGoogleForm] = useState({
    marketplaceInstallStatus: 'PENDING',
    domainWideDelegationStatus: 'PENDING',
    delegatedAdminEmail: '',
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      setConnectors(await accessOpsClient.listConnectors());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load connections');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const ms = searchParams.get('microsoft');
    const google = searchParams.get('google');
    const err = searchParams.get('error');
    if (ms === 'connected') {
      setStatus('Microsoft connected. Capability readiness will continue in the background.');
      void load();
    } else if (ms === 'denied' || ms === 'error') {
      setError(err || 'Microsoft connection was not completed.');
    }
    if (google === 'onboarding' || google === 'connected') {
      setStatus('Google Workspace onboarding returned. Complete the five setup states below.');
      void load();
    } else if (google === 'denied' || google === 'error') {
      setError(err || 'Google Workspace connection was not completed.');
    }
  }, [searchParams, load]);

  async function begin(provider: 'microsoft' | 'google') {
    setBusy(true);
    setError(null);
    try {
      const result =
        provider === 'microsoft'
          ? await accessOpsClient.beginMicrosoftAuthorize()
          : await accessOpsClient.beginGoogleAuthorize();
      window.location.assign(result.authorizationUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start connection');
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!disconnecting) return;
    setBusy(true);
    try {
      await accessOpsClient.disconnectConnector(disconnecting.id);
      setStatus(`${disconnecting.name} disconnected.`);
      setDisconnecting(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect');
    } finally {
      setBusy(false);
    }
  }

  async function saveGoogleStates() {
    if (!managingGoogle) return;
    setBusy(true);
    setError(null);
    try {
      await accessOpsClient.updateGoogleConnectionStates(managingGoogle.id, {
        marketplaceInstallStatus: googleForm.marketplaceInstallStatus,
        domainWideDelegationStatus: googleForm.domainWideDelegationStatus,
        delegatedAdminEmail: googleForm.delegatedAdminEmail || undefined,
      });
      setStatus('Google Workspace setup states updated. Run Test to verify capabilities.');
      setManagingGoogle(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update Google states');
    } finally {
      setBusy(false);
    }
  }

  const hasMicrosoft = connectors.some((c) => c.provider.toUpperCase() === 'MICROSOFT');
  const hasGoogle = connectors.some((c) => c.provider.toUpperCase() === 'GOOGLE');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Connections</h1>
        <p className="mt-1 text-sm text-gray-600">
          Connect Microsoft Entra ID or Google Workspace. Managed connections do not collect
          customer secrets in the default flow.
        </p>
      </div>
      <LiveErrorRegion message={error} onRetry={load} />
      <LiveStatusRegion message={status} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectCard
          title="Microsoft"
          detail="Admin consent for a Cynayd-managed multi-tenant Entra application. No customer client secret required."
          label={hasMicrosoft ? 'Reconnect Microsoft' : 'Connect Microsoft'}
          disabled={busy}
          onClick={() => void begin('microsoft')}
        />
        <ConnectCard
          title="Google Workspace"
          detail="Sign in as a Workspace admin, install from Marketplace, approve domain-wide delegation, then return here."
          label={hasGoogle ? 'Reconnect Google Workspace' : 'Connect Google Workspace'}
          disabled={busy}
          onClick={() => void begin('google')}
        />
      </div>

      <section>
        <h2 className="font-semibold">Existing connections</h2>
        <ul className="mt-3 divide-y rounded-lg border bg-white">
          {connectors.map((connector) => (
            <li key={connector.id} className="space-y-3 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <span className="font-medium">{connector.name}</span>
                  <p className="text-sm text-gray-500">
                    {connector.provider}
                    {connector.primaryDomain ? ` · ${connector.primaryDomain}` : ''}
                    {connector.externalTenantId && !connector.primaryDomain
                      ? ` · Tenant ${connector.externalTenantId.slice(0, 8)}…`
                      : ''}
                    {' · '}
                    {humanizeConnectorStatus(connector.semanticStatus || connectionFallback(connector))}
                    {connector.connectionLabel ? ` · ${connector.connectionLabel}` : ''}
                  </p>
                  {connector.statusSummary && (
                    <p className="mt-1 text-xs text-gray-500">{connector.statusSummary}</p>
                  )}
                  {connector.optionalNotes?.length ? (
                    <p className="mt-1 text-xs text-amber-700">{connector.optionalNotes.join(' · ')}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {connector.provider.toUpperCase() === 'GOOGLE' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setManagingGoogle(connector);
                        setGoogleForm({
                          marketplaceInstallStatus:
                            connector.marketplaceInstallStatus || 'PENDING',
                          domainWideDelegationStatus:
                            connector.domainWideDelegationStatus || 'PENDING',
                          delegatedAdminEmail: connector.delegatedAdminEmail || '',
                        });
                      }}
                    >
                      Manage setup
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await accessOpsClient.testConnector(connector.id);
                        setStatus(`${connector.name} test finished.`);
                        await load();
                      } catch (e: unknown) {
                        setError(e instanceof Error ? e.message : 'Test failed');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Test
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    onClick={() => setDisconnecting(connector)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
              {connector.provider.toUpperCase() === 'GOOGLE' && (
                <GoogleSetupStates connector={connector} />
              )}
            </li>
          ))}
          {connectors.length === 0 && (
            <li className="p-4 text-sm text-gray-500">No connections yet.</li>
          )}
        </ul>
      </section>

      <p className="text-sm text-gray-600">
        Need customer-owned credentials? Use{' '}
        <Link className="text-indigo-700 underline" href="/accessops/settings/advanced?tab=manual-setup">
          Advanced → Manual setup
        </Link>
        .
      </p>

      {managingGoogle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold">Google Workspace setup</h3>
            <p className="mt-1 text-sm text-gray-600">
              Marketplace installation alone never activates the connector. Complete all five states.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                Marketplace installation
                <select
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  value={googleForm.marketplaceInstallStatus}
                  onChange={(e) =>
                    setGoogleForm((v) => ({ ...v, marketplaceInstallStatus: e.target.value }))
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="INSTALLED">Installed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label className="block text-sm">
                Domain-wide delegation
                <select
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  value={googleForm.domainWideDelegationStatus}
                  onChange={(e) =>
                    setGoogleForm((v) => ({ ...v, domainWideDelegationStatus: e.target.value }))
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="AUTHORIZED">Authorized</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label className="block text-sm">
                Delegated administrator email
                <input
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  value={googleForm.delegatedAdminEmail}
                  onChange={(e) =>
                    setGoogleForm((v) => ({ ...v, delegatedAdminEmail: e.target.value }))
                  }
                  placeholder="admin@example.com"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setManagingGoogle(null)}>
                Cancel
              </Button>
              <Button type="button" loading={busy} onClick={() => void saveGoogleStates()}>
                Save states
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!disconnecting}
        title="Disconnect connection"
        description="Existing Cynayd grants remain governed. New external operations stop. Queued jobs are held. External provider access may remain. A review warning is created. Connection history is preserved."
        confirmLabel="Disconnect"
        destructive
        loading={busy}
        onCancel={() => setDisconnecting(null)}
        onConfirm={disconnect}
      />
    </div>
  );
}

function ConnectCard({
  title,
  detail,
  label,
  disabled,
  onClick,
}: {
  title: string;
  detail: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{detail}</p>
      <Button type="button" className="mt-4" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

function GoogleSetupStates({ connector }: { connector: AccessOpsConnector }) {
  const rows = useMemo(() => {
    const scopesReady =
      Array.isArray(connector.scopes)
        ? connector.scopes.length > 0
        : Boolean(connector.scopes && String(connector.scopes) !== '[]');
    const caps =
      typeof connector.capabilityStatus === 'object' && connector.capabilityStatus
        ? connector.capabilityStatus
        : (() => {
            try {
              return JSON.parse(String(connector.capabilityStatus || '{}'));
            } catch {
              return {};
            }
          })();
    const capsReady = Object.values(caps as Record<string, string>).some(
      (v) => String(v).toUpperCase() === 'SUPPORTED'
    );
    return GOOGLE_SETUP_STATES.map((item) => {
      if (item.key === 'scopes') {
        return { label: item.label, value: scopesReady ? 'Configured' : 'Pending' };
      }
      if (item.key === 'capabilityStatus') {
        return { label: item.label, value: capsReady ? 'Ready' : 'Not ready' };
      }
      if (item.key === 'delegatedAdminEmail') {
        return {
          label: item.label,
          value: connector.delegatedAdminEmail || 'Not set',
        };
      }
      const raw = String(
        (connector as unknown as Record<string, unknown>)[item.key] || 'PENDING'
      );
      return { label: item.label, value: raw };
    });
  }, [connector]);

  return (
    <dl className="grid gap-2 rounded-md bg-gray-50 p-3 text-xs sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="font-medium text-gray-700">{row.label}</dt>
          <dd className="text-gray-600">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function connectionFallback(connector: AccessOpsConnector): string {
  const state = connector.state.toUpperCase();
  const health = connector.health.toUpperCase();
  if (state === 'DISCONNECTED' || state === 'DISABLED') return 'Disconnected';
  if (health === 'HEALTHY' && state === 'ACTIVE') return 'Connected';
  if (health === 'DEGRADED' || state === 'LIMITED') return 'Limited';
  return 'Needs attention';
}
