import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner API Documentation',
  description:
    'Integrate third-party apps with CYNAYD One using SSO, SAML, service credentials, app assignment, provisioning, and webhooks.',
  openGraph: {
    title: 'Partner API Documentation | CYNAYD One',
    description:
      'Developer documentation for the CYNAYD One Partner API — SSO, SAML, provisioning, and webhooks.',
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
