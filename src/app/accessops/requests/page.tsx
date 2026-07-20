'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Legacy Access Requests → Activity (requests filter). */
export default function AccessOpsRequestsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams();
    q.set('filter', 'requests');
    const requestId = searchParams.get('requestId');
    const tab = searchParams.get('tab');
    if (requestId) q.set('requestId', requestId);
    if (tab === 'pending') q.set('filter', 'needs_action');
    router.replace(`/accessops/activity?${q.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-gray-500">Redirecting to Activity…</p>;
}
