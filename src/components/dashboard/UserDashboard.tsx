"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  url?: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserAppAccess {
  id: string;
  userId: string;
  appId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  assignedAt: string;
  usedQuota: number;
  quota?: number;
  expiresAt?: string;
}

interface AppWithAccess extends App {
  userAccess?: UserAppAccess;
}

interface UserStats {
  totalApps: number;
  activeApps: number;
  usedQuota: number;
  totalQuota: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface UserDashboardProps {
  user: any;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [apps, setApps] = useState<AppWithAccess[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalApps: 0,
    activeApps: 0,
    usedQuota: 0,
    totalQuota: 0
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch organization details if user has organizationId
      if (user?.organizationId) {
        try {
          const orgDetails = await apiClient.getOrganizationById(user.organizationId);
          setOrganization(orgDetails);
        } catch (orgError) {
          console.warn('Failed to fetch organization details:', orgError);
          // Fallback to showing organizationId if name fetch fails
          setOrganization({ 
            id: user.organizationId, 
            name: user.organizationId,
            slug: user.organizationId.toLowerCase().replace(/\s+/g, '-')
          });
        }
      }

      // Fetch apps and user access
      const appsData = await getApps();
      setApps(appsData);

      // Calculate stats
      const activeApps = appsData.filter(app => app.isActive).length;
      const usedQuota = appsData.reduce((sum, app) => sum + (app.userAccess?.usedQuota || 0), 0);
      const totalQuota = appsData.reduce((sum, app) => sum + (app.userAccess?.quota || 0), 0);
      
      console.log('Stats calculation:', {
        totalApps: appsData.length,
        activeApps,
        appsData: appsData.map(app => ({ name: app.name, isActive: app.isActive }))
      });

      setStats({
        totalApps: appsData.length,
        activeApps,
        usedQuota,
        totalQuota
      });

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getApps = async (): Promise<AppWithAccess[]> => {
    try {
      // Fetch user's assigned apps from API
      const userApps = await apiClient.getUserApps();
      
      // Transform the API response to match the expected format
      const apps: AppWithAccess[] = userApps.map((app, index) => {
        const processedApp = {
          id: app.id,
          name: app.name,
          slug: app.slug,
          description: app.description || 'No description available',
          icon: getAppIcon(app.slug),
          color: getAppColor(app.slug),
          isActive: true, // API doesn't include isActive field, but returns only accessible apps
          createdAt: app.createdAt || new Date().toISOString(),
          updatedAt: app.updatedAt || new Date().toISOString(),
          userAccess: {
            id: `${index + 1}`,
            userId: user?.id || '',
            appId: app.id,
            isActive: true, // Since API already filters for active access
            assignedAt: app.access?.assignedAt || new Date().toISOString(),
            usedQuota: app.access?.usedQuota || 0,
            quota: app.access?.quota,
            expiresAt: app.access?.expiresAt,
            permissions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        
        console.log(`App: ${app.name}, isActive: ${processedApp.isActive}, userAccess.isActive: ${processedApp.userAccess.isActive}`);
        return processedApp;
      });

      return apps;
    } catch (error) {
      console.error('Error fetching user apps:', error);
      return [];
    }
  };

  const getAppIcon = (slug: string): string => {
    const iconMap: { [key: string]: string } = {
      'hr-management': '👥',
      'drive': '💾',
      'connect': '💬',
      'crm-system': '📊',
      'project-tracker': '📋',
      'admin-dashboard': '🛡️',
      'user-management': '👤',
      'security-center': '🔒'
    };
    return iconMap[slug] || '📱';
  };

  const getAppColor = (slug: string): string => {
    const colorMap: { [key: string]: string } = {
      'hr-management': '#3B82F6',
      'drive': '#10B981',
      'connect': '#8B5CF6',
      'crm-system': '#F59E0B',
      'project-tracker': '#EF4444',
      'admin-dashboard': '#6366F1',
      'user-management': '#06B6D4',
      'security-center': '#DC2626'
    };
    return colorMap[slug] || '#3B82F6';
  };

  const handleAppAccess = async (app: AppWithAccess) => {
    try {
      console.log('Accessing app:', app.name);
      
      // Get app details to check if SAML is enabled
      const appDetails = await apiClient.getAppBySlug(app.slug);
      const appMetadata = appDetails.metadata ? JSON.parse(appDetails.metadata) : {};
      const isSamlEnabled = appMetadata.samlEnabled && appMetadata.samlConfig;
      
      if (isSamlEnabled) {
        // Use SAML SSO
        console.log(`Initiating SAML SSO for app: ${app.slug}`);
        const response = await apiClient.initiateSamlSSO(app.slug);
        
        // SAML SSO returns HTML that auto-submits a form
        const html = await response.text();
        
        // Create a new window and write the HTML to it
        const samlWindow = window.open('', '_blank');
        if (samlWindow) {
          samlWindow.document.write(html);
          samlWindow.document.close();
        } else {
          alert('Popup blocked. Please allow popups for this site.');
        }
      } else {
        // Use JWT SSO (legacy)
        const { ssoToken } = await apiClient.generateSSOToken(app.slug);
        
        if (appDetails && appDetails.url) {
          // Redirect directly to the actual app URL with SSO token
          const appUrl = `${appDetails.url}?sso_token=${ssoToken}`;
          console.log(`Redirecting to actual app URL: ${appUrl}`);
          window.open(appUrl, '_blank');
        } else {
          // Fallback: redirect to the portal page if no URL is configured
          const appUrl = `${window.location.origin}/${app.slug}?sso_token=${ssoToken}`;
          console.log(`No app URL configured, redirecting to portal: ${appUrl}`);
          window.open(appUrl, '_blank');
        }
      }
      
    } catch (error) {
      console.error('Error accessing app:', error);
      alert(`Failed to access ${app.name}. Please try again.`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-blue-100 rounded-2xl">
            <span className="text-4xl">🚀</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to {organization?.name || 'Your'} Workspace
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Access your assigned apps and collaborate with your team
            </p>
          </div>
        </div>
      </div>

      {/* Apps Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apps to Access</h2>
            <p className="text-gray-600 mt-1">Access your assigned apps and tools</p>
          </div>
        </div>

        {apps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <Card 
                key={app.id} 
                className="p-6 hover:shadow-lg transition-shadow group cursor-pointer"
                onClick={() => handleAppAccess(app)}
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ 
                      backgroundColor: app.color + '15', 
                      color: app.color
                    }}
                  >
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {app.description}
                    </p>
                    <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium inline-block ${
                      app.isActive
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {app.isActive ? 'Active' : 'Inactive'} 
                      {/* Debug: {JSON.stringify({isActive: app.isActive, userAccess: app.userAccess?.isActive})} */}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Apps Assigned
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have any apps assigned yet. Contact your administrator to get access to the tools you need for your work.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => alert('Contact admin feature coming soon!')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span className="mr-2">📧</span>
                Request Access
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Help center coming soon!')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">❓</span>
                Get Help
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Analytics */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Analytics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-1">Active Apps</h4>
              <p className="text-2xl font-bold text-blue-600">{stats.activeApps}</p>
              <p className="text-sm text-gray-600">Currently accessible</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-1">Total Apps</h4>
              <p className="text-2xl font-bold text-green-600">{stats.totalApps}</p>
              <p className="text-sm text-gray-600">Assigned to you</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/dashboard/profile'}
              className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <span className="mr-3">👤</span>
              Update Profile
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/settings'}
              className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <span className="mr-3">⚙️</span>
              Settings
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/help'}
              className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              <span className="mr-3">❓</span>
              Get Help
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}