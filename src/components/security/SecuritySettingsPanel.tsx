'use client';

import { useMemo } from 'react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/Alert';

export type PolicyPresetId = 'balanced-enterprise' | 'strict-enterprise' | 'maximum-security';

/** Challenge types enforced by resolveLogin (matches backend baseline schema). */
export type ChallengeOrderStep = 'security_review' | 'mfa' | 'mobile_approval';

export type MinimumFactorStrengthStub =
  | 'single_factor'
  | 'multi_factor'
  | 'phishing_resistant';

const LEGACY_MINIMUM_STRENGTH: Record<string, MinimumFactorStrengthStub> = {
  standard: 'single_factor',
  strong: 'multi_factor',
  maximum: 'phishing_resistant',
  single_factor: 'single_factor',
  multi_factor: 'multi_factor',
  phishing_resistant: 'phishing_resistant',
};

export function normalizeMinimumFactorStrength(
  raw: unknown
): MinimumFactorStrengthStub {
  if (typeof raw !== 'string') return 'multi_factor';
  return LEGACY_MINIMUM_STRENGTH[raw] ?? 'multi_factor';
}

export const CHALLENGE_ORDER_LABELS: Record<ChallengeOrderStep, string> = {
  security_review: 'Security review',
  mfa: 'MFA (TOTP / passkey / email OTP)',
  mobile_approval: 'Mobile approval',
};

export const DEFAULT_CHALLENGE_ORDER: ChallengeOrderStep[] = [
  'security_review',
  'mfa',
  'mobile_approval',
];

const VALID_CHALLENGE_ORDER = new Set<string>(DEFAULT_CHALLENGE_ORDER);

export function normalizeChallengeOrder(raw: unknown): ChallengeOrderStep[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CHALLENGE_ORDER];
  const steps = raw
    .map(String)
    .filter((step): step is ChallengeOrderStep => VALID_CHALLENGE_ORDER.has(step));
  return steps.length ? steps : [...DEFAULT_CHALLENGE_ORDER];
}

export interface SecuritySettingsFormState {
  policyPreset: PolicyPresetId;
  mfaRequired: boolean;
  passkeySatisfiesMfa: boolean;
  mfaRequireEveryLogin: boolean;
  mfaTrustedDeviceDays: number;
  mfaRenewTrustOnLogin: boolean;
  mobileApprovalEnabled: boolean;
  mobileRequirePeriodicApproval: boolean;
  mobilePeriodicApprovalHours: number;
  mobileRequireEveryLogin: boolean;
  mobileTrustedDeviceDays: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number;
  webIdleTimeoutMinutes: number;
  mobileIdleTimeoutMinutes: number;
  accessTokenTtlMinutes: number;
  defaultWebSessionTtlDays: number;
  rememberMeWebSessionTtlDays: number;
  defaultMobileSessionTtlDays: number;
  rememberMeMobileSessionTtlDays: number;
  trustedDeviceMaxSkipRisk: 'low' | 'medium' | 'high';
  failedLoginLimit: number;
  accountLockoutDuration: number;
  maxConcurrentSessions: number;
  botDetectionEnabled: boolean;
  credentialStuffingEnabled: boolean;
  impossibleTravelMaxKmh: number;
  /** Ordered login challenge steps (persisted in baseline JSON; enforced by resolveLogin). */
  challengeOrder: ChallengeOrderStep[];
  minimumFactorStrength: MinimumFactorStrengthStub;
  passkeyOnlyWhenEnrolled: boolean;
  mfaSignedApprovalRequired: boolean;
  adminReviewMinRiskScore: number;
  allowHighRiskEmailOtpFallback: boolean;
  allowPasskeyApprovalFallback: boolean;
  allowEnrollmentDuringLogin: boolean;
  securityReviewMinimumEligibleApprovers: number;
  securityReviewEmergencyRecoveryEnabled: boolean;
  securityReviewSelfApprovalAllowed: boolean;
}

interface SecuritySettingsPanelProps {
  settings: SecuritySettingsFormState;
  onChange: (next: SecuritySettingsFormState) => void;
  onSave: () => void;
  saving?: boolean;
}

