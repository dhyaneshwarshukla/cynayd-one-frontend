import type { PinLock } from './api-client';

/**
 * Client-side session lock persistence.
 * - sessionLocked (sessionStorage): survives reload for no-PIN inactivity lock
 * - lastUserInteraction (localStorage): real user input only; drives inactivity timer
 */

const SESSION_LOCKED_KEY = 'sessionLocked';
const LAST_USER_INTERACTION_KEY = 'lastUserInteraction';
/** @deprecated Legacy key; cleared on logout */
const LEGACY_LAST_ACTIVITY_KEY = 'lastActivity';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function markSessionLocked(): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(SESSION_LOCKED_KEY, 'true');
}

export function clearSessionLocked(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_LOCKED_KEY);
}

export function isSessionLocked(): boolean {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(SESSION_LOCKED_KEY) === 'true';
}

export function touchUserInteraction(timestamp: number = Date.now()): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_USER_INTERACTION_KEY, timestamp.toString());
}

export function getLastUserInteraction(): number | null {
  if (!isBrowser()) return null;
  const stored = localStorage.getItem(LAST_USER_INTERACTION_KEY);
  if (!stored) return null;
  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getMsSinceLastInteraction(): number | null {
  const last = getLastUserInteraction();
  if (last === null) return null;
  return Date.now() - last;
}

export function clearAllSessionLockData(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_LOCKED_KEY);
  localStorage.removeItem(LAST_USER_INTERACTION_KEY);
  localStorage.removeItem(LEGACY_LAST_ACTIVITY_KEY);
}

/** Server says PIN unlock is required (JWT pinVerifiedAt / cookie / lastActivity). */
export function isPinLockedOnServer(pinLock: PinLock | null | undefined): boolean {
  return !!pinLock?.requiresPin && !pinLock.unlocked;
}

/** Show PIN lock screen: server requires unlock or client inactivity marked lock. */
export function shouldShowPinLockScreen(pinLock: PinLock | null | undefined): boolean {
  if (!pinLock?.requiresPin) return false;
  return isPinLockedOnServer(pinLock) || isSessionLocked();
}

/** Show no-PIN overlay after inactivity when user has not set up PIN. */
export function shouldShowNoPinLockOverlay(pinLock: PinLock | null | undefined): boolean {
  if (pinLock?.requiresPin) return false;
  return isSessionLocked();
}

/** @deprecated Use shouldShowPinLockScreen / shouldShowNoPinLockOverlay with server pinLock */
export function shouldLockOnInitialLoad(pinEnabled: boolean): boolean {
  return pinEnabled || isSessionLocked();
}
