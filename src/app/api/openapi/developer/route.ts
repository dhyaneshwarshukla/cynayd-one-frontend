import { NextResponse } from 'next/server';
import { resolvePlatformApiUrls } from '@/lib/api-docs/resolve-api-urls';

export const revalidate = 300;

async function fetchDeveloperSpec(baseUrl: string): Promise<Response> {
  return fetch(`${baseUrl}/api-docs/developer.json`, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  });
}

export async function GET() {
  const candidates = resolvePlatformApiUrls();
  let lastStatus = 500;
  let lastError: string | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetchDeveloperSpec(baseUrl);

      if (!response.ok) {
        lastStatus = response.status;
        lastError = `Failed to fetch developer OpenAPI spec from ${baseUrl}`;
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
      error: lastError ?? 'Unable to load developer OpenAPI spec',
      hint:
        process.env.NODE_ENV === 'development'
          ? 'Start platform-gateway: cd workspace/v2/platform-gateway && npm run dev'
          : 'Set NEXT_PUBLIC_PLATFORM_API_URL to your platform gateway URL',
      tried: candidates,
    },
    { status: lastStatus },
  );
}
