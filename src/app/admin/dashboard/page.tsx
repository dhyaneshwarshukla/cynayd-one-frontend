"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import AppManagement from '@/components/admin/AppManagement';
import OrganizationUserManagement from '@/components/admin/OrganizationUserManagement';
import OrganizationAppManagement from '@/components/admin/OrganizationAppManagement';
import OrganizationSettings from '@/components/admin/OrganizationSettings';
import PlanManagement from '@/components/admin/PlanManagement';
import { 
  UsersIcon, 
  Squares2X2Icon, 
  ChartBarIcon, 
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  organization: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
  };
  users: {
    total: number;
    active: number;
    lastLogin: Date | null;
    firstLogin: Date | null;
  };
  apps: {
    total: number;
    activeAccess: number;
  };
  activity: {
    recentActivity: number;
    securityEvents: number;
  };
  trends: {
    userGrowth: number;
    appUsage: number;
  };
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  user?: string;
  type: 'user' | 'system' | 'security';
  details?: string;
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<number>(0);

  // Fetch dashboard data when user is available
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.organizationId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch organization-specific dashboard stats
      const stats = await apiClient.getOrganizationDashboardStats(user.organizationId);
      setDashboardStats(stats);

      // Fetch recent activity for the organization
      const activity = await apiClient.getAuditLogs({ 
        limit: 10,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      });
      
      // Ensure activity is an array
      const activityArray = Array.isArray(activity) ? activity : [];
      
      setRecentActivity(activityArray.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
        user: undefined, // TODO: Get user info from log
        type: log.action.toLowerCase().includes('security') ? 'security' : 
              log.action.toLowerCase().includes('system') ? 'system' : 'user',
        details: log.details ? JSON.stringify(log.details) : undefined
      })));

      // Calculate notifications based on recent activity and security events
      const notificationCount = Math.min(
        (stats.activity.recentActivity || 0) + (stats.activity.securityEvents || 0),
        99
      );
      setNotifications(notificationCount);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-700 text-sm mt-1">Admin or Super Admin privileges required.</p>
        </div>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button 
            onClick={fetchDashboardData}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <UnifiedLayout 
      title={`${dashboardStats?.organization?.name || 'Organization'} Admin Dashboard`} 
      subtitle={`Welcome back, ${user.name || user.email}. Manage ${dashboardStats?.organization?.name || 'your organization'} and apps.`} 
      variant="dashboard"
    >
      <div>
        {/* Quick Actions Header */}
        <div className="mb-8">
          <div className="flex items-center justify-end space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <BellIcon className="w-5 h-5 mr-2" />
              <span>{notifications} notifications</span>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusIcon className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('apps')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'apps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Squares2X2Icon className="w-5 h-5 mr-2" />
                App Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UsersIcon className="w-5 h-5 mr-2" />
                User Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Activity
              </div>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">💎</span>
                Plans & Billing
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CogIcon className="w-5 h-5 mr-2" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} gap="md">
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <UsersIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Users</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {dashboardStats?.users.total || 0}
                      </p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {dashboardStats?.users.active || 0} active
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Squares2X2Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Available Apps</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {dashboardStats?.apps.total || 0}
                      </p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {dashboardStats?.apps.activeAccess || 0} active access
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Recent Activity</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {dashboardStats?.activity.recentActivity || 0}
                      </p>
                      <p className="text-sm text-blue-600 mt-1 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Last 7 days
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <ShieldCheckIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Security Events</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {dashboardStats?.activity.securityEvents || 0}
                      </p>
                      <p className={`text-sm mt-1 flex items-center ${
                        (dashboardStats?.activity.securityEvents || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {(dashboardStats?.activity.securityEvents || 0) > 0 ? (
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                        )}
                        {(dashboardStats?.activity.securityEvents || 0) > 0 ? 'Needs attention' : 'All clear'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </ResponsiveGrid>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Button 
                  onClick={() => setActiveTab('apps')}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <PlusIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">Add New App</div>
                      <div className="text-sm opacity-90">Create and configure a new application</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">Manage Users</div>
                      <div className="text-sm opacity-90">Add users and assign app access</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <CogIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">Settings</div>
                      <div className="text-sm opacity-90">Configure organization settings</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Recent Activity & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Button 
                    variant="outline" 
                    className="text-sm"
                    onClick={() => setActiveTab('activity')}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className={`flex items-center p-3 rounded-lg ${
                        activity.type === 'security' ? 'bg-red-50' :
                        activity.type === 'system' ? 'bg-blue-50' : 'bg-green-50'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          activity.type === 'security' ? 'bg-red-100' :
                          activity.type === 'system' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {activity.type === 'security' ? (
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                          ) : activity.type === 'system' ? (
                            <CogIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <UsersIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Organization Status</h3>
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Organization</span>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">
                      {dashboardStats?.organization?.name || 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <UsersIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">User Activity</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {dashboardStats?.users.active || 0} active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Squares2X2Icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">App Access</span>
                    </div>
                    <span className="text-sm text-purple-600 font-medium">
                      {dashboardStats?.apps.activeAccess || 0} active
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          user?.organizationId ? (
            <OrganizationAppManagement 
              organizationId={user.organizationId}
              currentUserRole={user.role}
            />
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <Squares2X2Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Organization Access</h3>
                  <p className="text-gray-600 mb-4">
                    You need to be associated with an organization to manage apps.
                  </p>
                  <p className="text-sm text-gray-500">
                    Contact your administrator to be added to an organization.
                  </p>
                </div>
              </Card>
            </div>
          )
        )}

        {activeTab === 'users' && (
          user?.organizationId ? (
            <OrganizationUserManagement 
              organizationId={user.organizationId}
              currentUserRole={user.role}
            />
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Organization Access</h3>
                  <p className="text-gray-600 mb-4">
                    You need to be associated with an organization to manage users.
                  </p>
                  <p className="text-sm text-gray-500">
                    Contact your administrator to be added to an organization.
                  </p>
                </div>
              </Card>
            </div>
          )
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
                <Button 
                  variant="outline" 
                  onClick={fetchDashboardData}
                  className="text-sm"
                >
                  <ClockIcon className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className={`flex items-center p-4 rounded-lg border ${
                      activity.type === 'security' ? 'bg-red-50 border-red-200' :
                      activity.type === 'system' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        activity.type === 'security' ? 'bg-red-100' :
                        activity.type === 'system' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'security' ? (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                        ) : activity.type === 'system' ? (
                          <CogIcon className="w-5 h-5 text-blue-600" />
                        ) : (
                          <UsersIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-gray-600 mt-1 font-mono bg-gray-100 p-2 rounded">
                            {activity.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ClockIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                    <p className="text-gray-600">Activity will appear here as users interact with the system.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'plans' && (
          user?.organizationId ? (
            <PlanManagement organizationId={user.organizationId} />
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <span className="text-6xl mb-4 block">💎</span>
                  <h3 className="text-lg font-medium mb-2">No Organization Access</h3>
                  <p className="text-gray-600 mb-4">
                    You need to be associated with an organization to manage plans.
                  </p>
                  <p className="text-sm text-gray-500">
                    Contact your administrator to be added to an organization.
                  </p>
                </div>
              </Card>
            </div>
          )
        )}

        {activeTab === 'settings' && (
          user?.organizationId && dashboardStats ? (
            <OrganizationSettings 
              organizationId={user.organizationId}
              currentUserRole={user.role}
              dashboardStats={dashboardStats}
            />
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <CogIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Organization Access</h3>
                  <p className="text-gray-600 mb-4">
                    You need to be associated with an organization to manage settings.
                  </p>
                  <p className="text-sm text-gray-500">
                    Contact your administrator to be added to an organization.
                  </p>
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    </UnifiedLayout>
  );
}
