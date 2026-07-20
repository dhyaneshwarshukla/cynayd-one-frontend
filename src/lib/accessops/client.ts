import apiClient from '../api-client';
import { PlatformClient } from '@cynayd/typescript-client';

export type AccessOpsMode = 'DISABLED' | 'READ_ONLY' | 'REVOCATION_ONLY' | 'ACTIVE';

export interface EffectiveAccessOpsFeatures {
  enabled: boolean;
  mode: AccessOpsMode;
  grants: boolean;
  requests: boolean;
  lifecycle: boolean;
  connectors: boolean;
  revocation: boolean;
  verification: boolean;
  evidence: boolean;
  read: boolean;
}

export interface OrgInventoryMetrics {
  users: number;
  totalApps: number;
  billableApps: number;
  planLimit?: number | null;
  overLimit?: boolean;
}

export interface AccessOpsOverview {
  activeGovernedRuntimeGrants: number;
  activeRuntimeAssignments: number;
  runtimeWithoutGrant: number;
  grantWithoutRuntime: number;
  projectionMismatch: number;
  expiredButRuntimeActive: number;
  revokedButRuntimeActive: number;
  quotaMismatch: number;
  expiryMismatch: number;
  unmanagedExternalEntitlements: number;
  pendingProvisioning: number;
  failedProvisioning: number;
  pendingApprovals: number;
  leaversInProgress: number;
  failedActions: number;
  overdueManualTasks: number;
  connectors: Array<{ id: string; provider: string; health: string; state: string }>;
  productPromise: string;
  inventory?: OrgInventoryMetrics;
  /** @deprecated use activeGovernedRuntimeGrants */
  activeGrants?: number;
}

export interface AccessOpsOverviewSummary {
  usersWithAccess: number;
  applications: number;
  pendingRequests: number;
  accessExpiringSoon: number;
  failedRemovals: number;
  connectorStatus: string;
  connectorStatusLabel?: string;
}

export interface AccessOpsPerson {
  id: string;
  name: string;
  email?: string;
  applications: number;
  expiring: number;
  status: string;
  unmanagedCount?: number;
}

export interface AccessOpsPeoplePage {
  items: AccessOpsPerson[];
  nextCursor?: string | null;
}

export interface AccessOpsGrantItem {
  id?: string;
  applicationId: string;
  applicationName?: string;
  entitlementId?: string;
  entitlementName?: string;
  status?: string;
  expiresAt?: string | null;
  [key: string]: unknown;
}

export interface EmployeeAccessSnapshot {
  userId: string;
  person?: AccessOpsPerson;
  grants: AccessOpsGrantItem[];
  governed?: AccessOpsGrantItem[];
  ungovernedRuntime?: AccessOpsGrantItem[];
  unmanagedRuntime?: AccessOpsGrantItem[];
  expiredRevoked?: AccessOpsGrantItem[];
  pendingRequests?: Record<string, unknown>[];
  manualPending?: Record<string, unknown>[];
  history?: Record<string, unknown>[];
}

export interface ApplicationUser {
  id: string;
  name: string;
  email?: string;
  status?: string;
  expiresAt?: string | null;
}

export interface ApplicationUsersPage {
  items: ApplicationUser[];
  nextCursor?: string | null;
}

export interface AccessOpsActivityItem {
  id: string;
  type: string;
  title: string;
  detail?: string;
  status?: string;
  createdAt?: string;
  subjectId?: string;
  actions?: string[];
  metadata?: Record<string, unknown>;
}

export interface AccessOpsActivityPage {
  items: AccessOpsActivityItem[];
  nextCursor?: string | null;
}

export interface BatchOutcomeItem {
  userId: string;
  applicationId?: string;
  outcome: 'granted' | 'approvalRequested' | 'alreadyHadAccess' | 'failed' | string;
  message?: string;
  requestId?: string;
  grantId?: string;
}

