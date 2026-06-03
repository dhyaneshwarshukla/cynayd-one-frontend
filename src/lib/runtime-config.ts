import type { RuntimePublicConfig } from './env';

/** Site URL for client metadata — injected at request time from SITE_URL. */
export function getRuntimePublicConfig(): RuntimePublicConfig {
  const siteUrl =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    '';

  const trim = (url: string) => url.replace(/\/$/, '');

  return {
    siteUrl: siteUrl ? trim(siteUrl) : '',
  };
}
