import { NextResponse } from 'next/server';
import { resolveAuthApiUrls } from '@/lib/api-docs/resolve-api-urls';

export const revalidate = 300;

async function fetchPartnerSpec(baseUrl: string): Promise<Response> {
  return fetch(`${baseUrl}/api-docs/partner.json`, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  });
}

export async function GET() {
  const candidates = resolveAuthApiUrls();
  let lastStatus = 500;
  let lastError: string | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetchPartnerSpec(baseUrl);

      if (!response.ok) {
        lastStatus = response.status;
        lastError = `Failed to fetch partner OpenAPI spec from ${baseUrl}`;
        continue;
      }

      const spec = await response.json();

      return NextResponse.json(spec, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-OpenAPI-Source': baseUrl,
        },
      });
    } catch (error) {
      lastError =
        error instanceof Error
          ? `Unable to reach ${baseUrl}: ${error.message}`
          : `Unable to reach ${baseUrl}`;
    }
  }

  return NextResponse.json(
    {
      error: lastError ?? 'Unable to load partner OpenAPI spec',
      hint:
        process.env.NODE_ENV === 'development'
          ? 'Start standalone-backend: cd workspace/v2/standalone-backend && npm run dev'
          : 'Set NEXT_PUBLIC_API_URL to your auth API URL',
      tried: candidates,
    },
    { status: lastStatus },
  );
}
