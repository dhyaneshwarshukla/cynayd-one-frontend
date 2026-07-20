'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/accessops/settings/connections', 'Connections'],
  ['/accessops/settings/approval-rules', 'Approval rules'],
  ['/accessops/settings/access-review', 'Access review'],
  ['/accessops/settings/advanced', 'Advanced'],
];

export default function AccessOpsSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b pb-3" aria-label="AccessOps settings">
        {links.map(([href, label]) => (
          <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`rounded-md px-3 py-2 text-sm ${pathname === href ? 'bg-indigo-100 font-medium text-indigo-800' : 'text-gray-600 hover:bg-gray-50'}`}>{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
