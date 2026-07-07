'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionLock } from '@/contexts/SessionLockContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient, UserSettings, SystemSettings, OrgLocation } from '@/lib/api-client';
import { ResponsiveContainer } from '@/components/layout/ResponsiveLayout';
import { MFASetupModal } from '@/components/auth/MFASetupModal';
import { DisableMFAModal } from '@/components/auth/DisableMFAModal';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { PINSetupModal } from '@/components/auth/PINSetupModal';
import { PasskeyManager } from '@/components/security/PasskeyManager';
import PlanManagement from '@/components/admin/PlanManagement';
import { LocationsSettings } from '@/components/settings/LocationsSettings';
import { isAdminUser } from '@/utils/tenant';

const VALID_TABS = ['profile', 'security', 'preferences', 'plan', 'organization', 'locations'] as const;
type TabId = (typeof VALID_TABS)[number];

type MfaStatus = {
  enabled: boolean;
  hasSecret?: boolean;
  methods?: string[];
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: {
    name: '',
    email: '',
    bio: '',
    timezone: 'UTC',
    language: 'en',
    primaryLocationId: null,
    effectiveTimezone: 'UTC',
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
    security: true,
    updates: true,
    marketing: false,
  },
  privacy: {
    profileVisibility: 'organization',
    showEmail: false,
    showLastSeen: true,
    allowDirectMessages: true,
  },
  security: {
    mfaEnabled: false,
    mfaMethod: 'email',
    sessionTimeout: 30,
    loginNotifications: true,
  },
  preferences: {
    theme: 'light',
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
  },
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  organization: {
    name: '',
    slug: '',
    timezone: 'UTC',
    language: 'en',
    theme: 'blue',
    defaultLocationId: null,
  },
  features: { hr: true, drive: true, connect: true, mail: true },
  limits: { maxUsers: 100, maxTeams: 20, maxStorage: 1000, maxApps: 10 },
};

function applyPreferences(preferences: UserSettings['preferences']) {
  const root = document.documentElement;
  if (preferences.theme === 'dark') {
    root.classList.add('dark');
  } else if (preferences.theme === 'light') {
    root.classList.remove('dark');
  } else if (preferences.theme === 'auto') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  localStorage.setItem('theme', preferences.theme);
  localStorage.setItem('compactMode', String(preferences.compactMode));
  localStorage.setItem('animations', String(preferences.animations));
  if (preferences.compactMode) {
    document.body.classList.add('compact-mode');
  } else {
    document.body.classList.remove('compact-mode');
  }
  if (!preferences.animations) {
    document.body.classList.add('no-animations');
  } else {
    document.body.classList.remove('no-animations');
  }
}

function SettingsPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { notifyPinSetupComplete } = useSessionLock();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userIsAdmin = isAdminUser(user?.role);

  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [originalUser, setOriginalUser] = useState<UserSettings | null>(null);
  const [originalSystem, setOriginalSystem] = useState<SystemSettings | null>(null);

  const [pinStatus, setPinStatus] = useState<{ pinEnabled: boolean; hasPIN: boolean } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showDisableMFA, setShowDisableMFA] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [pinUpdating, setPinUpdating] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>({ enabled: false, methods: [] });
  const [orgLocations, setOrgLocations] = useState<OrgLocation[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const normalized =
      tabParam === 'system' ? 'organization' : tabParam;
    if (normalized && VALID_TABS.includes(normalized as TabId)) {
      setActiveTab(normalized as TabId);
    }
  }, [searchParams]);

  const selectTab = (tabId: TabId) => {
    setActiveTab(tabId);
    router.replace(`/settings?tab=${tabId}`, { scroll: false });
  };

  const flash = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  };

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const [apiUser, mfaStatus, pin] = await Promise.all([
        apiClient.getUserSettings(),
        apiClient.getMFAStatus().catch(() => ({ enabled: false })),
        apiClient.getPINStatus().catch(() => ({ pinEnabled: false, hasPIN: false })),
      ]);

      const merged: UserSettings = {
        ...apiUser,
        security: { ...apiUser.security, mfaEnabled: mfaStatus.enabled },
      };
      setUserSettings(merged);
      setOriginalUser(JSON.parse(JSON.stringify(merged)));
      setPinStatus(pin);
      setMfaStatus(mfaStatus);
      applyPreferences(merged.preferences);

      try {
        const snapshot = await apiClient.getOrgLocations();
        setOrgLocations(snapshot.locations);
      } catch {
        setOrgLocations([]);
      }

      if (userIsAdmin) {
        try {
          const sys = await apiClient.getSystemSettings();
          setSystemSettings(sys);
          setOriginalSystem(JSON.parse(JSON.stringify(sys)));
        } catch {
          /* org admin without org — system tab shows message */
        }
      }
    } catch {
      flash('Failed to load settings', true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userIsAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveProfile = async () => {
    if (!userSettings.profile.name?.trim()) {
      flash('Name is required', true);
      return;
    }
    try {
      await apiClient.updateUserSettings(userSettings);
      const refreshed = await apiClient.getUserSettings();
      const merged: UserSettings = {
        ...refreshed,
        security: { ...userSettings.security, mfaEnabled: userSettings.security.mfaEnabled },
      };
      setUserSettings(merged);
      setOriginalUser(JSON.parse(JSON.stringify(merged)));
      applyPreferences(merged.preferences);
      flash('Profile saved');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to save profile', true);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await apiClient.updateUserSettings(userSettings);
      setOriginalUser(JSON.parse(JSON.stringify(userSettings)));
      applyPreferences(userSettings.preferences);
      flash('Appearance saved');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to save appearance', true);
    }
  };

  const handleSaveOrganization = async () => {
    const { organization } = systemSettings;
    if (!organization.name?.trim()) {
      flash('Organization name is required', true);
      return;
    }
    if (!organization.slug?.trim()) {
      flash('Organization slug is required', true);
      return;
    }
    if (!/^[a-z0-9-]+$/.test(organization.slug)) {
      flash('Slug must use lowercase letters, numbers, and hyphens only', true);
      return;
    }
    try {
      await apiClient.updateSystemSettings(systemSettings);
      setOriginalSystem(JSON.parse(JSON.stringify(systemSettings)));
      flash('Organization settings saved');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to save organization', true);
    }
  };

  const handleReset = () => {
    if (activeTab === 'organization' && originalSystem) {
      setSystemSettings(JSON.parse(JSON.stringify(originalSystem)));
    } else if (originalUser) {
      setUserSettings(JSON.parse(JSON.stringify(originalUser)));
      applyPreferences(originalUser.preferences);
    }
    flash('Changes reset');
  };

  const handleMfaToggle = async () => {
    if (userSettings.security.mfaEnabled) {
      setShowDisableMFA(true);
    } else {
      setShowMFASetup(true);
    }
  };

  const handleMfaDisableSuccess = async () => {
    try {
      setIsLoading(true);
      const mfaStatus = await apiClient.getMFAStatus();
      setUserSettings((prev) => ({
        ...prev,
        security: { ...prev.security, mfaEnabled: mfaStatus.enabled },
      }));
      setMfaStatus(mfaStatus);
      flash('MFA disabled');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to refresh MFA status', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSuccess = async () => {
    const mfaStatus = await apiClient.getMFAStatus();
    setUserSettings((prev) => ({
      ...prev,
      security: { ...prev.security, mfaEnabled: mfaStatus.enabled },
    }));
    setMfaStatus(mfaStatus);
    setShowMFASetup(false);
    flash('MFA enabled');
  };

  const handlePinDisable = async () => {
    if (
      !window.confirm(
        'Disable portal lock PIN? You will need to sign in again if the session locks.'
      )
    ) {
      return;
    }
    try {
      await apiClient.disablePIN();
      setPinStatus({ pinEnabled: false, hasPIN: false });
      flash('PIN disabled');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to disable PIN', true);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'preferences', label: 'Appearance' },
    ...(userIsAdmin
      ? [
          { id: 'plan' as TabId, label: 'Plan & billing' },
          { id: 'organization' as TabId, label: 'Organization' },
          { id: 'locations' as TabId, label: 'Locations & Hours' },
        ]
      : []),
  ];

  const showSave =
    activeTab === 'profile' ||
    activeTab === 'preferences' ||
    activeTab === 'organization';

  const onSave = () => {
    if (activeTab === 'profile') void handleSaveProfile();
    else if (activeTab === 'preferences') void handleSavePreferences();
    else if (activeTab === 'organization') void handleSaveOrganization();
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <UnifiedLayout title="Settings" subtitle="Loading…">
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Settings"
      subtitle="Account, security, and organization preferences"
      actions={
        showSave ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave}>Save changes</Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        ) : undefined
      }
    >
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <ResponsiveContainer maxWidth="full">
        <div className="flex flex-col gap-6 lg:flex-row">
          <Card className="p-3 lg:w-56 lg:shrink-0">
            <nav className="flex flex-wrap gap-1 lg:flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>

          <Card className="min-w-0 flex-1 p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : activeTab === 'profile' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600">Name and regional preferences</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={userSettings.profile.name}
                    onChange={(e) =>
                      setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, name: e.target.value },
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={userSettings.profile.email}
                    disabled={!userIsAdmin}
                    onChange={(e) =>
                      setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, email: e.target.value },
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {!userIsAdmin && (
                    <p className="mt-1 text-xs text-gray-500">
                      Contact an administrator to change your email.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    value={userSettings.profile.bio || ''}
                    onChange={(e) =>
                      setUserSettings({
                        ...userSettings,
                        profile: { ...userSettings.profile, bio: e.target.value },
                      })
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Primary office
                    </label>
                    <select
                      value={userSettings.profile.primaryLocationId || ''}
                      onChange={(e) =>
                        setUserSettings({
                          ...userSettings,
                          profile: {
                            ...userSettings.profile,
                            primaryLocationId: e.target.value || null,
                          },
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Use organization default</option>
                      {orgLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.timezone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Effective timezone
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={userSettings.profile.effectiveTimezone || userSettings.profile.timezone}
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Resolved from your primary office, or the org default location.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Personal timezone override
                    </label>
                    <select
                      value={userSettings.profile.timezone}
                      onChange={(e) =>
                        setUserSettings({
                          ...userSettings,
                          profile: { ...userSettings.profile, timezone: e.target.value },
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Asia/Kolkata">India</option>
                      <option value="Asia/Singapore">Singapore</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      value={userSettings.profile.language}
                      onChange={(e) =>
                        setUserSettings({
                          ...userSettings,
                          profile: { ...userSettings.profile, language: e.target.value },
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <Link href="/settings/privacy" className="text-blue-600 hover:underline">
                    Privacy & data requests (export / deletion)
                  </Link>
                </p>
              </div>
            ) : activeTab === 'security' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                  <p className="text-sm text-gray-600">Password, MFA, and portal lock</p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">Password</p>
                      <p className="text-sm text-gray-600">Update your sign-in password</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                      Change password
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">Multi-factor authentication</p>
                      <p className="text-sm text-gray-600">Authenticator app or email OTP</p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          userSettings.security.mfaEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {userSettings.security.mfaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {mfaStatus.methods?.length ? (
                        <p className="mt-2 text-xs text-gray-500">
                          Active methods: {mfaStatus.methods.join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void handleMfaToggle()}>
                      {userSettings.security.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">Portal lock PIN</p>
                      <p className="text-sm text-gray-600">
                        Unlock the app after inactivity without signing out
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          pinStatus?.pinEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pinStatus?.pinEnabled ? 'Enabled' : 'Not set'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {pinStatus?.pinEnabled ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPinUpdating(true);
                              setShowPINSetup(true);
                            }}
                          >
                            Update PIN
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-700"
                            onClick={() => void handlePinDisable()}
                          >
                            Disable
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPinUpdating(false);
                            setShowPINSetup(true);
                          }}
                        >
                          Set up PIN
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-3 font-medium text-gray-900">Passkeys</p>
                  <PasskeyManager
                    onMessage={(text, type) => flash(text, type !== 'success')}
                  />
                </div>

                {userIsAdmin && (
                  <Card className="border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">Organization security</p>
                        <p className="text-sm text-gray-600">
                          Events, sessions, threats, and org-wide password/MFA policy
                        </p>
                      </div>
                      <Link href="/security">
                        <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                          Security Center
                        </Button>
                      </Link>
                    </div>
                    <p className="mt-3 text-xs text-gray-600">
                      <Link href="/admin/security-policies" className="text-indigo-600 hover:underline">
                        Access policies
                      </Link>{' '}
                      — block or require MFA by country, VPN, and schedule.
                    </p>
                  </Card>
                )}
              </div>
            ) : activeTab === 'preferences' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
                  <p className="text-sm text-gray-600">Theme and display options</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Theme</label>
                  <select
                    value={userSettings.preferences.theme}
                    onChange={(e) => {
                      const theme = e.target.value as UserSettings['preferences']['theme'];
                      const next = { ...userSettings.preferences, theme };
                      setUserSettings({ ...userSettings, preferences: next });
                      applyPreferences(next);
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">System</option>
                  </select>
                </div>
                <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <span className="text-sm text-gray-700">Compact layout</span>
                  <input
                    type="checkbox"
                    checked={userSettings.preferences.compactMode}
                    onChange={(e) => {
                      const next = {
                        ...userSettings.preferences,
                        compactMode: e.target.checked,
                      };
                      setUserSettings({ ...userSettings, preferences: next });
                      applyPreferences(next);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <span className="text-sm text-gray-700">Animations</span>
                  <input
                    type="checkbox"
                    checked={userSettings.preferences.animations}
                    onChange={(e) => {
                      const next = {
                        ...userSettings.preferences,
                        animations: e.target.checked,
                      };
                      setUserSettings({ ...userSettings, preferences: next });
                      applyPreferences(next);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
              </div>
            ) : activeTab === 'plan' ? (
              user?.organizationId ? (
                <PlanManagement organizationId={user.organizationId} />
              ) : (
                <p className="text-sm text-gray-600">
                  No organization linked to your account. Contact an administrator.
                </p>
              )
            ) : activeTab === 'organization' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
                  <p className="text-sm text-gray-600">Name, slug, and regional defaults</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={systemSettings.organization.name}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        organization: {
                          ...systemSettings.organization,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    value={systemSettings.organization.slug}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        organization: {
                          ...systemSettings.organization,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                        },
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Default timezone
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={systemSettings.organization.timezone}
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Managed via the{' '}
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => selectTab('locations')}
                      >
                        Locations & Hours
                      </button>{' '}
                      tab (set a default office location).
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Brand color
                    </label>
                    <select
                      value={systemSettings.organization.theme}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          organization: {
                            ...systemSettings.organization,
                            theme: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : activeTab === 'locations' ? (
              <LocationsSettings onMessage={flash} />
            ) : null}
          </Card>
        </div>
      </ResponsiveContainer>

      <MFASetupModal
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onSuccess={() => void handleMfaSuccess()}
      />
      <DisableMFAModal
        isOpen={showDisableMFA}
        onClose={() => setShowDisableMFA(false)}
        onSuccess={() => void handleMfaDisableSuccess()}
      />
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => flash('Password updated')}
      />
      <PINSetupModal
        isOpen={showPINSetup}
        onClose={() => setShowPINSetup(false)}
        isUpdate={pinUpdating}
        onSuccess={async () => {
          const pin = await apiClient.getPINStatus();
          setPinStatus(pin);
          notifyPinSetupComplete();
          setShowPINSetup(false);
          flash(pinUpdating ? 'PIN updated' : 'PIN enabled');
        }}
      />
    </UnifiedLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <UnifiedLayout title="Settings" subtitle="Loading…">
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        </UnifiedLayout>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
