/**
 * AccessOps client and permissions surface tests.
 */
import { accessOpsClient } from '../client';
import {
  ACCESSOPS_PERMISSIONS,
  hasAccessOpsPermission,
  permissionsFromFeatures,
} from '../permissions-core';
import type { EffectiveAccessOpsFeatures } from '../client';

describe('accessOpsClient surface', () => {
  it('exposes pilot endpoints', () => {
    expect(typeof accessOpsClient.getFeatures).toBe('function');
    expect(typeof accessOpsClient.getOverview).toBe('function');
    expect(typeof accessOpsClient.getOverviewSummary).toBe('function');
    expect(typeof accessOpsClient.listPeople).toBe('function');
    expect(typeof accessOpsClient.getEmployeeAccess).toBe('function');
    expect(typeof accessOpsClient.listApplicationUsers).toBe('function');
    expect(typeof accessOpsClient.listActivity).toBe('function');
    expect(typeof accessOpsClient.batchGiveAccess).toBe('function');
    expect(typeof accessOpsClient.batchRemoveAccess).toBe('function');
    expect(typeof accessOpsClient.previewRemoveAll).toBe('function');
    expect(typeof accessOpsClient.confirmRemoveAll).toBe('function');
    expect(typeof accessOpsClient.createLeaver).toBe('function');
    expect(typeof accessOpsClient.createHandover).toBe('function');
    expect(typeof accessOpsClient.executeLifecycle).toBe('function');
    expect(typeof accessOpsClient.listEvidence).toBe('function');
    expect(typeof accessOpsClient.uploadEvidence).toBe('function');
    expect(typeof accessOpsClient.createConnector).toBe('function');
    expect(typeof accessOpsClient.listConnectors).toBe('function');
    expect(typeof accessOpsClient.beginMicrosoftAuthorize).toBe('function');
    expect(typeof accessOpsClient.beginGoogleAuthorize).toBe('function');
    expect(typeof accessOpsClient.disconnectConnector).toBe('function');
    expect(typeof accessOpsClient.testConnector).toBe('function');
    expect(typeof accessOpsClient.getConnectorCapabilities).toBe('function');
    expect(typeof accessOpsClient.requeueDeadLetter).toBe('function');
    expect(typeof accessOpsClient.skipDeadLetter).toBe('function');
    expect(typeof accessOpsClient.runReconciliation).toBe('function');
    expect(typeof accessOpsClient.createJoiner).toBe('function');
    expect(typeof accessOpsClient.createMover).toBe('function');
    expect(typeof accessOpsClient.listReviewCampaigns).toBe('function');
    expect(typeof accessOpsClient.runDiscoveryScan).toBe('function');
    expect(typeof accessOpsClient.getDiscoveryDashboard).toBe('function');
  });
});

describe('AccessOps permissions helpers', () => {
  const activeFeatures: EffectiveAccessOpsFeatures = {
    enabled: true,
    mode: 'ACTIVE',
    grants: true,
    requests: true,
    lifecycle: true,
    connectors: true,
    revocation: true,
    verification: true,
    evidence: true,
    read: true,
  };

  it('maps feature flags to permission sets', () => {
    const perms = permissionsFromFeatures(activeFeatures);
    expect(hasAccessOpsPermission(perms, 'accessops.grants.read')).toBe(true);
    expect(hasAccessOpsPermission(perms, 'accessops.grants.approve')).toBe(true);
  });

  it('lists all seeded permission actions', () => {
    expect(ACCESSOPS_PERMISSIONS).toContain('accessops.exceptions.approve');
    expect(ACCESSOPS_PERMISSIONS.length).toBeGreaterThanOrEqual(10);
  });
});
