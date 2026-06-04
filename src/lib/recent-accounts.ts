export type RecentAccount = {
  email: string;
  name?: string;
  lastUsedAt: number;
};

const STORAGE_KEY = 'cynayd_recent_accounts';
const MAX_ACCOUNTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseStoredAccounts(raw: string): RecentAccount[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentAccount =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as RecentAccount).email === 'string' &&
          typeof (item as RecentAccount).lastUsedAt === 'number'
      )
      .map((item) => ({
        email: normalizeEmail(item.email),
        name: typeof item.name === 'string' ? item.name : undefined,
        lastUsedAt: item.lastUsedAt,
      }));
  } catch {
    return [];
  }
}

function readAccounts(): RecentAccount[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return parseStoredAccounts(raw);
}

function writeAccounts(accounts: RecentAccount[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function getRecentAccounts(): RecentAccount[] {
  return readAccounts().sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export function addRecentAccount(input: { email: string; name?: string }): void {
  const email = normalizeEmail(input.email);
  if (!email) return;

  const now = Date.now();
  const existing = readAccounts().filter((a) => a.email !== email);
  const updated: RecentAccount = {
    email,
    name: input.name?.trim() || undefined,
    lastUsedAt: now,
  };

  const merged = [updated, ...existing]
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, MAX_ACCOUNTS);

  writeAccounts(merged);
}

export function removeRecentAccount(email: string): void {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  const filtered = readAccounts().filter((a) => a.email !== normalized);
  writeAccounts(filtered);
}

/** Initials for avatar display (name first, else email local part). */
export function getAccountInitials(account: RecentAccount): string {
  if (account.name?.trim()) {
    const parts = account.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = account.email.split('@')[0] || account.email;
  return local.slice(0, 2).toUpperCase();
}

/** Test-only: parse and merge without browser storage. */
export function mergeRecentAccountsForTest(
  existing: RecentAccount[],
  input: { email: string; name?: string },
  now = Date.now()
): RecentAccount[] {
  const email = normalizeEmail(input.email);
  const rest = existing.filter((a) => a.email !== email);
  const updated: RecentAccount = {
    email,
    name: input.name?.trim() || undefined,
    lastUsedAt: now,
  };
  return [updated, ...rest].sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, MAX_ACCOUNTS);
}

export function parseRecentAccountsJsonForTest(raw: string): RecentAccount[] {
  return parseStoredAccounts(raw);
}
