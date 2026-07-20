'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api-client';
import { accessOpsClient, EffectiveAccessOpsFeatures } from './client';
import {
  ACCESSOPS_PERMISSIONS,
  AccessOpsPermission,
  hasAccessOpsPermission,
  permissionsFromFeatures,
} from './permissions-core';

export type { AccessOpsPermission };
export {
  ACCESSOPS_PERMISSIONS,
  hasAccessOpsPermission,
  permissionsFromFeatures,
};

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

async function resolveRolePermissions(roleName: string): Promise<Set<AccessOpsPermission>> {
  try {
    const roles = await apiClient.getRoles();
    const match = roles.find(
      (r) => r.name.toUpperCase() === roleName.toUpperCase()
    );
    if (!match?.permissions?.length) return new Set();
    const actions = match.permissions
      .map((p) => p.action)
      .filter((a): a is AccessOpsPermission =>
        ACCESSOPS_PERMISSIONS.includes(a as AccessOpsPermission)
      );
    return new Set(actions);
  } catch {
    return new Set();
  }
}

export function useAccessOpsCapabilities() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<EffectiveAccessOpsFeatures | null>(null);
  const [permissions, setPermissions] = useState<Set<AccessOpsPermission>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const f = await accessOpsClient.getFeatures();
        if (cancelled) return;
        setFeatures(f);

        const role = user?.role?.toUpperCase() || '';
        let perms: Set<AccessOpsPermission>;
        if (ADMIN_ROLES.has(role)) {
          perms = new Set(ACCESSOPS_PERMISSIONS);
        } else {
          const fromRole = await resolveRolePermissions(role);
          perms =
            fromRole.size > 0 ? fromRole : permissionsFromFeatures(f);
        }
        if (!cancelled) setPermissions(perms);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load AccessOps capabilities');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const can = useMemo(
    () => (permission: AccessOpsPermission) => hasAccessOpsPermission(permissions, permission),
    [permissions]
  );

  return { features, permissions, can, error, loading };
}
