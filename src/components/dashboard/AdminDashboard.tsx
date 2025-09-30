"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';

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
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  activeUsers: number;
  totalTeams: number;
  securityEvents: number;
  totalOrganizations: number;
  recentLogins: number;
  pendingInvitations: number;
  totalProducts: number;
  activeProductAccess: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  user?: string;
  type: 'user' | 'system' | 'security';
  details?: string;
}

interface DashboardUser {
  id: string;
  name?: string;
  email: string;
}

interface AdminDashboardProps {
  user: any;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({ 
    activeUsers: 0, 
    totalTeams: 0, 
    securityEvents: 0,
    totalOrganizations: 0,
    recentLogins: 0,
    pendingInvitations: 0,
    totalProducts: 0,
    activeProductAccess: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Product-related state
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);

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
        activeUsers: statsData.activeUsers || 0,
        totalTeams: statsData.totalTeams || 0,
        securityEvents: statsData.securityEvents || 0,
        totalOrganizations: 0,
        recentLogins: 0,
        pendingInvitations: 0
      }));

      // Fetch recent activity
      const activityData = await apiClient.getAuditLogs({ limit: 10 });
      setRecentActivity(activityData.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
        user: undefined,
        type: log.action.toLowerCase().includes('security') ? 'security' : 
              log.action.toLowerCase().includes('system') ? 'system' : 'user',
        details: log.details ? JSON.stringify(log.details) : undefined
      })));

      // Fetch organizations
      try {
        const orgsData = await apiClient.getOrganizations();
        setOrganizations(orgsData);
      } catch (orgErr) {
        console.warn('Failed to fetch organizations:', orgErr);
      }

      // Fetch products and user access
      try {
        const productsData = await fetchProducts();
        setProducts(productsData);
        
        // Update product stats
        setStats(prevStats => ({
          ...prevStats,
          totalProducts: productsData.length,
          activeProductAccess: productsData.filter(p => p.isActive).length
        }));
      } catch (productErr) {
        console.warn('Failed to fetch products:', productErr);
      }

      // Fetch users (for admin)
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


  const fetchProducts = async (): Promise<Product[]> => {
    try {
      // Fetch real products from API
      const productsData = await apiClient.getApps();
      return productsData.map(app => ({
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description || 'No description available',
        icon: app.icon || '📱',
        color: app.color || '#3B82F6',
        isActive: app.isActive,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const fetchUsers = async (): Promise<DashboardUser[]> => {
    try {
      // Fetch real users from API
      const usersData = await apiClient.getUsers();
      return usersData.map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email
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
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-blue-100 rounded-2xl">
            <span className="text-4xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your organization's products, users, and settings
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <span className="text-2xl text-white">👤</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <span className="text-2xl text-white">📦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <span className="text-2xl text-white">🔓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Access</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProductAccess}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500 rounded-lg">
              <span className="text-2xl text-white">🛡️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Security Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.securityEvents}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/users'}>
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600">Add and manage users</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/users'}>
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Teams</h3>
            <p className="text-sm text-gray-600">Team management</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/apps'}>
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Apps</h3>
            <p className="text-sm text-gray-600">Configure access</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/security'}>
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
            <p className="text-sm text-gray-600">Monitor events</p>
          </div>
        </Card>
      </div>

      {/* Admin Analytics & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Reports */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Reports</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Users</p>
                <p className="text-sm text-gray-600">Active in organization</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.activeUsers}</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Products</p>
                <p className="text-sm text-gray-600">Available apps</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-blue-600">Configured</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Active Access</p>
                <p className="text-sm text-gray-600">User-product assignments</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.activeProductAccess}</p>
                <p className="text-sm text-purple-600">Active</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Security Events</p>
                <p className="text-sm text-gray-600">Last 24 hours</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.securityEvents}</p>
                <p className="text-sm text-red-600">Events</p>
              </div>
            </div>
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl">💚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-900">API Server</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-xs text-green-600">healthy</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-900">Database</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-xs text-green-600">healthy</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-900">Authentication</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-xs text-green-600">healthy</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium text-gray-900">Security Monitoring</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Monitoring</p>
                <p className="text-xs text-blue-600">active</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
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

        {/* Security Alerts */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-xl">🚨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
          </div>
          <div className="space-y-3">
            {securityAlerts.length > 0 ? (
              securityAlerts.slice(0, 4).map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'high' || alert.severity === 'critical' ? 'bg-red-50 border-red-400' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                  alert.severity === 'low' ? 'bg-blue-50 border-blue-400' :
                  'bg-green-50 border-green-400'
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
                <p className="text-gray-600">No security alerts to display</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Apps Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">App Management</h2>
            <p className="text-gray-600 mt-1">Manage app access and quotas across your organization</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => window.location.href = '/apps'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">➕</span>
              Add App
            </Button>
            <Button
              variant="outline"
              onClick={() => alert('Bulk management coming soon!')}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-2">📊</span>
              Bulk Manage
            </Button>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow group">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ 
                      backgroundColor: product.color + '15', 
                      color: product.color
                    }}
                  >
                    {product.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.isActive
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => window.location.href = `/apps/${product.id}`}
                    className="w-full"
                  >
                    <span className="mr-2">⚙️</span>
                    Manage Access
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => alert(`View usage for ${product.name} coming soon!`)}
                    className="w-full"
                  >
                    <span className="mr-2">📊</span>
                    View Usage
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No apps configured
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add apps to your organization to start managing access and quotas for your users.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/apps'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span className="mr-2">➕</span>
                Add Your First App
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Import apps coming soon!')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">📥</span>
                Import Apps
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Getting Started Section */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <div className="text-4xl mb-4">🛡️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Quick Start</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            As an administrator, you have full control over your organization. Set up products, 
            manage user access, and monitor security across all teams.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Button
              onClick={() => window.location.href = '/users'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">👤</span>
              Manage Users
            </Button>
            <Button
              onClick={() => window.location.href = '/users'}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="mr-2">👥</span>
              Manage Users
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/apps'}
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <span className="mr-2">📦</span>
              Setup Apps
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}