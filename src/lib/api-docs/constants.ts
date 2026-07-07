export const AUTH_API_BASE_URL = 'https://auth.one.cynayd.com';
export const PLATFORM_API_BASE_URL = 'https://api.one.cynayd.com';

/** @deprecated Use AUTH_API_BASE_URL or PLATFORM_API_BASE_URL */
export const PARTNER_API_BASE_URL = AUTH_API_BASE_URL;

export const DOCS_LAST_UPDATED = '2026-07-07';

export type DocsTab = 'guide' | 'reference';

export const DOCS_TABS: DocsTab[] = ['guide', 'reference'];

export const PUBLIC_SCOPES = [
  'user.read',
  'calendar.read',
  'calendar.write',
  'tasks.read',
  'tasks.write',
  'docs.read',
  'docs.write',
  'forms.read',
  'forms.write',
  'forms.responses.read',
  'mail.read',
  'mail.send',
  'mail.write',
  'drive.read',
  'drive.write',
  'drive.share',
  'webhooks.read',
  'webhooks.write',
] as const;
