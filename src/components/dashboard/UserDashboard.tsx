"use client";

import { useEffect, useState } from 'react';
import { apiClient, AppWithAccess } from '@/lib/api-client';
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
      const usedQuota = appsData.reduce((sum, app) => sum + (app.access?.usedQuota || 0), 0);
      const totalQuota = appsData.reduce((sum, app) => sum + (app.access?.quota || 0), 0);
      

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
      // Use exact same logic as /apps page - check role directly (case-sensitive)
      const userRole = user?.role;
      
      let apps: AppWithAccess[] = [];
      
      if (userRole === 'SUPER_ADMIN') {
        // Super admins see all active apps
        const allApps = await apiClient.getApps();
        apps = allApps
          .filter(app => app.isActive !== false)
          .map(app => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description || 'No description available',
            icon: getAppIcon(app.slug),
            color: getAppColor(app.slug),
            isActive: app.isActive !== false,
            systemApp: app.systemApp,
            organizationId: app.organizationId,
            createdAt: app.createdAt || new Date().toISOString(),
            updatedAt: app.updatedAt || new Date().toISOString(),
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
      } else if (userRole === 'ADMIN') {
        // Admins see: system apps + organization apps + assigned apps
        const [allApps, assignedApps] = await Promise.all([
          apiClient.getApps(),
          apiClient.getUserApps()
        ]);
        
        // Get system apps (read-only, only if active)
        const systemApps = allApps
          .filter(app => app.systemApp === true && app.isActive !== false)
          .map(app => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description || 'No description available',
            icon: getAppIcon(app.slug),
            color: getAppColor(app.slug),
            isActive: app.isActive !== false,
            systemApp: app.systemApp,
            organizationId: app.organizationId,
            createdAt: app.createdAt || new Date().toISOString(),
            updatedAt: app.updatedAt || new Date().toISOString(),
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        
        // Get organization apps (only active ones, belonging to user's organization)
        const organizationApps = allApps
          .filter(app => {
            const matches = app.organizationId === user.organizationId && app.isActive !== false;
            return matches;
          })
          .map(app => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description || 'No description available',
            icon: getAppIcon(app.slug),
            color: getAppColor(app.slug),
            isActive: app.isActive !== false,
            systemApp: app.systemApp,
            organizationId: app.organizationId,
            createdAt: app.createdAt || new Date().toISOString(),
            updatedAt: app.updatedAt || new Date().toISOString(),
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        
        // Get assigned apps (only active ones)
        const assignedActiveApps = assignedApps
          .filter(app => app.isActive !== false)
          .map(app => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description || 'No description available',
            icon: getAppIcon(app.slug),
            color: getAppColor(app.slug),
            isActive: app.isActive !== false,
            systemApp: app.systemApp,
            organizationId: app.organizationId,
            createdAt: app.createdAt || new Date().toISOString(),
            updatedAt: app.updatedAt || new Date().toISOString(),
            access: {
              assignedAt: app.access?.assignedAt || new Date().toISOString(),
              expiresAt: app.access?.expiresAt || null,
              quota: app.access?.quota || null,
              usedQuota: app.access?.usedQuota || 0
            }
          }));
        
        // Combine and deduplicate by ID
        const allUserApps = [...systemApps, ...organizationApps, ...assignedActiveApps];
        const uniqueAppsMap = new Map<string, AppWithAccess>();
        
        allUserApps.forEach(app => {
          if (!uniqueAppsMap.has(app.id)) {
            uniqueAppsMap.set(app.id, app);
          }
        });
        
        apps = Array.from(uniqueAppsMap.values());
      } else {
        // Regular users see only their assigned active apps
        const assignedApps = await apiClient.getUserApps();
        
        // Deduplicate apps by ID to prevent showing the same app multiple times
        const uniqueAppsMap = new Map<string, AppWithAccess>();
        
        assignedApps
          .filter(app => app.isActive !== false)
          .forEach(app => {
            // Skip if we've already processed this app ID
            if (!uniqueAppsMap.has(app.id)) {
              uniqueAppsMap.set(app.id, {
                id: app.id,
                name: app.name,
                slug: app.slug,
                description: app.description || 'No description available',
                icon: getAppIcon(app.slug),
                color: getAppColor(app.slug),
                isActive: app.isActive !== false,
                systemApp: app.systemApp,
                organizationId: app.organizationId,
                createdAt: app.createdAt || new Date().toISOString(),
                updatedAt: app.updatedAt || new Date().toISOString(),
                access: {
                  assignedAt: app.access?.assignedAt || new Date().toISOString(),
                  expiresAt: app.access?.expiresAt || null,
                  quota: app.access?.quota || null,
                  usedQuota: app.access?.usedQuota || 0
                }
              });
            }
          });
        
        apps = Array.from(uniqueAppsMap.values());
      }
      
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
      // Get app details to check if SAML is enabled
      const appDetails = await apiClient.getAppBySlug(app.slug);
      const appMetadata = appDetails.metadata ? JSON.parse(appDetails.metadata) : {};
      const isSamlEnabled = appMetadata.samlEnabled && appMetadata.samlConfig;
      
      if (!isSamlEnabled) {
        alert('SAML is not configured for this app. Please contact your administrator to configure SAML.');
        return;
      }
      
      // Use SAML SSO
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
                      {/* Debug: {JSON.stringify({isActive: app.isActive, access: app.access})} */}
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