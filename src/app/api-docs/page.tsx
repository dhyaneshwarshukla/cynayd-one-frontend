'use client';

import { Suspense } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { DocsShell } from '@/components/api-docs/DocsShell';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function ApiDocsContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <DocsShell />
    </Suspense>
  );
}

export default function ApiDocsPage() {
  return (
    <UnifiedLayout variant="landing">
      <ApiDocsContent />
    </UnifiedLayout>
  );
}
