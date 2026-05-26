export function parseAuditDetails(details: unknown): Record<string, unknown> | null {
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
      return { value: parsed };
    } catch {
      return { message: details };
    }
  }
  return null;
}

export function formatActionLabel(action: string): string {
  return action
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function detailsToSearchText(details: unknown): string {
  const parsed = parseAuditDetails(details);
  if (!parsed) return '';
  return JSON.stringify(parsed).toLowerCase();
}

export function summarizeAuditDetails(
  action: string,
  details: Record<string, unknown> | null
): string {
  if (!details || Object.keys(details).length === 0) {
    return 'No additional details recorded.';
  }

  const parts: string[] = [];
  const appSlug = details.appSlug ?? details.app_slug;
  const email = details.email ?? details.userEmail;
  const userId = details.userId ?? details.user_id;

  if (appSlug) parts.push(`App: ${appSlug}`);
  if (email) parts.push(String(email));
  if (userId) parts.push(`User ${String(userId).slice(0, 8)}…`);
  if (details.organizationId) parts.push('Org scoped');
  if (details.success === true || details.success === 'true') parts.push('Success');
  if (details.success === false || details.success === 'false') parts.push('Failed');

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  const entries = Object.entries(details).slice(0, 2);
  return entries
    .map(([k, v]) => {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${k}: ${val.length > 36 ? `${val.slice(0, 36)}…` : val}`;
    })
    .join(' · ');
}

export function getActionTone(action: string): {
  title: string;
  badge: string;
  icon: string;
} {
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('sso') || a.includes('token') || a.includes('jwt')) {
    return {
      title: 'text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
      icon: '🔐',
    };
  }
  if (a.includes('delete')) {
    return { title: 'text-red-700', badge: 'bg-red-50 text-red-700 ring-red-200', icon: '🗑️' };
  }
  if (a.includes('create') || a.includes('invite')) {
    return { title: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: '➕' };
  }
  if (a.includes('security') || a.includes('mfa')) {
    return { title: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 ring-orange-200', icon: '🛡️' };
  }
  if (a.includes('update')) {
    return { title: 'text-amber-700', badge: 'bg-amber-50 text-amber-800 ring-amber-200', icon: '✏️' };
  }
  return { title: 'text-slate-800', badge: 'bg-slate-100 text-slate-700 ring-slate-200', icon: '📝' };
}
