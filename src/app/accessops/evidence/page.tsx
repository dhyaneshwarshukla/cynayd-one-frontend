'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessOpsEvidenceRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams();
    q.set('tab', 'evidence');
    const subjectType = searchParams.get('subjectType');
    const subjectId = searchParams.get('subjectId');
    if (subjectType) q.set('subjectType', subjectType);
    if (subjectId) q.set('subjectId', subjectId);
    router.replace(`/accessops/settings/advanced?${q.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-gray-500">Redirecting to Advanced diagnostics…</p>;
}
