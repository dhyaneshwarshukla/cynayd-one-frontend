/** Role helpers — tenant data scope is enforced by the API; these are for UI gating only. */

export function normalizeRole(role?: string | null): string {
  return (role ?? '').trim().toUpperCase();
}

export function isSuperAdmin(role?: string | null): boolean {
  return normalizeRole(role) === 'SUPER_ADMIN';
}

export function isOrgAdmin(role?: string | null): boolean {
  return normalizeRole(role) === 'ADMIN';
}

/** Platform or organization administrator (can access admin screens). */
export function isAdminUser(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}
