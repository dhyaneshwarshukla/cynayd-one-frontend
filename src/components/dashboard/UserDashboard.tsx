"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, AppWithAccess } from '@/lib/api-client';
import { launchAppWithFallback } from '@/lib/launch-app';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { WorkspaceAppCard } from '@/components/dashboard/WorkspaceAppCard';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
  color?: string;
  url?: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserAppAccess {
  id: string;
  userId: string;
  appId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  assignedAt: string;
  usedQuota: number;
  quota?: number;
  expiresAt?: string;
}

interface UserStats {
  totalApps: number;
  activeApps: number;
  usedQuota: number;
  totalQuota: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface UserDashboardProps {
  user: any;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const router = useRouter();
  const [apps, setApps] = useState<AppWithAccess[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalApps: 0,
    activeApps: 0,
    usedQuota: 0,
    totalQuota: 0
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch organization details if user has organizationId
      if (user?.organizationId) {
        try {
          const orgDetails = await apiClient.getOrganizationById(user.organizationId);
          setOrganization(orgDetails);
        } catch (orgError) {
          console.warn('Failed to fetch organization details:', orgError);
          // Fallback to showing organizationId if name fetch fails
          setOrganization({ 
            id: user.organizationId, 
            name: user.organizationId,
            slug: user.organizationId.toLowerCase().replace(/\s+/g, '-')
          });
        }
      }

      // Fetch apps and user access
      const appsData = await getApps();
      setApps(appsData);

      // Calculate stats
      const activeApps = appsData.filter(app => app.isActive).length;
      const usedQuota = appsData.reduce((sum, app) => sum + (app.access?.usedQuota || 0), 0);
      const totalQuota = appsData.reduce((sum, app) => sum + (app.access?.quota || 0), 0);
      

      setStats({
        totalApps: appsData.length,
        activeApps,
        usedQuota,
        totalQuota
      });

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultAccess = () => ({
    assignedAt: new Date().toISOString(),
    expiresAt: null as string | null,
    quota: null as number | null,
    usedQuota: 0,
  });

  /** Preserve API icon/iconUrl; only fall back to slug defaults when missing. */
  const normalizeDashboardApp = (
    app: AppWithAccess,
    access?: AppWithAccess['access']
  ): AppWithAccess => ({
    ...app,
    description: app.description || 'No description available',
    icon: app.icon || getAppIcon(app.slug),
    iconUrl: app.iconUrl,
    color: app.color || getAppColor(app.slug),
    isActive: app.isActive !== false,
    createdAt: app.createdAt || new Date().toISOString(),
    updatedAt: app.updatedAt || new Date().toISOString(),
    access: access ?? app.access ?? defaultAccess(),
  });

  const getApps = async (): Promise<AppWithAccess[]> => {
    try {
      const userRole = user?.role;
      let apps: AppWithAccess[] = [];

      if (userRole === 'SUPER_ADMIN') {
        const allApps = await apiClient.getApps();
        apps = allApps
          .filter((app) => app.isActive !== false)
          .map((app) => normalizeDashboardApp(app as AppWithAccess));
      } else if (userRole === 'ADMIN') {
        const [allApps, assignedApps] = await Promise.all([
          apiClient.getApps(),
          apiClient.getUserApps(),
        ]);

        const systemApps = allApps
          .filter((app) => app.systemApp === true && app.isActive !== false)
          .map((app) => normalizeDashboardApp(app as AppWithAccess));

        const organizationApps = allApps
          .filter(
            (app) =>
              app.organizationId === user.organizationId && app.isActive !== false
          )
          .map((app) => normalizeDashboardApp(app as AppWithAccess));

        const assignedActiveApps = assignedApps
          .filter((app) => app.isActive !== false)
          .map((app) => normalizeDashboardApp(app));

        const uniqueAppsMap = new Map<string, AppWithAccess>();
        [...systemApps, ...organizationApps, ...assignedActiveApps].forEach((app) => {
          if (!uniqueAppsMap.has(app.id)) {
            uniqueAppsMap.set(app.id, app);
          }
        });
        apps = Array.from(uniqueAppsMap.values());
      } else {
        const assignedApps = await apiClient.getUserApps();
        const uniqueAppsMap = new Map<string, AppWithAccess>();

        assignedApps
          .filter((app) => app.isActive !== false)
          .forEach((app) => {
            if (!uniqueAppsMap.has(app.id)) {
              uniqueAppsMap.set(app.id, normalizeDashboardApp(app));
            }
          });

        apps = Array.from(uniqueAppsMap.values());
      }

      return apps;
    } catch (error) {
      console.error('Error fetching user apps:', error);
      return [];
    }
  };

  const getAppIcon = (slug: string): string => {
    const iconMap: { [key: string]: string } = {
      'hr-management': '👥',
      'drive': '💾',
      'connect': '💬',
      'crm-system': '📊',
      'project-tracker': '📋',
      'admin-dashboard': '🛡️',
      'user-management': '👤',
      'security-center': '🔒'
    };
    return iconMap[slug] || '📱';
  };

  const getAppColor = (slug: string): string => {
    const colorMap: { [key: string]: string } = {
      'hr-management': '#3B82F6',
      'drive': '#10B981',
      'connect': '#8B5CF6',
      'crm-system': '#F59E0B',
      'project-tracker': '#EF4444',
      'admin-dashboard': '#6366F1',
      'user-management': '#06B6D4',
      'security-center': '#DC2626'
    };
    return colorMap[slug] || '#3B82F6';
  };

  const handleAppAccess = async (app: AppWithAccess) => {
    try {
      setLaunchingAppId(app.id);
      await launchAppWithFallback(app.slug);
    } catch (error: unknown) {
      console.error('Error accessing app:', error);
      const message =
        error instanceof Error
          ? error.message
          : `Failed to access ${app.name}. Please try again.`;
      alert(message);
    } finally {
      setLaunchingAppId(null);
    }
  };

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.slug.toLowerCase().includes(q) ||
        (app.description?.toLowerCase().includes(q) ?? false)
    );
  }, [apps, searchQuery]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const quickLinks = [
    {
      href: '/dashboard/profile',
      label: 'Profile',
      description: 'Update your account details',
      icon: UserCircleIcon,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      description: 'Preferences and security',
      icon: Cog6ToothIcon,
    },
    {
      href: '/dashboard/help',
      label: 'Help & support',
      description: 'Guides and documentation',
      icon: QuestionMarkCircleIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchDashboardData()}>
              <ArrowPathIcon className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {organization && (
        <p className="text-sm text-gray-500">
          Organization:{' '}
          <span className="font-medium text-gray-700">{organization.name}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Your apps"
          value={stats.totalApps}
          description="Assigned to you"
        />
        <StatsCard
          title="Ready to open"
          value={stats.activeApps}
          description="Currently active"
        />
        {stats.totalQuota > 0 && (
          <StatsCard
            title="Usage"
            value={`${stats.usedQuota}/${stats.totalQuota}`}
            description="Quota consumed"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_280px]">
        <section aria-labelledby="apps-heading">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="apps-heading" className="text-lg font-semibold text-gray-900">
                Your applications
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {apps.length === 0
                  ? 'No apps assigned yet'
                  : `${filteredApps.length} of ${apps.length} app${apps.length === 1 ? '' : 's'}`}
              </p>
            </div>
            {apps.length > 0 && (
              <div className="relative w-full sm:max-w-xs">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  aria-label="Search applications"
                />
              </div>
            )}
          </div>

          {apps.length > 0 ? (
            filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredApps.map((app) => (
                  <WorkspaceAppCard
                    key={app.id}
                    app={app}
                    onOpen={handleAppAccess}
                    isLaunching={launchingAppId === app.id}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Squares2X2Icon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-600">
                  No apps match &ldquo;{searchQuery}&rdquo;. Try a different search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              </Card>
            )
          ) : (
            <Card className="border-dashed p-10 text-center">
              <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No apps assigned</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Your administrator has not assigned any applications yet. Contact them to
                request access to the tools you need.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => router.push('/dashboard/help')}>View help</Button>
                <Button variant="outline" onClick={() => fetchDashboardData()}>
                  <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </Card>
          )}
        </section>

        <aside className="space-y-4" aria-label="Quick links">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Quick links
          </h2>
          <nav className="space-y-2">
            {quickLinks.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-900">{label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
                </span>
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}