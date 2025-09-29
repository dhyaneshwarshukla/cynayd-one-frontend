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
  isActive: boolean;
  assignedAt: string;
  usedQuota: number;
}

interface ProductWithAccess extends Product {
  userAccess?: UserProductAccess;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  
  // Product-related state
  const [products, setProducts] = useState<ProductWithAccess[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [showProductAccessModal, setShowProductAccessModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithAccess | null>(null);

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
          activeProductAccess: productsData.filter(p => p.userAccess).length
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
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setError('Email and name are required');
      return;
    }

    try {
      setError(null);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('user');
      setShowInviteModal(false);
      
      alert('User invitation sent successfully! (Feature in development)');
    } catch (err) {
      setError('Failed to send invitation');
      console.error('Invite user error:', err);
    }
  };

  // Product-related functions
  const fetchProducts = async (): Promise<ProductWithAccess[]> => {
    // Mock data for admin products
    const mockProducts: ProductWithAccess[] = [
      {
        id: '1',
        name: 'HR Management',
        slug: 'hr',
        description: 'Manage employees, payroll, and HR processes',
        icon: '👥',
        color: '#3B82F6',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userAccess: undefined // Admin sees all products without user access
      },
      {
        id: '2',
        name: 'Drive',
        slug: 'drive',
        description: 'Secure file storage and sharing',
        icon: '💾',
        color: '#10B981',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userAccess: undefined
      },
      {
        id: '3',
        name: 'Connect',
        slug: 'connect',
        description: 'Team communication and collaboration',
        icon: '💬',
        color: '#8B5CF6',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userAccess: undefined
      },
      {
        id: '4',
        name: 'Mail',
        slug: 'mail',
        description: 'Professional email and calendar',
        icon: '📧',
        color: '#F59E0B',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userAccess: undefined
      }
    ];

    return mockProducts;
  };

