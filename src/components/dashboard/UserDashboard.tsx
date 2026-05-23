"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, AppWithAccess } from '@/lib/api-client';
import { launchAppWithFallback } from '@/lib/launch-app';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { WorkspaceAppCard } from '@/components/dashboard/WorkspaceAppCard';
import { OrganizationBanner } from '@/components/dashboard/OrganizationBanner';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { QuickLinkCard } from '@/components/dashboard/QuickLinkCard';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface UserStats {
  totalApps: number;
  activeApps: number;
  usedQuota: number;
  totalQuota: number;
}

interface UserDashboardProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    organizationId?: string;
  };
  roleLabel?: string;
}

export default function UserDashboard({ user, roleLabel = 'Member' }: UserDashboardProps) {
  const router = useRouter();
  const [apps, setApps] = useState<AppWithAccess[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalApps: 0,
    activeApps: 0,
    usedQuota: 0,
    totalQuota: 0,
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (user?.organizationId) {
        try {
          const orgDetails = await apiClient.getOrganizationById(user.organizationId);
          setOrganization(orgDetails);
        } catch (orgError) {
          console.warn('Failed to fetch organization details:', orgError);
          setOrganization({
            id: user.organizationId,
            name: user.organizationId,
            slug: user.organizationId.toLowerCase().replace(/\s+/g, '-'),
          });
        }
      }

      const appsData = await getApps();
      setApps(appsData);

      const activeApps = appsData.filter((app) => app.isActive).length;
      const usedQuota = appsData.reduce((sum, app) => sum + (app.access?.usedQuota || 0), 0);
      const totalQuota = appsData.reduce((sum, app) => sum + (app.access?.quota || 0), 0);

      setStats({
        totalApps: appsData.length,
        activeApps,
        usedQuota,
        totalQuota,
      });
      setLastRefreshed(new Date());
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
    const iconMap: Record<string, string> = {
      'hr-management': '👥',
      drive: '💾',
      connect: '💬',
      'crm-system': '📊',
      'project-tracker': '📋',
      'admin-dashboard': '🛡️',
      'user-management': '👤',
      'security-center': '🔒',
    };
    return iconMap[slug] || '📱';
  };

  const getAppColor = (slug: string): string => {
    const colorMap: Record<string, string> = {
      'hr-management': '#3B82F6',
      drive: '#10B981',
      connect: '#8B5CF6',
      'crm-system': '#F59E0B',
      'project-tracker': '#EF4444',
      'admin-dashboard': '#6366F1',
      'user-management': '#06B6D4',
      'security-center': '#DC2626',
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

  const lastRefreshedLabel = lastRefreshed
    ? lastRefreshed.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const quickLinks = [
    {
      href: '/dashboard/profile',
      label: 'Profile',
      description: 'Account details and identity',
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

  const renderRefreshButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => fetchDashboardData()}
      className="border-slate-200 text-slate-700"
    >
      <ArrowPathIcon className="mr-1.5 h-4 w-4" />
      Refresh
    </Button>
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      {error && (
        <Alert variant="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            {renderRefreshButton()}
          </div>
        </Alert>
      )}

      {organization && (
        <OrganizationBanner
          organizationName={organization.name}
          userEmail={user.email}
          roleLabel={roleLabel}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Assigned apps"
          value={stats.totalApps}
          description="Available in your workspace"
          icon={Squares2X2Icon}
          variant="blue"
        />
        <StatsCard
          title="Ready to launch"
          value={stats.activeApps}
          description="Active and accessible"
          icon={RocketLaunchIcon}
          variant="emerald"
        />
        {stats.totalQuota > 0 ? (
          <StatsCard
            title="Usage"
            value={`${stats.usedQuota}/${stats.totalQuota}`}
            description="Quota consumed"
            icon={ChartBarIcon}
            variant="violet"
          />
        ) : (
          <StatsCard
            title="Status"
            value={stats.activeApps > 0 ? 'Active' : 'Pending'}
            description={
              stats.activeApps > 0
                ? 'Your workspace is ready'
                : 'Awaiting app assignments'
            }
            icon={CheckCircleIcon}
            variant="slate"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <DashboardSection
            id="applications"
            title="Applications"
            description={
              apps.length === 0
                ? 'No applications have been assigned to your account yet.'
                : `Showing ${filteredApps.length} of ${apps.length} application${apps.length === 1 ? '' : 's'}`
            }
            variant="plain"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {lastRefreshedLabel && (
                  <span className="text-xs text-slate-400">
                    Updated {lastRefreshedLabel}
                  </span>
                )}
                {renderRefreshButton()}
              </div>
            }
            contentClassName="space-y-4 p-0"
          >
            {apps.length > 0 && (
              <div className="relative">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  aria-label="Search applications"
                />
              </div>
            )}

            {apps.length > 0 ? (
              filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
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
                <Card className="border-dashed border-slate-200 p-10 text-center">
                  <Squares2X2Icon className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-600">
                    No applications match &ldquo;{searchQuery}&rdquo;.
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
              <Card className="border-dashed border-slate-200 p-10 text-center">
                <Squares2X2Icon className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No applications assigned
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  Your administrator has not assigned any applications yet. Contact
                  your IT or workspace admin to request access to the tools you need.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button onClick={() => router.push('/dashboard/help')}>
                    Contact support
                  </Button>
                  <Button variant="outline" onClick={() => fetchDashboardData()}>
                    <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                    Check again
                  </Button>
                </div>
              </Card>
            )}
          </DashboardSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start" aria-label="Quick links">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Account & resources
          </h2>
          <nav className="space-y-2">
            {quickLinks.map((link) => (
              <QuickLinkCard key={link.href} {...link} />
            ))}
          </nav>
          <Card className="border-slate-200/80 bg-slate-50/80 p-4">
            <p className="text-xs font-medium text-slate-700">Need access?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Request new applications through your organization administrator or
              visit the help center for SSO and access guides.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => router.push('/dashboard/help')}
            >
              Open help center
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
