import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrlOrEmpty } from '@/lib/api';

/** First path segment when proxied without /api prefix (e.g. /uploads, /health). */
const ROOT_PATH_PREFIXES = new Set(['uploads', 'health', 'api-docs', 'saml']);

export function resolveBackendUrl(pathSegments: string[], search: string): string {
  const base = getServerApiUrlOrEmpty();
  if (!base) {
    throw new Error('API_URL is not configured');
  }

  const joined = pathSegments.join('/');
  const first = pathSegments[0] ?? '';
  const backendPath = ROOT_PATH_PREFIXES.has(first)
    ? `/${joined}`
    : `/api/${joined}`;

  return `${base}${backendPath}${search}`;
}

const FORWARD_REQUEST_HEADERS = [
  'authorization',
  'cookie',
  'content-type',
  'accept',
  'accept-language',
  'x-xsrf-token',
  'x-current-session-id',
  'x-requested-with',
] as const;

function pickForwardHeaders(request: NextRequest): Headers {
  const out = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) out.set(name, value);
  }
  return out;
}

function applyResponseHeaders(backend: Response, response: NextResponse): void {
  const passThrough = [
    'content-type',
    'cache-control',
    'content-disposition',
    'x-request-id',
  ];
  for (const name of passThrough) {
    const value = backend.headers.get(name);
    if (value) response.headers.set(name, value);
  }

  const setCookies =
    typeof (backend.headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie === 'function'
      ? (backend.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : backend.headers.get('set-cookie')
        ? [backend.headers.get('set-cookie')!]
        : [];

  for (const cookie of setCookies) {
    if (cookie) response.headers.append('set-cookie', cookie);
  }
}

export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const search = request.nextUrl.search;
  let backendUrl: string;

  try {
    backendUrl = resolveBackendUrl(pathSegments, search);
  } catch {
    return NextResponse.json(
      { message: 'API_URL is not configured on the frontend service.' },
      { status: 503 }
    );
  }

  const method = request.method.toUpperCase();
  const headers = pickForwardHeaders(request);

  let body: ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const backendResponse = await fetch(backendUrl, {
    method,
    headers,
    body: body?.byteLength ? body : undefined,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get('content-type') ?? '';
  const isEventStream = contentType.includes('text/event-stream');

  if (isEventStream && backendResponse.body) {
    const response = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
    response.headers.set('content-type', contentType);
    response.headers.set('cache-control', 'no-cache');
    response.headers.set('connection', 'keep-alive');
    applyResponseHeaders(backendResponse, response);
    return response;
  }

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
  applyResponseHeaders(backendResponse, response);
  return response;
}
