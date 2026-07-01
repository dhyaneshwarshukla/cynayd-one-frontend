import type { SecurityEvent } from '@/lib/api-client';

export function parseEventDetails(details: unknown): Record<string, unknown> | null {
  if (details == null || details === '') return null;
  if (typeof details === 'object' && !Array.isArray(details)) {
    return details as Record<string, unknown>;
  }
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return { message: String(parsed) };
    } catch {
      return { message: details };
    }
  }
  return null;
}

export function formatEventTypeLabel(eventType: string): string {
  return eventType
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeSeverity(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'info' || s === 'low') return 'low';
  if (s === 'warning' || s === 'medium') return 'medium';
  if (s === 'high' || s === 'error') return 'high';
  if (s === 'critical') return 'critical';
  return s;
}

export function severityBadgeClass(severity: string): string {
  switch (normalizeSeverity(severity)) {
    case 'critical':
      return 'bg-red-100 text-red-800 ring-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-900 ring-orange-200';
    case 'medium':
      return 'bg-amber-100 text-amber-900 ring-amber-200';
    default:
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  }
}

export function summarizeEventDetails(event: SecurityEvent): string {
  const parsed = parseEventDetails(event.details);
  if (!parsed || Object.keys(parsed).length === 0) {
    return typeof event.details === 'string' && event.details.length < 120
      ? event.details
      : 'No additional details';
  }
  const parts: string[] = [];
  if (parsed.email) parts.push(String(parsed.email));
  if (parsed.reason) parts.push(String(parsed.reason));
  if (parsed.appSlug) parts.push(`App: ${parsed.appSlug}`);
  const entries = Object.entries(parsed).slice(0, 2);
  if (parts.length === 0 && entries.length) {
    return entries
      .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
      .join(' · ');
  }
  return parts.join(' · ') || 'View details for more information';
}

export const COMMON_EVENT_TYPES = [
  'login.success',
  'failed_login',
  'login_blocked',
  'login_blocked_policy',
  'login_blocked_geolocation',
  'login_blocked_risk',
  'password_reset_request',
  'password.reset.completed',
  'PASSWORD_CHANGE',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'SUSPICIOUS_ACTIVITY',
  'BRUTE_FORCE_ATTACK',
  'CREDENTIAL_STUFFING',
  'role_change',
  'user.created',
  'user.disabled',
  'user.activated',
  'user.deprovisioned',
  'logout',
  'logout.all_devices',
  'session.revoked',
  'login_challenge_started',
  'login_challenge_approved',
  'login_challenge_rejected',
  'login_challenge_expired',
  'break_glass.provisioned',
  'saml.replay_blocked',
  'saml.sso_login',
  'sso.token_validation_failed',
  'sso.token_validated',
  'sso.token_generated',
  'api_key.generated',
  'access_policy.created',
  'access_policy.updated',
  'access_policy.deleted',
  'ERROR',
];
