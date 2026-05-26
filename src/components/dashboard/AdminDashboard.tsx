"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Organization, Plan, Pricing, type SecurityEvent } from '@/lib/api-client';
import {
  formatEventTypeLabel,
  normalizeSeverity,
  summarizeEventDetails,
} from '@/components/security/security-event-utils';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  UsersIcon,
  Squares2X2Icon,
  KeyIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

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

interface DashboardStats {
  activeUsers: number;
  totalTeams: number;
  securityEvents: number;
  totalOrganizations: number;
  recentLogins: number;
  pendingInvitations: number;
  totalApps: number;
  activeAppAccess: number;
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
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ 
    activeUsers: 0, 
    totalTeams: 0, 
    securityEvents: 0,
    totalOrganizations: 0,
    recentLogins: 0,
    pendingInvitations: 0,
    totalApps: 0,
    activeAppAccess: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // App-related state
  const [apps, setApps] = useState<App[]>([]);
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
      // Ensure activityData is an array
      const activityArray = Array.isArray(activityData) ? activityData : [];
      setRecentActivity(activityArray.map(log => ({
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

      // Fetch apps and user access - use same logic as /apps page
      try {
        const appsData = await fetchApps();
        setApps(appsData);
        
        // Update app stats
        setStats(prevStats => ({
          ...prevStats,
          totalApps: appsData.length,
          activeAppAccess: appsData.filter(a => a.isActive).length
        }));
      } catch (appErr) {
        console.warn('Failed to fetch apps:', appErr);
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
        setSecurityAlerts(Array.isArray(alertsData) ? alertsData : []);
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


  const fetchApps = async (): Promise<App[]> => {
    try {
      // Use same logic as /apps page: system apps + organization apps + assigned apps
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
          icon: app.icon || '📱',
          color: app.color || '#3B82F6',
          isActive: app.isActive,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt
        }));
      
      // Get organization apps (only active ones, belonging to user's organization)
      const organizationApps = allApps
        .filter(app => app.organizationId === user?.organizationId && app.isActive !== false)
        .map(app => ({
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
      
      // Get assigned apps (only active ones)
      const assignedActiveApps = assignedApps
        .filter(app => app.isActive !== false)
        .map(app => ({
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
      
      // Combine and deduplicate by ID
      const allUserApps = [...systemApps, ...organizationApps, ...assignedActiveApps];
      const uniqueAppsMap = new Map<string, App>();
      
      allUserApps.forEach(app => {
        if (!uniqueAppsMap.has(app.id)) {
          uniqueAppsMap.set(app.id, app);
        }
      });
      
      const apps = Array.from(uniqueAppsMap.values());
      return apps;
    } catch (error) {
      console.error('Error fetching apps:', error);
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
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total users"
          value={stats.activeUsers}
          description="Active in organization"
          icon={UsersIcon}
          variant="blue"
        />
        <StatsCard
          title="Applications"
          value={stats.totalApps}
          description="Configured in workspace"
          icon={Squares2X2Icon}
          variant="emerald"
        />
        <StatsCard
          title="Active access"
          value={stats.activeAppAccess}
          description="User-app assignments"
          icon={KeyIcon}
          variant="violet"
        />
        <div
          className="cursor-pointer"
          role="link"
          tabIndex={0}
          onClick={() => router.push('/security')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') router.push('/security');
          }}
        >
          <StatsCard
            title="Security events"
            value={stats.securityEvents}
            description="Open Security Center"
            icon={ShieldExclamationIcon}
            variant="amber"
            className="hover:border-amber-300"
          />
        </div>
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
                      Current: {stats.totalApps} apps
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          {
            href: '/users',
            title: 'Manage users',
            description: 'Add, invite, and assign roles',
            icon: UsersIcon,
            iconBg: 'bg-blue-100 text-blue-700',
          },
          {
            href: '/users',
            title: 'Teams',
            description: 'Organize members into groups',
            icon: UserGroupIcon,
            iconBg: 'bg-emerald-100 text-emerald-700',
          },
          {
            href: '/admin/apps',
            title: 'Applications',
            description: 'Configure access and SSO',
            icon: CubeIcon,
            iconBg: 'bg-violet-100 text-violet-700',
          },
          {
            href: '/security',
            title: 'Security Center',
            description: 'Events, sessions, and policies',
            icon: ShieldExclamationIcon,
            iconBg: 'bg-amber-100 text-amber-700',
          },
          {
            href: '/settings',
            title: 'Settings',
            description: 'Profile, plan, and organization',
            icon: Cog6ToothIcon,
            iconBg: 'bg-slate-100 text-slate-700',
          },
        ].map((action) => (
          <Card
            key={action.title}
            className="group cursor-pointer border-slate-200/80 p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-md"
            onClick={() => {
              window.location.href = action.href;
            }}
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}
              >
                <action.icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-800">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{action.description}</p>
              </div>
            </div>
          </Card>
        ))}
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
                <p className="font-medium text-gray-900">Total Apps</p>
                <p className="text-sm text-gray-600">Available apps</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.totalApps}</p>
                <p className="text-sm text-blue-600">Configured</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Active Access</p>
                <p className="text-sm text-gray-600">User-app assignments</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.activeAppAccess}</p>
                <p className="text-sm text-purple-600">Active</p>
              </div>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-amber-50"
              onClick={() => router.push('/security')}
            >
              <div>
                <p className="font-medium text-gray-900">Security Events</p>
                <p className="text-sm text-gray-600">View in Security Center</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{stats.securityEvents}</p>
                <p className="text-sm text-amber-700">Open →</p>
              </div>
            </button>
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
          {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-100 p-2">
                <span className="text-xl">🚨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/security')}>
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {securityAlerts.length > 0 ? (
              securityAlerts.slice(0, 4).map((alert) => {
                const sev = normalizeSeverity(alert.severity);
                return (
                  <button
                    key={alert.id}
                    type="button"
                    className={`w-full rounded-lg border-l-4 p-3 text-left transition-opacity hover:opacity-90 ${
                      sev === 'critical' || sev === 'high'
                        ? 'border-red-400 bg-red-50'
                        : sev === 'medium'
                          ? 'border-yellow-400 bg-yellow-50'
                          : sev === 'low'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-emerald-400 bg-emerald-50'
                    }`}
                    onClick={() => router.push('/security')}
                  >
                    <p className="font-medium text-gray-900">
                      {formatEventTypeLabel(alert.eventType)}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
                      {summarizeEventDetails(alert)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <span className="mb-4 block text-4xl">🚨</span>
                <p className="text-gray-600">No security alerts to display</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/security')}
                >
                  Open Security Center
                </Button>
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
            As an administrator, you have full control over your organization. Set up apps, 
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
              onClick={() => window.location.href = '/admin/apps'}
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