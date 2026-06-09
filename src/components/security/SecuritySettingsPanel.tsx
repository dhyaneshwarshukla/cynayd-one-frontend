'use client';

import { Button } from '@/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';

export interface SecuritySettingsFormState {
  mfaRequired: boolean;
  passkeySatisfiesMfa: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number;
  failedLoginLimit: number;
  accountLockoutDuration: number;
  maxConcurrentSessions: number;
  botDetectionEnabled: boolean;
  credentialStuffingEnabled: boolean;
  impossibleTravelMaxKmh: number;
}

interface SecuritySettingsPanelProps {
  settings: SecuritySettingsFormState;
  onChange: (next: SecuritySettingsFormState) => void;
  onSave: () => void;
  saving?: boolean;
}

export function SecuritySettingsPanel({
  settings,
  onChange,
  onSave,
  saving,
}: SecuritySettingsPanelProps) {
  const set = <K extends keyof SecuritySettingsFormState>(
    key: K,
    value: SecuritySettingsFormState[K]
  ) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Multi-factor authentication</CardTitle>
          <CardDescription>Require MFA for users in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.mfaRequired}
              onChange={(e) => set('mfaRequired', e.target.checked)}
              className="rounded border-gray-300 text-indigo-600"
            />
            Require MFA for all users
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.passkeySatisfiesMfa}
              onChange={(e) => set('passkeySatisfiesMfa', e.target.checked)}
              className="rounded border-gray-300 text-indigo-600"
            />
            Passkey login satisfies MFA (skip second factor when passkey is used)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password policy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Minimum length
            <input
              type="number"
              min={6}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={settings.passwordMinLength}
              onChange={(e) => set('passwordMinLength', Number(e.target.value))}
            />
          </label>
          {(
            [
              ['passwordRequireUppercase', 'Require uppercase'],
              ['passwordRequireLowercase', 'Require lowercase'],
              ['passwordRequireNumbers', 'Require numbers'],
              ['passwordRequireSymbols', 'Require symbols'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="rounded border-gray-300 text-indigo-600"
              />
              {label}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session and lockout</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            Session timeout (minutes)
            <input
              type="number"
              min={5}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={settings.sessionTimeout}
              onChange={(e) => set('sessionTimeout', Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Failed login limit
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={settings.failedLoginLimit}
              onChange={(e) => set('failedLoginLimit', Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Lockout duration (minutes)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={settings.accountLockoutDuration}
              onChange={(e) => set('accountLockoutDuration', Number(e.target.value))}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Threat controls</CardTitle>
          <CardDescription>Bot detection, credential stuffing, and travel checks.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Max concurrent sessions
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={settings.maxConcurrentSessions}
              onChange={(e) => set('maxConcurrentSessions', Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Impossible travel max (km/h)
            <input
              type="number"
              min={100}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={settings.impossibleTravelMaxKmh}
              onChange={(e) => set('impossibleTravelMaxKmh', Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.botDetectionEnabled}
              onChange={(e) => set('botDetectionEnabled', e.target.checked)}
            />
            Bot detection enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.credentialStuffingEnabled}
              onChange={(e) => set('credentialStuffingEnabled', e.target.checked)}
            />
            Credential stuffing protection
          </label>
        </CardContent>
      </Card>

      <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">
        Save security settings
      </Button>
    </div>
  );
}

export function mapApiToSecuritySettings(api: Record<string, unknown>): SecuritySettingsFormState {
  return {
    mfaRequired: Boolean(api.mfaRequired),
    passkeySatisfiesMfa: api.passkeySatisfiesMfa !== false,
    passwordMinLength: Number(api.passwordMinLength ?? 8),
    passwordRequireUppercase: api.passwordRequireUppercase !== false,
    passwordRequireLowercase: api.passwordRequireLowercase !== false,
    passwordRequireNumbers: api.passwordRequireNumbers !== false,
    passwordRequireSymbols: Boolean(api.passwordRequireSymbols),
    sessionTimeout: Number(api.sessionTimeout ?? 30),
    failedLoginLimit: Number(api.failedLoginLimit ?? 5),
    accountLockoutDuration: Number(api.accountLockoutDuration ?? 15),
    maxConcurrentSessions: Number(api.maxConcurrentSessions ?? 10),
    botDetectionEnabled: api.botDetectionEnabled !== false,
    credentialStuffingEnabled: api.credentialStuffingEnabled !== false,
    impossibleTravelMaxKmh: Number(api.impossibleTravelMaxKmh ?? 900),
  };
}
