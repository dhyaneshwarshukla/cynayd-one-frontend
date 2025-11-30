"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { AddAppModal } from '@/components/dashboard/AddAppModal';
import { AppAssignmentModal } from '@/components/dashboard/AppAssignmentModal';
import { AppCreationModal } from '@/components/dashboard/AppCreationModal';
import { apiClient, AppWithAccess, AuditLog } from '@/lib/api-client';
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
  WifiIcon,
  KeyIcon,
  XMarkIcon
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

function AppsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
  const [showSamlConfigModal, setShowSamlConfigModal] = useState(false);
  const [samlConfig, setSamlConfig] = useState({
    samlEnabled: false,
    entityId: '',
    acsUrl: '',
    sloUrl: '',
  });
  const [isSavingSaml, setIsSavingSaml] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    totalApps: 0,
    activeApps: 0,
    expiringApps: 0,
    avgUsage: 0
  });
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const hasFetchedRef = useRef(false);
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
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

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

  const fetchAppsInline = useCallback(async () => {
    if (!user) return;
    
    console.log('🚀 Fetching apps for user:', user.email, 'Role:', user.role);
    setIsLoading(true);
    setError(null);
    
    try {
      let userApps;
      
      if (user?.role === 'SUPER_ADMIN') {
        console.log('🔍 SUPER_ADMIN: Fetching all apps...');
        const allApps = await apiClient.getApps();
        console.log('📦 All apps received:', allApps.length);
        userApps = allApps
          .filter(app => app.isActive !== false) // Default to true if not specified
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        console.log('✅ Active apps processed:', userApps.length);
      } else if (user?.role === 'ADMIN') {
        console.log('🔍 ADMIN: Fetching system and assigned apps...');
        const [allApps, assignedApps] = await Promise.all([
          apiClient.getApps(),
          apiClient.getUserApps()
        ]);

        const systemApps = allApps
          .filter(app => app.systemApp && app.isActive !== false)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));

        const organizationApps = allApps
          .filter(app => app.organizationId === user.organizationId && app.isActive !== false)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));

        const assignedActiveApps = assignedApps
          .filter(app => app.isActive !== false)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));

        const allUserApps = [...systemApps, ...organizationApps, ...assignedActiveApps];
        userApps = allUserApps.filter((app, index, self) =>
          index === self.findIndex(a => a.id === app.id)
        );
        console.log('✅ Admin apps processed:', userApps.length);
      } else {
        console.log('🔍 USER: Fetching assigned apps...');
        const assignedApps = await apiClient.getUserApps();
        userApps = assignedApps
          .filter(app => app.isActive !== false)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        console.log('✅ User apps processed:', userApps.length);
      }
      
      console.log('🎯 Final apps to set:', userApps.length);
      setApps(userApps);
    } catch (err) {
      console.error('Apps fetch error:', err);
      setError('Failed to load apps. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Set page title
  useEffect(() => {
    document.title = 'Applications | CYNAYD One';
  }, []);

  // Check for error message in URL params (from SAML redirect back)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Remove error from URL to clean it up
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('appSlug');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    // Check authentication and admin access
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check if user is admin (SUPER_ADMIN or ADMIN)
    const userRole = user?.role?.toUpperCase();
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    
    if (!isAdmin) {
      // Redirect non-admin users to dashboard
      router.push('/dashboard');
      return;
    }

    // If we have a user and are authenticated, fetch apps (only once)
    if (user && isAuthenticated && !hasFetchedRef.current) {
      console.log('✅ Authenticated with user, fetching apps...');
      hasFetchedRef.current = true;
      fetchAppsInline();
      return;
    }
  }, [isAuthenticated, authLoading, user, router, fetchAppsInline]);

  const fetchApps = useCallback(async (showRefreshIndicator = false, retryCount = 0) => {
    console.log('🚀 fetchApps called with:', { showRefreshIndicator, retryCount });
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      let userApps;
      
      // Implement consistent app visibility logic
      if (user?.role === 'SUPER_ADMIN') {
        // Super admins see all active apps
        const allApps = await apiClient.getApps();
        userApps = allApps
          .filter(app => app.isActive !== false) // Only show active apps
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
      } else if (user?.role === 'ADMIN') {
        // Admins see: system apps (if enabled) + organization apps + assigned apps
        const [allApps, assignedApps] = await Promise.all([
          apiClient.getApps(),
          apiClient.getUserApps()
        ]);
        
        // Get system apps (read-only, only if active)
        const systemApps = allApps
          .filter(app => app.systemApp && app.isActive !== false)
          .map(app => ({
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        
        // Get organization apps (only active ones)
        const organizationApps = allApps
          .filter(app => app.organizationId === user.organizationId && app.isActive !== false)
          .map(app => ({
            ...app,
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
            ...app,
            access: {
              assignedAt: new Date().toISOString(),
              expiresAt: null,
              quota: null,
              usedQuota: 0
            }
          }));
        
        // Combine and deduplicate
        const allUserApps = [...systemApps, ...organizationApps, ...assignedActiveApps];
        const uniqueApps = allUserApps.filter((app, index, self) => 
          index === self.findIndex(a => a.id === app.id)
        );
        
        userApps = uniqueApps;
      } else {
        // Regular users see only their assigned active apps
        try {
          const assignedApps = await apiClient.getUserApps();
          userApps = assignedApps
            .filter(app => app.isActive !== false)
            .map(app => ({
              ...app,
              access: {
                assignedAt: new Date().toISOString(),
                expiresAt: null,
                quota: null,
                usedQuota: 0
              }
            }));
        } catch (apiError) {
          console.error('Failed to fetch user apps:', apiError);
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
          setError('Your session has expired. Please refresh the page and try again.');
          // Don't auto-redirect, let user decide
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
      
      // Get app details to check if SAML is enabled
      const appDetails = await apiClient.getAppBySlug(appSlug);
      const appMetadata = appDetails.metadata ? JSON.parse(appDetails.metadata) : {};
      const isSamlEnabled = appMetadata.samlEnabled && appMetadata.samlConfig;
      
      if (!isSamlEnabled) {
        throw new Error('SAML is not configured for this app. Please configure SAML in admin settings.');
      }
      
      // Use SAML SSO
      console.log(`Initiating SAML SSO for app: ${appSlug}`);
      const response = await apiClient.initiateSamlSSO(appSlug);
      
      // SAML SSO returns HTML that auto-submits a form
      const html = await response.text();
      
      // Create a new window and write the HTML to it
      const samlWindow = window.open('', '_blank');
      if (samlWindow) {
        samlWindow.document.write(html);
        samlWindow.document.close();
      } else {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
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
      
    } catch (err: any) {
      console.error('App access error:', err);
      
      // Add error notification
      const app = apps.find(a => a.id === appId);
      setNotifications(prev => [{
        id: `app-access-error-${Date.now()}`,
        type: 'error',
        title: 'App Access Failed',
        message: err.message || `Failed to access ${app?.name || 'the app'}. Please try again.`,
        timestamp: new Date(),
        read: false
      }, ...prev.slice(0, 9)]);
      
      setUnreadNotifications(prev => prev + 1);
      setError(err.message || 'Failed to access app');
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

  // Debug logging
  console.log('🔍 Debug - Total apps:', apps.length);
  console.log('🔍 Debug - Filtered apps:', filteredApps.length);
  console.log('🔍 Debug - Search term:', searchTerm);
  console.log('🔍 Debug - Filter status:', filterStatus);
  console.log('🔍 Debug - Apps array:', apps);

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

  const handleOpenSamlConfig = async (app: AppWithAccess) => {
    setSelectedApp(app);
    try {
      const appDetails = await apiClient.getAppBySlug(app.slug);
      const metadata = appDetails.metadata ? JSON.parse(appDetails.metadata) : {};
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
        alert('Entity ID and ACS URL are required when enabling SAML');
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
      
      setShowSamlConfigModal(false);
      await fetchApps();
      alert('SAML configuration saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to save SAML configuration');
    } finally {
      setIsSavingSaml(false);
    }
  };

  const getSamlStatus = (app: AppWithAccess) => {
    // Check if app has metadata with SAML enabled
    // Since AppWithAccess might not have metadata, we'll need to check differently
    return false; // Will be updated when we fetch app details
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
    samlEnabled?: boolean;
    samlConfig?: {
      entityId?: string;
      acsUrl?: string;
      sloUrl?: string;
    };
  }) => {
    try {
      setIsLoading(true);
      
      // Create the app using the API client with SAML config included
      const newApp = await apiClient.createApp({
        name: appData.name,
        slug: appData.slug,
        description: appData.description,
        icon: appData.icon,
        color: appData.color,
        url: appData.url,
        domain: appData.domain,
        systemApp: user?.role === 'SUPER_ADMIN',
        // Include SAML configuration if enabled
        ...(appData.samlEnabled && appData.samlConfig ? {
          samlEnabled: true,
          samlConfig: {
            entityId: appData.samlConfig.entityId,
            acsUrl: appData.samlConfig.acsUrl,
            sloUrl: appData.samlConfig.sloUrl,
          }
        } : {})
      });
      
      // Add success notification
      setNotifications(prev => [{
        id: `app-created-${Date.now()}`,
        type: 'success',
        title: 'App Created Successfully',
        message: `${appData.name} has been created${appData.samlEnabled ? ' with SAML configured' : ''} and is ready for assignment`,
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

  // Fetch activity logs when activity tab is active
  const fetchActivityLogs = useCallback(async () => {
    try {
      setIsLoadingActivity(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Last 24 hours
      
      const logs = await apiClient.getAuditLogs({
        startDate,
        endDate,
        limit: 50,
        offset: 0
      });
      
      // Filter for app-related activities
      const appRelatedLogs = logs.filter(log => 
        log.resource?.toLowerCase().includes('app') ||
        log.action?.toLowerCase().includes('app') ||
        log.action?.toLowerCase().includes('access') ||
        log.action?.toLowerCase().includes('assign') ||
        log.resource?.toLowerCase().includes('application')
      );
      
      setActivityLogs(appRelatedLogs);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setActivityLogs([]);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  // Fetch activity logs when activity tab becomes active
  useEffect(() => {
    if (activeTab === 'activity' && isAuthenticated) {
      fetchActivityLogs();
      // Set up auto-refresh for activity tab
      const activityInterval = setInterval(() => {
        fetchActivityLogs();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(activityInterval);
    }
  }, [activeTab, isAuthenticated, fetchActivityLogs]);

  // Utility function to calculate time ago dynamically
  const getTimeAgo = (timestamp: Date | string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  };

  // Get app icon and color from activity log
  const getAppFromActivity = (log: AuditLog) => {
    // Try to find app by name in resource or details
    const appName = log.resource || log.details?.appName || log.details?.name || 'Unknown App';
    const app = apps.find(a => 
      a.name.toLowerCase().includes(appName.toLowerCase()) ||
      a.slug.toLowerCase().includes(appName.toLowerCase())
    );
    return app || null;
  };

  // Calculate most accessed apps from activity logs
  const getMostAccessedApps = () => {
    const appAccessCounts = new Map<string, { count: number; lastAccess: Date; app: AppWithAccess }>();
    
    activityLogs.forEach(log => {
      const app = getAppFromActivity(log);
      if (app) {
        const existing = appAccessCounts.get(app.id);
        const logDate = new Date(log.timestamp);
        
        if (existing) {
          appAccessCounts.set(app.id, {
            count: existing.count + 1,
            lastAccess: logDate > existing.lastAccess ? logDate : existing.lastAccess,
            app
          });
        } else {
          appAccessCounts.set(app.id, {
            count: 1,
            lastAccess: logDate,
            app
          });
        }
      }
    });
    
    return Array.from(appAccessCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

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

  // Show access denied if user is not admin
  if (!authLoading && isAuthenticated && user) {
    const userRole = user?.role?.toUpperCase();
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    
    if (!isAdmin) {
      return (
        <UnifiedLayout 
          variant="dashboard" 
          title="Access Denied"
          subtitle="This page is only accessible to administrators"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 max-w-md text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You need administrator privileges to access this page.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </Card>
          </div>
        </UnifiedLayout>
      );
    }
  }

  if (authLoading || isLoading) {
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
                        
                        {/* Admin Action Buttons */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAssignApp(app)}
                              variant="outline"
                              className={`flex-1 ${
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
                            <Button
                              onClick={() => handleOpenSamlConfig(app)}
                              variant="outline"
                              className="px-3 border-blue-300 text-blue-700 hover:bg-blue-50"
                              title="Configure SAML"
                            >
                              <KeyIcon className="w-4 h-4" />
                            </Button>
                          </div>
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
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchActivityLogs}
                    disabled={isLoadingActivity}
                    className="flex items-center"
                  >
                    <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoadingActivity ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>Last 24 hours</span>
                  </div>
                </div>
              </div>
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-600">Loading activity...</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                  <p className="text-gray-600 mb-4">No app-related activities found in the last 24 hours.</p>
                  <Button variant="outline" onClick={fetchActivityLogs}>
                    Refresh Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.slice(0, 10).map((log) => {
                    const app = getAppFromActivity(log);
                    const timeAgo = getTimeAgo(log.timestamp);
                    const actionType = log.action?.toLowerCase() || '';
                    
                    // Determine icon and color based on action type
                    let icon = '📱';
                    let bgColor = '#3b82f6';
                    let actionText = log.action || 'Activity';
                    
                    if (actionType.includes('access') || actionType.includes('login')) {
                      icon = '🚀';
                      bgColor = '#10b981';
                      actionText = 'App Accessed';
                    } else if (actionType.includes('assign') || actionType.includes('grant')) {
                      icon = '👤';
                      bgColor = '#3b82f6';
                      actionText = 'App Assigned';
                    } else if (actionType.includes('create')) {
                      icon = '➕';
                      bgColor = '#8b5cf6';
                      actionText = 'App Created';
                    } else if (actionType.includes('update') || actionType.includes('modify')) {
                      icon = '✏️';
                      bgColor = '#f59e0b';
                      actionText = 'App Updated';
                    } else if (actionType.includes('delete') || actionType.includes('remove')) {
                      icon = '🗑️';
                      bgColor = '#ef4444';
                      actionText = 'App Removed';
                    }
                    
                    // Use app's color and icon if available
                    if (app) {
                      bgColor = app.color || bgColor;
                      icon = app.icon || icon;
                    }
                    
                    return (
                      <div key={log.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 text-white text-sm shadow-md"
                          style={{ backgroundColor: bgColor }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {app ? app.name : log.resource || 'Unknown App'}
                            </h3>
                            <span className="text-xs text-gray-500">{timeAgo}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {actionText}
                            {log.user && (
                              <span className="ml-1">by {log.user.name || log.user.email}</span>
                            )}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {JSON.stringify(log.details).substring(0, 100)}
                              {JSON.stringify(log.details).length > 100 ? '...' : ''}
                            </p>
                          )}
                          {app && (
                            <div className="flex items-center mt-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    getUsagePercentage(app) > 90 ? 'bg-red-500' :
                                    getUsagePercentage(app) > 70 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${getUsagePercentage(app)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{getUsagePercentage(app)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            actionType.includes('access') || actionType.includes('create') || actionType.includes('assign')
                              ? 'bg-green-100 text-green-800'
                              : actionType.includes('update')
                              ? 'bg-yellow-100 text-yellow-800'
                              : actionType.includes('delete')
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {actionText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchActivityLogs}
                    disabled={isLoadingActivity}
                    className="flex items-center"
                  >
                    <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoadingActivity ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <div className="flex items-center text-sm text-gray-500">
                    <ChartBarIcon className="w-4 h-4 mr-1" />
                    <span>Real-time data</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Most Used Apps</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTab('activity')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All Activity
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      // Get most accessed apps from activity logs if available
                      const mostAccessed = getMostAccessedApps();
                      
                      // If we have activity data, show most accessed apps
                      if (mostAccessed.length > 0) {
                        return mostAccessed.map(({ app, count, lastAccess }) => {
                          const usagePercentage = getUsagePercentage(app);
                          const accessStatus = getAccessStatus(app);
                          const timeAgo = getTimeAgo(lastAccess);
                          
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
                                  <span className="text-gray-500 font-semibold">{count} access{count !== 1 ? 'es' : ''}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500">Last: {timeAgo}</span>
                                  {usagePercentage > 0 && (
                                    <span className="text-xs text-gray-500">{usagePercentage}% quota</span>
                                  )}
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
                        });
                      }
                      
                      // Fallback: Sort apps by usage percentage (highest first) and get top 5
                      const sortedApps = [...apps]
                        .map(app => ({
                          app,
                          usagePercentage: getUsagePercentage(app),
                          accessStatus: getAccessStatus(app)
                        }))
                        .sort((a, b) => b.usagePercentage - a.usagePercentage)
                        .slice(0, 5);
                      
                      if (sortedApps.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No apps with usage data</p>
                          </div>
                        );
                      }
                      
                      return sortedApps.map(({ app, usagePercentage, accessStatus }) => (
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
                              <span className="text-gray-500 font-semibold">{usagePercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  usagePercentage > 90 ? 'bg-red-500' :
                                  usagePercentage > 70 ? 'bg-yellow-500' :
                                  usagePercentage > 0 ? 'bg-green-500' :
                                  'bg-gray-300'
                                }`}
                                style={{ width: `${Math.max(usagePercentage, 2)}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center">
                                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                  accessStatus.color === 'green' ? 'bg-green-500' :
                                  accessStatus.color === 'yellow' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className="text-xs text-gray-400">{accessStatus.text}</span>
                              </div>
                              {app.access?.quota && (
                                <span className="text-xs text-gray-500">
                                  {app.access.usedQuota.toLocaleString()} / {app.access.quota.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Access Status & Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Active Apps</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {stats.activeApps} / {stats.totalApps}
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
                    {stats.totalQuota > 0 && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <div className="flex items-center">
                          <ChartBarIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Total Quota Usage</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          {stats.quotaUtilization}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-5 h-5 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Avg Usage</span>
                      </div>
                      <span className="text-lg font-bold text-indigo-600">
                        {stats.avgUsage}%
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

      {/* SAML Configuration Modal */}
      {showSamlConfigModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2 text-blue-600" />
                  SAML Configuration - {selectedApp.name}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSamlConfigModal(false)}
                  className="p-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              </div>
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
                      <input
                        type="text"
                        value={samlConfig.entityId}
                        onChange={(e) => setSamlConfig({ ...samlConfig, entityId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://your-app.example.com/saml"
                      />
                      <p className="mt-1 text-xs text-gray-500">Your app's unique SAML identifier</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ACS URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={samlConfig.acsUrl}
                        onChange={(e) => setSamlConfig({ ...samlConfig, acsUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://your-app.example.com/saml/acs"
                      />
                      <p className="mt-1 text-xs text-gray-500">Where your app receives SAML responses</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SLO URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={samlConfig.sloUrl}
                        onChange={(e) => setSamlConfig({ ...samlConfig, sloUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://your-app.example.com/saml/slo"
                      />
                      <p className="mt-1 text-xs text-gray-500">Single Logout URL (optional)</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowSamlConfigModal(false)}
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
          </Card>
        </div>
      )}

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

export default function AppsPage() {
  return (
    <Suspense fallback={
      <UnifiedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </UnifiedLayout>
    }>
      <AppsPageContent />
    </Suspense>
  );
}
