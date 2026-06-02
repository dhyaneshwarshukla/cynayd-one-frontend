'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BookOpenIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  SignalIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/LoadingSpinner';
import { UserAvatar } from '@/components/common/UserAvatar';
import ToastContainer from '@/components/common/ToastContainer';
import { useToast } from '@/hooks/useToast';

interface RiskUser {
  email: string;
  name: string | null;
}

interface RiskProfile {
  id?: string;
  userId?: string;
  riskScore: number;
  riskLevel: string;
  lastCalculated?: string;
  lastLoginLocation?: string | null;
  factors?: string | Record<string, unknown>;
  user?: RiskUser;
}

interface DashboardData {
  highRiskUsers: RiskProfile[];
  profiles: RiskProfile[];
  openAnomalies: number;
  activeSessions: number;
  riskDistribution: Record<string, number>;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

function normalizeDashboard(raw: Record<string, unknown>): DashboardData {
  const profiles = (Array.isArray(raw.profiles) ? raw.profiles : []) as RiskProfile[];
  const highRiskUsers = (
    Array.isArray(raw.highRiskUsers) ? raw.highRiskUsers : profiles.filter((p) =>
      ['high', 'critical'].includes(String(p.riskLevel).toLowerCase())
    )
  ) as RiskProfile[];

  const dist = raw.riskDistribution as Record<string, number> | undefined;
  const riskDistribution =
    dist && Object.keys(dist).length > 0
      ? dist
      : RISK_LEVELS.reduce(
          (acc, level) => {
            acc[level] = profiles.filter(
              (p) => String(p.riskLevel).toLowerCase() === level
            ).length;
            return acc;
          },
          {} as Record<string, number>
        );

  return {
    profiles,
    highRiskUsers,
    openAnomalies: Number(raw.openAnomalies ?? 0),
    activeSessions: Number(raw.activeSessions ?? 0),
    riskDistribution,
  };
}

function riskLevelStyles(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 ring-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-900 ring-orange-200';
    case 'medium':
      return 'bg-amber-100 text-amber-900 ring-amber-200';
    default:
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  }
}

function scoreBarColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-amber-500';
    default:
      return 'bg-emerald-500';
  }
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RiskInsightsPage() {
  const { user } = useAuth();
  const [toasts, { showToast, hideToast }] = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');
  const [search, setSearch] = useState('');

  const isAdmin =
    user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';

  const load = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background && hasLoadedOnce.current;
    if (!background) setLoading(true);
    else setRefreshing(true);

    try {
      const dash = await apiClient.getRiskInsightsDashboard();
      setData(normalizeDashboard(dash));
    } catch {
      if (!hasLoadedOnce.current) setData(null);
      showToast({
        type: 'error',
        title: 'Failed to load risk insights',
        message: 'Check your connection and try again.',
      });
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredProfiles = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.profiles.filter((p) => {
      const level = String(p.riskLevel).toLowerCase();
      if (levelFilter !== 'all' && level !== levelFilter) return false;
      if (!q) return true;
      const email = p.user?.email?.toLowerCase() ?? '';
      const name = p.user?.name?.toLowerCase() ?? '';
      return email.includes(q) || name.includes(q);
    });
  }, [data, levelFilter, search]);

  const distributionTotal = useMemo(() => {
    if (!data) return 0;
    return RISK_LEVELS.reduce((sum, l) => sum + (data.riskDistribution[l] ?? 0), 0);
  }, [data]);

  return (
    <UnifiedLayout title="Risk insights">
      <ToastContainer toasts={toasts} onClose={hideToast} />

      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <ChartBarIcon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Risk insights</h1>
              <p className="text-sm text-gray-600">
                Organization-wide risk scores, anomalies, and high-risk sign-in patterns.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={refreshing}
            disabled={loading || refreshing}
            onClick={() => void load({ background: true })}
            className="shrink-0"
          >
            <ArrowPathIcon className="mr-1.5 h-4 w-4" aria-hidden />
            Refresh
          </Button>
        </header>

        {!isAdmin && (
          <Alert variant="warning">
            <AlertTitle>View only</AlertTitle>
            <AlertDescription>
              Admin access is required to view organization risk data.
            </AlertDescription>
          </Alert>
        )}

        <InstructionsPanel
          expanded={showInstructions}
          onToggle={() => setShowInstructions((v) => !v)}
        />

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton lines={2} />
                </Card>
              ))}
            </div>
            <Card className="p-6">
              <Skeleton lines={6} />
            </Card>
          </div>
        ) : !data ? (
          <EmptyState
            icon={<ChartBarIcon className="h-full w-full" />}
            title="Unable to load dashboard"
            description="Risk data could not be retrieved. Try refreshing the page."
            action={{
              label: 'Retry',
              onClick: () => void load(),
            }}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={<BoltIcon className="h-5 w-5" />}
                label="Open anomalies"
                value={data.openAnomalies}
                hint="Unresolved detections"
                accent="text-amber-600"
                iconBg="bg-amber-50 text-amber-600"
              />
              <MetricCard
                icon={<SignalIcon className="h-5 w-5" />}
                label="Active sessions"
                value={data.activeSessions}
                hint="Non-expired logins"
                accent="text-blue-600"
                iconBg="bg-blue-50 text-blue-600"
              />
              <MetricCard
                icon={<ShieldExclamationIcon className="h-5 w-5" />}
                label="High-risk users"
                value={data.highRiskUsers.length}
                hint="High or critical level"
                accent="text-orange-600"
                iconBg="bg-orange-50 text-orange-600"
              />
              <MetricCard
                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                label="Critical"
                value={data.riskDistribution.critical ?? 0}
                hint="In tracked profiles"
                accent="text-red-600"
                iconBg="bg-red-50 text-red-600"
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              <section className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Risk distribution</CardTitle>
                    <CardDescription>
                      Breakdown of the top {data.profiles.length} user risk profiles (by score).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {distributionTotal === 0 ? (
                      <p className="text-sm text-gray-500">No risk profiles tracked yet.</p>
                    ) : (
                      RISK_LEVELS.map((level) => {
                        const count = data.riskDistribution[level] ?? 0;
                        const pct = Math.round((count / distributionTotal) * 100);
                        return (
                          <div key={level}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="capitalize font-medium text-gray-700">{level}</span>
                              <span className="text-gray-500">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all ${scoreBarColor(level)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link
                      href="/security"
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      Security events &amp; sessions
                      <span className="text-gray-400">→</span>
                    </Link>
                    <Link
                      href="/admin/security-policies"
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      Access policies
                      <span className="text-gray-400">→</span>
                    </Link>
                    <Link
                      href="/audit"
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      Audit logs
                      <span className="text-gray-400">→</span>
                    </Link>
                  </CardContent>
                </Card>
              </section>

              <section className="lg:col-span-3 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">High-risk users</h2>
                    <p className="text-sm text-gray-500">
                      Users with high or critical risk levels — review sign-in activity promptly.
                    </p>
                  </div>
                </div>

                {data.highRiskUsers.length === 0 ? (
                  <Card className="p-8 text-center">
                    <UserGroupIcon className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 font-medium text-gray-900">No high-risk users</p>
                    <p className="mt-1 text-sm text-gray-500">
                      No users are currently flagged as high or critical risk.
                    </p>
                  </Card>
                ) : (
                  <ul className="space-y-2">
                    {data.highRiskUsers.map((profile) => (
                      <RiskUserRow key={profile.userId ?? profile.id ?? profile.user?.email} profile={profile} emphasized />
                    ))}
                  </ul>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">All tracked users</h2>
                      <p className="text-sm text-gray-500">
                        Top risk profiles in your organization, sorted by score.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value as RiskLevel | 'all')}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        aria-label="Filter by risk level"
                      >
                        <option value="all">All levels</option>
                        {RISK_LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="search"
                        placeholder="Search name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  {filteredProfiles.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                      {search || levelFilter !== 'all'
                        ? 'No users match your filters.'
                        : 'No risk profiles available.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {filteredProfiles.map((profile) => (
                        <RiskUserRow
                          key={profile.userId ?? profile.id ?? profile.user?.email}
                          profile={profile}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </UnifiedLayout>
  );
}

function InstructionsPanel({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="border-rose-100 bg-gradient-to-br from-rose-50/60 to-white">
      <button
        type="button"
        className="flex w-full items-start gap-3 p-5 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
          <BookOpenIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900">Understanding risk insights</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            How scores are calculated and what to do when risk is elevated. Click to{' '}
            {expanded ? 'hide' : 'show'} details.
          </p>
        </div>
        {expanded ? (
          <ChevronUpIcon className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
        ) : (
          <ChevronDownIcon className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
        )}
      </button>

      {expanded && (
        <CardContent className="space-y-4 border-t border-rose-100/80 pt-0 text-sm text-gray-700">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-medium text-gray-900">
              <InformationCircleIcon className="h-4 w-4 text-rose-600" aria-hidden />
              What you&apos;re seeing
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-gray-600">
              <li>
                <strong>Risk score (0–100)</strong> is computed at sign-in from factors such as new
                devices, IP changes, location shifts, and impossible travel.
              </li>
              <li>
                <strong>Risk levels</strong> map to scores: low, medium, high, and critical.
              </li>
              <li>
                <strong>Open anomalies</strong> are automated detections that have not been resolved.
              </li>
              <li>
                This dashboard shows the <strong>top 20</strong> risk profiles by score for your
                organization.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium text-gray-900">Recommended response</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-gray-600">
              <li>Review high-risk users and check recent activity in Security.</li>
              <li>Require MFA or step-up via Access policies if sign-ins look suspicious.</li>
              <li>Investigate open anomalies and document outcomes in audit logs.</li>
              <li>Confirm trusted devices for users with repeated medium-risk scores.</li>
            </ol>
          </section>

          <Alert variant="info" className="text-sm">
            <AlertTitle>Risk level guide</AlertTitle>
            <AlertDescription>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <LevelGuide level="Low" range="0–39" detail="Normal activity; routine monitoring." />
                <LevelGuide level="Medium" range="40–59" detail="Some unusual signals; watch for trends." />
                <LevelGuide level="High" range="60–79" detail="Review user sessions; consider MFA policy." />
                <LevelGuide level="Critical" range="80–100" detail="Immediate review; may indicate compromise." />
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

function LevelGuide({
  level,
  range,
  detail,
}: {
  level: string;
  range: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
      <p className="font-medium text-gray-900">
        {level} <span className="font-normal text-gray-500">({range})</span>
      </p>
      <p className="mt-0.5 text-xs text-gray-600">{detail}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  accent,
  iconBg,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
  accent: string;
  iconBg: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-semibold tabular-nums ${accent}`}>{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RiskUserRow({
  profile,
  emphasized = false,
}: {
  profile: RiskProfile;
  emphasized?: boolean;
}) {
  const level = String(profile.riskLevel).toLowerCase();
  const score = Math.min(100, Math.max(0, profile.riskScore ?? 0));

  return (
    <li>
      <Card
        className={
          emphasized
            ? 'border-orange-200 bg-gradient-to-r from-orange-50/50 to-white'
            : ''
        }
      >
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatar
              name={profile.user?.name}
              email={profile.user?.email}
              size={40}
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {profile.user?.name || profile.user?.email || 'Unknown user'}
              </p>
              {profile.user?.name && profile.user?.email && (
                <p className="truncate text-xs text-gray-500">{profile.user.email}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {profile.lastLoginLocation && (
                  <span>Last location: {profile.lastLoginLocation}</span>
                )}
                <span>Updated {formatRelativeTime(profile.lastCalculated)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 sm:min-w-[140px]">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${riskLevelStyles(level)}`}
            >
              {level}
            </span>
            <div className="w-full min-w-[120px]">
              <div className="mb-0.5 flex justify-between text-xs text-gray-500">
                <span>Score</span>
                <span className="font-medium text-gray-900">{score}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${scoreBarColor(level)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
