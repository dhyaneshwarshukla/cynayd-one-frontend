"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { apiClient, App } from '@/lib/api-client';
import { 
  CheckCircleIcon,
  InformationCircleIcon,
  CodeBracketIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  LinkIcon,
  KeyIcon,
  ChevronDownIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function SAMLIntegrationPage() {
  const { user } = useAuth();
  
  // Check if user is superadmin
  const userRole = user?.role?.toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  
  // Get base URL from environment or use current origin
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // For localhost, use port 4000 for backend
      if (origin.includes('localhost')) {
        return origin.replace(':3000', ':4000');
      }
      return origin;
    }
    return 'https://one.cynayd.com';
  };

  const baseUrl = getBaseUrl();
  
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [orgId, setOrgId] = useState<string>('');
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Organization SAML state
  const [orgSamlConfig, setOrgSamlConfig] = useState<any>(null);
  const [isLoadingOrgConfig, setIsLoadingOrgConfig] = useState(true);
  const [showOrgConfigForm, setShowOrgConfigForm] = useState(false);
  const [orgConfigForm, setOrgConfigForm] = useState({
    entityId: `${baseUrl}/saml`,
    ssoUrl: `${baseUrl}/api/saml/sso`,
    sloUrl: `${baseUrl}/api/saml/slo`,
    certificate: '',
    privateKey: '', // Private key for signing
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    signRequests: true,
    signAssertions: true,
    encryptAssertions: false,
  });
  const [isSavingOrgConfig, setIsSavingOrgConfig] = useState(false);
  
  // App SAML state
  const [showAppConfigForm, setShowAppConfigForm] = useState(false);
  const [appConfigForm, setAppConfigForm] = useState({
    samlEnabled: false,
    entityId: '',
    acsUrl: '',
    sloUrl: '',
  });
  const [isSavingAppConfig, setIsSavingAppConfig] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchApps();
    fetchOrgSamlConfig();
    if (user?.organizationId) {
      setOrgId(user.organizationId);
    }
  }, [user]);

  useEffect(() => {
    if (selectedApp) {
      const metadata = selectedApp.metadata ? JSON.parse(selectedApp.metadata) : {};
      setAppConfigForm({
        samlEnabled: metadata.samlEnabled || false,
        entityId: metadata.samlConfig?.entityId || '',
        acsUrl: metadata.samlConfig?.acsUrl || '',
        sloUrl: metadata.samlConfig?.sloUrl || '',
      });
    }
  }, [selectedApp]);

  const fetchApps = async () => {
    try {
      setIsLoadingApps(true);
      const appsData = await apiClient.getApps();
      setApps(appsData || []);
      if (appsData && appsData.length > 0 && !selectedApp) {
        setSelectedApp(appsData[0]);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const fetchOrgSamlConfig = async () => {
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
          privateKey: config.privateKey || '', // Extract private key from config
          nameIdFormat: config.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          signRequests: config.signRequests !== false,
          signAssertions: config.signAssertions !== false,
          encryptAssertions: config.encryptAssertions || false,
        });
      }
    } catch (error: any) {
      if (error.message?.includes('not configured') || error.message?.includes('404')) {
        setOrgSamlConfig(null);
      } else {
        console.error('Error fetching SAML config:', error);
      }
    } finally {
      setIsLoadingOrgConfig(false);
    }
  };

  const handleSaveOrgConfig = async () => {
    try {
      setIsSavingOrgConfig(true);
      
      // Ensure private key is included if it exists (even if user didn't change it)
      const configToSave = { ...orgConfigForm };
      
      // If private key is empty in form but exists in current config, preserve it
      if (!configToSave.privateKey && orgSamlConfig?.privateKey) {
        configToSave.privateKey = orgSamlConfig.privateKey;
        console.log('[SAML] Preserving existing private key from current config');
      }
      
      console.log('[SAML Frontend] Saving config:', {
        hasPrivateKey: !!configToSave.privateKey,
        privateKeyLength: configToSave.privateKey?.length,
        signAssertions: configToSave.signAssertions,
      });
      
      await apiClient.configureSaml(configToSave);
      setNotification({ type: 'success', message: 'SAML configuration saved successfully!' });
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
      setNotification({ type: 'success', message: `SAML ${enabled ? 'enabled' : 'disabled'} successfully!` });
      await fetchOrgSamlConfig();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to update SAML status' });
    }
  };

  const handleSaveAppConfig = async () => {
    try {
      if (!selectedApp) return;
      
      setIsSavingAppConfig(true);
      
      // Check if organization SAML is configured first
      if (!orgSamlConfig || !orgSamlConfig.enabled) {
        setNotification({ 
          type: 'error', 
          message: 'Please configure and enable organization SAML first. Organization SAML is required to sign SAML assertions for app access.' 
        });
        return;
      }
      
      if (appConfigForm.samlEnabled && (!appConfigForm.entityId || !appConfigForm.acsUrl)) {
        setNotification({ type: 'error', message: 'Entity ID and ACS URL are required when enabling SAML' });
        return;
      }

      await apiClient.updateAppSamlConfig(selectedApp.slug, {
        samlEnabled: appConfigForm.samlEnabled,
        samlConfig: appConfigForm.samlEnabled ? {
          entityId: appConfigForm.entityId,
          acsUrl: appConfigForm.acsUrl,
          sloUrl: appConfigForm.sloUrl || undefined,
        } : undefined,
      });
      
      setNotification({ type: 'success', message: 'App SAML configuration saved successfully!' });
      setShowAppConfigForm(false);
      await fetchApps();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to save app SAML configuration' });
    } finally {
      setIsSavingAppConfig(false);
    }
  };

  const handleCertificateFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setOrgConfigForm({ ...orgConfigForm, certificate: content.trim() });
      };
      reader.readAsText(file);
    }
  };

  const handlePrivateKeyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setOrgConfigForm({ ...orgConfigForm, privateKey: content.trim() });
      };
      reader.readAsText(file);
    }
  };

  // Get app-specific information
  const getAppInfo = () => {
    if (!selectedApp) {
      return {
        appSlug: '{app-slug}',
        appName: 'Your Application',
        metadataUrl: '',
        entityId: orgSamlConfig?.entityId || `${baseUrl}/saml`,
        ssoUrl: orgSamlConfig?.ssoUrl || `${baseUrl}/api/saml/sso`,
        sloUrl: orgSamlConfig?.sloUrl || `${baseUrl}/api/saml/slo`,
      };
    }

    const metadataUrl = `${baseUrl}/api/apps/${selectedApp.slug}/saml/metadata${orgId ? `?organizationId=${orgId}` : ''}`;
    
    return {
      appSlug: selectedApp.slug,
      appName: selectedApp.name,
      metadataUrl,
      entityId: orgSamlConfig?.entityId || `${baseUrl}/saml`,
      ssoUrl: orgSamlConfig?.ssoUrl || `${baseUrl}/api/saml/sso`,
      sloUrl: orgSamlConfig?.sloUrl || `${baseUrl}/api/saml/slo`,
    };
  };

  const appInfo = getAppInfo();

  // Helper function to safely parse metadata and check SAML status
  const getSamlStatus = (app: App | null) => {
    if (!app?.metadata) return false;
    try {
      const metadata = JSON.parse(app.metadata);
      return metadata?.samlEnabled === true;
    } catch {
      return false;
    }
  };

  const isSamlEnabled = getSamlStatus(selectedApp);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <UnifiedLayout
      title="SAML Integration Guide"
      subtitle="Integration details for connecting your application with CYNAYD One"
      variant="dashboard"
    >
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Organization SAML Configuration */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <KeyIcon className="h-5 w-5 text-purple-600" />
                <span>Organization SAML Configuration</span>
                {!orgSamlConfig || !orgSamlConfig.enabled ? (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                    Required
                  </span>
                ) : null}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Configure CYNAYD One as an Identity Provider (IdP) for your organization. This is required before you can use SAML SSO for apps.
              </p>
              {!orgSamlConfig || !orgSamlConfig.enabled ? (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Action Required:</strong> You must configure and enable organization SAML before apps can use SAML SSO. The organization SAML certificate is used to sign SAML assertions sent to your apps.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOrgSamlConfig}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                title="Refresh configuration"
              >
                Refresh
              </button>
              {orgSamlConfig && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgSamlConfig.enabled || false}
                      onChange={(e) => handleEnableOrgSaml(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {orgSamlConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setShowOrgConfigForm(!showOrgConfigForm);
                    if (!showOrgConfigForm) {
                      fetchOrgSamlConfig();
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center space-x-2"
                >
                  {orgSamlConfig ? (
                    <>
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Configuration</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      <span>Configure SAML</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {isLoadingOrgConfig ? (
            <div className="text-sm text-gray-500">Loading configuration...</div>
          ) : orgSamlConfig ? (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Entity ID:</span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-900">{orgSamlConfig.entityId}</code>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      orgSamlConfig.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orgSamlConfig.enabled ? '✅ Enabled' : '⚠️ Disabled'}
                    </span>
                  </div>
                  {orgSamlConfig.certificateExpiresAt && (
                    <div>
                      <span className="font-semibold text-gray-700">Certificate Expires:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(orgSamlConfig.certificateExpiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Private Key:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      orgSamlConfig.privateKey
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {orgSamlConfig.privateKey ? '✅ Configured' : '❌ Missing'}
                    </span>
                  </div>
                </div>
              </div>
              {orgSamlConfig.enabled && orgSamlConfig.signAssertions && !orgSamlConfig.privateKey && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">Private Key Required</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Your SAML configuration is missing the private key. SAML SSO will not work without it. Please click "Edit Configuration" and add your private key.
                      </p>
                      <button
                        onClick={() => {
                          setShowOrgConfigForm(true);
                          fetchOrgSamlConfig();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        Add Private Key Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ SAML is not configured for your organization. Click "Configure SAML" to set it up.
              </p>
            </div>
          )}

          {showOrgConfigForm && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4">SAML Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgConfigForm.entityId}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, entityId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`${baseUrl}/saml`}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Unique identifier for CYNAYD One as IdP</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SSO URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgConfigForm.ssoUrl}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, ssoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`${baseUrl}/api/saml/sso`}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Single Sign-On endpoint URL</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SLO URL (Optional)</label>
                  <input
                    type="text"
                    value={orgConfigForm.sloUrl}
                    onChange={(e) => setOrgConfigForm({ ...orgConfigForm, sloUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`${baseUrl}/api/saml/slo`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Single Logout endpoint URL (optional)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate (PEM Format) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pem,.crt,.cert"
                      onChange={handleCertificateFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    <textarea
                      value={orgConfigForm.certificate}
                      onChange={(e) => setOrgConfigForm({ ...orgConfigForm, certificate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-xs"
                      rows={6}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Upload or paste your SAML certificate (public key) in PEM format.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Private Key (PEM Format) {orgConfigForm.signAssertions && <span className="text-red-500">*</span>}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pem,.key"
                      onChange={handlePrivateKeyFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    <textarea
                      value={orgConfigForm.privateKey}
                      onChange={(e) => setOrgConfigForm({ ...orgConfigForm, privateKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-xs"
                      rows={6}
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                      required={orgConfigForm.signAssertions}
                    />
                    <p className="text-xs text-gray-500">
                      Upload or paste your SAML private key in PEM format. Required when "Sign Assertions" is enabled. Keep this secure!
                    </p>
                    {orgConfigForm.signAssertions && !orgConfigForm.privateKey && (
                      <p className="text-xs text-red-600">
                        ⚠️ Private key is required when signing assertions is enabled.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={orgConfigForm.signRequests}
                      onChange={(e) => setOrgConfigForm({ ...orgConfigForm, signRequests: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Sign Requests</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={orgConfigForm.signAssertions}
                      onChange={(e) => setOrgConfigForm({ ...orgConfigForm, signAssertions: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Sign Assertions</span>
                  </label>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setShowOrgConfigForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOrgConfig}
                    disabled={
                      isSavingOrgConfig || 
                      !orgConfigForm.certificate || 
                      (orgConfigForm.signAssertions && !orgConfigForm.privateKey)
                    }
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isSavingOrgConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
        {/* App Selector */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <KeyIcon className="h-5 w-5 text-blue-600" />
                <span>Select Application</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose an application to view its SAML integration details
              </p>
              {isLoadingApps ? (
                <div className="text-sm text-gray-500">Loading apps...</div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedApp?.id || ''}
                    onChange={(e) => {
                      const app = apps.find(a => a.id === e.target.value);
                      setSelectedApp(app || null);
                    }}
                    className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="">Select an application...</option>
                    {apps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name} ({app.slug})
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
          {selectedApp && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">App Name:</span>
                  <span className="ml-2 text-gray-900">{selectedApp.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Slug:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-900">{selectedApp.slug}</code>
                </div>
                {selectedApp.url && (
                  <div>
                    <span className="font-semibold text-gray-700">URL:</span>
                    <a href={selectedApp.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                      {selectedApp.url}
                    </a>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">SAML Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      isSamlEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                      {isSamlEnabled ? '✅ Enabled' : '⚠️ Not Enabled'}
                  </span>
                </div>
                </div>
              </div>

              {/* App SAML Configuration */}
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">App SAML Configuration</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure SAML settings for this specific application (Service Provider settings)
                    </p>
                    {(!orgSamlConfig || !orgSamlConfig.enabled) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                        ⚠️ Organization SAML must be configured and enabled first before configuring app SAML.
                      </div>
                    )}
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setShowAppConfigForm(!showAppConfigForm)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
                    >
                      {showAppConfigForm ? (
                        <>
                          <XMarkIcon className="h-4 w-4" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4" />
                          <span>Configure</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {showAppConfigForm && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="samlEnabled"
                        checked={appConfigForm.samlEnabled}
                        onChange={(e) => setAppConfigForm({ ...appConfigForm, samlEnabled: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="samlEnabled" className="text-sm font-medium text-gray-700">
                        Enable SAML for this app
                      </label>
                    </div>

                    {appConfigForm.samlEnabled && (
                      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entity ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={appConfigForm.entityId}
                            onChange={(e) => setAppConfigForm({ ...appConfigForm, entityId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://your-app.example.com/saml"
                          />
                          <p className="mt-1 text-xs text-gray-500">Your app's unique SAML identifier</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ACS URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={appConfigForm.acsUrl}
                            onChange={(e) => setAppConfigForm({ ...appConfigForm, acsUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://your-app.example.com/saml/acs"
                          />
                          <p className="mt-1 text-xs text-gray-500">Where your app receives SAML responses</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SLO URL (Optional)
                          </label>
                          <input
                            type="text"
                            value={appConfigForm.sloUrl}
                            onChange={(e) => setAppConfigForm({ ...appConfigForm, sloUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://your-app.example.com/saml/slo"
                          />
                          <p className="mt-1 text-xs text-gray-500">Single Logout URL (optional)</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowAppConfigForm(false);
                          // Reset form to current app state
                          if (selectedApp) {
                            const metadata = selectedApp.metadata ? JSON.parse(selectedApp.metadata) : {};
                            setAppConfigForm({
                              samlEnabled: metadata.samlEnabled || false,
                              entityId: metadata.samlConfig?.entityId || '',
                              acsUrl: metadata.samlConfig?.acsUrl || '',
                              sloUrl: metadata.samlConfig?.sloUrl || '',
                            });
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAppConfig}
                        disabled={
                          isSavingAppConfig || 
                          (appConfigForm.samlEnabled && (!appConfigForm.entityId || !appConfigForm.acsUrl)) ||
                          !orgSamlConfig || 
                          !orgSamlConfig.enabled
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        title={(!orgSamlConfig || !orgSamlConfig.enabled) ? 'Organization SAML must be enabled first' : ''}
                      >
                        {isSavingAppConfig ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                )}

                {!showAppConfigForm && isSamlEnabled && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {(() => {
                        const metadata = selectedApp.metadata ? JSON.parse(selectedApp.metadata) : {};
                        return (
                          <>
                            {metadata.samlConfig?.entityId && (
                              <div>
                                <span className="font-semibold text-gray-700">Entity ID:</span>
                                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-900 text-xs">
                                  {metadata.samlConfig.entityId}
                                </code>
                              </div>
                            )}
                            {metadata.samlConfig?.acsUrl && (
                              <div>
                                <span className="font-semibold text-gray-700">ACS URL:</span>
                                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-900 text-xs">
                                  {metadata.samlConfig.acsUrl}
                                </code>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {selectedApp && (
          <>
            {/* Step 1: Add CYNAYD One as IdP */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Add CYNAYD One as your Identity Provider
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Use the following IdP details to configure CYNAYD One in your Service Provider:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">Entity ID:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(appInfo.entityId);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                      <code className="text-sm text-gray-900 break-all">{appInfo.entityId}</code>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">Single Sign-On (SSO) URL:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(appInfo.ssoUrl);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                      <code className="text-sm text-gray-900 break-all">{appInfo.ssoUrl}</code>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">Single Logout (SLO) URL (optional):</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(appInfo.sloUrl);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                      <code className="text-sm text-gray-900 break-all">{appInfo.sloUrl}</code>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">Certificate (x509):</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Fetch certificate from metadata or show placeholder
                              setShowCertificate(!showCertificate);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {showCertificate ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => {
                              // Copy certificate
                              navigator.clipboard.writeText('Certificate will be provided via metadata URL or separately');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      {showCertificate ? (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-2">
                            Certificate is available via metadata URL or will be provided separately.
                          </p>
                          <code className="text-xs text-gray-700 break-all">
                            -----BEGIN CERTIFICATE-----<br />
                            (Certificate will be provided)<br />
                            -----END CERTIFICATE-----
                          </code>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 italic">
                          Certificate will be provided via metadata URL or separately. This is the only thing to update when expired.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2: Use Metadata URL */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Use Metadata URL (Recommended)
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    You can automatically import IdP configuration using the metadata URL. Your SP will automatically pull Entity ID, SSO URL, SLO URL, and Public certificate.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Metadata URL:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(appInfo.metadataUrl);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <code className="text-sm text-gray-900 break-all">{appInfo.metadataUrl}</code>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>💡 Tip:</strong> If your SP supports metadata auto-refresh, enable it to automatically receive certificate updates when CYNAYD rotates certificates.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 3: Configure Your Service Provider */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Configure Your Service Provider
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Add your SAML settings in your application:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">ACS URL:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Where your app receives SAML responses (e.g., <code className="bg-gray-100 px-1 rounded">https://your-app.com/saml/acs</code>)
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Entity ID:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Your unique app identifier (e.g., <code className="bg-gray-100 px-1 rounded">https://your-app.com/saml</code>)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* SAML Attributes */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <span>SAML Attributes You Will Receive</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your application will receive the following user and organization attributes in SAML assertions:
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Attribute</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">email</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">User email address</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">name</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">User full name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">userId</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Unique user ID</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">organizationId</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Organization ID</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">organizationName</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Organization name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">role</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">User role (user, admin, etc.)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">planId</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Current plan ID</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">planName</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Plan name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">maxUsers</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Maximum allowed users</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">maxApps</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Maximum allowed apps</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">maxStorage</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Maximum allowed storage (in bytes)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">subscriptionStatus</code></td>
                      <td className="px-4 py-3 text-sm text-gray-600">Subscription status (active / inactive)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Certificate Renewal Policy */}
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-3">Certificate Renewal Policy</h3>
                  <p className="text-sm text-yellow-800 mb-4">
                    When CYNAYD rotates the certificate, you only need to update one thing:
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 border-2 border-green-300 mb-4">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span>✅ You only need to update:</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-green-800 ml-7">
                      <li>• <strong>The IdP public certificate</strong> - Replace the old certificate with the new one</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center space-x-2">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                      <span>❌ You do NOT need to update:</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-red-800 ml-7">
                      <li>• Entity ID</li>
                      <li>• SSO URL</li>
                      <li>• SLO URL</li>
                      <li>• Metadata URL</li>
                      <li>• ACS URL</li>
                      <li>• Any other configuration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Automatic Certificate Update */}
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">Automatic Certificate Update (Optional)</h3>
                  <p className="text-sm text-green-800 mb-3">
                    If your SP supports metadata auto-refresh, you can enable automatic certificate updates:
                  </p>
                  <ol className="space-y-2 text-sm text-green-800 ml-4">
                    <li>1. Add the Metadata URL: <code className="bg-white px-1 rounded text-xs">{appInfo.metadataUrl}</code></li>
                    <li>2. Enable auto-refresh in your SP configuration</li>
                    <li>3. Certificate updates automatically when CYNAYD rotates certificates</li>
                  </ol>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-green-700">
                      <strong>💡 Benefit:</strong> No manual certificate updates needed. Your SP will automatically fetch the latest certificate from the metadata URL.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {!selectedApp && (
          <Card className="p-6">
            <div className="text-center py-8">
              <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Please select an application to view SAML integration details</p>
            </div>
          </Card>
        )}
      </div>
    </UnifiedLayout>
  );
}
