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
  console.info(`[launch-app] "${appDetails.slug}" -> SSO launch path (POST /api/sso/exchange-code)`);

  const { launchUrl } = await apiClient.exchangeSsoCode(appDetails.slug);

  if (!launchUrl?.trim()) {
    throw new Error(`Server did not return a launch URL for "${appDetails.name}". Check backend logs.`);
  }

  const appWindow = window.open(launchUrl.trim(), '_blank');
  if (!appWindow) {
    throw new Error('Popup blocked. Please allow popups for this site to access ' + appDetails.name + '.');
  }
}

/**
 * Launch an app using the correct SSO mechanism:
 *   - SAML enabled in app.metadata  -> POST /api/apps/:slug/saml/sso  (auto-submit SAML form)
 *   - SAML NOT enabled              -> POST /api/sso/exchange-code (redirect via launchUrl with ?sso_token=)
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
