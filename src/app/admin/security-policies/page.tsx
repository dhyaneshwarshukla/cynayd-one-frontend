'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** @deprecated Canonical route is /admin/access-policies */
export default function SecurityPoliciesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/access-policies');
  }, [router]);
  return null;
}
