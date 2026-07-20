'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedLayout } from '../../components/layout/UnifiedLayout';
import { AccessOpsPermissionGuard } from '../../components/accessops/PermissionGuard';
import { AccessOpsFlowProvider } from '../../components/accessops/AccessOpsFlowContext';
import { AccessOpsShellActions } from '../../components/accessops/AccessOpsShellActions';
import { AccessOpsFlowHost } from '../../components/accessops/AccessOpsFlowHost';
import { useAccessOpsCapabilities } from '../../lib/accessops/permissions';
import type { AccessOpsPermission } from '../../lib/accessops/permissions';

const nav: Array<{
  href: string;
  label: string;
  feature?: keyof import('../../lib/accessops/client').EffectiveAccessOpsFeatures;
  permission?: AccessOpsPermission;
}> = [
  { href: '/accessops/overview', label: 'Overview', feature: 'read', permission: 'accessops.applications.read' },
  { href: '/accessops/people', label: 'People', feature: 'read', permission: 'accessops.grants.read' },
  {
    href: '/accessops/applications',
    label: 'Applications',
    feature: 'read',
    permission: 'accessops.applications.read',
  },
  { href: '/accessops/activity', label: 'Activity', feature: 'read', permission: 'accessops.grants.read' },
  { href: '/accessops/settings', label: 'Settings', feature: 'read', permission: 'accessops.applications.read' },
];

export default function AccessOpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { features, can, loading } = useAccessOpsCapabilities();

  const visibleNav = nav.filter((item) => {
    if (!features?.enabled) return false;
    if (item.feature && !features[item.feature]) return false;
    if (item.permission && !can(item.permission)) return false;
    return true;
  });

  return (
    <UnifiedLayout title="AccessOps" subtitle="Give and remove application access">
      <AccessOpsPermissionGuard require="read">
        <AccessOpsFlowProvider>
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-56 shrink-0" aria-label="AccessOps sections">
              <nav className="space-y-1" aria-label="AccessOps">
                {!loading &&
                  visibleNav.map((item) => {
                    const active =
                      pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`block rounded-md px-3 py-2 text-sm font-medium ${
                          active
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                {!loading && visibleNav.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No sections available.</p>
                )}
              </nav>
            </aside>

            <main className="flex-1 min-w-0 space-y-4">
              <div className="flex justify-end">
                <AccessOpsShellActions />
              </div>
              {children}
            </main>
          </div>
          <AccessOpsFlowHost />
        </AccessOpsFlowProvider>
      </AccessOpsPermissionGuard>
    </UnifiedLayout>
  );
}
