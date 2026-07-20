export type DurationMode = 'none' | 'until' | 'days';
export type UsageMode = 'unlimited' | 'max';

export interface GrantDurationUsage {
  durationMode: DurationMode;
  expiresAt: string;
  durationDays: string;
  usageMode: UsageMode;
  maxLaunches: string;
}

export const DEFAULT_GRANT_DURATION_USAGE: GrantDurationUsage = {
  durationMode: 'none',
  expiresAt: '',
  durationDays: '',
  usageMode: 'unlimited',
  maxLaunches: '',
};

export function resolveGrantExpiresAt(form: GrantDurationUsage): string | undefined {
  if (form.durationMode === 'until' && form.expiresAt) {
    return new Date(form.expiresAt).toISOString();
  }
  if (form.durationMode === 'days' && form.durationDays.trim()) {
    const days = Number(form.durationDays);
    if (Number.isFinite(days) && days > 0) {
      return new Date(Date.now() + days * 86400000).toISOString();
    }
  }
  return undefined;
}

export function resolveGrantQuota(form: GrantDurationUsage): number | null | undefined {
  if (form.usageMode === 'max' && form.maxLaunches.trim()) {
    const quota = Number(form.maxLaunches);
    if (Number.isFinite(quota) && quota >= 0) return quota;
  }
  if (form.usageMode === 'unlimited') return null;
  return undefined;
}
