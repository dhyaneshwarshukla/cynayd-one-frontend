export const PRODUCTION_AUTH_API_URL = 'https://auth.one.cynayd.com';
export const PRODUCTION_PLATFORM_API_URL = 'https://api.one.cynayd.com';

const LOCAL_AUTH_API_URL = 'http://localhost:4000';
const LOCAL_PLATFORM_API_URL = 'http://localhost:4100';

export function isLocalApiUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]'
    );
  } catch {
    return false;
  }
}

function appendCandidate(urls: string[], candidate: string, isProduction: boolean): void {
  const normalized = candidate.replace(/\/$/, '');
  if (!normalized) return;
  if (isProduction && isLocalApiUrl(normalized)) return;
  if (!urls.includes(normalized)) {
    urls.push(normalized);
  }
}

export function resolvePlatformApiUrls(): string[] {
  const configured = process.env.NEXT_PUBLIC_PLATFORM_API_URL?.trim();
  const urls: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (configured) {
    appendCandidate(urls, configured, isProduction);
  }

  if (!isProduction) {
    appendCandidate(urls, LOCAL_PLATFORM_API_URL, false);
  }

  appendCandidate(urls, PRODUCTION_PLATFORM_API_URL, false);

  return urls;
}

export function resolveAuthApiUrls(): string[] {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const urls: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (configured) {
    appendCandidate(urls, configured, isProduction);
  }

  if (!isProduction) {
    appendCandidate(urls, LOCAL_AUTH_API_URL, false);
  }

  appendCandidate(urls, PRODUCTION_AUTH_API_URL, false);

  return urls;
}
