export type RuntimePublicConfig = {
  apiUrl: string;
  siteUrl: string;
};

declare global {
  interface Window {
    __CYNAYD_CONFIG__?: RuntimePublicConfig;
  }
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function fromInjectedConfig(): RuntimePublicConfig | null {
  if (typeof window === 'undefined') return null;
  return window.__CYNAYD_CONFIG__ ?? null;
}

/**
 * Backend API origin (no trailing slash).
 * Client: prefers window.__CYNAYD_CONFIG__ injected by root layout (Cloud Run runtime env).
 * Server / build: uses NEXT_PUBLIC_API_URL or API_URL.
 */
export function getPublicApiUrl(): string {
  const injected = fromInjectedConfig();
  if (injected?.apiUrl) {
    return trimTrailingSlash(injected.apiUrl);
  }

  const url =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.API_URL?.trim() ||
    '';
  return url ? trimTrailingSlash(url) : '';
}

/**
 * Frontend site origin (no trailing slash).
 * Client: prefers window.__CYNAYD_CONFIG__ from root layout.
 */
export function getPublicSiteUrl(): string {
  const injected = fromInjectedConfig();
  if (injected?.siteUrl) {
    return trimTrailingSlash(injected.siteUrl);
  }

  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    '';
  return url ? trimTrailingSlash(url) : '';
}
