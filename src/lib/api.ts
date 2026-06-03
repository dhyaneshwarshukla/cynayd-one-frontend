/**
 * Server-only API access. Uses API_URL from runtime env (Cloud Run, never baked at build).
 * Do not import this module from Client Components.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function getServerApiUrl(): string {
  const url = process.env.API_URL?.trim();
  if (!url) {
    throw new Error(
      'API_URL is not configured. Set API_URL on Cloud Run (e.g. https://auth.cynayd.cloud).'
    );
  }
  return trimTrailingSlash(url);
}

/** Optional server API URL — returns empty string when unset (e.g. local without API_URL). */
export function getServerApiUrlOrEmpty(): string {
  const url = process.env.API_URL?.trim();
  return url ? trimTrailingSlash(url) : '';
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = getServerApiUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${base}${normalized}`, {
    ...options,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `API request failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as Promise<T>;
}