export interface BatchOutcome {
  async?: boolean;
  status?: string;
  batchId?: string;
  parentOperationId?: string;
  granted: number;
  approvalRequested: number;
  alreadyHadAccess: number;
  failed: number;
  revoked?: number;
  scheduled?: number;
  items: BatchOutcomeItem[];
  counts?: Partial<Record<string, number>>;
  totalItems?: number;
  message?: string;
}

export interface AsyncAccepted {
  async?: boolean;
  status?: string;
  batchId: string;
  activityRef?: string;
  parentOperationId?: string;
  totalItems?: number;
  message?: string;
}

export interface BatchGiveAccessBody {
  peopleIds?: string[];
  userIds?: string[];
  applicationIds: string[];
  expiresAt?: string | null;
  quota?: number | null;
  businessJustification?: string;
  requireApproval?: boolean;
}

export interface BatchRemoveAccessBody {
  peopleIds?: string[];
  userIds?: string[];
  applicationIds: string[];
  removeAt?: 'now' | string;
  effectiveAt?: string | null;
  reason?: string;
}

export interface RemoveAllBody {
  userId?: string;
  userIds?: string[];
  snapshotId?: string;
  effectiveAt?: string | null;
  reason?: string;
  previewToken?: string;
}

export interface RemoveAllPreview {
  snapshotId: string;
  organizationId?: string;
  actorId?: string;
  grantIds?: string[];
  hash?: string;
  createdAt?: string;
  expiresAt?: string;
  consumedAt?: string | null;
  affectedUsers?: number;
  accessItems?: number;
  unmanagedItems?: number;
  previewToken?: string;
  items?: Array<Record<string, unknown>>;
}

export interface ConnectorCapabilitiesSummary {
  hasHealthyConnector: boolean;
  healthyConnectorCount: number;
  capabilities: string[];
  hasMailboxCapability: boolean;
  hasDriveCapability: boolean;
  hasTransferData: boolean;
}

export interface AccessOpsConnector {
  id: string;
  provider: string;
  name: string;
  tenantConfig?: string | Record<string, unknown>;
  scopes?: string | string[];
  capabilityStatus?: string | Record<string, unknown>;
  capabilityProfileId?: string;
  health: string;
  state: string;
  lastHealthAt?: string;
  authorizationMode?: string;
  externalTenantId?: string | null;
  primaryDomain?: string | null;
  marketplaceInstallStatus?: string | null;
  domainWideDelegationStatus?: string | null;
  delegatedAdminEmail?: string | null;
  consentStatus?: string | null;
  semanticStatus?: 'Connected' | 'Limited' | 'Needs attention' | 'Disconnected' | string;
  statusSummary?: string;
  optionalNotes?: string[];
  connectionLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccessOpsDeadLetter {
  id: string;
  reasonCategory: string;
  resolutionStatus: string;
  originalOperation?: string;
  caseImpact?: string;
  lifecycleCaseId?: string;
  retryEligible?: boolean;
  createdAt?: string;
}

export interface LifecycleActionSummary {
  id: string;
  actionType: string;
  status: string;
  verificationStatus?: string;
}

export interface LifecycleCaseSummary {
  id: string;
  lifecycleType: string;
  status: string;
  freezeStage?: string;
  userId: string;
  executionGeneration?: number;
  effectiveAt?: string;
  actions?: LifecycleActionSummary[];
  handover?: Record<string, unknown>;
}

function newIdempotencyKey(prefix?: string): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return prefix ? `${prefix}-${id}` : id;
}

function readGatewayIdentity(): { organizationId: string; accessToken?: string } {
  if (typeof window === 'undefined') return { organizationId: 'server' };
  const accessToken = window.localStorage.getItem('auth_token') || undefined;
  let organizationId = window.localStorage.getItem('organization_id') || '';
  if (!organizationId && accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1])) as {
        organizationId?: string;
        orgId?: string;
      };
      organizationId = payload.organizationId || payload.orgId || '';
    } catch {
      // Gateway remains authoritative and will reject an invalid token/context.
    }
  }
  return { organizationId: organizationId || 'unknown', accessToken };
}

