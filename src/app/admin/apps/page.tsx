"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/common/Input';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { apiClient, App } from '@/lib/api-client';
import { BulkAssignmentModal } from '@/components/dashboard/BulkAssignmentModal';

// Define UserAppAccess interface locally
interface UserAppAccess {
  id: string;
  userId: string;
  appId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  BellIcon,
  ShieldCheckIcon,
  CogIcon,
  PlayIcon,
  KeyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface UserAppAccessWithDetails extends UserAppAccess {
  isActive: boolean;
  user: User;
  app: App;
  expiresAt?: string;
  quota?: number;
  usedQuota?: number;
}


export default function AdminAppsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userAppAccess, setUserAppAccess] = useState<UserAppAccessWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSamlConfigModal, setShowSamlConfigModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [samlConfig, setSamlConfig] = useState({
    samlEnabled: false,
    entityId: '',
    acsUrl: '',
    sloUrl: '',
  });
  const [isSavingSaml, setIsSavingSaml] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const [newApp, setNewApp] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📱',
    color: '#3B82F6',
    url: '',
    domain: '',
    samlEnabled: false,
    entityId: '',
    acsUrl: '',
    sloUrl: ''
  });

  const [editApp, setEditApp] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📱',
    color: '#3B82F6',
    url: '',
    domain: '',
    isActive: true
  });

  const [assignmentData, setAssignmentData] = useState({
    userId: '',
    quota: '',
    expiresAt: ''
  });

  useEffect(() => {
    console.log('Admin Apps Page - useEffect triggered:', {
      authLoading,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    });
    
    if (!authLoading && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      console.log('Starting to fetch data...');
      fetchData();
    } else if (!authLoading && !user) {
      console.log('No user found - redirecting to login');
    } else if (!authLoading && user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      console.log('User is not admin:', user.role);
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data - API calls starting...');
      console.log('API Client base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      console.log('API Client authenticated:', apiClient.isAuthenticated());
      
      const [appsData, usersData, accessData] = await Promise.all([
        apiClient.getApps(),
        apiClient.getUsers(),
        apiClient.getAllUserAppAccess()
      ]);
      
      // Handle paginated response for usersData
      const usersArray = Array.isArray(usersData) 
        ? usersData 
        : (usersData && typeof usersData === 'object' && 'data' in usersData) 
          ? usersData.data 
          : [];
      
      console.log('API calls successful:', {
        appsCount: appsData?.length || 0,
        usersCount: usersArray.length,
        accessCount: accessData?.length || 0
      });
      
      setApps(appsData);
      setUsers(usersArray);
      setUserAppAccess(accessData as unknown as UserAppAccessWithDetails[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    try {
      // Validate SAML config if enabled
      if (newApp.samlEnabled && (!newApp.entityId || !newApp.acsUrl)) {
        setNotification({ type: 'error', message: 'Entity ID and ACS URL are required when enabling SAML' });
        return;
      }

      const createdApp = await apiClient.createApp({
        name: newApp.name,
        slug: newApp.slug,
        description: newApp.description,
        icon: newApp.icon,
        color: newApp.color,
        url: newApp.url,
        domain: newApp.domain,
        // Include SAML configuration if enabled
        ...(newApp.samlEnabled && newApp.entityId && newApp.acsUrl ? {
          samlEnabled: true,
          samlConfig: {
            entityId: newApp.entityId,
            acsUrl: newApp.acsUrl,
            sloUrl: newApp.sloUrl || undefined,
          }
        } : {})
      });
      
      setShowCreateAppModal(false);
      setNewApp({ name: '', slug: '', description: '', icon: '📱', color: '#3B82F6', url: '', domain: '', samlEnabled: false, entityId: '', acsUrl: '', sloUrl: '' });
      fetchData();
      setNotification({ type: 'success', message: `App created successfully${newApp.samlEnabled ? ' with SAML configured' : ''}!` });
    } catch (err: any) {
      setError('Failed to create app');
      setNotification({ type: 'error', message: err.message || 'Failed to create app' });
      console.error('Error creating app:', err);
    }
  };

  const handleEditApp = async () => {
    if (!selectedApp) return;
    
    try {
      await apiClient.updateApp(selectedApp.id, editApp);
      setShowEditModal(false);
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setError('Failed to update app');
      console.error('Error updating app:', err);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiClient.deleteApp(appId);
      fetchData();
    } catch (err) {
      setError('Failed to delete app');
      console.error('Error deleting app:', err);
    }
  };

  const handleAssignAccess = async () => {
    if (!selectedApp || !assignmentData.userId) return;
    
    try {
      await apiClient.assignAppAccess(selectedApp.id, assignmentData.userId, {
        quota: assignmentData.quota ? parseInt(assignmentData.quota) : undefined,
        expiresAt: assignmentData.expiresAt ? new Date(assignmentData.expiresAt) : undefined
      });
      setShowAssignModal(false);
      setAssignmentData({ userId: '', quota: '', expiresAt: '' });
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setError('Failed to assign access');
      console.error('Error assigning access:', err);
    }
  };

  const handleRevokeAccess = async (access: UserAppAccessWithDetails) => {
    try {
      await apiClient.revokeAppAccess(access.appId, access.userId);
      fetchData();
    } catch (err) {
      setError('Failed to revoke access');
      console.error('Error revoking access:', err);
    }
  };

  const openEditModal = (app: App) => {
    setSelectedApp(app);
    setEditApp({
      name: app.name,
      slug: app.slug,
      description: app.description || '',
      icon: app.icon || '📱',
      color: app.color || '#3B82F6',
      url: app.url || '',
      domain: app.domain || '',
      isActive: app.isActive
    });
    setShowEditModal(true);
  };

  const openSamlConfigModal = (app: App) => {
    setSelectedApp(app);
    try {
      const metadata = app.metadata ? JSON.parse(app.metadata) : {};
      setSamlConfig({
        samlEnabled: metadata.samlEnabled || false,
        entityId: metadata.samlConfig?.entityId || '',
        acsUrl: metadata.samlConfig?.acsUrl || '',
        sloUrl: metadata.samlConfig?.sloUrl || '',
      });
    } catch {
      setSamlConfig({
        samlEnabled: false,
        entityId: '',
        acsUrl: '',
        sloUrl: '',
      });
    }
    setShowSamlConfigModal(true);
  };

  const handleSaveSamlConfig = async () => {
    if (!selectedApp) return;
    
    try {
      setIsSavingSaml(true);
      
      if (samlConfig.samlEnabled && (!samlConfig.entityId || !samlConfig.acsUrl)) {
        setNotification({ type: 'error', message: 'Entity ID and ACS URL are required when enabling SAML' });
        return;
      }

      await apiClient.updateAppSamlConfig(selectedApp.slug, {
        samlEnabled: samlConfig.samlEnabled,
        samlConfig: samlConfig.samlEnabled ? {
          entityId: samlConfig.entityId,
          acsUrl: samlConfig.acsUrl,
          sloUrl: samlConfig.sloUrl || undefined,
        } : undefined,
      });
      
      setNotification({ type: 'success', message: 'SAML configuration saved successfully!' });
      setShowSamlConfigModal(false);
      await fetchData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to save SAML configuration' });
    } finally {
      setIsSavingSaml(false);
    }
  };

  // Helper function to check SAML status
  const getSamlStatus = (app: App) => {
    if (!app.metadata) return false;
    try {
      const metadata = JSON.parse(app.metadata);
      return metadata?.samlEnabled === true;
    } catch {
      return false;
    }
  };

  // Helper function to check if user can configure app (info, SAML)
  const canConfigureApp = (app: App): boolean => {
    if (!user) return false;
    
    // For system apps: Only SUPER_ADMIN can configure
    if (app.systemApp) {
      return user.role === 'SUPER_ADMIN';
    }
    
    // For org apps: Only owner org admin or SUPER_ADMIN can configure
    if (app.organizationId) {
      if (user.role === 'SUPER_ADMIN') {
        return true;
      }
      if (user.role === 'ADMIN' && user.organizationId === app.organizationId) {
        return true;
      }
      return false;
    }
    
    // For other apps (assigned apps), no configuration allowed
    return false;
  };

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && app.isActive) ||
                         (filterStatus === 'inactive' && !app.isActive);
    return matchesSearch && matchesFilter;
  });

  if (authLoading || loading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <LoadingSpinner size="lg" />
          <div className="text-center">
            <p className="text-gray-600">Loading admin dashboard...</p>
            {authLoading && <p className="text-sm text-gray-500">Checking authentication...</p>}
            {loading && <p className="text-sm text-gray-500">Fetching data...</p>}
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-700 text-sm mt-1">Admin privileges required to access this page.</p>
          <div className="mt-3 text-sm text-red-600">
            <p>Current user: {user ? `${user.name || user.email} (${user.role})` : 'Not logged in'}</p>
            <p className="mt-1">
              <a href="/auth/login" className="text-blue-600 hover:text-blue-500 underline">
                Click here to login
              </a>
            </p>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <UnifiedLayout title="Admin Apps Management" subtitle={`Manage applications and user access for your organization.`} variant="dashboard">
      <div>
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
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
        {/* Quick Actions Header */}
        <div className="mb-8">
          <div className="flex items-center justify-end space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <BellIcon className="w-5 h-5 mr-2" />
              <span>3 notifications</span>
            </div>
            <Button 
              onClick={() => setShowCreateAppModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkAssignmentModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Bulk Assign
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowCreateAppModal(true)}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add New App
                </Button>
              </div>
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
              onClick={() => setActiveTab('access')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'access'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UsersIcon className="w-5 h-5 mr-2" />
                User Access
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} gap="lg">
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Squares2X2Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Apps</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{apps.length}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {apps.filter(app => app.isActive).length} active
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
                        <UsersIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Users</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {users.filter(user => user.role === 'USER').length} regular users
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
                        <UserPlusIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Access Assignments</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{userAppAccess.length}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {userAppAccess.filter(access => access.isActive).length} active
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
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Security Score</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">98%</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Excellent
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
                  onClick={() => setShowCreateAppModal(true)}
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
                  onClick={() => setActiveTab('access')}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <UserPlusIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">Manage Access</div>
                      <div className="text-sm opacity-90">Assign and revoke user access</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('apps')}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <CogIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">App Settings</div>
                      <div className="text-sm opacity-90">Configure app properties</div>
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
                  <Button variant="outline" className="text-sm">
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {userAppAccess.slice(0, 3).map((access, index) => (
                    <div key={access.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <UserPlusIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {access.user.name || access.user.email} granted access to {access.app.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {new Date(access.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">App Status</h3>
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">All Systems Operational</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {apps.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm"
                          style={{ backgroundColor: app.color || '#3b82f6' }}
                        >
                          {app.icon || '📱'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{app.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        app.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {app.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search apps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  className="text-sm"
                >
                  All Apps
                </Button>
                <Button
                  onClick={() => setFilterStatus('active')}
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  className="text-sm"
                >
                  Active
                </Button>
                <Button
                  onClick={() => setFilterStatus('inactive')}
                  variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                  className="text-sm"
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className="text-red-800 font-medium">Error</h3>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-3 text-sm text-red-600">
                  <p>Debug info:</p>
                  <p>• User authenticated: {user ? 'Yes' : 'No'}</p>
                  <p>• User role: {user?.role || 'None'}</p>
                  <p>• API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</p>
                  <p className="mt-2">
                    <a href="/auth/login" className="text-blue-600 hover:text-blue-500 underline">
                      Try logging in again
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Apps Grid */}
            <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="lg">
              {filteredApps.map((app) => (
                <Card key={app.id} className="p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                        style={{ backgroundColor: app.color }}
                      >
                        {app.icon}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                        <p className="text-sm text-gray-500">{app.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {app.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {app.description && (
                    <p className="text-gray-600 text-sm mb-4">{app.description}</p>
                  )}

                  {/* SAML Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">SAML Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getSamlStatus(app)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getSamlStatus(app) ? '✅ Enabled' : '⚠️ Not Configured'}
                      </span>
                    </div>
                  </div>

                  {/* App URL/Domain */}
                  {(app.url || app.domain) && (
                    <div className="mb-4">
                      {app.url && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <span className="font-medium mr-2">URL:</span>
                          <a 
                            href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {app.url}
                          </a>
                        </div>
                      )}
                      {app.domain && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">Domain:</span>
                          <span>{app.domain}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created: {new Date(app.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    {/* Direct Access Button */}
                    {app.url && (
                      <Button
                        onClick={() => window.open(app.url?.startsWith('http') ? app.url : `https://${app.url}`, '_blank')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        <PlayIcon className="w-4 h-4 mr-1" />
                        Access App
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowAssignModal(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        <UserPlusIcon className="w-4 h-4 mr-1" />
                        Assign Access
                      </Button>
                      {/* SAML Config Button - Only show if user can configure this app */}
                      {canConfigureApp(app) && (
                        <Button
                          onClick={() => openSamlConfigModal(app)}
                          variant="outline"
                          className="px-3"
                          title="Configure SAML"
                        >
                          <KeyIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Edit App Button - Only show if user can configure this app */}
                      {canConfigureApp(app) && (
                        <Button
                          onClick={() => openEditModal(app)}
                          variant="outline"
                          className="px-3"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteApp(app.id)}
                        variant="outline"
                        className="px-3 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </ResponsiveGrid>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">User Access Management</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  {userAppAccess.length} assignments
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        App
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userAppAccess.map((access) => (
                      <tr key={access.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700">
                                {(access.user.name || access.user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {access.user.name || 'No Name'}
                              </div>
                              <div className="text-sm text-gray-500">{access.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs mr-2"
                              style={{ backgroundColor: access.app.color }}
                            >
                              {access.app.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{access.app.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {access.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(access.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${access.quota ? (access.usedQuota / access.quota) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {access.usedQuota}/{access.quota || '∞'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => handleRevokeAccess(access)}
                            className="text-red-600 hover:text-red-900"
                            variant="outline"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Create App Modal */}
        {showCreateAppModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New App</h3>
              <div className="space-y-4">
                <Input
                  label="App Name"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  placeholder="Enter app name"
                />
                <Input
                  label="Slug"
                  value={newApp.slug}
                  onChange={(e) => setNewApp({ ...newApp, slug: e.target.value })}
                  placeholder="Enter app slug"
                />
                <Input
                  label="Description"
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  placeholder="Enter app description"
                />
                <Input
                  label="Icon"
                  value={newApp.icon}
                  onChange={(e) => setNewApp({ ...newApp, icon: e.target.value })}
                  placeholder="Enter icon (emoji or text)"
                />
                <Input
                  label="Color"
                  type="color"
                  value={newApp.color}
                  onChange={(e) => setNewApp({ ...newApp, color: e.target.value })}
                />
                <Input
                  label="App URL"
                  value={newApp.url}
                  onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                  placeholder="https://app.example.com or app.example.com"
                />
                <Input
                  label="Domain (optional)"
                  value={newApp.domain}
                  onChange={(e) => setNewApp({ ...newApp, domain: e.target.value })}
                  placeholder="example.com"
                />
                
                {/* SAML Configuration Section */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">SAML Configuration</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="newAppSamlEnabled"
                        checked={newApp.samlEnabled}
                        onChange={(e) => setNewApp({ ...newApp, samlEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="newAppSamlEnabled" className="text-sm text-gray-700">
                        Enable SAML
                      </label>
                    </div>
                  </div>

                  {newApp.samlEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                      <Input
                        label="Entity ID"
                        value={newApp.entityId}
                        onChange={(e) => setNewApp({ ...newApp, entityId: e.target.value })}
                        placeholder="https://your-app.example.com/saml"
                        required={newApp.samlEnabled}
                      />
                      <p className="text-xs text-gray-500 -mt-2">Your app's unique SAML identifier</p>
                      
                      <Input
                        label="ACS URL"
                        value={newApp.acsUrl}
                        onChange={(e) => setNewApp({ ...newApp, acsUrl: e.target.value })}
                        placeholder="https://your-app.example.com/saml/acs"
                        required={newApp.samlEnabled}
                      />
                      <p className="text-xs text-gray-500 -mt-2">Where your app receives SAML responses</p>
                      
                      <Input
                        label="SLO URL (Optional)"
                        value={newApp.sloUrl}
                        onChange={(e) => setNewApp({ ...newApp, sloUrl: e.target.value })}
                        placeholder="https://your-app.example.com/saml/slo"
                      />
                      <p className="text-xs text-gray-500 -mt-2">Single Logout URL (optional)</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowCreateAppModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateApp}
                    disabled={newApp.samlEnabled && (!newApp.entityId || !newApp.acsUrl)}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    Create App
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit App Modal */}
        {showEditModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit App</h3>
              <div className="space-y-4">
                <Input
                  label="App Name"
                  value={editApp.name}
                  onChange={(e) => setEditApp({ ...editApp, name: e.target.value })}
                  placeholder="Enter app name"
                />
                <Input
                  label="Slug"
                  value={editApp.slug}
                  onChange={(e) => setEditApp({ ...editApp, slug: e.target.value })}
                  placeholder="Enter app slug"
                />
                <Input
                  label="Description"
                  value={editApp.description}
                  onChange={(e) => setEditApp({ ...editApp, description: e.target.value })}
                  placeholder="Enter app description"
                />
                <Input
                  label="Icon"
                  value={editApp.icon}
                  onChange={(e) => setEditApp({ ...editApp, icon: e.target.value })}
                  placeholder="Enter icon (emoji or text)"
                />
                <Input
                  label="Color"
                  type="color"
                  value={editApp.color}
                  onChange={(e) => setEditApp({ ...editApp, color: e.target.value })}
                />
                <Input
                  label="App URL"
                  value={editApp.url}
                  onChange={(e) => setEditApp({ ...editApp, url: e.target.value })}
                  placeholder="https://app.example.com or app.example.com"
                />
                <Input
                  label="Domain (optional)"
                  value={editApp.domain}
                  onChange={(e) => setEditApp({ ...editApp, domain: e.target.value })}
                  placeholder="example.com"
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editApp.isActive}
                    onChange={(e) => setEditApp({ ...editApp, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditApp}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update App
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SAML Configuration Modal */}
        {showSamlConfigModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <KeyIcon className="w-5 h-5 mr-2 text-blue-600" />
                SAML Configuration - {selectedApp.name}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="samlEnabled"
                    checked={samlConfig.samlEnabled}
                    onChange={(e) => setSamlConfig({ ...samlConfig, samlEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="samlEnabled" className="text-sm font-medium text-gray-700">
                    Enable SAML for this app
                  </label>
                </div>

                {samlConfig.samlEnabled && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entity ID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={samlConfig.entityId}
                        onChange={(e) => setSamlConfig({ ...samlConfig, entityId: e.target.value })}
                        placeholder="https://your-app.example.com/saml"
                      />
                      <p className="mt-1 text-xs text-gray-500">Your app's unique SAML identifier</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ACS URL <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={samlConfig.acsUrl}
                        onChange={(e) => setSamlConfig({ ...samlConfig, acsUrl: e.target.value })}
                        placeholder="https://your-app.example.com/saml/acs"
                      />
                      <p className="mt-1 text-xs text-gray-500">Where your app receives SAML responses</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SLO URL (Optional)
                      </label>
                      <Input
                        value={samlConfig.sloUrl}
                        onChange={(e) => setSamlConfig({ ...samlConfig, sloUrl: e.target.value })}
                        placeholder="https://your-app.example.com/saml/slo"
                      />
                      <p className="mt-1 text-xs text-gray-500">Single Logout URL (optional)</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowSamlConfigModal(false);
                      if (selectedApp) {
                        try {
                          const metadata = selectedApp.metadata ? JSON.parse(selectedApp.metadata) : {};
                          setSamlConfig({
                            samlEnabled: metadata.samlEnabled || false,
                            entityId: metadata.samlConfig?.entityId || '',
                            acsUrl: metadata.samlConfig?.acsUrl || '',
                            sloUrl: metadata.samlConfig?.sloUrl || '',
                          });
                        } catch {
                          setSamlConfig({
                            samlEnabled: false,
                            entityId: '',
                            acsUrl: '',
                            sloUrl: '',
                          });
                        }
                      }
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSamlConfig}
                    disabled={isSavingSaml || (samlConfig.samlEnabled && (!samlConfig.entityId || !samlConfig.acsUrl))}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {isSavingSaml ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Access Modal */}
        {showAssignModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Assign Access to {selectedApp.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assignmentData.userId}
                    onChange={(e) => setAssignmentData({ ...assignmentData, userId: e.target.value })}
                  >
                    <option value="">Choose a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Quota (optional)"
                  type="number"
                  value={assignmentData.quota}
                  onChange={(e) => setAssignmentData({ ...assignmentData, quota: e.target.value })}
                  placeholder="Enter usage quota"
                />
                <Input
                  label="Expires At (optional)"
                  type="datetime-local"
                  value={assignmentData.expiresAt}
                  onChange={(e) => setAssignmentData({ ...assignmentData, expiresAt: e.target.value })}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowAssignModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignAccess}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Assign Access
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Assignment Modal */}
        <BulkAssignmentModal
          apps={apps}
          isOpen={showBulkAssignmentModal}
          onClose={() => setShowBulkAssignmentModal(false)}
          onAssignmentChange={fetchData}
          currentUser={{
            role: user?.role || 'USER',
            organizationId: user?.organizationId
          }}
        />
      </div>
    </UnifiedLayout>
  );
}
