export const GUIDE_SECTIONS = [
  { id: 'before-you-start', title: 'Before You Start' },
  { id: 'flow-browser-sso', title: 'Flow A — Browser SSO' },
  { id: 'flow-exchange-code', title: 'Flow A2 — Exchange code (recommended)' },
  { id: 'flow-service', title: 'Flow B — Service-to-service' },
  { id: 'flow-saml', title: 'Flow C — SAML federation' },
  { id: 'auth-tokens', title: 'Authentication and Token Lifecycle' },
  { id: 'error-format', title: 'Standard error format' },
  { id: 'rate-limits', title: 'Limits and Retry Behavior' },
  { id: 'partner-scopes', title: 'Partner scopes' },
  { id: 'credential-security', title: 'Credential security' },
  { id: 'debugging-support', title: 'Debugging and support' },
  { id: 'versioning', title: 'Versioning and deprecation' },
  { id: 'glossary', title: 'Glossary' },
  { id: 'api-access', title: 'API access' },
] as const;

export type GuideSectionId = (typeof GUIDE_SECTIONS)[number]['id'];

export const QUICK_START_CARDS = [
  {
    id: 'flow-browser-sso' as GuideSectionId,
    title: 'Browser SSO',
    description: 'Validate SSO tokens from Cynayd One app launches in your web app.',
    icon: '🌐',
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
    id: 'flow-saml' as GuideSectionId,
    title: 'SAML federation',
    description: 'Configure enterprise SAML metadata, login, and logout endpoints.',
    icon: '🏢',
  },
] as const;
