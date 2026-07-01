import { apiClient, type App } from '@/lib/api-client';

/**
 * SAML is considered ENABLED for an app when its metadata JSON contains:
 *   { "samlEnabled": true, "samlConfig": { "entityId": "...", "acsUrl": "...", ... } }
 *
 * This MUST stay in sync with the backend check in:
 *   standalone-backend/src/routes/apps.routes.ts  (POST /api/apps/:appSlug/sso-token)
 *   -> if (appMetadata.samlEnabled && appMetadata.samlConfig) { ... SAML path ... }
 */
function isSamlEnabled(metadata?: string): boolean {
  if (!metadata) return false;

  try {
    const parsed = JSON.parse(metadata);
    return Boolean(parsed?.samlEnabled === true && parsed?.samlConfig);
  } catch {
    return false;
  }
}

function getAppBaseUrl(app: App): string | null {
  if (app.url && app.url.trim()) {
    return app.url.trim();
  }

  if (app.domain && app.domain.trim()) {
    const domain = app.domain.trim();
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      return domain;
    }
    return `https://${domain}`;
  }

  return null;
}

function appendExchangeCode(baseUrl: string, code: string): string {
  const delimiter = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${delimiter}code=${encodeURIComponent(code)}`;
}

function openSamlAutoSubmitWindow(html: string, appName: string): void {
  const samlWindow = window.open('', '_blank');
  if (!samlWindow) {
    throw new Error('Popup blocked. Please allow popups for this site to access ' + appName + '.');
  }
  samlWindow.document.write(html);
  samlWindow.document.close();
}

async function launchViaSaml(appSlug: string, appName: string): Promise<void> {
  console.info(`[launch-app] "${appSlug}" -> SAML SSO path (POST /api/apps/${appSlug}/saml/sso)`);
  const response = await apiClient.initiateSamlSSO(appSlug);
  const html = await response.text();
  if (!html || !html.toLowerCase().includes('samlresponse')) {
    throw new Error(`Invalid SAML response received from server for "${appName}". Please verify SAML configuration.`);
  }
  openSamlAutoSubmitWindow(html, appName);
}

async function launchViaExchangeCode(appDetails: App): Promise<void> {
  const baseUrl = getAppBaseUrl(appDetails);
  if (!baseUrl) {
    throw new Error('Application URL or domain is not configured. Please update this app in Admin > Apps.');
  }

  console.info(`[launch-app] "${appDetails.slug}" -> SSO exchange code path (POST /api/sso/exchange-code)`);

  const { code } = await apiClient.exchangeSsoCode(appDetails.slug);

  if (!code) {
    throw new Error(`Server did not return a valid exchange code for "${appDetails.name}". Check backend logs.`);
  }

  const redirectUrl = appendExchangeCode(baseUrl, code);
  const appWindow = window.open(redirectUrl, '_blank');
  if (!appWindow) {
    throw new Error('Popup blocked. Please allow popups for this site to access ' + appDetails.name + '.');
  }
}

/**
 * Launch an app using the correct SSO mechanism:
 *   - SAML enabled in app.metadata  -> POST /api/apps/:slug/saml/sso  (auto-submit SAML form)
 *   - SAML NOT enabled              -> POST /api/sso/exchange-code (opaque code in redirect URL)
 */
export async function launchAppWithFallback(appSlug: string): Promise<void> {
  const appDetails = await apiClient.getAppBySlug(appSlug);

  if (!appDetails) {
    throw new Error(`App "${appSlug}" not found or inactive.`);
  }

  const samlEnabled = isSamlEnabled(appDetails.metadata);
  console.info(
    `[launch-app] App="${appDetails.name}" slug="${appDetails.slug}" samlEnabled=${samlEnabled}`
  );

  if (samlEnabled) {
    await launchViaSaml(appDetails.slug, appDetails.name);
    return;
  }

  await launchViaExchangeCode(appDetails);
}
