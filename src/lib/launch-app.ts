import { apiClient, type App } from '@/lib/api-client';

function isSamlEnabled(metadata?: string): boolean {
  if (!metadata) return false;

  try {
    const parsed = JSON.parse(metadata);
    return Boolean(parsed.samlEnabled && parsed.samlConfig);
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

function appendSsoToken(baseUrl: string, ssoToken: string): string {
  const delimiter = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${delimiter}sso_token=${encodeURIComponent(ssoToken)}`;
}

export async function launchAppWithFallback(appSlug: string): Promise<void> {
  const appDetails = await apiClient.getAppBySlug(appSlug);

  if (isSamlEnabled(appDetails.metadata)) {
    const response = await apiClient.initiateSamlSSO(appSlug);
    const html = await response.text();
    const samlWindow = window.open('', '_blank');
    if (!samlWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    samlWindow.document.write(html);
    samlWindow.document.close();
    return;
  }

  const { ssoToken } = await apiClient.generateSSOToken(appSlug);
  const baseUrl = getAppBaseUrl(appDetails);

  if (!baseUrl) {
    throw new Error('Application URL or domain is not configured. Please update this app in Admin > Apps.');
  }

  const redirectUrl = appendSsoToken(baseUrl, ssoToken);
  const appWindow = window.open(redirectUrl, '_blank');
  if (!appWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }
}

