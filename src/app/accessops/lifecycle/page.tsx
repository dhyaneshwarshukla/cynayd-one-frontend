'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessOpsLifecycleRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams();
    q.set('filter', searchParams.get('focus') === 'failed' ? 'failed' : 'needs_action');
    const caseId = searchParams.get('caseId');
    if (caseId) q.set('caseId', caseId);
    router.replace(`/accessops/activity?${q.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-gray-500">Redirecting to Activity…</p>;
}
