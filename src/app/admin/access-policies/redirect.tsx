'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessPoliciesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/security-policies');
  }, [router]);
  return null;
}
