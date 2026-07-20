const PROVISIONING_LABELS: Record<string, string> = {
  CYNAYD_SSO_ONLY: 'Access controlled by Cynayd',
  API: 'Connected',
  SCIM: 'Connected',
  DIRECTORY_GROUP: 'Connected',
  MANUAL: 'Manual',
  HYBRID: 'Connected',
};

const RISK_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
  NOT_CLASSIFIED: 'Not classified',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  APPROVED: 'Active',
  PROVISIONING: 'Waiting',
  PENDING: 'Waiting',
  PENDING_APPROVAL: 'Waiting',
  REQUESTED: 'Waiting',
  SUBMITTED: 'Waiting',
  EXPIRING: 'Waiting',
  REVOCATION_PENDING: 'Waiting',
  REVOKING: 'Waiting',
  FAILED: 'Failed',
  REJECTED: 'Failed',
  REVOKED: 'Removed',
  EXPIRED: 'Removed',
  SUSPENDED: 'Removed',
  CANCELLED: 'Removed',
  COMPLETED: 'Removed',
  FULFILLED: 'Active',
  CONNECTED: 'Connected',
  LIMITED: 'Limited',
  NEEDS_ATTENTION: 'Needs attention',
  DISCONNECTED: 'Disconnected',
  DRAFT: 'Waiting',
  TESTED: 'Waiting',
  INACTIVE: 'Disconnected',
  DEGRADED: 'Needs attention',
  UNKNOWN: 'Needs attention',
};

const CONNECTOR_STATUS_LABELS: Record<string, string> = {
  Connected: 'Connected',
  Limited: 'Limited',
  'Needs attention': 'Needs attention',
  Disconnected: 'Disconnected',
};

export function humanizeProvisioningMode(mode: unknown): string {
  const key = String(mode || 'CYNAYD_SSO_ONLY').toUpperCase();
  return (
    PROVISIONING_LABELS[key] ||
    key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function accessMethodLabel(mode: unknown, hasConnector?: boolean): string {
  const key = String(mode || 'CYNAYD_SSO_ONLY').toUpperCase();
  if (key === 'CYNAYD_SSO_ONLY') return 'Access controlled by Cynayd';
  if (hasConnector || ['API', 'SCIM', 'DIRECTORY_GROUP', 'HYBRID'].includes(key)) {
    return 'Connected';
  }
  return humanizeProvisioningMode(mode);
}

export function humanizeAccessStatus(status: unknown): string {
  const key = String(status || 'ACTIVE').toUpperCase();
  return STATUS_LABELS[key] || key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function humanizeConnectorStatus(
  status: 'Connected' | 'Limited' | 'Needs attention' | 'Disconnected' | string
): string {
  return CONNECTOR_STATUS_LABELS[status] || status;
}

export function humanizeRiskLevel(risk: unknown): string {
  if (risk == null || risk === '') return RISK_LABELS.NOT_CLASSIFIED;
  const key = String(risk).toUpperCase();
  return RISK_LABELS[key] || key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function displayRiskLevel(risk: unknown): string {
  if (risk == null || risk === '') {
    return humanizeRiskLevel('NOT_CLASSIFIED');
  }
  return humanizeRiskLevel(risk);
}
