function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Backend API origin from NEXT_PUBLIC_API_URL (no trailing slash). */
export function getPublicApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  return url ? trimTrailingSlash(url) : '';
}

/** Frontend site origin from NEXT_PUBLIC_SITE_URL (no trailing slash). */
export function getPublicSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return url ? trimTrailingSlash(url) : '';
}
