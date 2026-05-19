import type { App } from '@/lib/api-client';

/**
 * Client-side guard matching backend org-scoped app visibility.
 * Platform system apps: systemApp + no organizationId.
 * Org apps: organizationId matches the current user's org.
 */
export function filterOrgScopedApps(
  apps: App[],
  organizationId: string | null | undefined
): App[] {
  return apps.filter((app) => {
    const isGlobalSystemApp = app.systemApp === true && !app.organizationId;
    if (isGlobalSystemApp) return true;
    if (!organizationId) return false;
    return app.organizationId === organizationId;
  });
}
