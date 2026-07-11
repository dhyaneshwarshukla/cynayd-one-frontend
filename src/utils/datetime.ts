export function resolveBrowserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** Resolve IANA timezone for displaying timestamps to the user. */
export function resolveDisplayTimezone(
  profileTimezone?: string | null,
  effectiveTimezone?: string | null
): string {
  const profile = profileTimezone?.trim();
  if (profile) return profile;
  const effective = effectiveTimezone?.trim();
  if (effective) return effective;
  return resolveBrowserTimezone() ?? 'UTC';
}

/** Format using profile/effective timezone, else browser, else UTC. */
export function formatInstantForDisplay(
  iso: string,
  profileTimezone?: string | null,
  effectiveTimezone?: string | null
): string {
  return formatInstantInTimezone(
    iso,
    resolveDisplayTimezone(profileTimezone, effectiveTimezone)
  );
}

/** Format an ISO instant in the given IANA timezone with an explicit zone label. */
export function formatInstantInTimezone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
      timeZoneName: 'short',
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
      timeZoneName: 'short',
    }).format(new Date(iso));
  }
}
