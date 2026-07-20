import type { AccessOpsMode, AccessOpsOverview, AccessOpsOverviewSummary } from './client';

export function formatAccessOpsModeLabel(mode: AccessOpsMode | string | undefined): string {
  if (mode === 'READ_ONLY') return 'Observe only';
  if (!mode) return 'Unknown';
  return String(mode).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export type OverviewMetricKey =
  | 'activeGovernedRuntimeGrants'
  | 'activeRuntimeAssignments'
  | 'runtimeWithoutGrant'
  | 'grantWithoutRuntime'
  | 'projectionMismatch'
  | 'expiredButRuntimeActive'
  | 'revokedButRuntimeActive'
  | 'quotaMismatch'
  | 'expiryMismatch'
  | 'unmanagedExternalEntitlements'
  | 'pendingProvisioning'
  | 'failedProvisioning'
  | 'pendingApprovals'
  | 'leaversInProgress'
  | 'failedActions'
  | 'overdueManualTasks';

const OVERVIEW_METRIC_HREFS: Partial<Record<OverviewMetricKey, string>> = {
  activeGovernedRuntimeGrants: '/accessops/people',
  activeRuntimeAssignments: '/accessops/people',
  runtimeWithoutGrant: '/accessops/settings/advanced?tab=reconciliation',
  grantWithoutRuntime: '/accessops/settings/advanced?tab=reconciliation',
  projectionMismatch: '/accessops/settings/advanced?tab=reconciliation',
  expiredButRuntimeActive: '/accessops/settings/advanced?tab=reconciliation',
  revokedButRuntimeActive: '/accessops/settings/advanced?tab=reconciliation',
  quotaMismatch: '/accessops/settings/advanced?tab=reconciliation',
  expiryMismatch: '/accessops/settings/advanced?tab=reconciliation',
  unmanagedExternalEntitlements: '/accessops/settings/advanced?tab=reconciliation',
  pendingProvisioning: '/accessops/applications?focus=provisioning',
  failedProvisioning: '/accessops/applications?focus=provisioning',
  pendingApprovals: '/accessops/activity?filter=requests',
  leaversInProgress: '/accessops/activity?filter=needs_action',
  failedActions: '/accessops/activity?filter=failed',
  overdueManualTasks: '/accessops/activity?filter=needs_action',
};

export function overviewMetricHref(key: OverviewMetricKey): string | undefined {
  return OVERVIEW_METRIC_HREFS[key];
}

export interface OverviewMetricCard {
  key: OverviewMetricKey;
  label: string;
  value: number;
  href?: string;
  show: boolean;
}

export interface OverviewSummaryCard {
  key: keyof AccessOpsOverviewSummary;
  label: string;
  value: number | string;
  href: string;
}

export function buildOverviewSummaryCards(data: AccessOpsOverviewSummary): OverviewSummaryCard[] {
  return [
    { key: 'usersWithAccess', label: 'Users with access', value: data.usersWithAccess, href: '/accessops/people' },
    { key: 'applications', label: 'Applications', value: data.applications, href: '/accessops/applications' },
    { key: 'pendingRequests', label: 'Pending requests', value: data.pendingRequests, href: '/accessops/activity?filter=requests' },
    { key: 'accessExpiringSoon', label: 'Access expiring soon', value: data.accessExpiringSoon, href: '/accessops/activity?filter=expiring' },
    { key: 'failedRemovals', label: 'Failed removals', value: data.failedRemovals, href: '/accessops/activity?filter=failed' },
    { key: 'connectorStatus', label: 'Connector status', value: data.connectorStatusLabel ?? data.connectorStatus, href: '/accessops/settings/connections' },
  ];
}

export function buildOverviewMetricCards(input: {
  data: AccessOpsOverview;
  can: (permission: string) => boolean;
  features: {
    lifecycle?: boolean;
    requests?: boolean;
    verification?: boolean;
  } | null;
}): OverviewMetricCard[] {
  const { data, can, features } = input;
  const driftVisible = (value: number) => can('accessops.grants.read') && value > 0;

  const defs: Array<Omit<OverviewMetricCard, 'href'> & { hrefKey?: OverviewMetricKey }> = [
    {
      key: 'activeGovernedRuntimeGrants',
      label: 'Governed runtime grants',
      value: data.activeGovernedRuntimeGrants,
      show: can('accessops.grants.read'),
      hrefKey: 'activeGovernedRuntimeGrants',
    },
    {
      key: 'activeRuntimeAssignments',
      label: 'Runtime assignments',
      value: data.activeRuntimeAssignments,
      show: can('accessops.grants.read'),
      hrefKey: 'activeRuntimeAssignments',
    },
    {
      key: 'runtimeWithoutGrant',
      label: 'Runtime without grant',
      value: data.runtimeWithoutGrant,
      show: driftVisible(data.runtimeWithoutGrant),
      hrefKey: 'runtimeWithoutGrant',
    },
    {
      key: 'grantWithoutRuntime',
      label: 'Grant without runtime',
      value: data.grantWithoutRuntime,
      show: driftVisible(data.grantWithoutRuntime),
      hrefKey: 'grantWithoutRuntime',
    },
    {
      key: 'projectionMismatch',
      label: 'Projection mismatch',
      value: data.projectionMismatch,
      show: driftVisible(data.projectionMismatch),
      hrefKey: 'projectionMismatch',
    },
    {
      key: 'expiredButRuntimeActive',
      label: 'Expired but runtime active',
      value: data.expiredButRuntimeActive,
      show: driftVisible(data.expiredButRuntimeActive),
      hrefKey: 'expiredButRuntimeActive',
    },
    {
      key: 'revokedButRuntimeActive',
      label: 'Revoked but runtime active',
      value: data.revokedButRuntimeActive,
      show: driftVisible(data.revokedButRuntimeActive),
      hrefKey: 'revokedButRuntimeActive',
    },
    {
      key: 'quotaMismatch',
      label: 'Quota mismatch',
      value: data.quotaMismatch,
      show: driftVisible(data.quotaMismatch),
      hrefKey: 'quotaMismatch',
    },
    {
      key: 'expiryMismatch',
      label: 'Expiry mismatch',
      value: data.expiryMismatch,
      show: driftVisible(data.expiryMismatch),
      hrefKey: 'expiryMismatch',
    },
    {
      key: 'unmanagedExternalEntitlements',
      label: 'Unmanaged external entitlements',
      value: data.unmanagedExternalEntitlements,
      show: driftVisible(data.unmanagedExternalEntitlements),
      hrefKey: 'unmanagedExternalEntitlements',
    },
    {
      key: 'pendingProvisioning',
      label: 'Pending provisioning',
      value: data.pendingProvisioning,
      show: can('accessops.applications.read') && data.pendingProvisioning > 0,
      hrefKey: 'pendingProvisioning',
    },
    {
      key: 'failedProvisioning',
      label: 'Failed provisioning',
      value: data.failedProvisioning,
      show: can('accessops.applications.read') && data.failedProvisioning > 0,
      hrefKey: 'failedProvisioning',
    },
    {
      key: 'leaversInProgress',
      label: 'Leavers in progress',
      value: data.leaversInProgress,
      show: !!features?.lifecycle,
      hrefKey: 'leaversInProgress',
    },
    {
      key: 'failedActions',
      label: 'Failed actions',
      value: data.failedActions,
      show: !!features?.lifecycle && data.failedActions > 0,
      hrefKey: 'failedActions',
    },
    {
      key: 'pendingApprovals',
      label: 'Pending approvals',
      value: data.pendingApprovals,
      show: !!features?.requests,
      hrefKey: 'pendingApprovals',
    },
    {
      key: 'overdueManualTasks',
      label: 'Overdue manual tasks',
      value: data.overdueManualTasks,
      show: can('accessops.lifecycle.verify'),
      hrefKey: 'overdueManualTasks',
    },
  ];

  return defs
    .filter((d) => d.show)
    .map(({ hrefKey, ...card }) => ({
      ...card,
      href: hrefKey ? overviewMetricHref(hrefKey) : undefined,
    }));
}

export function resolveUnmanagedRuntime(snapshot: Record<string, unknown>): Record<string, unknown>[] {
  const ungoverned = snapshot.ungovernedRuntime;
  if (Array.isArray(ungoverned) && ungoverned.length > 0) {
    return ungoverned as Record<string, unknown>[];
  }
  const unmanaged = snapshot.unmanagedRuntime;
  return Array.isArray(unmanaged) ? (unmanaged as Record<string, unknown>[]) : [];
}

function formatWhen(value: unknown): string | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function formatGrantDetailLines(grant: Record<string, unknown>): string[] {
  const lines: string[] = [];

  const why = grant.why ?? grant.entitlementName ?? grant.taskType;
  if (why) lines.push(String(why));

  const approvalSource = grant.approvalSource ?? grant.approvedVia;
  if (approvalSource) lines.push(`Approval: ${String(approvalSource)}`);

  const sources = grant.sources;
  if (Array.isArray(sources) && sources.length > 0) {
    const sourceText = sources
      .map((s) => {
        const row = s as Record<string, unknown>;
        const type = row.sourceType ?? row.type ?? 'source';
        const id = row.sourceId ?? row.id;
        return id ? `${String(type)} (${String(id)})` : String(type);
      })
      .join('; ');
    lines.push(`Source: ${sourceText}`);
  }

  const expires = formatWhen(grant.expiresAt ?? grant.requestedEndAt);
  if (expires) lines.push(`Expires: ${expires}`);

  if (grant.quota != null && grant.quota !== '') {
    const used = grant.usedQuota ?? grant.usage ?? 0;
    lines.push(`Usage: ${String(used)} / ${String(grant.quota)}`);
  } else if (grant.usedQuota != null) {
    lines.push(`Usage: ${String(grant.usedQuota)}`);
  }

  return lines.length ? lines : ['—'];
}

export function accessOpsSubjectHref(subjectType: string, subjectId: string): string | null {
  const id = encodeURIComponent(subjectId);
  switch (subjectType) {
    case 'ManualAccessTask':
      return `/accessops/activity?filter=needs_action&subjectId=${id}`;
    case 'LifecycleCase':
      return `/accessops/activity?filter=needs_action&caseId=${id}`;
    case 'AccessRequest':
      return `/accessops/activity?filter=requests&requestId=${id}`;
    case 'AccessGrant':
      return `/accessops/people?grantId=${id}`;
    case 'DeadLetterItem':
      return `/accessops/activity?filter=failed&dlqId=${id}`;
    case 'ReconciliationRun':
      return `/accessops/settings/advanced?tab=reconciliation`;
    default:
      return null;
  }
}

export function evidenceFilterHref(subjectType: string, subjectId: string): string {
  const q = new URLSearchParams({ subjectType, subjectId });
  q.set('tab', 'evidence');
  return `/accessops/settings/advanced?${q.toString()}`;
}

export function connectorSupportsHandover(capabilities: {
  capabilities?: string[];
  hasMailboxCapability?: boolean;
  hasDriveCapability?: boolean;
  hasTransferData?: boolean;
} | null): boolean {
  if (!capabilities) return false;
  const caps = capabilities.capabilities ?? [];
  if (
    caps.includes('MAILBOX_HANDOVER') ||
    caps.includes('DRIVE_TRANSFER') ||
    caps.includes('TRANSFER_DATA')
  ) {
    return true;
  }
  return Boolean(
    capabilities.hasMailboxCapability ||
      capabilities.hasDriveCapability ||
      capabilities.hasTransferData
  );
}

export const CONNECTOR_REQUIRED_RECONCILIATION_MESSAGE =
  'Provider reconciliation requires at least one healthy connector.';
