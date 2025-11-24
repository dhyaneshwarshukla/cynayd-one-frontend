"use client";

import { useEffect, useState } from 'react';
import { apiClient, Organization, Plan, Pricing } from '@/lib/api-client';
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
  
  // Plan-related state
  const [organizationPlan, setOrganizationPlan] = useState<Organization | null>(null);

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

      // Fetch organization plan details
      try {
        if (user?.organizationId) {
          const planData = await apiClient.getOrganizationPlanDetails(user.organizationId);
          setOrganizationPlan(planData);
        }
      } catch (planErr) {
        console.warn('Failed to fetch organization plan details:', planErr);
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
      // Handle paginated response for usersData
      const usersArray = Array.isArray(usersData) 
        ? usersData 
        : (usersData && typeof usersData === 'object' && 'data' in usersData) 
          ? usersData.data 
          : [];
      return usersArray.map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const formatStorage = (storage: string | number | null | undefined): string => {
    if (!storage) return 'Unlimited';
    
    // Handle BigInt strings or numbers
    let storageStr: string;
    if (typeof storage === 'object') {
      const storageObj = storage as { toString?: () => string };
      storageStr = storageObj && 'toString' in storageObj ? storageObj.toString() : String(storage);
    } else {
      storageStr = String(storage);
    }
    
    const bytes = BigInt(storageStr);
    const gb = Number(bytes) / (1024 ** 3);
    
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)}TB`;
    }
    return `${gb.toFixed(0)}GB`;
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

      {/* Plan Details */}
      {organizationPlan?.plan && (
        <Card className="p-6 mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <span className="text-2xl text-white">💎</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Current Plan</h3>
                  <p className="text-sm text-gray-600">{organizationPlan.plan.name}</p>
                </div>
              </div>
              
              {organizationPlan.plan.description && (
                <p className="text-sm text-gray-700 mb-4">{organizationPlan.plan.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {organizationPlan.plan.maxUsers !== null && organizationPlan.plan.maxUsers !== undefined && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Max Users</p>
                    <p className="text-2xl font-bold text-blue-600">{organizationPlan.plan.maxUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {stats.activeUsers} active
                    </p>
                  </div>
                )}
                
                {organizationPlan.plan.maxApps !== null && organizationPlan.plan.maxApps !== undefined && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Max Apps</p>
                    <p className="text-2xl font-bold text-green-600">{organizationPlan.plan.maxApps}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {stats.totalProducts} apps
                    </p>
                  </div>
                )}
                
                {organizationPlan.plan.maxStorage && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Storage</p>
                    <p className="text-2xl font-bold text-purple-600">{formatStorage(organizationPlan.plan.maxStorage)}</p>
                  </div>
                )}
              </div>

              {organizationPlan.plan.pricings && organizationPlan.plan.pricings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Pricing</p>
                  <div className="flex flex-wrap gap-2">
                    {organizationPlan.plan.pricings.map((pricing: Pricing) => (
                      <span key={pricing.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {pricing.billingPeriod}: {pricing.currency} {parseFloat(pricing.price).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/settings?tab=plan'}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Manage Plan
            </Button>
          </div>
        </Card>
      )}

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

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/settings'}>
          <div className="text-center">
            <div className="p-4 bg-red-100 rounded-2xl mx-auto w-fit mb-4">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">Configure organization settings</p>
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
              onClick={() => window.location.href = '/dashboard/profile'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="mr-2">👤</span>
              Profile
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