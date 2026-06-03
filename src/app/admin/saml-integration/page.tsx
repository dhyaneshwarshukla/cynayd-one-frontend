"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { apiClient, App } from '@/lib/api-client';
import {
  ChevronDownIcon,
  DocumentTextIcon,
  KeyIcon,
  XMarkIcon,
  PencilIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const AWS_SP_PRESET = {
  entityId: 'urn:amazon:webservices',
  acsUrl: 'https://signin.aws.amazon.com/saml',
};

function getApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('localhost')) return origin.replace(':3000', ':4000');
    if (origin.includes('one.cynayd.com')) return 'https://auth.one.cynayd.com';
    return origin;
  }
  return 'https://auth.one.cynayd.com';
}

function parseAppMetadata(app: App | null) {
  if (!app?.metadata) return { samlEnabled: false, entityId: '', acsUrl: '', sloUrl: '' };
  try {
    const m = JSON.parse(app.metadata);
    return {
      samlEnabled: m.samlEnabled === true,
      entityId: m.samlConfig?.entityId || '',
      acsUrl: m.samlConfig?.acsUrl || '',
      sloUrl: m.samlConfig?.sloUrl || '',
    };
  } catch {
    return { samlEnabled: false, entityId: '', acsUrl: '', sloUrl: '' };
  }
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
      <ClipboardDocumentIcon className="h-4 w-4" />
      {copied ? 'Copied' : label}
    </button>
  );
}

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <CopyButton text={value} />
      </div>
      <code className="block break-all text-sm text-gray-900">{value}</code>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function SAMLIntegrationPage() {
  const { user } = useAuth();
  const baseUrl = getApiBaseUrl();
  const canManageSaml =
    user?.role?.toUpperCase() === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'ADMIN';
  const orgId = user?.organizationId || '';

  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [orgSamlConfig, setOrgSamlConfig] = useState<any>(null);
  const [isLoadingOrgConfig, setIsLoadingOrgConfig] = useState(true);
  const [showOrgConfigForm, setShowOrgConfigForm] = useState(false);
  const [orgConfigForm, setOrgConfigForm] = useState({
    entityId: `${baseUrl}/saml`,
    ssoUrl: `${baseUrl}/api/saml/sso`,
    sloUrl: `${baseUrl}/api/saml/slo`,
    certificate: '',
    privateKey: '',
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    signRequests: true,
    signAssertions: true,
    encryptAssertions: false,
  });
  const [isSavingOrgConfig, setIsSavingOrgConfig] = useState(false);
  const [showAppConfigForm, setShowAppConfigForm] = useState(false);
  const [appConfigForm, setAppConfigForm] = useState({
    samlEnabled: false,
    entityId: '',
    acsUrl: '',
    sloUrl: '',
  });
  const [isSavingAppConfig, setIsSavingAppConfig] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const orgMetadataUrl = orgId
    ? `${baseUrl}/api/saml/metadata?organizationId=${orgId}`
    : '';

  const orgReady = Boolean(orgSamlConfig?.enabled);
  const appSaml = useMemo(() => parseAppMetadata(selectedApp), [selectedApp]);

  const fetchApps = useCallback(async () => {
    try {
      setIsLoadingApps(true);
      const appsData = await apiClient.getApps();
      setApps(appsData || []);
    } catch {
      setApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  const fetchOrgSamlConfig = useCallback(async () => {
    try {
      setIsLoadingOrgConfig(true);
      const config = await apiClient.getSamlConfig();
      setOrgSamlConfig(config);
      if (config) {
        setOrgConfigForm({
          entityId: config.entityId || `${baseUrl}/saml`,
          ssoUrl: config.ssoUrl || `${baseUrl}/api/saml/sso`,
          sloUrl: config.sloUrl || `${baseUrl}/api/saml/slo`,
          certificate: config.certificate || '',
          privateKey: config.privateKey || '',
          nameIdFormat: config.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          signRequests: config.signRequests !== false,
          signAssertions: config.signAssertions !== false,
          encryptAssertions: config.encryptAssertions || false,
        });
      }
    } catch (error: any) {
      if (error.message?.includes('not configured') || error.message?.includes('404')) {
        setOrgSamlConfig(null);
      }
    } finally {
      setIsLoadingOrgConfig(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchApps();
    fetchOrgSamlConfig();
  }, [fetchApps, fetchOrgSamlConfig]);

  useEffect(() => {
    if (selectedApp) {
      setAppConfigForm(parseAppMetadata(selectedApp));
    }
  }, [selectedApp]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleSaveOrgConfig = async () => {
    try {
      setIsSavingOrgConfig(true);
      const configToSave = { ...orgConfigForm };
      if (!configToSave.privateKey && orgSamlConfig?.privateKey) {
        configToSave.privateKey = orgSamlConfig.privateKey;
      }
      await apiClient.configureSaml(configToSave);
      await apiClient.enableSaml(true);
      setNotification({ type: 'success', message: 'Organization SAML saved and enabled.' });
      setShowOrgConfigForm(false);
      await fetchOrgSamlConfig();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to save SAML configuration' });
    } finally {
      setIsSavingOrgConfig(false);
    }
  };

  const handleEnableOrgSaml = async (enabled: boolean) => {
    try {
      await apiClient.enableSaml(enabled);
      setNotification({ type: 'success', message: `SAML ${enabled ? 'enabled' : 'disabled'}.` });
      await fetchOrgSamlConfig();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to update SAML status' });
    }
  };

  const handleSaveAppConfig = async () => {
    if (!selectedApp) return;
    if (!orgReady) {
      setNotification({ type: 'error', message: 'Enable organization SAML before configuring an app.' });
      return;
    }
    if (appConfigForm.samlEnabled && (!appConfigForm.entityId || !appConfigForm.acsUrl)) {
      setNotification({ type: 'error', message: 'Entity ID and ACS URL are required.' });
      return;
    }
    try {
      setIsSavingAppConfig(true);
      await apiClient.updateAppSamlConfig(selectedApp.slug, {
        samlEnabled: appConfigForm.samlEnabled,
        samlConfig: appConfigForm.samlEnabled
          ? {
              entityId: appConfigForm.entityId,
              acsUrl: appConfigForm.acsUrl,
              sloUrl: appConfigForm.sloUrl || undefined,
            }
          : undefined,
      });
      setNotification({ type: 'success', message: `SAML settings saved for ${selectedApp.name}.` });
      setShowAppConfigForm(false);
      await fetchApps();
      const updated = (await apiClient.getApps())?.find((a) => a.id === selectedApp.id);
      if (updated) setSelectedApp(updated);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to save app SAML' });
    } finally {
      setIsSavingAppConfig(false);
    }
  };

  const applyAwsPreset = () => {
    setAppConfigForm((f) => ({
      ...f,
      samlEnabled: true,
      entityId: AWS_SP_PRESET.entityId,
      acsUrl: AWS_SP_PRESET.acsUrl,
    }));
    setShowAppConfigForm(true);
  };

  const handleCertificateFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setOrgConfigForm((f) => ({ ...f, certificate: (e.target?.result as string).trim() }));
    };
    reader.readAsText(file);
  };

  const handlePrivateKeyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setOrgConfigForm((f) => ({ ...f, privateKey: (e.target?.result as string).trim() }));
    };
    reader.readAsText(file);
  };

  const idpEntityId = orgSamlConfig?.entityId || `${baseUrl}/saml`;
  const idpSsoUrl = orgSamlConfig?.ssoUrl || `${baseUrl}/api/saml/sso`;
  const idpSloUrl = orgSamlConfig?.sloUrl || `${baseUrl}/api/saml/slo`;

  return (
    <UnifiedLayout
      title="SAML Integration"
      subtitle="Configure CYNAYD One as your identity provider and connect external apps"
      variant="dashboard"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {notification && (
          <div
            className={`rounded-lg border p-4 ${
              notification.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{notification.message}</span>
              <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Organization IdP */}
        <Card className="border border-gray-200 p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <KeyIcon className="h-5 w-5 text-purple-600" />
                Organization identity provider
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Required for all SAML apps. Use the metadata URL in AWS IAM, Okta, Google Workspace, etc.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {orgSamlConfig && (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={orgSamlConfig.enabled || false}
                    onChange={(e) => handleEnableOrgSaml(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Enabled
                </label>
              )}
              {canManageSaml && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOrgConfigForm(!showOrgConfigForm);
                    if (!showOrgConfigForm) fetchOrgSamlConfig();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  {orgSamlConfig ? <PencilIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {orgSamlConfig ? 'Edit' : 'Configure'}
                </button>
              )}
            </div>
          </div>

          {isLoadingOrgConfig ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : orgSamlConfig ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-medium ${
                    orgReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {orgReady ? 'Active' : 'Disabled'}
                </span>
                {orgSamlConfig.privateKey ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800">
                    Signing key OK
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800">
                    Missing private key
                  </span>
                )}
                {orgSamlConfig.certificateExpiresAt && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-700">
                    Cert expires {new Date(orgSamlConfig.certificateExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {orgReady && orgMetadataUrl && (
                <CopyField
                  label="IdP metadata URL (paste into AWS / external SP)"
                  value={orgMetadataUrl}
                  hint="Opening in a browser shows raw XML — that is normal. Do not use the one.cynayd.com frontend URL here."
                />
              )}

              {orgReady && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <CopyField label="Entity ID" value={idpEntityId} />
                  <CopyField label="SSO URL" value={idpSsoUrl} />
                </div>
              )}

              {orgSamlConfig.signAssertions && !orgSamlConfig.privateKey && canManageSaml && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                  <p>
                    Add a private key under Edit — assertions cannot be signed without it.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Organization SAML is not set up yet.{' '}
              {canManageSaml ? 'Click Configure to add certificate and keys.' : 'Ask an organization admin.'}
            </p>
          )}

          {showOrgConfigForm && canManageSaml && (
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Entity ID</label>
                  <input
                    type="text"
                    value={orgConfigForm.entityId}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, entityId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">SSO URL</label>
                  <input
                    type="text"
                    value={orgConfigForm.ssoUrl}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, ssoUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">SLO URL</label>
                  <input
                    type="text"
                    value={orgConfigForm.sloUrl}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, sloUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder={`${baseUrl}/api/saml/slo`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Use your production auth host, not localhost.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Certificate (PEM)</label>
                  <input type="file" accept=".pem,.crt,.cert" onChange={handleCertificateFileUpload} className="mb-2 block w-full text-sm" />
                  <textarea
                    value={orgConfigForm.certificate}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, certificate: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
                    placeholder="-----BEGIN CERTIFICATE-----"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Private key (PEM){orgConfigForm.signAssertions && ' *'}
                  </label>
                  <input type="file" accept=".pem,.key" onChange={handlePrivateKeyFileUpload} className="mb-2 block w-full text-sm" />
                  <textarea
                    value={orgConfigForm.privateKey}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, privateKey: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
                    placeholder="-----BEGIN PRIVATE KEY-----"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={orgConfigForm.signAssertions}
                      onChange={(e) => setOrgConfigForm({ ...orgConfigForm, signAssertions: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    Sign assertions
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={orgConfigForm.signRequests}
                      onChange={(e) => setOrgConfigForm({ ...orgConfigForm, signRequests: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    Sign requests
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrgConfigForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrgConfig}
                  disabled={
                    isSavingOrgConfig ||
                    !orgConfigForm.certificate ||
                    (orgConfigForm.signAssertions && !orgConfigForm.privateKey)
                  }
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSavingOrgConfig ? 'Saving…' : 'Save & enable'}
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* App SP settings */}
        <Card className="border border-gray-200 p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Application (service provider)</h2>
          <p className="mb-4 text-sm text-gray-600">
            Per-app settings for launching SSO from the dashboard — e.g. AWS console, Slack, your custom app.
          </p>

          {!orgReady && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Complete organization SAML above before configuring apps.
            </p>
          )}

          <label className="mb-1 block text-sm font-medium text-gray-700">Application</label>
          <div className="relative mb-4">
            <select
              value={selectedApp?.id || ''}
              onChange={(e) => {
                const app = apps.find((a) => a.id === e.target.value);
                setSelectedApp(app || null);
                setShowAppConfigForm(false);
              }}
              disabled={isLoadingApps}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900"
            >
              <option value="">Select an application…</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.slug})
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>

          {selectedApp && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    appSaml.samlEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {appSaml.samlEnabled ? 'SAML enabled' : 'SAML off'}
                </span>
                {canManageSaml && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyAwsPreset}
                      disabled={!orgReady}
                      className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-900 hover:bg-orange-100 disabled:opacity-50"
                    >
                      AWS preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAppConfigForm(!showAppConfigForm)}
                      disabled={!orgReady}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {showAppConfigForm ? 'Close' : 'Configure'}
                    </button>
                  </div>
                )}
              </div>

              {appSaml.samlEnabled && !showAppConfigForm && (
                <div className="mb-4 space-y-2">
                  <CopyField label="SP Entity ID" value={appSaml.entityId} />
                  <CopyField label="SP ACS URL" value={appSaml.acsUrl} />
                </div>
              )}

              {showAppConfigForm && canManageSaml && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={appConfigForm.samlEnabled}
                      onChange={(e) => setAppConfigForm({ ...appConfigForm, samlEnabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    Enable SAML for this app
                  </label>
                  {appConfigForm.samlEnabled && (
                    <div className="space-y-3 border-l-2 border-blue-200 pl-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">SP Entity ID</label>
                        <input
                          type="text"
                          value={appConfigForm.entityId}
                          onChange={(e) => setAppConfigForm({ ...appConfigForm, entityId: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="urn:amazon:webservices"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">ACS URL</label>
                        <input
                          type="text"
                          value={appConfigForm.acsUrl}
                          onChange={(e) => setAppConfigForm({ ...appConfigForm, acsUrl: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="https://signin.aws.amazon.com/saml"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">SLO URL (optional)</label>
                        <input
                          type="text"
                          value={appConfigForm.sloUrl}
                          onChange={(e) => setAppConfigForm({ ...appConfigForm, sloUrl: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppConfigForm(false);
                        setAppConfigForm(parseAppMetadata(selectedApp));
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAppConfig}
                      disabled={
                        isSavingAppConfig ||
                        (appConfigForm.samlEnabled && (!appConfigForm.entityId || !appConfigForm.acsUrl))
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingAppConfig ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* AWS quick steps */}
              {selectedApp.slug.toLowerCase().includes('aws') && orgReady && orgMetadataUrl && (
                <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h3 className="mb-2 font-semibold text-orange-950">AWS setup checklist</h3>
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-orange-900">
                    <li>
                      IAM → Identity providers → Create SAML provider → use{' '}
                      <a
                        href={orgMetadataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-orange-700 underline"
                      >
                        metadata URL
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </a>
                    </li>
                    <li>Create IAM roles with trust for that provider</li>
                    <li>
                      Here: enable SAML with AWS preset (Entity ID{' '}
                      <code className="rounded bg-white px-1 text-xs">urn:amazon:webservices</code>, ACS{' '}
                      <code className="rounded bg-white px-1 text-xs">https://signin.aws.amazon.com/saml</code>)
                    </li>
                    <li>Assign users access to this app in Admin → Apps</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Optional attributes reference */}
        <Card className="border border-gray-200 p-4">
          <button
            type="button"
            onClick={() => setShowAttributes(!showAttributes)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
              SAML assertion attributes (reference)
            </span>
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-500 transition-transform ${showAttributes ? 'rotate-180' : ''}`}
            />
          </button>
          {showAttributes && (
            <div className="mt-4 overflow-x-auto border-t border-gray-100 pt-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="pb-2 pr-4">Attribute</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  {[
                    ['email', 'User email (NameID)'],
                    ['name', 'Display name'],
                    ['userId', 'CYNAYD user ID'],
                    ['organizationId', 'Organization ID'],
                    ['role / roles', 'CYNAYD role'],
                    ['planName', 'Subscription plan'],
                  ].map(([attr, desc]) => (
                    <tr key={attr}>
                      <td className="py-2 pr-4">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{attr}</code>
                      </td>
                      <td className="py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-gray-500">
                AWS IAM role mapping may require custom attribute URIs — configure trust policies in AWS separately.
              </p>
            </div>
          )}
        </Card>

        {orgId && (
          <p className="text-center text-xs text-gray-400">
            Organization ID: <code className="text-gray-500">{orgId}</code>
          </p>
        )}
      </div>
    </UnifiedLayout>
  );
}
