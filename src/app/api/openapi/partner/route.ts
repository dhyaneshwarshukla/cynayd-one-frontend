import { NextResponse } from 'next/server';

export const revalidate = 300;

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api-docs/partner.json`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch partner OpenAPI spec',
          status: response.status,
        },
        { status: response.status },
      );
    }

    const spec = await response.json();

    return NextResponse.json(spec, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load partner OpenAPI spec' },
      { status: 500 },
    );
  }
}
