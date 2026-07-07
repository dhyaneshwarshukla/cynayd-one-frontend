'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { DocsCodeBlock } from '@/components/api-docs/DocsCodeBlock';
import { AUTH_API_BASE_URL, PLATFORM_API_BASE_URL, PUBLIC_SCOPES } from '@/lib/api-docs/constants';
import type { GuideSectionId } from '@/lib/api-docs/docs-sections';

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' }) {
  const colors = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-amber-100 text-amber-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`mr-1.5 inline-block rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${colors[method]}`}
    >
      {method}
    </span>
  );
}

function Endpoint({ method, path }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string }) {
  return (
    <code className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-sm">
      <MethodBadge method={method} />
      {path}
    </code>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">{children}</code>;
}

function Section({
  id,
  title,
  children,
}: {
  id: GuideSectionId;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <div className="mt-4 text-gray-700">{children}</div>
    </section>
  );
}

function DocsTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function IntegrationGuide() {
  const authUrl = AUTH_API_BASE_URL;
  const platformUrl = PLATFORM_API_BASE_URL;

  return (
    <div className="space-y-8">
      <Section id="before-you-start" title="Before You Start">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Cynayd One organization is active.</li>
          <li>Partner app is registered in Cynayd One.</li>
          <li>Redirect URLs are configured.</li>
          <li>App slug is available.</li>
          <li>API access is approved for the organization.</li>
          <li>Service credentials are created if using machine-to-machine APIs.</li>
          <li>Webhook endpoint is publicly reachable over HTTPS.</li>
          <li>Webhook secret is stored securely.</li>
          <li>Required partner scopes are approved.</li>
          <li>Production and test environments are identified.</li>
        </ol>
      </Section>

      <Section id="platform-overview" title="Platform Overview">
        <p>
          Cynayd One exposes two public API surfaces. Use <InlineCode>{authUrl}</InlineCode> for
          authentication, SSO, SAML, and webhook configuration. Use{' '}
          <InlineCode>{platformUrl}</InlineCode> for product APIs (Calendar, Tasks, Docs, Forms,
          Mail, Drive).
        </p>
        <p className="mt-3">
          All platform routes are under <InlineCode>/api/v1/*</InlineCode>. Internal admin, billing,
          and security APIs are not published in this developer portal.
        </p>
      </Section>

      <Section id="flow-browser-sso" title="Flow A — Browser SSO (legacy token)">
        <p className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Passing SSO tokens in URL query parameters is deprecated. Prefer{' '}
          <InlineCode>Flow A2 — Exchange code</InlineCode> for new integrations.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>User signs in to Cynayd One.</li>
          <li>The third-party app receives an SSO token or app launch token.</li>
          <li>
            The app validates the token using <Endpoint method="POST" path="/api/sso/validate" />.
          </li>
          <li>The app receives user claims and app access details.</li>
        </ol>
        <DocsCodeBlock language="curl">{`curl -X POST ${authUrl}/api/sso/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "sso_token_here",
    "appSlug": "your-app-slug"
  }'`}</DocsCodeBlock>
      </Section>

      <Section id="flow-exchange-code" title="Flow A2 — Exchange code (recommended)">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            From an authenticated Cynayd One session (browser cookie or Bearer), call{' '}
            <Endpoint method="POST" path="/api/sso/exchange-code" /> with{' '}
            <InlineCode>appSlug</InlineCode>.
          </li>
          <li>
            Redirect the user to your app with <InlineCode>?code=opaque</InlineCode> (120s TTL,
            one-time use).
          </li>
          <li>
            Your app server calls <Endpoint method="POST" path="/api/sso/redeem-code" /> with the
            code and <InlineCode>appSlug</InlineCode>.
          </li>
          <li>
            Use the returned <InlineCode>ssoToken</InlineCode> from the JSON body only — never echo
            it in URLs or logs.
          </li>
        </ol>
        <DocsCodeBlock language="curl">{`# 1. Mint code (authenticated)
curl -X POST ${authUrl}/api/sso/exchange-code \\
  -H "Content-Type: application/json" \\
  -H "Cookie: accessToken=..." \\
  -d '{ "appSlug": "your-app-slug" }'

# Response: { "code": "...", "expiresIn": 120 }

# 2. Redeem code (public — code is the secret)
curl -X POST ${authUrl}/api/sso/redeem-code \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "opaque_code_from_redirect",
    "appSlug": "your-app-slug"
  }'`}</DocsCodeBlock>
        <p className="mt-4 text-sm text-gray-600">
          Mobile apps use the same flow: CYNAYD One returns{' '}
          <InlineCode>cynaydapp://auth?code=...</InlineCode>; the client redeems server-side.
        </p>
      </Section>

      <Section id="flow-service" title="Flow B — Service-to-service">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Organization admin creates a service credential via the Partner API.</li>
          <li>
            The app exchanges <InlineCode>client_id</InlineCode> and{' '}
            <InlineCode>client_secret</InlineCode> for a service token.
          </li>
          <li>The app uses the service token for authorized partner API calls.</li>
        </ol>
        <DocsCodeBlock language="curl">{`curl -X POST ${authUrl}/api/sso/service-token \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "client_id_here",
    "client_secret": "client_secret_here"
  }'`}</DocsCodeBlock>
      </Section>

      <Section id="flow-saml" title="Flow C — SAML federation">
        <p>
          Cynayd One supports SAML federation for enterprise apps. Configure metadata,
          login, callback, and logout endpoints from the API Reference tab.
        </p>
        <DocsCodeBlock language="text">{`${authUrl}/api/apps/{appSlug}/saml/metadata?organizationId={orgId}
${authUrl}/api/saml/login?organizationId={orgId}
${authUrl}/api/saml/callback
${authUrl}/api/saml/slo`}</DocsCodeBlock>
      </Section>

      <Section id="auth-tokens" title="Authentication and Token Lifecycle">
        <DocsTable>
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-semibold text-gray-900">Token type</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Used by</th>
              <th className="px-4 py-3 font-semibold text-gray-900">How obtained</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Used for</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">Exchange code</td>
              <td className="px-4 py-3">Browser and mobile apps</td>
              <td className="px-4 py-3">POST /api/sso/exchange-code</td>
              <td className="px-4 py-3">One-time redirect via ?code= → POST /api/sso/redeem-code</td>
            </tr>
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">SSO token</td>
              <td className="px-4 py-3">Browser-based apps (legacy)</td>
              <td className="px-4 py-3">Cynayd One app launch / redirect</td>
              <td className="px-4 py-3">Validate user via POST /api/sso/validate</td>
            </tr>
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">Service token</td>
              <td className="px-4 py-3">Machine clients</td>
              <td className="px-4 py-3">POST /api/sso/service-token</td>
              <td className="px-4 py-3">Server-to-server partner API calls</td>
            </tr>
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">App token</td>
              <td className="px-4 py-3">Connected apps</td>
              <td className="px-4 py-3">POST /api/v1/token or app SSO exchange</td>
              <td className="px-4 py-3">App-scoped API access</td>
            </tr>
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">Session token</td>
              <td className="px-4 py-3">Cynayd One UI</td>
              <td className="px-4 py-3">User login flow</td>
              <td className="px-4 py-3">Dashboard and session-backed operations</td>
            </tr>
          </tbody>
        </DocsTable>
        <p className="mt-4">
          When a token expires, re-authenticate the user or mint a new service token. Handle{' '}
          <InlineCode>INVALID_TOKEN</InlineCode> and <InlineCode>TOKEN_EXPIRED</InlineCode> error
          codes from the standard error format below.
        </p>
      </Section>

      <Section id="workspaces" title="Workspaces and Tenancy">
        <p>
          Every platform API call should include{' '}
          <InlineCode>X-Cynayd-Workspace-Id</InlineCode> with the organization/workspace ID.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>
            <Endpoint method="GET" path="/api/v1/workspaces" /> — list workspaces for the
            authenticated user (platform API)
          </li>
          <li>
            <Endpoint method="GET" path="/api/v1/workspaces/{workspaceId}/members" /> — list
            members
          </li>
          <li>
            <Endpoint method="GET" path="/api/v1/workspaces/{workspaceId}/apps" /> — enabled Cynayd
            apps
          </li>
        </ul>
      </Section>

      <Section id="scopes-permissions" title="Scopes and Permissions">
        <p className="mb-4 text-sm text-gray-600">
          Platform APIs enforce OAuth-style scopes on each request. Request only the scopes your
          integration needs when minting tokens via <InlineCode>POST /api/v1/token</InlineCode>.
        </p>
        <DocsCodeBlock language="text">{PUBLIC_SCOPES.join('\n')}</DocsCodeBlock>
        <p className="mt-4 text-sm text-gray-600">
          Colon aliases (e.g. <InlineCode>mail:read</InlineCode>, <InlineCode>calendar:create</InlineCode>)
          are accepted during the migration period.
        </p>
      </Section>

      <Section id="platform-api" title="Platform API (api.one.cynayd.com)">
        <p>Standard headers for all platform requests:</p>
        <DocsCodeBlock language="http">{`Authorization: Bearer <access_token>
X-Cynayd-Workspace-Id: <workspace_id>
Content-Type: application/json
Idempotency-Key: <unique_key>   # recommended on POST/PATCH/DELETE writes`}</DocsCodeBlock>
        <DocsCodeBlock language="curl">{`curl ${platformUrl}/api/v1/mail/messages?limit=20 \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Cynayd-Workspace-Id: $WORKSPACE_ID"`}</DocsCodeBlock>
        <p className="mt-4 text-sm text-gray-600">
          See the API Reference tab for the full app-wise catalog: Platform, Calendar, Tasks, Docs,
          Forms, Mail, Drive, and Unified APIs.
        </p>
      </Section>

      <Section id="pagination" title="Pagination">
        <p>
          List endpoints support <InlineCode>limit</InlineCode> and <InlineCode>cursor</InlineCode>{' '}
          query parameters. Responses include pagination metadata inside <InlineCode>data</InlineCode>{' '}
          when the upstream service supports it.
        </p>
      </Section>

      <Section id="idempotency" title="Idempotency">
        <p>
          Send <InlineCode>Idempotency-Key</InlineCode> on write requests (send mail, create
          webhooks, complete tasks). Retrying with the same key returns the original response
          without duplicating side effects.
        </p>
      </Section>

      <Section id="error-format" title="Standard error format">
        <p>Platform APIs return a consistent JSON envelope:</p>
        <DocsCodeBlock language="json">{`{
  "success": false,
  "error": {
    "code": "permission_denied",
    "message": "Missing required scope: mail.read"
  },
  "requestId": "req_01HZY..."
}`}</DocsCodeBlock>
        <p className="mt-4">Auth APIs on {authUrl} use a partner error shape:</p>
        <DocsCodeBlock language="json">{`{
  "error": "Invalid token",
  "code": "INVALID_TOKEN",
  "message": "The provided token is invalid or expired.",
  "requestId": "req_01HZY..."
}`}</DocsCodeBlock>
        <p className="mt-4 font-medium">Common error codes</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li><InlineCode>INVALID_REQUEST</InlineCode> — invalid body or query parameters</li>
          <li><InlineCode>UNAUTHORIZED</InlineCode> — missing or invalid authentication</li>
          <li><InlineCode>FORBIDDEN</InlineCode> — authenticated but not allowed</li>
          <li><InlineCode>NOT_FOUND</InlineCode> — resource not found or not accessible</li>
          <li><InlineCode>RATE_LIMITED</InlineCode> — too many requests (see Retry-After header)</li>
          <li><InlineCode>TOKEN_EXPIRED</InlineCode> / <InlineCode>INVALID_TOKEN</InlineCode> — token issues</li>
          <li><InlineCode>APP_NOT_ASSIGNED</InlineCode> — user or org lacks app access</li>
          <li><InlineCode>WEBHOOK_SECRET_INVALID</InlineCode> — webhook signature validation failed</li>
          <li><InlineCode>INTERNAL_ERROR</InlineCode> — unexpected server error</li>
        </ul>
      </Section>

      <Section id="webhooks" title="Webhooks">
        <p>
          Configure webhooks via <InlineCode>POST {authUrl}/api/webhooks</InlineCode> or the platform
          alias <InlineCode>POST /api/v1/webhooks</InlineCode>. Subscribe to events such as:
        </p>
        <DocsCodeBlock language="text">{`calendar.event.created | calendar.event.updated | calendar.event.deleted
task.created | task.updated | task.completed | task.deleted
doc.created | doc.updated | doc.shared | doc.deleted
form.submitted | form.response.updated
mail.received | mail.sent | mail.thread.updated
drive.file.created | drive.file.updated | drive.file.deleted | drive.file.shared`}</DocsCodeBlock>
        <p className="mt-4 text-sm text-gray-600">
          Full catalog: <InlineCode>GET {platformUrl}/api/v1/webhooks/events</InlineCode>
        </p>
      </Section>

      <Section id="rate-limits" title="Limits and Retry Behavior">
        <DocsTable>
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-semibold text-gray-900">Endpoint family</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Bucket</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Keying</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">POST /api/sso/validate</td>
              <td className="px-4 py-3">SSO_VALIDATE</td>
              <td className="px-4 py-3">IP</td>
              <td className="px-4 py-3">Browser SSO token validation</td>
            </tr>
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">POST /api/sso/service-token</td>
              <td className="px-4 py-3">SERVICE_TOKEN</td>
              <td className="px-4 py-3">client_id</td>
              <td className="px-4 py-3">Machine token minting</td>
            </tr>
            <tr className="bg-white even:bg-gray-50/50">
              <td className="px-4 py-3">POST /api/v1/token</td>
              <td className="px-4 py-3">TOKEN_V1_*</td>
              <td className="px-4 py-3">IP + session + app</td>
              <td className="px-4 py-3">App-to-app token exchange</td>
            </tr>
          </tbody>
        </DocsTable>
        <p className="mt-4">
          On rate limit (HTTP 429), respect the <InlineCode>Retry-After</InlineCode> header when
          present.
        </p>
        <DocsCodeBlock language="json">{`{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "message": "Rate limit exceeded. Retry after the specified time.",
  "requestId": "req_01HZY..."
}`}</DocsCodeBlock>
      </Section>

      <Section id="partner-scopes" title="Partner scopes">
        <p className="mb-4 text-sm text-gray-600">
          Scopes document partner permission boundaries. Runtime enforcement may vary by
          organization plan, app configuration, and admin permissions.
        </p>
        <DocsTable>
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-semibold text-gray-900">Scope</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Allows</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Example routes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">sso:validate</td><td className="px-4 py-3">Validate SSO tokens</td><td className="px-4 py-3">POST /api/sso/validate</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">apps:read</td><td className="px-4 py-3">Read app metadata</td><td className="px-4 py-3">GET /api/apps/by-slug/:slug, GET /api/sso/my-apps</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">apps:assign</td><td className="px-4 py-3">Assign apps to users</td><td className="px-4 py-3">POST /api/apps/:appId/assign</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">users:read</td><td className="px-4 py-3">Read users</td><td className="px-4 py-3">GET /api/users, GET /api/users/:id</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">users:provision</td><td className="px-4 py-3">Create/update users</td><td className="px-4 py-3">POST /api/users, PUT /api/users/:id</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">orgs:read</td><td className="px-4 py-3">Read organization context</td><td className="px-4 py-3">GET /api/organizations/*</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">roles:read</td><td className="px-4 py-3">Read roles</td><td className="px-4 py-3">GET /api/roles</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">permissions:assign</td><td className="px-4 py-3">Assign permissions</td><td className="px-4 py-3">POST /api/permissions/*</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">webhooks:manage</td><td className="px-4 py-3">Manage webhooks</td><td className="px-4 py-3">GET/POST/PUT/DELETE /api/webhooks/*</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">saml:read</td><td className="px-4 py-3">SAML federation config</td><td className="px-4 py-3">/api/saml/*, /api/apps/:appSlug/saml/metadata</td></tr>
            <tr className="bg-white even:bg-gray-50/50"><td className="px-4 py-3">service_credentials:manage</td><td className="px-4 py-3">Manage machine credentials</td><td className="px-4 py-3">/api/sso/service-credentials/*</td></tr>
          </tbody>
        </DocsTable>
      </Section>

      <Section id="credential-security" title="Credential security">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Store <InlineCode>client_secret</InlineCode> only on backend servers — never in browsers
            or mobile apps.
          </li>
          <li>Rotate credentials periodically and immediately if leaked.</li>
          <li>Use separate credentials per environment (production vs staging).</li>
          <li>Apply least-privilege scopes and disable unused credentials.</li>
        </ul>
      </Section>

      <Section id="debugging-support" title="Debugging and support">
        <p>When contacting support, include:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><InlineCode>requestId</InlineCode> from error responses</li>
          <li>Timestamp, HTTP method, endpoint path, and response status</li>
          <li>For webhooks: event type and delivery timestamp</li>
        </ul>
        <p className="mt-4 font-medium text-red-800">
          Never send raw secrets, client_secret, access tokens, or private keys in support tickets.
        </p>
        <p className="mt-3">
          <Link href="/contact" className="font-medium text-blue-600 underline hover:text-blue-700">
            Contact Cynayd support
          </Link>
        </p>
      </Section>

      <Section id="versioning" title="Versioning and deprecation">
        <ul className="list-disc space-y-2 pl-5">
          <li>Breaking changes receive a minimum 90-day advance notice.</li>
          <li>Deprecated endpoints remain available for at least 180 days where feasible.</li>
          <li>Non-breaking field additions may ship without notice — clients should ignore unknown fields.</li>
          <li>Avoid strict response-shape assumptions; design for forward compatibility.</li>
        </ul>
      </Section>

      <Section id="glossary" title="Glossary">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-gray-900">appSlug</dt>
            <dd className="text-gray-600">Unique identifier for a registered connected app.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Service credential</dt>
            <dd className="text-gray-600">client_id + client_secret pair for machine-to-machine APIs.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">SSO token</dt>
            <dd className="text-gray-600">
              Short-lived token from Cynayd One user authentication for third-party apps.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Webhook secret</dt>
            <dd className="text-gray-600">
              Shared secret used to verify X-Webhook-Signature on inbound deliveries.
            </dd>
          </div>
        </dl>
      </Section>

      <section
        id="api-access"
        className="scroll-mt-28 rounded-2xl border border-amber-200 bg-amber-50 p-6"
      >
        <h3 className="text-lg font-semibold text-amber-950">API access</h3>
        <p className="mt-2 text-amber-900">
          Partner API access requires an approved Cynayd One organization and app registration.{' '}
          <Link href="/contact" className="font-medium underline hover:text-amber-950">
            Contact Cynayd support
          </Link>{' '}
          to enable production credentials.
        </p>
        <p className="mt-3 text-sm text-amber-800">
          Auth API: {authUrl}. Platform API: {platformUrl}. Sandbox environment coming in a future
          release.
        </p>
      </section>
    </div>
  );
}