  const fetchUsers = async (): Promise<DashboardUser[]> => {
    // Mock data for admin users
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
    ];
  };

  const handleProductAccess = async (product: ProductWithAccess) => {
    try {
      console.log('Accessing product:', product.name);
      
      // Get SSO token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please log in to access products');
        return;
      }

      // Generate SSO token for the app
      const response = await fetch(`/api/apps/${product.slug}/sso-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate SSO token');
      }

      const { ssoToken } = await response.json();
      
      // Redirect to the app with SSO token
      const appUrl = `${window.location.origin}/${product.slug}?sso_token=${ssoToken}`;
      window.open(appUrl, '_blank');
      
    } catch (error) {
      console.error('Error accessing product:', error);
      alert(`Failed to access ${product.name}. Please try again.`);
    }
  };

  const handleManageProductAccess = (product: ProductWithAccess) => {
    setSelectedProduct(product);
    setShowProductAccessModal(true);
  };

  const handleViewProductUsage = (product: ProductWithAccess) => {
    console.log('Viewing usage for:', product.name);
    alert(`Usage details for ${product.name}... (Feature in development)`);
  };

  const handleAssignProductAccess = async (userId: string, quota?: number, expiresAt?: string) => {
    console.log('Assigning access:', { userId, quota, expiresAt });
    alert('Product access assigned successfully! (Feature in development)');
  };

  const handleRevokeProductAccess = async (userId: string) => {
    console.log('Revoking access for user:', userId);
    alert('Product access revoked successfully! (Feature in development)');
  };

  const handleUpdateProductQuota = async (userId: string, quota: number) => {
    console.log('Updating quota:', { userId, quota });
    alert('Product quota updated successfully! (Feature in development)');
  };

  // Quick actions configuration for admin
  const quickActions = [
    {
      id: 'invite-user',
      title: 'Invite User',
      description: 'Send invitation to new member',
      icon: '📧',
      action: () => setShowInviteModal(true)
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Access analytics and reports',
      icon: '📊',
      action: () => alert('Reports feature coming soon!')
    },
    {
      id: 'security-settings',
      title: 'Security Settings',
      description: 'Manage security preferences',
      icon: '🛡️',
      action: () => console.log('Security settings')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Debug indicator */}
      <div className="bg-purple-100 border border-purple-300 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👑</span>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">ADMIN DASHBOARD ACTIVE</h3>
            <p className="text-sm text-purple-700">This is the admin-specific dashboard for administrators and super admins</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Admin Stats Overview */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">👑</span>
            <h2 className="text-xl font-semibold text-gray-900">Organization Overview</h2>
          </div>
          <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="md">
            <StatsCard
              title="Total Users"
              value={stats.activeUsers}
              icon="👤"
              change={{ value: 12, type: 'increase' }}
              loading={isLoading}
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            />
            <StatsCard
              title="Active Users"
              value={stats.activeUsers}
              icon="👤"
              change={{ value: 5, type: 'increase' }}
              loading={isLoading}
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            />
            <StatsCard
              title="Total Products"
              value={stats.totalProducts}
              icon="📦"
              loading={isLoading}
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
            />
            <StatsCard
              title="Active Access"
              value={stats.activeProductAccess}
              icon="🔓"
              loading={isLoading}
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
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
              title="Organizations"
              value={stats.totalOrganizations}
              icon="🏢"
              loading={isLoading}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
            />
          </ResponsiveGrid>
        </div>
      </ResponsiveContainer>

      {/* Main Content */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <ResponsiveGrid cols={{ xs: 1, lg: 2 }} gap="lg">
          {/* Admin Quick Actions */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">⚡</span>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('User Management coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Users</h4>
                    <p className="text-sm text-gray-600">Add and manage users</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowInviteModal(true)}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-xl">📧</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Invite User</h4>
                    <p className="text-sm text-gray-600">Add new members</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('Product Management coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-xl">📦</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Products</h4>
                    <p className="text-sm text-gray-600">Configure access</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert('Security Settings coming soon!')}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Security</h4>
                    <p className="text-sm text-gray-600">Monitor events</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">📊</span>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <ActivityFeed
              activities={recentActivity}
              loading={isLoading}
              maxItems={6}
            />
          </div>
        </ResponsiveGrid>
      </ResponsiveContainer>

      {/* Products Section */}
      <ResponsiveContainer maxWidth="full" className="mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage product access and quotas across your organization
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => alert('Create new product feature coming soon!')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <span className="mr-2">➕</span>
              Add Product
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
        
        {isLoading ? (
          <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap="md">
            {[1, 2, 3, 4].map((i) => (
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
        ) : products.length > 0 ? (
          <div className="space-y-6">
            {/* Product Filter/Search for Admin */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Products</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Users</option>
                  <option>With Access</option>
                  <option>Without Access</option>
                </select>
              </div>
            </div>
            
            {/* Products Grid */}
            <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap="md">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <ProductCard
                    product={product}
                    isAdmin={true}
                    onAccess={handleProductAccess}
                    onManageAccess={handleManageProductAccess}
                    onViewUsage={handleViewProductUsage}
                    className="group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1"
                  />
                </div>
              ))}
            </ResponsiveGrid>
            
            {/* Product Summary for Admin */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                    <div className="text-sm text-gray-600">Total Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.activeProductAccess}</div>
                    <div className="text-sm text-gray-600">Active Access</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{users.length}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => alert('Export data coming soon!')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <span className="mr-2">📊</span>
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products configured
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add products to your organization to start managing access and quotas for your users.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => alert('Create new product feature coming soon!')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <span className="mr-2">➕</span>
                Add Your First Product
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Import products coming soon!')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">📥</span>
                Import Products
              </Button>
            </div>
          </Card>
        )}
      </ResponsiveContainer>

      {/* Getting Started Section */}
      <ResponsiveContainer maxWidth="full" className="mt-8">
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="text-center">
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Quick Start</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              As an administrator, you have full control over your organization. Set up products, 
              manage user access, and monitor security across all teams.
            </p>
            <ResponsiveGrid cols={{ xs: 1, sm: 3 }} gap="md" className="max-w-3xl mx-auto">
              <Button
                onClick={() => alert('User Management coming soon!')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <span className="mr-2">👤</span>
                Manage Users
              </Button>
              <Button
                onClick={() => setShowInviteModal(true)}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                <span className="mr-2">📧</span>
                Invite Users
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Product setup coming soon!')}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <span className="mr-2">📦</span>
                Setup Products
              </Button>
            </ResponsiveGrid>
          </div>
        </Card>
      </ResponsiveContainer>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Access Modal */}
      {showProductAccessModal && selectedProduct && (
        <ProductAccessModal
          isOpen={showProductAccessModal}
          onClose={() => {
            setShowProductAccessModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          users={users}
          onAssignAccess={handleAssignProductAccess}
          onRevokeAccess={handleRevokeProductAccess}
          onUpdateQuota={handleUpdateProductQuota}
        />
      )}
    </div>
  );
}
