const DEVICE_ID_KEY = 'cynayd_device_id';

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim());
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Stable web device identifier for correlation only — not authentication proof.
 * Preserved across logout; server DeviceTrust is source of truth.
 */
export function getOrCreateWebDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const generated = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

export function getWebDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

/** Binds magic-link tokens to the browser that requested them. */
export async function getMagicLinkDeviceBindingHash(): Promise<string | null> {
  if (typeof window === 'undefined' || !crypto.subtle) return null;
  const deviceId = getOrCreateWebDeviceId();
  if (!deviceId) return null;
  return sha256Hex(deviceId);
}
