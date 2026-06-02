import type { RiskInsightsSummaryV2, RiskInsightsTrendsV2, RiskInsightsUsersV2 } from '@/lib/api-client';

export type RiskLevel = 'all' | 'low' | 'medium' | 'high' | 'critical';

export type RiskInsightsSummary = RiskInsightsSummaryV2;
export type RiskInsightsTrends = RiskInsightsTrendsV2;

export interface RiskProfileRow {
  id?: string;
  userId?: string;
  riskScore: number;
  riskLevel: string;
  lastCalculated?: string;
  lastLoginLocation?: string | null;
  user?: { email: string; name: string | null };
}

export interface RiskInsightsUsers {
  contractVersion: 'v2';
  generatedAt: string;
  items: RiskProfileRow[];
  pagination: RiskInsightsUsersV2['pagination'];
}
