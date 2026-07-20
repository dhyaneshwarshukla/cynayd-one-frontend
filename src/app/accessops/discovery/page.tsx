'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessOpsDiscoveryRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams();
    if (searchParams.get('focus') === 'drift') q.set('tab', 'reconciliation');
    router.replace(`/accessops/settings/advanced?${q.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-gray-500">Redirecting to Advanced diagnostics…</p>;
}
