import type {
  RiskInsightsProfileRow,
  RiskInsightsSummaryV2,
  RiskInsightsTrendsV2,
  RiskInsightsUsersV2,
} from '@/lib/api-client';

export type RiskLevel = 'all' | 'low' | 'medium' | 'high' | 'critical';

export type RiskInsightsSummary = RiskInsightsSummaryV2;
export type RiskInsightsTrends = RiskInsightsTrendsV2;
export type RiskProfileRow = RiskInsightsProfileRow;

export interface RiskInsightsUsers {
  contractVersion: 'v2';
  generatedAt: string;
  items: RiskProfileRow[];
  pagination: RiskInsightsUsersV2['pagination'];
}