function gatewayClient(): PlatformClient {
  const identity = readGatewayIdentity();
  return new PlatformClient({
    gatewayBaseUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || window.location.origin,
    ...identity,
  });
}

function parseAccessOpsError(err: unknown): Error {
  if (err instanceof Error) {
    const data = (err as Error & { response?: { data?: { error?: string; code?: string } } })
      .response?.data;

    if (data?.code === 'STEP_UP_REQUIRED') {
      const stepUpErr = new Error(data.error || 'Step-up authentication required') as Error & {
        code: string;
      };
      stepUpErr.code = 'STEP_UP_REQUIRED';
      return stepUpErr;
    }

    const codeMessages: Record<string, string> = {
      FEATURE_DISABLED: 'This AccessOps feature is not enabled for your organization.',
      ORG_FEATURE_DISABLED: 'AccessOps is not enabled for your organization.',
      PERMISSION_DENIED: 'You do not have permission to perform this action.',
      SERVICE_UNAVAILABLE: 'AccessOps is temporarily unavailable. Try again later.',
      CONFIGURATION_REQUIRED: 'Additional configuration is required before this action can run.',
      REVIEWS_DISABLED: 'Access reviews are not enabled.',
    };

    if (data?.code && codeMessages[data.code]) {
      return new Error(codeMessages[data.code]);
    }
    if (data?.error) {
      return new Error(data.error);
    }

    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
      return new Error('Network error — check your connection and try again.');
    }

    return err;
  }
  return new Error('AccessOps request failed');
}

async function accessOpsGet<T>(path: string): Promise<T> {
  try {
    return await apiClient.accessOpsRequest<T>(path);
  } catch (err) {
    throw parseAccessOpsError(err);
  }
}

function withQuery(path: string, params?: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `${path}?${value}` : path;
}

async function accessOpsMutate<T>(
  path: string,
  body?: unknown,
  opts?: { method?: string; idempotencyKey?: string; stepUp?: boolean }
): Promise<T> {
  const method = opts?.method ?? 'POST';
  const idempotencyKey = opts?.idempotencyKey ?? newIdempotencyKey('accessops');
  try {
    if (opts?.stepUp) {
      return await apiClient.accessOpsRequestWithStepUp<T>(path, {
        method,
        body,
        idempotencyKey,
      });
    }
    return await apiClient.accessOpsRequest<T>(path, {
      method,
      body,
      idempotencyKey,
    });
  } catch (err) {
    throw parseAccessOpsError(err);
  }
}

