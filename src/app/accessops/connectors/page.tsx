'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessOpsConnectorsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accessops/settings/connections');
  }, [router]);
  return <p className="text-sm text-gray-500">Redirecting to Connections…</p>;
}
