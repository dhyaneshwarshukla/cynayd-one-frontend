import type { RuntimePublicConfig } from './env';

/** Read public config at request time (Cloud Run / server env). */
export function getRuntimePublicConfig(): RuntimePublicConfig {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.API_URL?.trim() ||
    '';
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    '';

  const trim = (url: string) => url.replace(/\/$/, '');

  return {
    apiUrl: apiUrl ? trim(apiUrl) : '',
    siteUrl: siteUrl ? trim(siteUrl) : '',
  };
}
