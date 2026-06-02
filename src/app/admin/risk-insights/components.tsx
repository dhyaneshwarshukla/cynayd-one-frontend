import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { UserAvatar } from '@/components/common/UserAvatar';
import type { RiskInsightsSummary, RiskInsightsTrends, RiskLevel, RiskProfileRow } from './types';

export function KpiCards({ summary }: { summary: RiskInsightsSummary }) {
  const cards: Array<{ label: string; value: number; hint: string }> = [
    { label: 'Open anomalies', value: summary.openAnomalies, hint: 'Unresolved detections' },
    { label: 'Active sessions', value: summary.activeSessions, hint: 'Non-expired logins' },
    { label: 'High-risk users', value: summary.highRiskUsers, hint: 'High or critical level' },
    { label: 'Critical users', value: summary.criticalUsers, hint: 'Immediate review suggested' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900">{c.value}</p>
          <p className="mt-1 text-xs text-gray-500">{c.hint}</p>
        </Card>
      ))}
    </div>
  );
}

export function FiltersBar({
  riskLevel,
  setRiskLevel,
  search,
  setSearch,
  windowDays,
  setWindowDays,
}: {
  riskLevel: RiskLevel;
  setRiskLevel: (value: RiskLevel) => void;
  search: string;
  setSearch: (value: string) => void;
  windowDays: number;
  setWindowDays: (value: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
        <CardDescription>Refine time window and user segments.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <select
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </CardContent>
    </Card>
  );
}

export function RiskDistribution({ summary }: { summary: RiskInsightsSummary }) {
  const levels: Array<Exclude<RiskLevel, 'all'>> = ['low', 'medium', 'high', 'critical'];
  const total = summary.trackedProfiles || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Risk distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {levels.map((level) => {
          const count = summary.riskDistribution[level];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={level}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize font-medium text-gray-700">{level}</span>
                <span className="text-gray-500">{count} ({pct}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function TrendChart({ trends }: { trends: RiskInsightsTrends }) {
  const max = Math.max(1, ...trends.points.map((p) => Math.max(p.anomalies, p.highOrCriticalProfiles)));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trend window ({trends.windowDays}d)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trends.points.map((p) => (
            <div key={p.date} className="grid grid-cols-[80px_1fr_1fr] items-center gap-3 text-xs">
              <span className="text-gray-500">{p.date.slice(5)}</span>
              <Bar value={p.anomalies} max={max} label={`anomalies ${p.anomalies}`} color="bg-rose-500" />
              <Bar
                value={p.highOrCriticalProfiles}
                max={max}
                label={`high/critical ${p.highOrCriticalProfiles}`}
                color="bg-amber-500"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Bar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full rounded bg-gray-100">
        <div className={`h-full rounded ${color}`} style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

export function UsersTable({
  rows,
  pagination,
  onPage,
}: {
  rows: RiskProfileRow[];
  pagination: { page: number; totalPages: number; total: number };
  onPage: (next: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tracked users</CardTitle>
        <CardDescription>{pagination.total} users matched</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">No users match current filters.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id ?? row.userId ?? row.user?.email} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={row.user?.name} email={row.user?.email} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.user?.name || row.user?.email || 'Unknown user'}
                      </p>
                      <p className="truncate text-xs text-gray-500">{row.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-gray-900">{row.riskScore}</p>
                    <p className="capitalize text-gray-500">{row.riskLevel}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between pt-2 text-sm">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPage(Math.max(1, pagination.page - 1))}
            className="rounded border border-gray-200 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPage(Math.min(pagination.totalPages, pagination.page + 1))}
            className="rounded border border-gray-200 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
