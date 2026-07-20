'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessOpsReviewsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accessops/activity?filter=needs_action');
  }, [router]);
  return <p className="text-sm text-gray-500">Redirecting to Activity…</p>;
}
