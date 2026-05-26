'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const TAB_MAP: Record<string, string> = {
  general: 'profile',
  security: 'security',
  notifications: 'profile',
  privacy: 'profile',
  preferences: 'preferences',
};

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const from = searchParams.get('tab') || 'security';
    const target = TAB_MAP[from] ?? 'security';
    router.replace(`/settings?tab=${target}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function DashboardSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}
