'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUserDirectly, triggerLoginSuccess } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!token || !email) {
      setStatus('error');
      return;
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(
      `${base}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.accessToken && data.user) {
          apiClient.storeAuthToken(data.accessToken);
          setUserDirectly(data.user);
          triggerLoginSuccess();
          setStatus('ok');
          router.push('/dashboard');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [searchParams, router, setUserDirectly, triggerLoginSuccess]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === 'loading' && <p>Signing you in…</p>}
      {status === 'error' && <p>Invalid or expired magic link.</p>}
    </div>
  );
}
