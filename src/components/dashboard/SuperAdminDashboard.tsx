"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProductCard } from '@/components/dashboard/ProductCard';
import { ProductAccessModal } from '@/components/dashboard/ProductAccessModal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';

// Define interfaces locally
interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  url?: string;
  domain?: string;
  isActive: boolean;
}

interface UserProductAccess {
  id: string;
  userId: string;
  productId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductWithAccess extends Product {
  userAccess?: UserProductAccess;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard statistics
      const statsData = await apiClient.getDashboardStats();
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: statsData.activeUsers || 0, // Use activeUsers instead of totalUsers
        totalOrganizations: 0, // Not available in API response
        totalApps: 0, // Not available in API response
        securityEvents: statsData.securityEvents || 0,
        recentLogins: 0, // Not available in API response
        pendingInvitations: 0, // Not available in API response
        systemHealth: 100 // Default value
      }));

      // Fetch recent activity
      const activityData = await apiClient.getAuditLogs({ limit: 10 });
      setRecentActivity(activityData.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
        user: undefined,
        organization: undefined, // organizationId not available in AuditLog
        type: log.action.toLowerCase().includes('security') ? 'security' : 
              log.action.toLowerCase().includes('system') ? 'system' : 
              'user', // organization type not supported by ActivityItem
        details: log.details ? JSON.stringify(log.details) : undefined
      })));

      // Fetch organizations
      try {
        const orgsData = await apiClient.getOrganizations();
        setOrganizations(orgsData);
      } catch (orgErr) {
        console.warn('Failed to fetch organizations:', orgErr);
      }

      // Fetch users
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (userErr) {
        console.warn('Failed to fetch users:', userErr);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (): Promise<DashboardUser[]> => {
    // Mock data for super admin users
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com', organization: 'Acme Corp', role: 'ADMIN' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', organization: 'Tech Solutions', role: 'USER' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', organization: 'Acme Corp', role: 'USER' },
      { id: '4', name: 'Alice Brown', email: 'alice@example.com', organization: 'Global Systems', role: 'ADMIN' }
    ];
  };

  // Quick actions configuration for super admin
  const quickActions = [
    {
      id: 'create-organization',
      title: 'Create Organization',
      description: 'Add new organization to the system',
      icon: '🏢',
      action: () => alert('Create organization feature coming soon!')
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure global system settings',
      icon: '⚙️',
      action: () => alert('System settings feature coming soon!')
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users across all organizations',
      icon: '👥',
      action: () => alert('User management feature coming soon!')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Super Admin indicator */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👑</span>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">SUPER ADMIN DASHBOARD</h3>
            <p className="text-sm text-purple-700">Full system access - manage all organizations, users, and global settings</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Super Admin Stats Overview */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">👑</span>
            <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
          </div>
          <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="md">
            <StatsCard
              title="Total Organizations"
              value={stats.totalOrganizations}
              icon="🏢"
              change={{ value: 2, type: 'increase' }}
              loading={isLoading}
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            />
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon="👤"
              change={{ value: 15, type: 'increase' }}
              loading={isLoading}
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            />
            <StatsCard
              title="Total Apps"
              value={stats.totalApps}
              icon="📦"
              change={{ value: 3, type: 'increase' }}
              loading={isLoading}
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
            />
            <StatsCard
              title="System Health"
              value={`${stats.systemHealth}%`}
              icon="💚"
              change={{ value: 0, type: 'neutral' }}
              loading={isLoading}
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
            />
          </ResponsiveGrid>
          
          <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="md">
            <StatsCard
              title="Security Events"
              value={stats.securityEvents}
              icon="🛡️"
              change={{ 
                value: stats.securityEvents > 0 ? 0 : 100, 
                type: stats.securityEvents > 0 ? 'increase' : 'neutral' 
              }}
              loading={isLoading}
              className="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
            />
            <StatsCard
              title="Recent Logins"
              value={stats.recentLogins}
              icon="🔐"
              loading={isLoading}
              className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
            />
            <StatsCard
              title="Pending Invites"
              value={stats.pendingInvitations}
              icon="📧"
              loading={isLoading}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
            />
            <StatsCard
              title="Active Sessions"
              value="142"
              icon="🔄"
              change={{ value: 8, type: 'increase' }}
              loading={isLoading}
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
            />
          </ResponsiveGrid>
        </div>
      </ResponsiveContainer>

      {/* Main Content */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <ResponsiveGrid cols={{ xs: 1, lg: 2 }} gap="lg">
          {/* Super Admin Quick Actions */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">⚡</span>
              <h3 className="text-lg font-semibold text-gray-900">System Management</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('Organization Management coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-xl">🏢</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Organizations</h4>
                    <p className="text-sm text-gray-600">Create and manage organizations</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('Global User Management coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Global Users</h4>
                    <p className="text-sm text-gray-600">Manage all users</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('System Settings coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">System Settings</h4>
                    <p className="text-sm text-gray-600">Global configuration</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('Security Monitoring coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Security Monitor</h4>
                    <p className="text-sm text-gray-600">System-wide security</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">📊</span>
              <h3 className="text-lg font-semibold text-gray-900">System Activity</h3>
            </div>
            <ActivityFeed
              activities={recentActivity}
              loading={isLoading}
              maxItems={6}
            />
          </div>
        </ResponsiveGrid>
      </ResponsiveContainer>

      {/* Organizations Overview */}
      <ResponsiveContainer maxWidth="full" className="mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage all organizations in the system
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => alert('Create organization feature coming soon!')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
        
        {isLoading ? (
          <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="md">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
        ) : (
          <div className="space-y-6">
            {/* Organizations Grid */}
            <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="md">
              {[
                { id: '1', name: 'Acme Corporation', users: 45, apps: 8, status: 'Active' },
                { id: '2', name: 'Tech Solutions', users: 23, apps: 5, status: 'Active' },
                { id: '3', name: 'Global Systems', users: 67, apps: 12, status: 'Active' }
              ].map((org) => (
                <Card key={org.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-xl">🏢</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-600">{org.status}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Users:</span>
                      <span className="font-medium">{org.users}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Apps:</span>
                      <span className="font-medium">{org.apps}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => alert(`Manage ${org.name} coming soon!`)}
                  >
                    Manage Organization
                  </Button>
                </Card>
              ))}
            </ResponsiveGrid>
          </div>
        )}
      </ResponsiveContainer>

      {/* Getting Started Section */}
      <ResponsiveContainer maxWidth="full" className="mt-8">
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="text-center">
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Super Admin Quick Start</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              As a super administrator, you have complete control over the entire system. 
              Manage organizations, users, and global settings across all tenants.
            </p>
            <ResponsiveGrid cols={{ xs: 1, sm: 3 }} gap="md" className="max-w-3xl mx-auto">
              <Button
                onClick={() => alert('Organization Management coming soon!')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <span className="mr-2">🏢</span>
                Manage Organizations
              </Button>
              <Button
                onClick={() => alert('Global User Management coming soon!')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                <span className="mr-2">👥</span>
                Global Users
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('System configuration coming soon!')}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <span className="mr-2">⚙️</span>
                System Config
              </Button>
            </ResponsiveGrid>
          </div>
        </Card>
      </ResponsiveContainer>
    </div>
  );
}
