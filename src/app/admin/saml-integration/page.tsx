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
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function SAMLIntegrationPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [orgId, setOrgId] = useState<string>('');
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    fetchApps();
    if (user?.organizationId) {
      setOrgId(user.organizationId);
    }
  }, [user]);

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

  // Get app-specific information
  const getAppInfo = () => {
    if (!selectedApp) {
      return {
        appSlug: '{app-slug}',
        appName: 'Your Application',
        metadataUrl: '',
        entityId: 'https://one.cynayd.com/saml',
        ssoUrl: 'https://one.cynayd.com/api/saml/sso',
        sloUrl: 'https://one.cynayd.com/api/saml/slo',
      };
    }

    const metadataUrl = `https://one.cynayd.com/api/apps/${selectedApp.slug}/saml/metadata${orgId ? `?organizationId=${orgId}` : ''}`;
    
    return {
      appSlug: selectedApp.slug,
      appName: selectedApp.name,
      metadataUrl,
      entityId: 'https://one.cynayd.com/saml',
      ssoUrl: 'https://one.cynayd.com/api/saml/sso',
      sloUrl: 'https://one.cynayd.com/api/saml/slo',
    };
  };

  const appInfo = getAppInfo();

  return (
    <UnifiedLayout
      title="SAML Integration Guide"
      subtitle="Integration details for connecting your application with CYNAYD One"
      variant="dashboard"
    >
      <div className="space-y-6">
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
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
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
                    selectedApp.metadata && JSON.parse(selectedApp.metadata)?.samlEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedApp.metadata && JSON.parse(selectedApp.metadata)?.samlEnabled ? '✅ Enabled' : '⚠️ Not Enabled'}
                  </span>
                </div>
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
