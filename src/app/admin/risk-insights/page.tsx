'use client';

import { useMemo, useState } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/LoadingSpinner';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskInsightsSummary, useRiskInsightsTrends, useRiskInsightsUsers } from './hooks';
import { FiltersBar, KpiCards, RiskDistribution, Section, TrendChart, UsersTable } from './components';
import type { RiskLevel } from './types';

export default function RiskInsightsPage() {
  const { user } = useAuth();
  const [windowDays, setWindowDays] = useState(30);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const summary = useRiskInsightsSummary(windowDays);
  const trends = useRiskInsightsTrends(windowDays);
  const usersData = useRiskInsightsUsers({
    page,
    limit: 20,
    q: search,
    riskLevel,
    sortBy: 'riskScore',
    sortOrder: 'desc',
  });

  const isAdmin =
    user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';

  const loading = summary.loading || trends.loading || usersData.loading;
  const hasError = summary.error || trends.error || usersData.error;

  const onRefresh = async () => {
    await Promise.all([summary.reload(), trends.reload(), usersData.reload()]);
  };

  const pagination = useMemo(
    () =>
      usersData.data?.pagination ?? {
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 20,
      },
    [usersData.data]
  );

  return (
    <UnifiedLayout title="Risk insights">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Risk insights</h1>
            <p className="text-sm text-gray-600">Tenant-accurate security risk analytics.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void onRefresh()}>
            Refresh
          </Button>
        </header>

        {!isAdmin && (
          <Alert variant="warning">
            <AlertTitle>View only</AlertTitle>
            <AlertDescription>Admin access is required to manage risk operations.</AlertDescription>
          </Alert>
        )}

        <FiltersBar
          riskLevel={riskLevel}
          setRiskLevel={(value) => {
            setRiskLevel(value);
            setPage(1);
          }}
          search={search}
          setSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          windowDays={windowDays}
          setWindowDays={(value) => {
            setWindowDays(value);
            setPage(1);
          }}
        />

        {loading ? (
          <div className="space-y-3">
            <Card className="p-4">
              <Skeleton lines={3} />
            </Card>
            <Card className="p-4">
              <Skeleton lines={8} />
            </Card>
          </div>
        ) : hasError ? (
          <Alert variant="error">
            <AlertTitle>Unable to load risk insights</AlertTitle>
            <AlertDescription>{hasError}</AlertDescription>
          </Alert>
        ) : summary.data && trends.data && usersData.data ? (
          <>
            <KpiCards summary={summary.data} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Distribution">
                <RiskDistribution summary={summary.data} />
              </Section>
              <Section title="Trends">
                <TrendChart trends={trends.data} />
              </Section>
            </div>
            <UsersTable
              rows={usersData.data.items}
              pagination={pagination}
              onPage={setPage}
            />
          </>
        ) : null}
      </div>
    </UnifiedLayout>
  );
}
