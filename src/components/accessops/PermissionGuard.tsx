'use client';

import React from 'react';
import {
  accessOpsClient,
  EffectiveAccessOpsFeatures,
} from '../../lib/accessops/client';
import {
  AccessOpsPermission,
  useAccessOpsCapabilities,
} from '../../lib/accessops/permissions';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function useAccessOpsFeatures() {
  const { features, error, loading } = useAccessOpsCapabilities();
  return { features, error, loading };
}

export const AccessOpsPermissionGuard: React.FC<{
  require?: keyof EffectiveAccessOpsFeatures;
  permission?: AccessOpsPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ require = 'read', permission, children, fallback }) => {
  const { features, can, error, loading } = useAccessOpsCapabilities();

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-gray-500" role="status">
        <LoadingSpinner size="sm" />
        Loading AccessOps…
      </div>
    );
  }

  const featureOk = features?.enabled && (!require || features[require]);
  const permissionOk = !permission || can(permission);

  if (error || !featureOk || !permissionOk) {
    return (
      <>
        {fallback || (
          <div className="p-6" role="alert">
            <h2 className="text-lg font-semibold text-gray-900">AccessOps unavailable</h2>
            <p className="mt-2 text-sm text-gray-600">
              {error ||
                (permission && !permissionOk
                  ? `You do not have permission (${permission}) for this action.`
                  : `Feature "${String(require)}" is not enabled for this organisation (mode: ${
                      features?.mode || 'DISABLED'
                    }).`)}
            </p>
          </div>
        )}
      </>
    );
  }
  return <>{children}</>;
};

export const AccessOpsActionGuard: React.FC<{
  permission: AccessOpsPermission;
  feature?: keyof EffectiveAccessOpsFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, feature, children, fallback = null }) => {
  const { features, can, loading } = useAccessOpsCapabilities();
  if (loading) return null;
  if (feature && features && !features[feature]) return <>{fallback}</>;
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
};

/** Nav visibility helper — any enabled AccessOps read access. */
export function useAccessOpsNavVisible() {
  const { features, loading } = useAccessOpsCapabilities();
  return { visible: !!features?.enabled && !!features.read, loading };
}

// Re-export client for pages that only need feature flags without capabilities
export { accessOpsClient };
