export const GUIDE_SECTIONS = [
  { id: 'before-you-start', title: 'Before You Start' },
  { id: 'platform-overview', title: 'Platform Overview' },
  { id: 'flow-browser-sso', title: 'Flow A — Browser SSO' },
  { id: 'flow-exchange-code', title: 'Flow A2 — Exchange code (recommended)' },
  { id: 'flow-service', title: 'Flow B — Service-to-service' },
  { id: 'flow-saml', title: 'Flow C — SAML federation' },
  { id: 'auth-tokens', title: 'Authentication and Token Lifecycle' },
  { id: 'workspaces', title: 'Workspaces and Tenancy' },
  { id: 'scopes-permissions', title: 'Scopes and Permissions' },
  { id: 'platform-api', title: 'Platform API (api.one.cynayd.com)' },
  { id: 'pagination', title: 'Pagination' },
  { id: 'idempotency', title: 'Idempotency' },
  { id: 'error-format', title: 'Standard error format' },
  { id: 'rate-limits', title: 'Limits and Retry Behavior' },
  { id: 'webhooks', title: 'Webhooks' },
  { id: 'partner-scopes', title: 'Partner scopes (SSO / provisioning)' },
  { id: 'credential-security', title: 'Credential security' },
  { id: 'debugging-support', title: 'Debugging and support' },
  { id: 'versioning', title: 'Versioning and deprecation' },
  { id: 'glossary', title: 'Glossary' },
  { id: 'api-access', title: 'API access' },
] as const;

export type GuideSectionId = (typeof GUIDE_SECTIONS)[number]['id'];

export const QUICK_START_CARDS = [
  {
    id: 'platform-overview' as GuideSectionId,
    title: 'Platform API',
    description: 'Unified /api/v1 APIs for Calendar, Mail, Docs, Forms, and Drive.',
    icon: '🚀',
  },
  {
    id: 'flow-exchange-code' as GuideSectionId,
    title: 'Exchange code SSO',
    description: 'Mint opaque codes from an authenticated session and redeem server-side.',
    icon: '🔐',
  },
  {
    id: 'flow-service' as GuideSectionId,
    title: 'Service-to-service',
    description: 'Exchange client credentials for machine-to-machine API access.',
    icon: '🔑',
  },
  {
    id: 'webhooks' as GuideSectionId,
    title: 'Webhooks',
    description: 'Subscribe to mail, calendar, task, doc, form, and drive events.',
    icon: '🔔',
  },
] as const;
