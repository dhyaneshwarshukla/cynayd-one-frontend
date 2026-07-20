'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessOpsTasksRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams();
    q.set('filter', 'needs_action');
    const subjectId = searchParams.get('subjectId');
    const dlqId = searchParams.get('dlqId');
    if (subjectId) q.set('subjectId', subjectId);
    if (dlqId) q.set('dlqId', dlqId);
    router.replace(`/accessops/activity?${q.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-gray-500">Redirecting to Activity…</p>;
}
