/**
 * Browser → same-origin BFF proxy. Backend URL stays server-side (API_URL).
 */

export const BFF_PREFIX = '/api/bff';

/** Map a backend path to the Next.js BFF proxy path (same-origin). */
export function toBffPath(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (path.startsWith('/api/')) {
    return `${BFF_PREFIX}${path.slice(4)}`;
  }
  return `${BFF_PREFIX}${path}`;
}

/** Full URL for client-side fetch / EventSource (relative, same origin). */
export function toBffUrl(endpoint: string): string {
  return toBffPath(endpoint);
}
