'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { RiskInsightsSummary, RiskInsightsTrends, RiskInsightsUsers, RiskLevel, RiskProfileRow } from './types';

function normalizeLegacyDashboard(raw: Record<string, unknown>): {
  summary: RiskInsightsSummary;
  users: RiskInsightsUsers;
} {
  const profiles = (Array.isArray(raw.profiles) ? raw.profiles : []) as RiskProfileRow[];
  const riskDistribution = (raw.riskDistribution as Record<'low' | 'medium' | 'high' | 'critical', number>) ?? {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const trackedProfiles = Number(raw.trackedProfiles ?? profiles.length);
  return {
    summary: {
      contractVersion: 'v2',
      generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
      trackedProfiles,
      highRiskUsers: Number(raw.highRiskUsers && Array.isArray(raw.highRiskUsers) ? raw.highRiskUsers.length : 0),
      criticalUsers: Number(riskDistribution.critical ?? 0),
      openAnomalies: Number(raw.openAnomalies ?? 0),
      activeSessions: Number(raw.activeSessions ?? 0),
      riskDistribution,
    },
    users: {
      contractVersion: 'v2',
      generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
      items: profiles,
      pagination: {
        page: 1,
        limit: profiles.length,
        total: profiles.length,
        totalPages: 1,
      },
    },
  };
}

export function useRiskInsightsSummary(windowDays: number) {
  const [data, setData] = useState<RiskInsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await apiClient.getRiskInsightsSummary(windowDays);
      setData(summary);
    } catch {
      try {
        const legacy = await apiClient.getRiskInsightsDashboard();
        setData(normalizeLegacyDashboard(legacy).summary);
      } catch {
        setError('Failed to load summary');
      }
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useRiskInsightsTrends(windowDays: number) {
  const [data, setData] = useState<RiskInsightsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trends = await apiClient.getRiskInsightsTrends(windowDays);
      setData(trends);
    } catch {
      setData({
        contractVersion: 'v2',
        generatedAt: new Date().toISOString(),
        windowDays,
        points: [],
      });
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useRiskInsightsUsers(filters: {
  page: number;
  limit: number;
  q: string;
  riskLevel: RiskLevel;
  sortBy: 'riskScore' | 'lastCalculated';
  sortOrder: 'asc' | 'desc';
}) {
  const [data, setData] = useState<RiskInsightsUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await apiClient.getRiskInsightsUsers({
        page: filters.page,
        limit: filters.limit,
        q: filters.q || undefined,
        riskLevel: filters.riskLevel,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setData(users);
    } catch {
      try {
        const legacy = await apiClient.getRiskInsightsDashboard();
        const normalized = normalizeLegacyDashboard(legacy).users;
        setData(normalized);
      } catch {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  }, [filters.limit, filters.page, filters.q, filters.riskLevel, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
