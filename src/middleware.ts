import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/users',
  '/security',
  '/audit',
  '/admin',
  '/settings',
  '/organizations',
  '/roles',
];

const ADMIN_PREFIXES = ['/admin', '/users', '/security', '/audit'];

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/auth',
  '/connect',
  '/app-sso',
  '/products',
  '/contact',
  '/pricing',
  '/forgot-password',
  '/reset-password',
  '/403',
];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('accessToken') || request.cookies.has('refreshToken')
  );
}

async function fetchUserRole(request: NextRequest): Promise<string | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://auth.one.cynayd.com'
      : 'http://localhost:4000');

  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  try {
    const res = await fetch(`${apiUrl}/api/users/me`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { role?: string };
    return user.role?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  try {
    if (request.headers.get('upgrade') === 'websocket') {
      return NextResponse.next();
    }

    const { pathname, searchParams } = request.nextUrl;

    // Legacy SSO URL normalization (supports code and sso_token)
    const legacyToken = searchParams.get('sso_token');
    const exchangeCode = searchParams.get('code');

    if (pathname.includes('/undefined/connect') && (legacyToken || exchangeCode)) {
      const redirectUrl = new URL('/connect', request.url);
      if (exchangeCode) redirectUrl.searchParams.set('code', exchangeCode);
      if (legacyToken) redirectUrl.searchParams.set('sso_token', legacyToken);
      if (searchParams.get('app_slug')) {
        redirectUrl.searchParams.set('app_slug', searchParams.get('app_slug')!);
      }
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.includes('/connect') && (legacyToken || exchangeCode)) {
      const appSlug = pathname.split('/')[1];
      if (appSlug === 'undefined' || !appSlug || appSlug === 'connect') {
        const redirectUrl = new URL('/connect', request.url);
        if (exchangeCode) redirectUrl.searchParams.set('code', exchangeCode);
        if (legacyToken) redirectUrl.searchParams.set('sso_token', legacyToken);
        if (searchParams.get('app_slug')) {
          redirectUrl.searchParams.set('app_slug', searchParams.get('app_slug')!);
        }
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (!isProtectedPath(pathname) || isPublicPath(pathname)) {
      return NextResponse.next();
    }

    if (!hasSessionCookie(request)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminPath(pathname)) {
      const role = await fetchUserRole(request);
      if (!role || !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/security/:path*',
    '/audit/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/organizations/:path*',
    '/roles/:path*',
    '/connect/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)',
  ],
};
