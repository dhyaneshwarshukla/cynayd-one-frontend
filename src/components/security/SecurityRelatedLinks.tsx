import Link from 'next/link';

export function SecurityRelatedLinks({ current }: { current: 'security' | 'policies' }) {
  const linkClass = (key: string) =>
    key === current
      ? 'rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-800'
      : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-1"
      aria-label="Security navigation"
    >
      <Link href="/security" className={linkClass('security')}>
        Security Center
      </Link>
      <Link href="/admin/access-policies" className={linkClass('policies')}>
        Security policies
      </Link>
      <Link href="/audit" className={linkClass('audit')}>
        Audit logs
      </Link>
      <Link href="/settings" className={linkClass('settings')}>
        Account settings
      </Link>
    </nav>
  );
}