const PRESET_LABELS: Record<PolicyPresetId, string> = {
  'balanced-enterprise': 'Balanced Enterprise (recommended)',
  'strict-enterprise': 'Strict Enterprise',
  'maximum-security': 'Maximum Security',
};

const TABS = [
  'Session',
  'MFA',
  'Mobile approval',
  'Device trust',
  'Login challenges',
  'Review & recovery',
  'Risk & lockout',
] as const;
type TabId = (typeof TABS)[number];

function CheckboxRow({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-gray-300 text-indigo-600"
      />
      <span>
        {label}
        {description ? <span className="mt-0.5 block text-xs text-gray-500">{description}</span> : null}
      </span>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  description?: string;
}) {
  return (
    <label className="text-sm">
      {label}
      {description ? <span className="mt-0.5 block text-xs text-amber-700">{description}</span> : null}
      <input
        type="number"
        min={min}
        max={max}
        className="mt-1 w-full rounded-lg border px-3 py-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function SecuritySettingsPanel({
  settings,
  onChange,
  onSave,
  saving,
}: SecuritySettingsPanelProps) {
  const [tab, setTab] = useState<TabId>('Session');

  const set = <K extends keyof SecuritySettingsFormState>(
    key: K,
    value: SecuritySettingsFormState[K]
  ) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SSO policy preset</CardTitle>
          <CardDescription>
            Presets set defaults; overrides below are merged on save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={settings.policyPreset}
            onChange={(e) => set('policyPreset', e.target.value as PolicyPresetId)}
          >
            {(Object.keys(PRESET_LABELS) as PolicyPresetId[]).map((id) => (
              <option key={id} value={id}>
                {PRESET_LABELS[id]}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Session' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session policy</CardTitle>
            <CardDescription>Access token TTL, idle timeout, and web/mobile session lengths.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Access token TTL (minutes)"
              value={settings.accessTokenTtlMinutes}
              onChange={(v) => set('accessTokenTtlMinutes', v)}
              min={5}
            />
            <NumberField
              label="Web idle timeout (minutes)"
              value={settings.webIdleTimeoutMinutes}
              onChange={(v) => set('webIdleTimeoutMinutes', v)}
              min={5}
            />
            <NumberField
              label="Mobile idle timeout (minutes)"
              value={settings.mobileIdleTimeoutMinutes}
              onChange={(v) => set('mobileIdleTimeoutMinutes', v)}
              min={5}
            />
            <NumberField
              label="Legacy idle timeout fallback (minutes)"
              value={settings.sessionTimeout}
              onChange={(v) => set('sessionTimeout', v)}
              min={5}
              description="Deprecated — prefer web/mobile idle fields below. Removed when backend snapshot drops this field."
            />
            <NumberField
              label="Default web session (days)"
              value={settings.defaultWebSessionTtlDays}
              onChange={(v) => set('defaultWebSessionTtlDays', v)}
              min={1}
            />
            <NumberField
              label="Remember-me web session (days)"
              value={settings.rememberMeWebSessionTtlDays}
              onChange={(v) => set('rememberMeWebSessionTtlDays', v)}
              min={1}
            />
            <NumberField
              label="Remember-me mobile session (days)"
              value={settings.rememberMeMobileSessionTtlDays}
              onChange={(v) => set('rememberMeMobileSessionTtlDays', v)}
              min={1}
            />
            <NumberField
              label="Default mobile session (days)"
              value={settings.defaultMobileSessionTtlDays}
              onChange={(v) => set('defaultMobileSessionTtlDays', v)}
              min={1}
            />
            <NumberField
              label="Max concurrent sessions"
              value={settings.maxConcurrentSessions}
              onChange={(v) => set('maxConcurrentSessions', v)}
              min={1}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'MFA' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MFA policy</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CheckboxRow
              label="Require MFA for all users"
              checked={settings.mfaRequired}
              onChange={(v) => set('mfaRequired', v)}
            />
            <CheckboxRow
              label="Passkey satisfies MFA"
              checked={settings.passkeySatisfiesMfa}
              onChange={(v) => set('passkeySatisfiesMfa', v)}
            />
            <CheckboxRow
              label="Require MFA every login"
              checked={settings.mfaRequireEveryLogin}
              onChange={(v) => set('mfaRequireEveryLogin', v)}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'Mobile approval' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mobile approval policy</CardTitle>
            <CardDescription>
              Push approval challenges for mobile sign-ins. Device trust duration is configured under Device trust.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CheckboxRow
              label="Mobile approval enabled"
              checked={settings.mobileApprovalEnabled}
              onChange={(v) => set('mobileApprovalEnabled', v)}
            />
            <CheckboxRow
              label="Require approval every login"
              checked={settings.mobileRequireEveryLogin}
              onChange={(v) => set('mobileRequireEveryLogin', v)}
            />
            <CheckboxRow
              label="Periodic approval (e.g. every 24h)"
              checked={settings.mobileRequirePeriodicApproval}
              onChange={(v) => set('mobileRequirePeriodicApproval', v)}
            />
            <NumberField
              label="Periodic approval interval (hours)"
              value={settings.mobilePeriodicApprovalHours}
              onChange={(v) => set('mobilePeriodicApprovalHours', v)}
              min={1}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'Device trust' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device trust</CardTitle>
            <CardDescription>
              How long trusted devices can skip MFA, mobile approval, and up to which risk level.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="MFA trusted device validity (days)"
              value={settings.mfaTrustedDeviceDays}
              onChange={(v) => set('mfaTrustedDeviceDays', v)}
              min={1}
            />
            <CheckboxRow
              label="Renew MFA device trust on successful login"
              checked={settings.mfaRenewTrustOnLogin}
              onChange={(v) => set('mfaRenewTrustOnLogin', v)}
            />
            <NumberField
              label="Mobile trusted device validity (days)"
              value={settings.mobileTrustedDeviceDays}
              onChange={(v) => set('mobileTrustedDeviceDays', v)}
              min={1}
            />
            <label className="text-sm sm:col-span-2">
              Max risk level to skip challenges on trusted devices
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={settings.trustedDeviceMaxSkipRisk}
                onChange={(e) =>
                  set(
                    'trustedDeviceMaxSkipRisk',
                    e.target.value as SecuritySettingsFormState['trustedDeviceMaxSkipRisk']
                  )
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </CardContent>
        </Card>
      )}

      {tab === 'Login challenges' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login challenge order</CardTitle>
            <CardDescription>
              Factor order for step-up challenges. Saved to the org baseline and enforced by the login resolver.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm">
              Challenge order (comma-separated)
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
                value={settings.challengeOrder.join(', ')}
                onChange={(e) => {
                  const parts = normalizeChallengeOrder(
                    e.target.value.split(',').map((s) => s.trim())
                  );
                  set('challengeOrder', parts);
                }}
                placeholder={DEFAULT_CHALLENGE_ORDER.join(', ')}
              />
              <span className="mt-1 block text-xs text-gray-500">
                Allowed: {Object.keys(CHALLENGE_ORDER_LABELS).join(', ')}
              </span>
            </label>
            <label className="text-sm">
              Minimum factor strength
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={settings.minimumFactorStrength}
                onChange={(e) =>
                  set('minimumFactorStrength', e.target.value as MinimumFactorStrengthStub)
                }
              >
                <option value="single_factor">Single factor (backup code where allowed)</option>
                <option value="multi_factor">Multi-factor (TOTP / email OTP)</option>
                <option value="phishing_resistant">Phishing-resistant (passkey / signed push)</option>
              </select>
            </label>
            <CheckboxRow
              label="Require signed mobile approval"
              checked={settings.mfaSignedApprovalRequired}
              onChange={(v) => set('mfaSignedApprovalRequired', v)}
              description="When enabled, approve/reject requests must include a device signature (default on)."
            />
            <CheckboxRow
              label="Passkey only when enrolled"
              checked={settings.passkeyOnlyWhenEnrolled}
              onChange={(v) => set('passkeyOnlyWhenEnrolled', v)}
              description="Only offer passkey as a challenge when the user already has a registered passkey. Password sign-in remains available unless another rule blocks it."
            />
            <Alert>
              <AlertTitle>Challenge lifetime</AlertTitle>
              <AlertDescription>
                Login, administrator-review, and MFA challenges remain valid for 15 minutes and renew
                when the flow advances to review or MFA.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {tab === 'Review & recovery' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Administrator review threshold</CardTitle>
              <CardDescription>
                Scores below this boundary use strong user-controlled verification. Confirmed attack
                conditions can still be blocked independently.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Administrator approval starts at score"
                value={settings.adminReviewMinRiskScore}
                onChange={(v) => set('adminReviewMinRiskScore', Math.min(100, Math.max(90, v)))}
                min={90}
                max={100}
                description="The production-safe minimum is 90. Scores 75–89 use strong MFA/recovery instead."
              />
              <NumberField
                label="Minimum eligible approvers"
                value={settings.securityReviewMinimumEligibleApprovers}
                onChange={(v) => set('securityReviewMinimumEligibleApprovers', Math.max(1, v))}
                min={1}
              />
              <CheckboxRow
                label="Allow explicit email OTP recovery below review threshold"
                checked={settings.allowHighRiskEmailOtpFallback}
                onChange={(v) => set('allowHighRiskEmailOtpFallback', v)}
                description="At elevated scores below 90, users may explicitly request an email OTP. It is never offered at or above the review threshold."
              />
              <CheckboxRow
                label="Allow passkey recovery below review threshold"
                checked={settings.allowPasskeyApprovalFallback}
                onChange={(v) => set('allowPasskeyApprovalFallback', v)}
                description="Requires a passkey already enrolled on the account and remains subject to minimum factor strength."
              />
              <CheckboxRow
                label="Allow MFA enrollment during login"
                checked={settings.allowEnrollmentDuringLogin}
                onChange={(v) => set('allowEnrollmentDuringLogin', v)}
                description="Lets users without a usable factor enter the resumable MFA enrollment flow instead of reaching an unsatisfiable challenge."
              />
              <CheckboxRow
                label="Emergency recovery when no approver is available"
                checked={settings.securityReviewEmergencyRecoveryEnabled}
                onChange={(v) => set('securityReviewEmergencyRecoveryEnabled', v)}
                description="Use only as a break-glass tenant policy. Every use emits a high-severity security event."
              />
              <CheckboxRow
                label="Allow administrators to approve their own login"
                checked={settings.securityReviewSelfApprovalAllowed}
                onChange={(v) => set('securityReviewSelfApprovalAllowed', v)}
                description="Not recommended. Keep disabled to preserve separation of duties."
              />
            </CardContent>
          </Card>

          <Alert>
            <AlertTitle>Effective sign-in behavior</AlertTitle>
            <AlertDescription>
              Scores below 50 follow normal or standard MFA policy; 50–74 require strong MFA; 75–89
              require strong MFA with configured email/passkey recovery; 90–100 require administrator
              review. Disabled users, suspended organizations, revoked devices, known attack IPs, and
              confirmed compromised accounts remain hard-block conditions.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {tab === 'Risk & lockout' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Password policy</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Minimum length"
                value={settings.passwordMinLength}
                onChange={(v) => set('passwordMinLength', v)}
                min={6}
              />
              {(
                [
                  ['passwordRequireUppercase', 'Require uppercase'],
                  ['passwordRequireLowercase', 'Require lowercase'],
                  ['passwordRequireNumbers', 'Require numbers'],
                  ['passwordRequireSymbols', 'Require symbols'],
                ] as const
              ).map(([key, label]) => (
                <CheckboxRow
                  key={key}
                  label={label}
                  checked={settings[key]}
                  onChange={(v) => set(key, v)}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk & lockout</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Failed login limit"
                value={settings.failedLoginLimit}
                onChange={(v) => set('failedLoginLimit', v)}
                min={1}
              />
              <NumberField
                label="Lockout duration (minutes)"
                value={settings.accountLockoutDuration}
                onChange={(v) => set('accountLockoutDuration', v)}
                min={1}
              />
              <NumberField
                label="Impossible travel max (km/h)"
                value={settings.impossibleTravelMaxKmh}
                onChange={(v) => set('impossibleTravelMaxKmh', v)}
                min={100}
              />
              <CheckboxRow
                label="Bot detection enabled"
                checked={settings.botDetectionEnabled}
                onChange={(v) => set('botDetectionEnabled', v)}
              />
              <CheckboxRow
                label="Credential stuffing protection"
                checked={settings.credentialStuffingEnabled}
                onChange={(v) => set('credentialStuffingEnabled', v)}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">
        Save security settings
      </Button>
    </div>
  );
}

const DEFAULT_FORM: SecuritySettingsFormState = {
  policyPreset: 'balanced-enterprise',
  mfaRequired: false,
  passkeySatisfiesMfa: true,
  mfaRequireEveryLogin: false,
  mfaTrustedDeviceDays: 30,
  mfaRenewTrustOnLogin: true,
  mobileApprovalEnabled: true,
  mobileRequirePeriodicApproval: true,
  mobilePeriodicApprovalHours: 24,
  mobileRequireEveryLogin: false,
  mobileTrustedDeviceDays: 90,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  sessionTimeout: 720,
  webIdleTimeoutMinutes: 720,
  mobileIdleTimeoutMinutes: 10080,
  accessTokenTtlMinutes: 15,
  defaultWebSessionTtlDays: 7,
  rememberMeWebSessionTtlDays: 30,
  defaultMobileSessionTtlDays: 30,
  rememberMeMobileSessionTtlDays: 90,
  trustedDeviceMaxSkipRisk: 'medium',
  failedLoginLimit: 5,
  accountLockoutDuration: 15,
  maxConcurrentSessions: 10,
  botDetectionEnabled: true,
  credentialStuffingEnabled: true,
  impossibleTravelMaxKmh: 900,
  challengeOrder: [...DEFAULT_CHALLENGE_ORDER],
  minimumFactorStrength: 'single_factor',
  passkeyOnlyWhenEnrolled: true,
  mfaSignedApprovalRequired: true,
  adminReviewMinRiskScore: 90,
  allowHighRiskEmailOtpFallback: true,
  allowPasskeyApprovalFallback: true,
  allowEnrollmentDuringLogin: true,
  securityReviewMinimumEligibleApprovers: 1,
  securityReviewEmergencyRecoveryEnabled: false,
  securityReviewSelfApprovalAllowed: false,
};

export function mapApiToSecuritySettings(api: Record<string, unknown>): SecuritySettingsFormState {
  const sso = (api.effectiveSsoPolicy ?? api.ssoPolicy) as Record<string, unknown> | undefined;
  const session = (sso?.session ?? {}) as Record<string, unknown>;
  const mfa = (sso?.mfa ?? {}) as Record<string, unknown>;
  const mobile = (sso?.mobileApproval ?? {}) as Record<string, unknown>;
  const risk = (sso?.risk ?? {}) as Record<string, unknown>;
  const legacy = (sso?.legacy ?? api.baseline ?? api) as Record<string, unknown>;
  const baselineRaw = (api.baseline ?? api) as Record<string, unknown>;
  const securityReview = (baselineRaw.securityReview ?? legacy.securityReview ?? {}) as Record<string, unknown>;
  const challengeRaw = baselineRaw.challengeOrder ?? api.challengeOrder;
  const challengeOrder = normalizeChallengeOrder(challengeRaw);

  return {
    ...DEFAULT_FORM,
    policyPreset:
      (typeof api.templateId === 'string' ? api.templateId : 'balanced-enterprise') as PolicyPresetId,
    mfaRequired: Boolean(legacy.mfaRequired ?? mfa.enabled),
    passkeySatisfiesMfa: legacy.passkeySatisfiesMfa !== false,
    mfaRequireEveryLogin: Boolean(mfa.requireEveryLogin),
    mfaTrustedDeviceDays: Number(mfa.trustedDeviceDays ?? 30),
    mfaRenewTrustOnLogin: mfa.renewTrustOnSuccessfulLogin !== false,
    mobileApprovalEnabled: mobile.enabled !== false,
    mobileRequirePeriodicApproval: mobile.requirePeriodicApproval !== false,
    mobilePeriodicApprovalHours: Number(mobile.periodicApprovalHours ?? 24),
    mobileRequireEveryLogin: Boolean(mobile.requireEveryLogin),
    mobileTrustedDeviceDays: Number(mobile.trustedMobileDeviceDays ?? 90),
    passwordMinLength: Number(legacy.passwordMinLength ?? 8),
    passwordRequireUppercase: legacy.passwordRequireUppercase !== false,
    passwordRequireLowercase: legacy.passwordRequireLowercase !== false,
    passwordRequireNumbers: legacy.passwordRequireNumbers !== false,
    passwordRequireSymbols: Boolean(legacy.passwordRequireSymbols),
    sessionTimeout: Number(session.idleTimeoutMinutes ?? legacy.sessionTimeout ?? 720),
    webIdleTimeoutMinutes: Number(
      session.webIdleTimeoutMinutes ?? session.idleTimeoutMinutes ?? legacy.sessionTimeout ?? 720
    ),
    mobileIdleTimeoutMinutes: Number(
      session.mobileIdleTimeoutMinutes ?? session.idleTimeoutMinutes ?? 10080
    ),
    accessTokenTtlMinutes: Number(session.accessTokenTtlMinutes ?? 15),
    defaultWebSessionTtlDays: Number(session.defaultWebSessionTtlDays ?? 7),
    rememberMeWebSessionTtlDays: Number(session.rememberMeWebSessionTtlDays ?? 30),
    defaultMobileSessionTtlDays: Number(session.defaultMobileSessionTtlDays ?? 30),
    rememberMeMobileSessionTtlDays: Number(session.rememberMeMobileSessionTtlDays ?? 90),
    trustedDeviceMaxSkipRisk: (risk.trustedDeviceMaxSkipRisk as SecuritySettingsFormState['trustedDeviceMaxSkipRisk']) ?? 'medium',
    failedLoginLimit: Number(legacy.failedLoginLimit ?? 5),
    accountLockoutDuration: Number(legacy.accountLockoutDuration ?? 15),
    maxConcurrentSessions: Number(legacy.maxConcurrentSessions ?? 10),
    botDetectionEnabled: legacy.botDetectionEnabled !== false,
    credentialStuffingEnabled: legacy.credentialStuffingEnabled !== false,
    impossibleTravelMaxKmh: Number(legacy.impossibleTravelMaxKmh ?? 900),
    challengeOrder: challengeOrder.length ? challengeOrder : [...DEFAULT_CHALLENGE_ORDER],
    minimumFactorStrength: normalizeMinimumFactorStrength(
      baselineRaw.minimumFactorStrength ?? legacy.minimumFactorStrength
    ),
    passkeyOnlyWhenEnrolled: baselineRaw.passkeyOnlyWhenEnrolled !== false,
    mfaSignedApprovalRequired:
      baselineRaw.mfaSignedApprovalRequired !== false &&
      legacy.mfaSignedApprovalRequired !== false,
    adminReviewMinRiskScore: Math.min(
      100,
      Math.max(90, Number(risk.adminReviewMinRiskScore ?? 90))
    ),
    allowHighRiskEmailOtpFallback:
      baselineRaw.allowHighRiskEmailOtpFallback !== false &&
      legacy.allowHighRiskEmailOtpFallback !== false,
    allowPasskeyApprovalFallback:
      baselineRaw.allowPasskeyApprovalFallback !== false &&
      legacy.allowPasskeyApprovalFallback !== false,
    allowEnrollmentDuringLogin:
      baselineRaw.allowEnrollmentDuringLogin === true || legacy.allowEnrollmentDuringLogin === true,
    securityReviewMinimumEligibleApprovers: Math.max(
      1,
      Number(securityReview.minimumEligibleApprovers ?? 1)
    ),
    securityReviewEmergencyRecoveryEnabled: securityReview.emergencyRecoveryEnabled === true,
    securityReviewSelfApprovalAllowed: securityReview.selfApprovalAllowed === true,
  };
}

export function mapSecuritySettingsToBaselinePayload(
  form: SecuritySettingsFormState
): Record<string, unknown> {
  return {
    mfaRequired: form.mfaRequired,
    passkeySatisfiesMfa: form.passkeySatisfiesMfa,
    passwordMinLength: form.passwordMinLength,
    passwordRequireUppercase: form.passwordRequireUppercase,
    passwordRequireLowercase: form.passwordRequireLowercase,
    passwordRequireNumbers: form.passwordRequireNumbers,
    passwordRequireSymbols: form.passwordRequireSymbols,
    sessionTimeout: form.sessionTimeout,
    failedLoginLimit: form.failedLoginLimit,
    accountLockoutDuration: form.accountLockoutDuration,
    maxConcurrentSessions: form.maxConcurrentSessions,
    botDetectionEnabled: form.botDetectionEnabled,
    credentialStuffingEnabled: form.credentialStuffingEnabled,
    impossibleTravelMaxKmh: form.impossibleTravelMaxKmh,
    templateId: form.policyPreset,
    session: {
      accessTokenTtlMinutes: form.accessTokenTtlMinutes,
      idleTimeoutMinutes: form.sessionTimeout,
      webIdleTimeoutMinutes: form.webIdleTimeoutMinutes,
      mobileIdleTimeoutMinutes: form.mobileIdleTimeoutMinutes,
      defaultWebSessionTtlDays: form.defaultWebSessionTtlDays,
      rememberMeWebSessionTtlDays: form.rememberMeWebSessionTtlDays,
      defaultMobileSessionTtlDays: form.defaultMobileSessionTtlDays,
      rememberMeMobileSessionTtlDays: form.rememberMeMobileSessionTtlDays,
    },
    mfa: {
      enabled: form.mfaRequired,
      requireEveryLogin: form.mfaRequireEveryLogin,
      trustedDeviceDays: form.mfaTrustedDeviceDays,
      renewTrustOnSuccessfulLogin: form.mfaRenewTrustOnLogin,
    },
    mobileApproval: {
      enabled: form.mobileApprovalEnabled,
      requireEveryLogin: form.mobileRequireEveryLogin,
      requirePeriodicApproval: form.mobileRequirePeriodicApproval,
      periodicApprovalHours: form.mobilePeriodicApprovalHours,
      trustedMobileDeviceDays: form.mobileTrustedDeviceDays,
    },
    risk: {
      trustedDeviceMaxSkipRisk: form.trustedDeviceMaxSkipRisk,
      adminReviewMinRiskScore: Math.min(100, Math.max(90, form.adminReviewMinRiskScore)),
      actions: {
        high: 'challenge',
        critical: 'review_unless_hard_block',
      },
    },
    challengeOrder: form.challengeOrder,
    minimumFactorStrength: form.minimumFactorStrength,
    passkeyOnlyWhenEnrolled: form.passkeyOnlyWhenEnrolled,
    mfaSignedApprovalRequired: form.mfaSignedApprovalRequired,
    allowHighRiskEmailOtpFallback: form.allowHighRiskEmailOtpFallback,
    allowPasskeyApprovalFallback: form.allowPasskeyApprovalFallback,
    allowEnrollmentDuringLogin: form.allowEnrollmentDuringLogin,
    securityReview: {
      minimumEligibleApprovers: Math.max(1, form.securityReviewMinimumEligibleApprovers),
      emergencyRecoveryEnabled: form.securityReviewEmergencyRecoveryEnabled,
      selfApprovalAllowed: form.securityReviewSelfApprovalAllowed,
    },
  };
}

export interface EffectivePolicyRuleRef {
  name: string;
  enabled: boolean;
  actions?: unknown;
}

function policyHasAction(rule: EffectivePolicyRuleRef, action: string): boolean {
  if (!rule.enabled) return false;
  const raw = rule.actions;
  let parsed: string[] = [];
  if (Array.isArray(raw)) parsed = raw.map(String);
  else if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) parsed = p.map(String);
    } catch {
      parsed = [];
    }
  }
  return parsed.includes(action);
}

export interface EffectivePolicyViewProps {
  effectiveSsoPolicy: Record<string, unknown> | null;
  rules?: EffectivePolicyRuleRef[];
  templateId?: string | null;
  appliedTemplateIds?: string[];
  lastTemplateAppliedAt?: string | null;
  isCustomBaseline?: boolean;
  approvalRuleBaselineMismatch?: boolean;
}

export function EffectivePolicyView({
  effectiveSsoPolicy,
  rules = [],
  templateId,
  appliedTemplateIds = [],
  lastTemplateAppliedAt,
  isCustomBaseline,
  approvalRuleBaselineMismatch,
}: EffectivePolicyViewProps) {
  const rows = useMemo(() => {
    const session = (effectiveSsoPolicy?.session ?? {}) as Record<string, unknown>;
    const mfa = (effectiveSsoPolicy?.mfa ?? {}) as Record<string, unknown>;
    const mobile = (effectiveSsoPolicy?.mobileApproval ?? {}) as Record<string, unknown>;
    const risk = (effectiveSsoPolicy?.risk ?? {}) as Record<string, unknown>;
    const actions = (risk.actions ?? {}) as Record<string, string>;
    const legacy = (effectiveSsoPolicy?.legacy ?? {}) as Record<string, unknown>;
    const challenges = legacy.challengeOrder;
    const challengeOrderLabel = Array.isArray(challenges)
      ? challenges.map(String).join(' → ')
      : null;

    const approvalRule = rules.find((p) => policyHasAction(p, 'require_approval'));
    const mfaRule = rules.find((p) => policyHasAction(p, 'require_mfa'));
    const source = (ruleName?: string) => (ruleName ? `access rule: ${ruleName}` : 'baseline');

    return [
      {
        setting: 'Baseline preset',
        value: templateId ?? 'balanced-enterprise',
        source: 'baseline',
      },
      {
        setting: 'MFA',
        value:
          mfa.requireEveryLogin === true || legacy.mfaRequired === true
            ? 'Required'
            : mfa.enabled
              ? 'Enabled; risk-based'
              : 'Disabled',
        source: mfaRule ? source(mfaRule.name) : 'baseline',
      },
      {
        setting: 'Mobile approval',
        value: mobile.enabled ? 'Enabled' : 'Disabled',
        source: approvalRule ? source(approvalRule.name) : 'baseline',
      },
      {
        setting: 'Session TTL (web)',
        value: `${session.defaultWebSessionTtlDays ?? 7}d (remember-me ${session.rememberMeWebSessionTtlDays ?? 30}d)`,
        source: 'baseline',
      },
      {
        setting: 'Session TTL (mobile)',
        value: `${session.defaultMobileSessionTtlDays ?? 30}d (remember-me ${session.rememberMeMobileSessionTtlDays ?? 90}d)`,
        source: 'baseline',
      },
      {
        setting: 'Risk score 50–89',
        value: actions.high === 'challenge_plus_review' ? 'Strong MFA / recovery (review score-gated)' : 'Strong MFA / recovery',
        source: 'baseline',
      },
      {
        setting: 'Administrator review threshold',
        value: `${risk.adminReviewMinRiskScore ?? 90}+`,
        source: 'baseline',
      },
      {
        setting: 'Email OTP recovery below threshold',
        value: legacy.allowHighRiskEmailOtpFallback === false ? 'Disabled' : 'Enabled on explicit request',
        source: 'baseline',
      },
      {
        setting: 'Idle timeout (web / mobile)',
        value: `${session.webIdleTimeoutMinutes ?? session.idleTimeoutMinutes ?? 720}m / ${session.mobileIdleTimeoutMinutes ?? session.idleTimeoutMinutes ?? 10080}m`,
        source: 'baseline',
      },
      ...(challengeOrderLabel
        ? [
            {
              setting: 'Challenge order',
              value: challengeOrderLabel,
              source: 'baseline',
            },
          ]
        : []),
    ];
  }, [effectiveSsoPolicy, rules, templateId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Effective policy</CardTitle>
        <CardDescription>
          Resolved values from the org-security snapshot (baseline preset, saved overrides, and enabled
          access rules).
          {isCustomBaseline ? (
            <span className="mt-1 block font-medium text-amber-800">
              Custom preset: saved baseline overrides differ from the selected template defaults.
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {appliedTemplateIds.length > 0 && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm">
            <p className="font-medium text-indigo-900">Applied templates</p>
            <p className="mt-1 flex flex-wrap gap-1.5">
              {appliedTemplateIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200"
                >
                  {id}
                </span>
              ))}
            </p>
            {lastTemplateAppliedAt ? (
              <p className="mt-1 text-xs text-indigo-700">
                Last template change: {new Date(lastTemplateAppliedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        )}

        {approvalRuleBaselineMismatch ? (
          <Alert variant="warning">
            <AlertTitle>Mobile approval mismatch</AlertTitle>
            <AlertDescription>
              An enabled access rule requires mobile approval while baseline mobile approval is disabled.
              Users may see inconsistent challenge behavior until these are aligned.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Setting</th>
                <th className="py-2 pr-4 font-medium">Effective value</th>
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.setting} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{row.setting}</td>
                  <td className="py-2 pr-4 text-gray-700">{row.value}</td>
                  <td className="py-2 text-gray-500">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
