import {
  buildOverviewMetricCards,
  buildOverviewSummaryCards,
  formatAccessOpsModeLabel,
  formatGrantDetailLines,
  overviewMetricHref,
  resolveUnmanagedRuntime,
} from '../ui-helpers';
import type { AccessOpsOverview } from '../client';

const baseOverview: AccessOpsOverview = {
  activeGovernedRuntimeGrants: 3,
  activeRuntimeAssignments: 3,
  runtimeWithoutGrant: 1,
  grantWithoutRuntime: 0,
  projectionMismatch: 0,
  expiredButRuntimeActive: 0,
  revokedButRuntimeActive: 0,
  quotaMismatch: 0,
  expiryMismatch: 0,
  unmanagedExternalEntitlements: 0,
  pendingProvisioning: 2,
  failedProvisioning: 1,
  pendingApprovals: 4,
  leaversInProgress: 1,
  failedActions: 0,
  overdueManualTasks: 2,
  connectors: [],
  productPromise: 'promise',
};

describe('AccessOps UI helpers', () => {
  it('shows Observe only for READ_ONLY mode', () => {
    expect(formatAccessOpsModeLabel('READ_ONLY')).toBe('Observe only');
    expect(formatAccessOpsModeLabel('ACTIVE')).toBe('Active');
  });

  it('links overview metrics to filtered destinations', () => {
    expect(overviewMetricHref('pendingApprovals')).toBe('/accessops/activity?filter=requests');
    expect(overviewMetricHref('runtimeWithoutGrant')).toBe('/accessops/settings/advanced?tab=reconciliation');
    expect(overviewMetricHref('overdueManualTasks')).toBe('/accessops/activity?filter=needs_action');
  });

  it('builds navigable cards for key metrics', () => {
    const cards = buildOverviewMetricCards({
      data: baseOverview,
      can: () => true,
      features: { lifecycle: true, requests: true, verification: true },
    });
    const pending = cards.find((c) => c.key === 'pendingApprovals');
    expect(pending?.href).toBe('/accessops/activity?filter=requests');
    expect(pending?.value).toBe(4);
  });

  it('builds the six simplified summary cards', () => {
    const cards = buildOverviewSummaryCards({
      usersWithAccess: 10,
      applications: 4,
      pendingRequests: 2,
      accessExpiringSoon: 3,
      failedRemovals: 1,
      connectorStatus: 'HEALTHY',
    });
    expect(cards).toHaveLength(6);
    expect(cards.find((card) => card.key === 'failedRemovals')?.href).toBe('/accessops/activity?filter=failed');
    expect(cards.find((card) => card.key === 'connectorStatus')?.href).toBe('/accessops/settings/connections');
  });

  it('prefers ungovernedRuntime over unmanagedRuntime for people snapshots', () => {
    const rows = resolveUnmanagedRuntime({
      unmanagedRuntime: [{ applicationId: 'a1' }],
      ungovernedRuntime: [{ applicationId: 'a2' }],
    });
    expect(rows).toEqual([{ applicationId: 'a2' }]);
  });

  it('formats grant approval, source, expiry, and usage lines when present', () => {
    const lines = formatGrantDetailLines({
      why: 'Finance app',
      approvalSource: 'Manager approval',
      sources: [{ sourceType: 'REQUEST', sourceId: 'req-1' }],
      expiresAt: '2026-12-01T00:00:00.000Z',
      quota: 10,
      usedQuota: 3,
    });
    expect(lines.some((line) => line.startsWith('Approval:'))).toBe(true);
    expect(lines.some((line) => line.startsWith('Source:'))).toBe(true);
    expect(lines.some((line) => line.startsWith('Expires:'))).toBe(true);
    expect(lines.some((line) => line.startsWith('Usage:'))).toBe(true);
  });
});
