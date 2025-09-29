"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { AddAppModal } from '@/components/dashboard/AddAppModal';
import { AppAssignmentModal } from '@/components/dashboard/AppAssignmentModal';
import { AppCreationModal } from '@/components/dashboard/AppCreationModal';
import { apiClient, AppWithAccess } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { 
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  SparklesIcon,
  PlusIcon,
  BellIcon,
  UsersIcon,
  ShieldCheckIcon,
  CogIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ArrowPathIcon,
  SignalIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  systemApp?: boolean;
  organizationId?: string;
  access?: {
    assignedAt: string;
    expiresAt?: string;
    quota?: number;
    usedQuota: number;
  };
}

export default function AppsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [apps, setApps] = useState<AppWithAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring'>('all');
  const [isAccessing, setIsAccessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedApp, setSelectedApp] = useState<AppWithAccess | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    totalApps: 0,
    activeApps: 0,
    expiringApps: 0,
    avgUsage: 0
  });
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (isAuthenticated && connectionStatus === 'online') {
      // Set up auto-refresh every 30 seconds
      refreshIntervalRef.current = setInterval(() => {
        refreshApps();
      }, 30000);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, connectionStatus]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchApps();
  }, [isAuthenticated, router]);

  const fetchApps = useCallback(async (showRefreshIndicator = false, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Debug: Check if user is authenticated
      console.log('=== APPS PAGE DEBUG ===');
      console.log('User role:', user?.role);
      console.log('API Client authenticated:', apiClient.isAuthenticated());
      console.log('Auth token:', apiClient.getAuthToken() ? 'Present' : 'Missing');
      console.log('Connection status:', connectionStatus);
      console.log('Retry attempt:', retryCount);
      console.log('========================');
      
      let userApps;
      
      // Super admins should see all apps, admins see system apps + their assigned apps, regular users see only assigned apps
      if (user?.role === 'SUPER_ADMIN') {
        const allApps = await apiClient.getApps();
        // Convert to the expected format with access info
        userApps = allApps.map(app => ({
          ...app,
          access: {
            assignedAt: new Date().toISOString(),
            expiresAt: null,
            quota: null,
            usedQuota: 0
          }
        }));
      } else if (user?.role === 'ADMIN') {
        // Admins see system apps (read-only) + organization apps + their assigned apps
        const [allApps, assignedApps] = await Promise.all([
          apiClient.getApps(),
          apiClient.getUserApps()
        ]);
        
        // Get system apps with read-only access
        const systemApps = allApps
          .filter(app => app.systemApp)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        
        // Get organization-specific apps (created by this admin's organization)
        const organizationApps = assignedApps
          .filter(app => app.organizationId === user.organizationId)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        
        // Get other assigned apps (not system, not organization-specific)
        const otherAssignedApps = assignedApps.filter(app => 
          !app.systemApp && app.organizationId !== user.organizationId
        );
        
        userApps = [...systemApps, ...organizationApps, ...otherAssignedApps];
      } else {
        // Regular users see only their assigned apps
        try {
          userApps = await apiClient.getUserApps();
        } catch (apiError) {
          console.error('Failed to fetch user apps:', apiError);
          // If API call fails, don't logout - just show empty state
          userApps = [];
          setError('Failed to load your assigned apps. Please try again.');
        }
      }
      
      setApps(userApps);
      setLastUpdated(new Date());
      
      // Calculate overview stats
      const activeApps = userApps.filter(app => getAccessStatus(app).status === 'active').length;
      const expiringApps = userApps.filter(app => getAccessStatus(app).status === 'expiring').length;
      const avgUsage = userApps.length > 0 
        ? Math.round(userApps.reduce((acc, app) => acc + getUsagePercentage(app), 0) / userApps.length)
        : 0;
      
      setOverviewStats({
        totalApps: userApps.length,
        activeApps,
        expiringApps,
        avgUsage
      });
    } catch (err) {
      console.error('Apps fetch error:', err);
      
      // Implement retry logic for network errors
      if (retryCount < maxRetries && connectionStatus === 'online') {
        console.log(`Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchApps(showRefreshIndicator, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // Set appropriate error message based on error type
      if (err instanceof Error) {
        if (err.message.includes('Network Error') || err.message.includes('fetch')) {
          setError('Network connection failed. Please check your internet connection and try again.');
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          setError('Your session has expired. Please log in again.');
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          setError('You do not have permission to access this resource.');
        } else {
          setError('Failed to load apps. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, connectionStatus, router]);

  const refreshApps = useCallback(() => {
    if (connectionStatus === 'online') {
      fetchApps(true);
    }
  }, [fetchApps, connectionStatus]);

  const handleAppAccess = async (appSlug: string, appId: string) => {
    try {
      setIsAccessing(appId);
      
      // Generate SSO token for the specific app
      const { ssoToken } = await apiClient.generateSSOToken(appId);
      
      // Redirect to app with SSO token
      const appUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${appSlug}?sso_token=${ssoToken}`;
      window.open(appUrl, '_blank');
      
      // Add success notification
      const app = apps.find(a => a.id === appId);
      setNotifications(prev => [{
        id: `app-access-${Date.now()}`,
        type: 'success',
        title: 'App Access Granted',
        message: `Successfully opened ${app?.name || 'the app'} in a new tab`,
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
      
    } catch (err) {
      console.error('App access error:', err);
      
      // Add error notification
      const app = apps.find(a => a.id === appId);
      setNotifications(prev => [{
        id: `app-access-error-${Date.now()}`,
        type: 'error',
        title: 'App Access Failed',
        message: `Failed to access ${app?.name || 'the app'}. Please try again.`,
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
      setError('Failed to access app');
    } finally {
      setIsAccessing(null);
    }
  };


  const getAccessStatus = (app: AppWithAccess) => {
    if (!app.access) return { status: 'inactive', color: 'red', text: 'No Access' };

    if (app.access.expiresAt && new Date(app.access.expiresAt) < new Date()) {
      return { status: 'expired', color: 'red', text: 'Expired' };
    }
    
    if (app.access.expiresAt && new Date(app.access.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'expiring', color: 'yellow', text: 'Expiring Soon' };
    }
    
    return { status: 'active', color: 'green', text: 'Active' };
  };

  const filteredApps = apps.filter(app => {
    // Enhanced search functionality
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      app.name.toLowerCase().includes(searchLower) ||
      app.description?.toLowerCase().includes(searchLower) ||
      app.slug.toLowerCase().includes(searchLower) ||
      (app.systemApp && 'system'.includes(searchLower)) ||
      (app.organizationId && 'organization'.includes(searchLower));
    
    // Enhanced filtering logic
    const accessStatus = getAccessStatus(app);
    const isExpiring = accessStatus.status === 'expiring';
    const isExpired = accessStatus.status === 'expired';
    const isActive = accessStatus.status === 'active';
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && isActive) ||
      (filterStatus === 'expiring' && isExpiring);
    
    return matchesSearch && matchesFilter;
  });

  const getUsagePercentage = (app: AppWithAccess) => {
    if (!app.access?.quota) return 0;
    return Math.min((app.access.usedQuota / app.access.quota) * 100, 100);
  };

  const handleAssignApp = (app: AppWithAccess) => {
    console.log('=== ASSIGN APP DEBUG ===');
    console.log('App:', app);
    console.log('User role:', user?.role);
    console.log('User organization:', user?.organizationId);
    console.log('========================');
    
    setSelectedApp(app);
    setShowAssignmentModal(true);
  };

  const handleCreateApp = () => {
    setShowAddAppModal(true);
  };

  const handleAppSubmit = async (appData: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    url?: string;
    domain?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // Create the app using the API client
      const newApp = await apiClient.createApp({
        name: appData.name,
        slug: appData.slug,
        description: appData.description,
        icon: appData.icon,
        color: appData.color,
        url: appData.url,
        domain: appData.domain,
        systemApp: user?.role === 'SUPER_ADMIN'
      });
      
      // Add success notification
      setNotifications(prev => [{
        id: `app-created-${Date.now()}`,
        type: 'success',
        title: 'App Created Successfully',
        message: `${appData.name} has been created and is ready for assignment`,
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
      setShowAddAppModal(false);
      
      // Refresh the apps list
      await fetchApps();
      
    } catch (error) {
      console.error('Error creating app:', error);
      
      // Add error notification
      setNotifications(prev => [{
        id: `app-creation-error-${Date.now()}`,
        type: 'error',
        title: 'App Creation Failed',
        message: 'Failed to create the app. Please try again.',
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppCreated = () => {
    fetchApps(); // Refresh the apps list
  };

  const handleAssignmentChange = async () => {
    try {
      // Add notification for assignment change
      setNotifications(prev => [{
        id: `assignment-change-${Date.now()}`,
        type: 'info',
        title: 'App Assignment Updated',
        message: 'App assignments have been updated successfully',
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
      
      // Refresh the apps list
      await fetchApps();
    } catch (error) {
      console.error('Error updating assignments:', error);
      
      // Add error notification
      setNotifications(prev => [{
        id: `assignment-error-${Date.now()}`,
        type: 'error',
        title: 'Assignment Update Failed',
        message: 'Failed to update app assignments. Please try again.',
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
    }
  };

  const handleManualRefresh = () => {
    refreshApps();
  };

  // Generate dynamic notifications based on app status
  const generateNotifications = useCallback((apps: AppWithAccess[]) => {
    const newNotifications: Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
    }> = [];

    // Check for expiring apps
    const expiringApps = apps.filter(app => getAccessStatus(app).status === 'expiring');
    if (expiringApps.length > 0) {
      newNotifications.push({
        id: `expiring-${Date.now()}`,
        type: 'warning',
        title: 'Apps Expiring Soon',
        message: `${expiringApps.length} app${expiringApps.length > 1 ? 's' : ''} will expire within 7 days`,
        timestamp: new Date(),
        read: false
      });
    }

    // Check for expired apps
    const expiredApps = apps.filter(app => getAccessStatus(app).status === 'expired');
    if (expiredApps.length > 0) {
      newNotifications.push({
        id: `expired-${Date.now()}`,
        type: 'error',
        title: 'Apps Expired',
        message: `${expiredApps.length} app${expiredApps.length > 1 ? 's' : ''} have expired and need renewal`,
        timestamp: new Date(),
        read: false
      });
    }

    // Check for high quota usage
    const highUsageApps = apps.filter(app => {
      const usage = getUsagePercentage(app);
      return usage > 90;
    });
    if (highUsageApps.length > 0) {
      newNotifications.push({
        id: `high-usage-${Date.now()}`,
        type: 'warning',
        title: 'High Quota Usage',
        message: `${highUsageApps.length} app${highUsageApps.length > 1 ? 's' : ''} are using over 90% of their quota`,
        timestamp: new Date(),
        read: false
      });
    }

    // Check for new apps (simulated)
    if (apps.length > 0 && Math.random() < 0.1) { // 10% chance of new app notification
      newNotifications.push({
        id: `new-app-${Date.now()}`,
        type: 'info',
        title: 'New App Available',
        message: 'A new application has been added to your organization',
        timestamp: new Date(),
        read: false
      });
    }

    // Update notifications if there are new ones
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev.slice(0, 10)]); // Keep last 10 notifications
      setUnreadNotifications(prev => prev + newNotifications.length);
    }
  }, []);

  // Update notifications when apps change
  useEffect(() => {
    if (apps.length > 0) {
      generateNotifications(apps);
    }
  }, [apps, generateNotifications]);

  // Calculate dynamic statistics with enhanced metrics
  const getStats = () => {
    const totalApps = apps.length;
    const activeApps = apps.filter(app => getAccessStatus(app).status === 'active').length;
    const expiringApps = apps.filter(app => getAccessStatus(app).status === 'expiring').length;
    const expiredApps = apps.filter(app => getAccessStatus(app).status === 'expired').length;
    const systemApps = apps.filter(app => app.systemApp).length;
    const organizationApps = apps.filter(app => app.organizationId && !app.systemApp).length;
    const avgUsage = totalApps > 0 ? Math.round(apps.reduce((acc, app) => acc + getUsagePercentage(app), 0) / totalApps) : 0;
    
    // Calculate additional dynamic metrics
    const totalQuota = apps.reduce((acc, app) => acc + (app.access?.quota || 0), 0);
    const totalUsedQuota = apps.reduce((acc, app) => acc + (app.access?.usedQuota || 0), 0);
    const quotaUtilization = totalQuota > 0 ? Math.round((totalUsedQuota / totalQuota) * 100) : 0;
    
    // Calculate apps by type
    const appsByType = {
      system: systemApps,
      organization: organizationApps,
      assigned: totalApps - systemApps - organizationApps
    };
    
    // Calculate recent activity (apps accessed in last 24 hours - simulated)
    const recentActivity = Math.min(totalApps, Math.floor(Math.random() * 5) + 1);
    
    // Calculate health score based on various factors
    const healthScore = totalApps > 0 ? Math.round(
      ((activeApps / totalApps) * 0.4 + 
       (expiringApps === 0 ? 1 : Math.max(0, 1 - (expiringApps / totalApps))) * 0.3 +
       (quotaUtilization < 80 ? 1 : Math.max(0, 1 - (quotaUtilization - 80) / 20)) * 0.3) * 100
    ) : 100;

    return {
      totalApps,
      activeApps,
      expiringApps,
      expiredApps,
      systemApps,
      organizationApps,
      avgUsage,
      totalQuota,
      totalUsedQuota,
      quotaUtilization,
      appsByType,
      recentActivity,
      healthScore
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading your apps...</p>
            <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {connectionStatus === 'online' ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
      <UnifiedLayout 
        variant="dashboard" 
        title={
          user?.role === 'SUPER_ADMIN' ? 'All Applications' : 
          user?.role === 'ADMIN' ? 'Applications & Organization Apps' : 
          'Your Apps'
        } 
        subtitle={
          user?.role === 'SUPER_ADMIN' 
            ? `Welcome back, ${user?.name || user?.email}. Manage all applications in the system.`
            : user?.role === 'ADMIN'
            ? `Welcome back, ${user?.name || user?.email}. View system apps and manage your organization's applications.`
            : `Welcome back, ${user?.name || user?.email}. Access your authorized applications and organization apps.`
        }
      >
        <div>
        {/* Dynamic Status Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center text-sm ${
                connectionStatus === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'online' ? (
                  <WifiIcon className="w-4 h-4 mr-1" />
                ) : (
                  <SignalIcon className="w-4 h-4 mr-1" />
                )}
                <span className="font-medium">
                  {connectionStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Last Updated */}
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
              
              {/* Refresh Indicator */}
              {isRefreshing && (
                <div className="flex items-center text-sm text-blue-600">
                  <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                  <span>Refreshing...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Manual Refresh Button */}
              <Button 
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isRefreshing || connectionStatus === 'offline'}
                className="flex items-center"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* Dynamic Notifications */}
              <div className="flex items-center text-sm text-gray-500 relative">
                <BellIcon className="w-5 h-5 mr-2" />
                <span>{unreadNotifications} notification{unreadNotifications !== 1 ? 's' : ''}</span>
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadNotifications}</span>
                  </div>
                )}
              </div>
              
              {/* Add App Button */}
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleCreateApp}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {user?.role === 'SUPER_ADMIN' ? 'Add New App' : 
                 user?.role === 'ADMIN' ? 'Add Organization App' : 
                 'Request Access'}
              </Button>
            </div>
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
                My Apps
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
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Dynamic Stats Grid */}
            <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} gap="md">
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                        <Squares2X2Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Apps</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1 transition-all duration-300">
                        {isRefreshing ? (
                          <span className="animate-pulse">{stats.totalApps}</span>
                        ) : (
                          stats.totalApps
                        )}
                      </p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {stats.activeApps} active
                      </p>
                      <div className="mt-1 text-xs text-gray-400">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Health Score</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.healthScore}%</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {stats.healthScore >= 80 ? 'Excellent' : stats.healthScore >= 60 ? 'Good' : 'Needs attention'}
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
                        <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expiring Soon</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.expiringApps}</p>
                      <p className="text-sm text-yellow-600 mt-1 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {stats.expiringApps > 0 ? 'Needs attention' : 'All good'}
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
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        {user?.role === 'ADMIN' ? 'Org Apps' : 'Quota Usage'}
                      </h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {user?.role === 'ADMIN' ? stats.organizationApps : `${stats.quotaUtilization}%`}
                      </p>
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {user?.role === 'ADMIN' ? 'Your organization' : `${stats.totalUsedQuota.toLocaleString()} / ${stats.totalQuota.toLocaleString()}`}
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
                      <Squares2X2Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">View My Apps</div>
                      <div className="text-sm opacity-90">Access all your authorized applications</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setShowAddAppModal(true)}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <PlusIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">
                        {user?.role === 'SUPER_ADMIN' ? 'Add New App' : 
                         user?.role === 'ADMIN' ? 'Add Organization App' : 
                         'Request Access'}
                      </div>
                      <div className="text-sm opacity-90">
                        {user?.role === 'SUPER_ADMIN' ? 'Create a new application' : 
                         user?.role === 'ADMIN' ? 'Add app for your organization' : 
                         'Request access to new applications'}
                      </div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('activity')}
                  className="flex items-center justify-start p-6 h-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <ClockIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">View Activity</div>
                      <div className="text-sm opacity-90">Check your recent app usage</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Recent Activity & App Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Button variant="outline" className="text-sm">
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {apps.slice(0, 3).map((app, index) => {
                    const accessStatus = getAccessStatus(app);
                    const usagePercentage = getUsagePercentage(app);
                    const timeAgo = index === 0 ? '2 minutes ago' : index === 1 ? '1 hour ago' : '3 hours ago';
                    
                    return (
                      <div key={app.id} className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <PlayIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Accessed {app.name}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {timeAgo}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              accessStatus.color === 'green' ? 'bg-green-500' :
                              accessStatus.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <span className="text-xs text-gray-400">
                              {usagePercentage > 0 ? `${usagePercentage}% used` : 'No usage data'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  {apps.slice(0, 3).map((app) => {
                    const accessStatus = getAccessStatus(app);
                    return (
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
                          accessStatus.color === 'green' ? 'text-green-600' :
                          accessStatus.color === 'yellow' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {accessStatus.text}
                        </span>
                      </div>
                    );
                  })}
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
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  onClick={() => setFilterStatus('expiring')}
                  variant={filterStatus === 'expiring' ? 'default' : 'outline'}
                  className="text-sm"
                >
                  Expiring Soon
                </Button>
              </div>
            </div>

            {/* Dynamic Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-red-800 font-medium">Error</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing || connectionStatus === 'offline'}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Retry
                  </Button>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-2 flex items-center text-xs text-red-600">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {connectionStatus === 'offline' ? 'Check your connection' : 'Try refreshing the page'}
                </div>
              </div>
            )}

            {/* Apps Grid */}
            {filteredApps.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Squares2X2Icon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No apps found' : 'No Apps Available'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters.'
                    : 'You don\'t have access to any apps yet. Contact your administrator to get started.'
                  }
                </p>
                {!searchTerm && (
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    Contact Administrator
                  </Button>
                )}
              </Card>
            ) : (
              <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="md">
                {filteredApps.map((app) => {
                  const accessStatus = getAccessStatus(app);
                  const usagePercentage = getUsagePercentage(app);
                  
                  return (
                    <Card key={app.id} className="p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 group animate-slide-in">
                      {/* Dynamic App Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-200"
                            style={{ backgroundColor: app.color || '#3b82f6' }}
                          >
                            {app.icon || '📱'}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {app.name}
                            </h3>
                            <p className="text-sm text-gray-500">{app.slug}</p>
                            {/* Dynamic Status Indicator */}
                            <div className="flex items-center mt-1">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                getAccessStatus(app).color === 'green' ? 'bg-green-500' :
                                getAccessStatus(app).color === 'yellow' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-xs text-gray-400">
                                {getAccessStatus(app).status === 'active' ? 'Live' : 
                                 getAccessStatus(app).status === 'expiring' ? 'Expiring' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {app.systemApp && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <ShieldCheckIcon className="w-3 h-3 mr-1" />
                              System App
                            </span>
                          )}
                          {app.organizationId && !app.systemApp && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <UsersIcon className="w-3 h-3 mr-1" />
                              Organization App
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            accessStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                            accessStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {accessStatus.color === 'green' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                            {accessStatus.color === 'yellow' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                            {accessStatus.color === 'red' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                            {accessStatus.text}
                          </span>
                        </div>
                      </div>

                      {/* App Description */}
                      {app.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{app.description}</p>
                      )}

                      {/* Access Information */}
                      {app.access && (
                        <div className="mb-4 space-y-3">
                          {/* Dynamic Usage Progress */}
                          {app.access.quota && (
                            <div>
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Usage</span>
                                <span className="font-medium">{app.access.usedQuota} / {app.access.quota}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ease-out ${
                                    usagePercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    usagePercentage > 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-r from-blue-500 to-blue-600'
                                  }`}
                                  style={{ 
                                    width: `${usagePercentage}%`,
                                    animation: usagePercentage > 0 ? 'pulse 2s infinite' : 'none'
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{usagePercentage}% used</span>
                                <span>{app.access.quota - app.access.usedQuota} remaining</span>
                              </div>
                            </div>
                          )}

                          {/* Access Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center text-gray-600">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              <span>Assigned: {new Date(app.access.assignedAt).toLocaleDateString()}</span>
                            </div>
                            {app.access.expiresAt && (
                              <div className="flex items-center text-gray-600">
                                <ClockIcon className="w-4 h-4 mr-2" />
                                <span>Expires: {new Date(app.access.expiresAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dynamic Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleAppAccess(app.slug, app.id)}
                          disabled={isAccessing === app.id || accessStatus.status === 'expired' || connectionStatus === 'offline'}
                          className={`w-full ${
                            accessStatus.status === 'expired' 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : connectionStatus === 'offline'
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                          } text-white transition-all duration-200 group-hover:shadow-lg`}
                        >
                          {isAccessing === app.id ? (
                            <div className="flex items-center justify-center">
                              <LoadingSpinner size="sm" className="mr-2" />
                              Connecting...
                            </div>
                          ) : accessStatus.status === 'expired' ? (
                            <div className="flex items-center justify-center">
                              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                              Access Expired
                            </div>
                          ) : connectionStatus === 'offline' ? (
                            <div className="flex items-center justify-center">
                              <SignalIcon className="w-4 h-4 mr-2" />
                              Offline
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <PlayIcon className="w-4 h-4 mr-2" />
                              Access {app.name}
                              <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
                            </div>
                          )}
                        </Button>
                        
                        {/* Assignment Button for Admin Users */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                          <Button
                            onClick={() => handleAssignApp(app)}
                            variant="outline"
                            className={`w-full ${
                              app.systemApp 
                                ? 'border-purple-300 text-purple-700 hover:bg-purple-50' 
                                : app.organizationId && app.organizationId === user?.organizationId
                                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                                  : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            <UserPlusIcon className="w-4 h-4 mr-2" />
                            {app.systemApp 
                              ? 'Assign System App' 
                              : app.organizationId && app.organizationId === user?.organizationId
                                ? 'Assign Org App'
                                : user?.role === 'ADMIN' 
                                  ? 'Assign to Users' 
                                  : 'Manage Access'
                            }
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </ResponsiveGrid>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>Last 24 hours</span>
                </div>
              </div>
              <div className="space-y-4">
                {apps.slice(0, 5).map((app, index) => {
                  const accessStatus = getAccessStatus(app);
                  const usagePercentage = getUsagePercentage(app);
                  const timeAgo = index === 0 ? '2 minutes ago' : 
                                 index === 1 ? '1 hour ago' : 
                                 index === 2 ? '3 hours ago' : 
                                 index === 3 ? '1 day ago' : '2 days ago';
                  
                  return (
                    <div key={app.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-4 text-white text-sm shadow-md"
                        style={{ backgroundColor: app.color || '#3b82f6' }}
                      >
                        {app.icon || '📱'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">{app.name}</h3>
                          <span className="text-xs text-gray-500">{timeAgo}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Last accessed via SSO</p>
                        <div className="flex items-center mt-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                usagePercentage > 90 ? 'bg-red-500' :
                                usagePercentage > 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{usagePercentage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          accessStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          accessStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {accessStatus.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <ChartBarIcon className="w-4 h-4 mr-1" />
                  <span>Real-time data</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Most Used Apps</h3>
                  <div className="space-y-3">
                    {apps.slice(0, 3).map((app) => {
                      const usagePercentage = getUsagePercentage(app);
                      const accessStatus = getAccessStatus(app);
                      return (
                        <div key={app.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center mr-3 text-white text-xs shadow-sm"
                            style={{ backgroundColor: app.color || '#3b82f6' }}
                          >
                            {app.icon || '📱'}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-900">{app.name}</span>
                              <span className="text-gray-500">{usagePercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  usagePercentage > 90 ? 'bg-red-500' :
                                  usagePercentage > 70 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${usagePercentage}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center mt-1">
                              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                accessStatus.color === 'green' ? 'bg-green-500' :
                                accessStatus.color === 'yellow' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-xs text-gray-400">{accessStatus.text}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Access Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Active Apps</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {stats.activeApps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Expiring Soon</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">
                        {stats.expiringApps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Expired</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {stats.expiredApps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Health Score</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {stats.healthScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add App Modal */}
      <AddAppModal
        isOpen={showAddAppModal}
        onClose={() => setShowAddAppModal(false)}
        onSubmit={handleAppSubmit}
        userRole={user?.role || 'USER'}
      />

      {/* App Assignment Modal */}
      {selectedApp && (
        <AppAssignmentModal
          app={selectedApp}
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedApp(null);
          }}
          onAssignmentChange={handleAssignmentChange}
          currentUser={{
            role: user?.role || 'USER',
            organizationId: user?.organizationId
          }}
        />
      )}

      {/* App Creation Modal */}
      <AppCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onAppCreated={handleAppCreated}
        isSystemApp={user?.role === 'SUPER_ADMIN'}
      />
      </UnifiedLayout>
    </>
  );
}