export const accessOpsClient = {
  marketplace: {
    list: () => gatewayClient().listMarketplaceApps(),
    install: (marketplaceAppId: string) =>
      gatewayClient().installMarketplaceApp({ marketplaceAppId }),
  },
  provisioning: {
    list: () => gatewayClient().listProvisioningQueue(),
  },
  roles: {
    create: (body: {
      name: string;
      description?: string;
      permissions: Array<Record<string, string>>;
    }) => gatewayClient().createAccessRole(body),
    publish: (
      roleId: string,
      body: {
        permissions: Array<Record<string, string>>;
        changeSummary?: string;
      }
    ) => gatewayClient().publishAccessRoleVersion(roleId, body),
  },
  getFeatures: () => accessOpsGet<EffectiveAccessOpsFeatures>('/features'),
  getOverview: () => accessOpsGet<AccessOpsOverview>('/overview'),
  getOverviewSummary: () => accessOpsGet<AccessOpsOverviewSummary>('/overview/summary'),

  listPeople: (params?: { search?: string; cursor?: string; limit?: number }) =>
    accessOpsGet<AccessOpsPeoplePage>(withQuery('/people', params)),

  getEmployeeAccess: (userId: string) =>
    accessOpsGet<EmployeeAccessSnapshot>(
      `/people/${encodeURIComponent(userId)}/access`
    ),

  listApplications: () => accessOpsGet<Record<string, unknown>[]>('/applications'),
  listApplicationUsers: (
    appId: string,
    params?: { search?: string; cursor?: string; limit?: number }
  ) =>
    accessOpsGet<ApplicationUsersPage>(
      withQuery(`/applications/${encodeURIComponent(appId)}/users`, params)
    ),
  listActivity: (params?: { filter?: string; cursor?: string; limit?: number }) =>
    accessOpsGet<AccessOpsActivityPage>(withQuery('/activity', params)),
  listAccessRequests: () => accessOpsGet<Record<string, unknown>[]>('/access-requests'),

  createAccessRequest: (body: Record<string, unknown>) =>
    accessOpsMutate('/access-requests', body),

  decideAccessRequest: (id: string, body: Record<string, unknown>) =>
    accessOpsMutate(`/access-requests/${encodeURIComponent(id)}/decide`, body),

  grantAccess: (body: Record<string, unknown>) =>
    accessOpsMutate('/access-grants', body),

  revokeAccess: (body: Record<string, unknown>) =>
    accessOpsMutate('/access-grants/revoke', body, { stepUp: true }),

  batchGiveAccess: (body: BatchGiveAccessBody) =>
    accessOpsMutate<BatchOutcome | AsyncAccepted>('/access-batches/give', {
      ...body,
      peopleIds: body.peopleIds || body.userIds || [],
    }),

  batchRemoveAccess: (body: BatchRemoveAccessBody) =>
    accessOpsMutate<BatchOutcome | AsyncAccepted>(
      '/access-batches/remove',
      {
        ...body,
        peopleIds: body.peopleIds || body.userIds || [],
        removeAt: body.removeAt || body.effectiveAt || 'now',
      },
      { stepUp: true }
    ),

  previewRemoveAll: (body: RemoveAllBody) =>
    accessOpsMutate<RemoveAllPreview>('/access-batches/remove-all/preview', {
      userId: body.userId || body.userIds?.[0],
    }),

  confirmRemoveAll: (body: RemoveAllBody) =>
    accessOpsMutate<BatchOutcome | AsyncAccepted>(
      '/access-batches/remove-all/confirm',
      {
        snapshotId: body.snapshotId || body.previewToken,
        reason: body.reason,
      },
      { stepUp: true }
    ),

  listLifecycleCases: () => accessOpsGet<LifecycleCaseSummary[]>('/lifecycle-cases'),
  getLifecycleCase: (id: string) =>
    accessOpsGet<LifecycleCaseSummary>(`/lifecycle-cases/${encodeURIComponent(id)}`),

  createLeaver: (body: Record<string, unknown>) =>
    accessOpsMutate('/lifecycle-cases/leaver', body),

  createHandover: (body: Record<string, unknown>) =>
    accessOpsMutate('/lifecycle-cases/handover', body),

  executeLifecycle: (id: string, body?: Record<string, unknown>) =>
    accessOpsMutate(`/lifecycle-cases/${encodeURIComponent(id)}/execute`, body ?? {}, {
      stepUp: true,
    }),

  listManualTasks: () => accessOpsGet<Record<string, unknown>[]>('/manual-tasks'),
  verifyManualTask: (id: string) =>
    accessOpsMutate(`/manual-tasks/${encodeURIComponent(id)}/verify`, {}),

  listEvidence: (params?: { subjectType?: string; subjectId?: string }) => {
    const q = new URLSearchParams();
    if (params?.subjectType) q.set('subjectType', params.subjectType);
    if (params?.subjectId) q.set('subjectId', params.subjectId);
    const qs = q.toString();
    return accessOpsGet<Record<string, unknown>[]>(`/evidence${qs ? `?${qs}` : ''}`);
  },

  uploadEvidence: (body: {
    subjectType: string;
    subjectId: string;
    filename: string;
    contentType: string;
    contentBase64: string;
  }) => accessOpsMutate('/evidence/upload', body),

  listConnectors: () => accessOpsGet<AccessOpsConnector[]>('/connectors'),

  beginMicrosoftAuthorize: () =>
    accessOpsMutate<{ authorizationUrl: string; sessionId: string }>(
      '/connectors/microsoft/authorize',
      {},
      { stepUp: true }
    ),

  beginGoogleAuthorize: () =>
    accessOpsMutate<{ authorizationUrl: string; sessionId: string }>(
      '/connectors/google/authorize',
      {},
      { stepUp: true }
    ),

  disconnectConnector: (id: string) =>
    accessOpsMutate<{
      connectorId: string;
      impact: {
        grantsPreserved: boolean;
        externalOperationsStopped: boolean;
        providerAccessMayRemain: boolean;
        historyPreserved: boolean;
      };
    }>(`/connectors/${encodeURIComponent(id)}/disconnect`, {}, { stepUp: true }),

  getDisconnectImpact: (id: string) =>
    accessOpsGet<{ message: string; effects: string[] }>(
      `/connectors/${encodeURIComponent(id)}/disconnect-impact`
    ),

  inspectConnectorConsent: (id: string) =>
    accessOpsGet<Record<string, unknown>>(
      `/connectors/${encodeURIComponent(id)}/consent`
    ),

  updateGoogleConnectionStates: (
    id: string,
    body: Record<string, unknown>
  ) =>
    accessOpsMutate(`/connectors/google/${encodeURIComponent(id)}/states`, body, {
      stepUp: true,
    }),

  requestOwnershipTransfer: (body: {
    provider: 'MICROSOFT' | 'GOOGLE';
    externalTenantKey: string;
    toOrganizationId: string;
    fromOrganizationId?: string;
    supportTicketId: string;
    evidenceNote: string;
  }) =>
    accessOpsMutate('/connectors/ownership-transfer', body, { stepUp: true }),

  createConnector: (body: {
    provider: string;
    name: string;
    tenantConfig: Record<string, unknown>;
    scopes?: string[];
    clientSecret?: string;
    refreshToken?: string;
  }) => accessOpsMutate('/connectors', body, { stepUp: true }),

  testConnector: (id: string) =>
    accessOpsMutate(`/connectors/${encodeURIComponent(id)}/test`, {}),

  getConnectorCapabilities: () =>
    accessOpsGet<ConnectorCapabilitiesSummary>('/connectors/capabilities'),

  listDeadLetters: () => accessOpsGet<AccessOpsDeadLetter[]>('/dead-letters'),

  requeueDeadLetter: (id: string, note?: string) =>
    accessOpsMutate(`/dead-letters/${encodeURIComponent(id)}/requeue`, { note }),

  skipDeadLetter: (id: string, body: { note: string; caseImpact?: string }) =>
    accessOpsMutate(`/dead-letters/${encodeURIComponent(id)}/skip`, body, { stepUp: true }),

  runReconciliation: () => accessOpsGet<Record<string, unknown>>('/reconciliation/run'),

  dispatchOutbox: () => accessOpsMutate('/outbox/dispatch', {}),

  createJoiner: (body: Record<string, unknown>) =>
    accessOpsMutate('/lifecycle/joiner', body),

  createMover: (body: Record<string, unknown>) =>
    accessOpsMutate('/lifecycle/mover', body),

  listReviewCampaigns: () =>
    accessOpsGet<Record<string, unknown>[]>('/reviews/campaigns'),

  createReviewCampaign: (body: Record<string, unknown>) =>
    accessOpsMutate('/reviews/campaigns', body),

  startReviewCampaign: (id: string) =>
    accessOpsMutate(`/reviews/campaigns/${encodeURIComponent(id)}/start`, {}),

  decideReviewItem: (id: string, body: Record<string, unknown>) =>
    accessOpsMutate(`/reviews/items/${encodeURIComponent(id)}/decide`, body, {
      stepUp: true,
    }),

  completeReviewCampaign: (id: string) =>
    accessOpsMutate(`/reviews/campaigns/${encodeURIComponent(id)}/complete`, {}, {
      stepUp: true,
    }),

  runDiscoveryScan: () => accessOpsMutate('/discovery/scan', {}),

  getDiscoveryDashboard: () =>
    accessOpsGet<Record<string, unknown>>('/discovery/dashboard'),
};

export { newIdempotencyKey, parseAccessOpsError };
