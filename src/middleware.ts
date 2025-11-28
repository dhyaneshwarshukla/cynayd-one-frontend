import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    // Skip middleware for WebSocket upgrade requests
    if (request.headers.get('upgrade') === 'websocket') {
      return NextResponse.next();
    }

    const { pathname, searchParams } = request.nextUrl;
    
    // Handle direct SSO token access (e.g., /undefined/connect?sso_token=...)
    if (pathname.includes('/undefined/connect') && searchParams.has('sso_token')) {
      const ssoToken = searchParams.get('sso_token');
      
      if (ssoToken) {
        // Redirect to the generic connect page that will handle the SSO token
        const redirectUrl = new URL('/connect', request.url);
        redirectUrl.searchParams.set('sso_token', ssoToken);
        
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Handle any malformed connect URLs
    if (pathname.includes('/connect') && searchParams.has('sso_token')) {
      const ssoToken = searchParams.get('sso_token');
      const appSlug = pathname.split('/')[1];
      
      // If the app slug is undefined or malformed, redirect to generic connect
      if (appSlug === 'undefined' || !appSlug || appSlug === 'connect') {
        const redirectUrl = new URL('/connect', request.url);
        redirectUrl.searchParams.set('sso_token', ssoToken!);
        
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // If there's an error, just continue with the request
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - WebSocket connections
     */
    '/((?!api|_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)',
  ],
};
