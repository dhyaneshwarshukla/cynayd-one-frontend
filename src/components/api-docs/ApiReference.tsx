'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const OPENAPI_URL = '/api/openapi/partner';

type LoadState = 'loading' | 'ready' | 'error';

export function ApiReference() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const checkSpec = useCallback(async () => {
    setLoadState('loading');
    setErrorMessage(null);

    try {
      const response = await fetch(OPENAPI_URL, { cache: 'no-store' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail =
          body && typeof body.error === 'string' ? body.error : `HTTP ${response.status}`;
        setErrorMessage(detail);
        setLoadState('error');
        return;
      }
      setLoadState('ready');
    } catch {
      setErrorMessage('Unable to reach the OpenAPI spec endpoint.');
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    void checkSpec();
  }, [checkSpec, retryKey]);

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading API reference…</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-red-900">Could not load API reference</h3>
        <p className="mt-2 max-w-md text-sm text-red-800">
          {errorMessage ?? 'The Partner OpenAPI spec is unavailable.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => setRetryKey((key) => key + 1)}>
            Retry
          </Button>
          <Link href="/contact">
            <Button type="button" variant="outline">
              Contact support
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="api-docs-scalar overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm min-h-[80vh]">
      <ApiReferenceReact
        key={retryKey}
        configuration={{
          url: OPENAPI_URL,
          theme: 'alternate',
          layout: 'modern',
          hideClientButton: true,
          hideModels: false,
          defaultHttpClient: {
            targetKey: 'shell',
            clientKey: 'curl',
          },
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
          },
        }}
      />
    </div>
  );
}
