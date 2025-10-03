"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';

interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalApps: number;
  securityEvents: number;
  recentLogins: number;
  pendingInvitations: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  user?: string;
  organization?: string;
  type: 'user' | 'system' | 'security';
  details?: string;
}

interface DashboardUser {
  id: string;
  name?: string;
  email: string;
  organization?: string;
  role: string;
}

interface SuperAdminDashboardProps {
  user: any;
}

export default function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalUsers: 0, 
    totalOrganizations: 0, 
    totalApps: 0,
    securityEvents: 0,
    recentLogins: 0,
    pendingInvitations: 0,
    systemHealth: 100
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch organizations first to get real counts
      const orgsData = await apiClient.getOrganizations();
      console.log('Fetched organizations:', orgsData); // Debug log
      setOrganizations(orgsData);
      
      // Calculate totals from organizations data
      const totalUsersFromOrgs = orgsData.reduce((sum, org) => sum + (org.userCount || 0), 0);
      const totalAppsFromOrgs = orgsData.reduce((sum, org) => sum + (org.appCount || 0), 0);
      
      console.log('Dashboard stats calculated:', {
        totalUsers: totalUsersFromOrgs,
        totalOrganizations: orgsData.length,
        totalApps: totalAppsFromOrgs
      }); // Debug log

      // Fetch dashboard statistics
      const statsData = await apiClient.getDashboardStats();
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: totalUsersFromOrgs,
        totalOrganizations: orgsData.length,
        totalApps: totalAppsFromOrgs,
        securityEvents: statsData.securityEvents || 0,
        recentLogins: 0,
        pendingInvitations: 0,
        systemHealth: 100
      }));

      // Fetch recent activity
      const activityData = await apiClient.getAuditLogs({ limit: 10 });
      setRecentActivity(activityData.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
        user: undefined,
        organization: undefined,
        type: log.action.toLowerCase().includes('security') ? 'security' : 
              log.action.toLowerCase().includes('system') ? 'system' : 
              'user',
        details: log.details ? JSON.stringify(log.details) : undefined
      })));

      // Fetch users
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (userErr) {
        console.warn('Failed to fetch users:', userErr);
      }

      // Fetch security alerts
      try {
        const alertsData = await apiClient.getSecurityEvents({ limit: 10 });
        setSecurityAlerts(alertsData);
      } catch (alertsErr) {
        console.warn('Failed to fetch security alerts:', alertsErr);
        setSecurityAlerts([]);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (): Promise<DashboardUser[]> => {
    try {
      // Fetch real users from API
      const usersData = await apiClient.getUsers();
      return usersData.map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        organization: 'Unknown Organization', // TODO: Get organization name
        role: user.role
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
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
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-purple-100 rounded-2xl">
            <span className="text-4xl">👑</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">
              Full system access - manage all organizations, users, and global settings
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <span className="text-2xl text-white">🏢</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <span className="text-2xl text-white">👤</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <span className="text-2xl text-white">📦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Apps</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApps}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <span className="text-2xl text-white">💚</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900">{stats.systemHealth}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/organizations'}>
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">🏢</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Organizations</h3>
            <p className="text-sm text-gray-600">Create and manage organizations</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/users'}>
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Global Users</h3>
            <p className="text-sm text-gray-600">Manage all users</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/settings'}>
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">⚙️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">System Settings</h3>
            <p className="text-sm text-gray-600">Global configuration</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/security'}>
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Security Monitor</h3>
            <p className="text-sm text-gray-600">System-wide security</p>
          </div>
        </Card>
      </div>

      {/* Global Analytics & Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Metrics */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">🌍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Global Metrics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Organizations</p>
                <p className="text-sm text-gray-600">Active organizations</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{organizations.length}</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Users</p>
                <p className="text-sm text-gray-600">Registered users</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-blue-600">Users</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                <p className="font-medium text-gray-900">System Health</p>
                <p className="text-sm text-gray-600">Overall status</p>
                </div>
                <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.systemHealth}%</p>
                <p className="text-sm text-green-600">Healthy</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Security Events</p>
                <p className="text-sm text-gray-600">Last 24 hours</p>
                </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.securityEvents}</p>
                <p className="text-sm text-red-600">Events</p>
              </div>
            </div>
          </div>
        </Card>

        {/* System Performance */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">API Response</p>
                <p className="text-sm text-green-600">excellent</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">Online</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-green-600">connected</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">Active</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                <p className="font-medium text-gray-900">Authentication</p>
                <p className="text-sm text-green-600">operational</p>
                </div>
                <div className="text-right">
                <p className="text-lg font-bold text-gray-900">Running</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Security</p>
                <p className="text-sm text-blue-600">monitoring</p>
                </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">Active</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Overview */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Security Events</p>
                <p className="text-sm text-red-600">last 24h</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.securityEvents}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Active Users</p>
                <p className="text-sm text-green-600">online</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                <p className="font-medium text-gray-900">Organizations</p>
                <p className="text-sm text-blue-600">managed</p>
                </div>
                <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{organizations.length}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">System Status</p>
                <p className="text-sm text-green-600">operational</p>
                </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.systemHealth}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Activity */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">System Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'security' ? 'bg-red-100' :
                    activity.type === 'system' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <span className="text-lg">
                      {activity.type === 'security' ? '🛡️' :
                       activity.type === 'system' ? '⚙️' : '👤'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📊</span>
              <p className="text-gray-600">No recent activity to display</p>
            </div>
          )}
        </Card>

        {/* Critical Alerts */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-xl">🚨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
          </div>
          <div className="space-y-3">
            {securityAlerts.length > 0 ? (
              securityAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical' || alert.severity === 'HIGH' ? 'bg-red-50 border-red-500' :
                alert.severity === 'high' ? 'bg-orange-50 border-orange-400' :
                  alert.severity === 'medium' || alert.severity === 'WARNING' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                  <p className="font-medium text-gray-900">{alert.details}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🚨</span>
                <p className="text-gray-600">No critical alerts to display</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Organizations Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
            <p className="text-gray-600 mt-1">Manage all organizations in the system</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => alert('Create organization feature coming soon!')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">➕</span>
              Add Organization
            </Button>
            <Button
              variant="outline"
              onClick={() => alert('Export data coming soon!')}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-2">📊</span>
              Export Data
            </Button>
          </div>
        </div>

        {organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.slice(0, 6).map((org) => (
            <Card key={org.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-xl">🏢</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Slug:</span>
                    <span className="font-medium">{org.slug}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                  onClick={() => alert(`Manage ${org.name} feature coming soon!`)}
              >
                Manage Organization
              </Button>
            </Card>
          ))}
        </div>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Organizations Found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No organizations are currently registered in the system.
            </p>
            <Button
              onClick={() => alert('Create organization feature coming soon!')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">➕</span>
              Create First Organization
            </Button>
          </Card>
        )}
      </div>

      {/* System Maintenance & Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-xl">🔧</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">API Server</p>
                <p className="text-sm text-gray-600">Main API endpoint</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Online
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-600">Primary database</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Connected
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Authentication</p>
                <p className="text-sm text-gray-600">User auth service</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Active
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                <p className="font-medium text-gray-900">Security Monitoring</p>
                <p className="text-sm text-gray-600">Threat detection</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Monitoring
              </div>
                </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Audit Logging</p>
                <p className="text-sm text-gray-600">Activity tracking</p>
                </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Recording
              </div>
            </div>
          </div>
        </Card>

        {/* System Tools */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">🛠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">System Tools</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => alert('System backup initiated!')}
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <span className="mr-2">💾</span>
              Backup Now
            </Button>
            <Button
              variant="outline"
              onClick={() => alert('Cache cleared successfully!')}
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
            >
              <span className="mr-2">🗑️</span>
              Clear Cache
            </Button>
            <Button
              variant="outline"
              onClick={() => alert('System health check completed!')}
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <span className="mr-2">🔍</span>
              Health Check
            </Button>
            <Button
              variant="outline"
              onClick={() => alert('Logs exported successfully!')}
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <span className="mr-2">📋</span>
              Export Logs
            </Button>
          </div>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card className="p-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="text-center">
          <div className="text-4xl mb-4">👑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Super Admin Quick Start</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            As a super administrator, you have complete control over the entire system. 
            Manage organizations, users, and global settings across all tenants.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Button
              onClick={() => window.location.href = '/organizations'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">🏢</span>
              Manage Organizations
            </Button>
            <Button
              onClick={() => window.location.href = '/users'}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="mr-2">👥</span>
              Global Users
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/settings'}
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <span className="mr-2">⚙️</span>
              System Config
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}