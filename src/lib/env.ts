export type RuntimePublicConfig = {
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
 * Frontend site origin for SEO/metadata (no trailing slash).
 * Prefer SITE_URL at runtime; NEXT_PUBLIC_SITE_URL only if already set at build.
 */
export function getPublicSiteUrl(): string {
  const injected = fromInjectedConfig();
  if (injected?.siteUrl) {
    return trimTrailingSlash(injected.siteUrl);
  }

  const url =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    '';
  return url ? trimTrailingSlash(url) : '';
}
