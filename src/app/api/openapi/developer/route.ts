import { NextResponse } from 'next/server';

export const revalidate = 300;

const PRODUCTION_PLATFORM_API_URL = 'https://api.one.cynayd.com';
const LOCAL_PLATFORM_API_URL = 'http://localhost:4100';

function resolvePlatformApiUrls(): string[] {
  const configured = process.env.NEXT_PUBLIC_PLATFORM_API_URL?.trim();
  const urls: string[] = [];

  if (configured) {
    urls.push(configured.replace(/\/$/, ''));
  }

  if (process.env.NODE_ENV === 'development') {
    if (!urls.includes(LOCAL_PLATFORM_API_URL)) {
      urls.push(LOCAL_PLATFORM_API_URL);
    }
  }

  if (!urls.includes(PRODUCTION_PLATFORM_API_URL)) {
    urls.push(PRODUCTION_PLATFORM_API_URL);
  }

  return urls;
}

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
