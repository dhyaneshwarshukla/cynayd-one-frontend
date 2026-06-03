import { NextResponse } from 'next/server';
import { getServerApiUrlOrEmpty } from '@/lib/api';

/**
 * SAML IdP metadata must reference the public auth service origin (not the BFF path).
 * Server-only — reads API_URL at runtime.
 */
export async function GET() {
  const origin = getServerApiUrlOrEmpty();
  if (!origin) {
    return NextResponse.json(
      { message: 'API_URL is not configured.' },
      { status: 503 }
    );
  }
  return NextResponse.json({ origin });
}
