import type { EffectiveAccessOpsFeatures } from './client';

/** RolePermission actions seeded for AccessOps (see standalone-backend/prisma/seed.ts). */
export const ACCESSOPS_PERMISSIONS = [
  'accessops.applications.read',
  'accessops.applications.manage',
  'accessops.grants.read',
  'accessops.grants.request',
  'accessops.grants.approve',
  'accessops.grants.revoke',
  'accessops.lifecycle.read',
  'accessops.lifecycle.initiate',
  'accessops.lifecycle.execute',
  'accessops.lifecycle.verify',
  'accessops.reviews.create',
  'accessops.reviews.decide',
  'accessops.connectors.manage',
  'accessops.evidence.read',
  'accessops.reports.export',
  'accessops.exceptions.approve',
] as const;

export type AccessOpsPermission = (typeof ACCESSOPS_PERMISSIONS)[number];

/** Minimum permissions implied by org feature flags when role permissions are unavailable. */
const FEATURE_PERMISSIONS: Partial<
  Record<keyof Omit<EffectiveAccessOpsFeatures, 'mode' | 'enabled'>, AccessOpsPermission[]>
> = {
  read: [
    'accessops.grants.read',
    'accessops.applications.read',
    'accessops.lifecycle.read',
    'accessops.evidence.read',
  ],
  grants: ['accessops.grants.request'],
  requests: ['accessops.grants.request', 'accessops.grants.approve'],
  lifecycle: [
    'accessops.lifecycle.read',
    'accessops.lifecycle.initiate',
    'accessops.lifecycle.execute',
    'accessops.lifecycle.verify',
  ],
  connectors: ['accessops.connectors.manage'],
  revocation: ['accessops.grants.revoke'],
  verification: ['accessops.connectors.manage'],
  evidence: ['accessops.evidence.read', 'accessops.reports.export'],
};

export function permissionsFromFeatures(
  features: EffectiveAccessOpsFeatures
): Set<AccessOpsPermission> {
  const out = new Set<AccessOpsPermission>();
  if (!features.enabled) return out;
  (Object.keys(FEATURE_PERMISSIONS) as Array<keyof typeof FEATURE_PERMISSIONS>).forEach(
    (key) => {
      if (features[key]) {
        for (const perm of FEATURE_PERMISSIONS[key] || []) {
          out.add(perm);
        }
      }
    }
  );
  return out;
}

export function hasAccessOpsPermission(
  permissions: Set<string> | string[] | undefined,
  permission: AccessOpsPermission
): boolean {
  if (!permissions) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(permission);
}
