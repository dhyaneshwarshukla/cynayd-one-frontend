"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient, UserSettings } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { MFASetupModal } from '@/components/auth/MFASetupModal';

// Define interfaces locally
// Using UserSettings from UI package

interface SystemSettings {
  organization: {
    name: string;
    slug: string;
    timezone: string;
    language: string;
    theme: string;
  };
  features: {
    hr: boolean;
    drive: boolean;
    connect: boolean;
    mail: boolean;
  };
  limits: {
    maxUsers: number;
    maxTeams: number;
    maxStorage: number;
    maxProducts: number;
  };
}

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings>({
    profile: {
      name: '',
      email: '',
      bio: '',
      timezone: 'UTC',
      language: 'en'
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      security: true,
      updates: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'organization',
      showEmail: false,
      showLastSeen: true,
      allowDirectMessages: true
    },
    security: {
      mfaEnabled: false,
      mfaMethod: 'email',
      sessionTimeout: 30,
      loginNotifications: true
    },
    preferences: {
      theme: 'light',
      sidebarCollapsed: false,
      compactMode: false,
      animations: true
    }
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    organization: {
      name: '',
      slug: '',
      timezone: 'UTC',
      language: 'en',
      theme: 'blue'
    },
    features: {
      hr: true,
      drive: true,
      connect: true,
      mail: true
    },
    limits: {
      maxUsers: 100,
      maxTeams: 20,
      maxStorage: 1000,
      maxProducts: 10
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      setIsAdmin(user?.role === 'admin');
    }
  }, [isAuthenticated, user]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch settings from API
      const [apiUserSettings, apiSystemSettings, mfaStatus] = await Promise.all([
        apiClient.getUserSettings(),
        apiClient.getSystemSettings(),
        apiClient.getMFAStatus().catch(() => ({ enabled: false })) // Fallback if MFA status fails
      ]);

      setUserSettings(apiUserSettings);
      setSystemSettings(apiSystemSettings);
      
      // Update MFA status from backend
      setUserSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          mfaEnabled: mfaStatus.enabled
        }
      }));
    } catch (err) {
      setError('Failed to load settings');
      console.error('Settings fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUserSettings = async () => {
    try {
      setError(null);
      await apiClient.updateUserSettings(userSettings);
      setSuccess('User settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save user settings');
      console.error('Save user settings error:', err);
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      setError(null);
      await apiClient.updateSystemSettings(systemSettings);
      setSuccess('System settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save system settings');
      console.error('Save system settings error:', err);
    }
  };

  const handleChangePassword = () => {
    alert('Change password feature coming soon!');
  };

  const handleEnableMFA = async () => {
    if (userSettings.security.mfaEnabled) {
      // Disable MFA
      try {
        setIsLoading(true);
        await apiClient.disableMFA('current-password');
        
        // Refresh MFA status from backend
        const mfaStatus = await apiClient.getMFAStatus();
        setUserSettings(prev => ({
          ...prev,
          security: { ...prev.security, mfaEnabled: mfaStatus.enabled }
        }));
        setSuccess('MFA disabled successfully');
      } catch (err: any) {
        setError(err.message || 'Failed to disable MFA');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Enable MFA - show setup modal
      setShowMFASetup(true);
    }
  };

  const handleMFASetupSuccess = async () => {
    // Refresh MFA status from backend
    const mfaStatus = await apiClient.getMFAStatus();
    setUserSettings(prev => ({
      ...prev,
      security: { ...prev.security, mfaEnabled: mfaStatus.enabled }
    }));
    setSuccess('MFA enabled successfully');
    setShowMFASetup(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    ...(isAdmin ? [{ id: 'system', label: 'System', icon: '🏢' }] : [])
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={userSettings.profile.name}
              onChange={(e) => setUserSettings({
                ...userSettings,
                profile: { ...userSettings.profile, name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={userSettings.profile.email}
              onChange={(e) => setUserSettings({
                ...userSettings,
                profile: { ...userSettings.profile, email: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={userSettings.profile.bio}
              onChange={(e) => setUserSettings({
                ...userSettings,
                profile: { ...userSettings.profile, bio: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={userSettings.profile.timezone}
                onChange={(e) => setUserSettings({
                  ...userSettings,
                  profile: { ...userSettings.profile, timezone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={userSettings.profile.language}
                onChange={(e) => setUserSettings({
                  ...userSettings,
                  profile: { ...userSettings.profile, language: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(userSettings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <p className="text-xs text-gray-500">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'push' && 'Receive push notifications in browser'}
                  {key === 'sms' && 'Receive notifications via SMS'}
                  {key === 'security' && 'Security-related notifications'}
                  {key === 'updates' && 'Product updates and announcements'}
                  {key === 'marketing' && 'Marketing and promotional content'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    notifications: { ...userSettings.notifications, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Visibility</label>
            <select
              value={userSettings.privacy.profileVisibility}
              onChange={(e) => setUserSettings({
                ...userSettings,
                privacy: { ...userSettings.privacy, profileVisibility: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="organization">Organization Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          {Object.entries(userSettings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <p className="text-xs text-gray-500">
                  {key === 'showEmail' && 'Show email address in profile'}
                  {key === 'showLastSeen' && 'Show when you were last active'}
                  {key === 'allowDirectMessages' && 'Allow others to send you direct messages'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    privacy: { ...userSettings.privacy, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">Multi-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userSettings.security.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {userSettings.security.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  onClick={handleEnableMFA}
                  variant="outline"
                  size="sm"
                  className={userSettings.security.mfaEnabled ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-green-300 text-green-700 hover:bg-green-50'}
                >
                  {userSettings.security.mfaEnabled ? 'Disable' : 'Enable'} MFA
                </Button>
              </div>
            </div>
            {userSettings.security.mfaEnabled && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">MFA Method</label>
                <select
                  value={userSettings.security.mfaMethod}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    security: { ...userSettings.security, mfaMethod: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="app">Authenticator App</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={userSettings.security.sessionTimeout}
                onChange={(e) => setUserSettings({
                  ...userSettings,
                  security: { ...userSettings.security, sessionTimeout: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Login Notifications</label>
                <p className="text-xs text-gray-500">Get notified of new login attempts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userSettings.security.loginNotifications}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    security: { ...userSettings.security, loginNotifications: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleChangePassword}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferenceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">App Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select
              value={userSettings.preferences.theme}
              onChange={(e) => setUserSettings({
                ...userSettings,
                preferences: { ...userSettings.preferences, theme: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          {Object.entries(userSettings.preferences).filter(([key]) => key !== 'theme').map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <p className="text-xs text-gray-500">
                  {key === 'sidebarCollapsed' && 'Start with sidebar collapsed'}
                  {key === 'compactMode' && 'Use compact layout for lists'}
                  {key === 'animations' && 'Enable smooth animations and transitions'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    preferences: { ...userSettings.preferences, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={systemSettings.organization.name}
              onChange={(e) => setSystemSettings({
                ...systemSettings,
                organization: { ...systemSettings.organization, name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={systemSettings.organization.slug}
              onChange={(e) => setSystemSettings({
                ...systemSettings,
                organization: { ...systemSettings.organization, slug: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={systemSettings.organization.timezone}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  organization: { ...systemSettings.organization, timezone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={systemSettings.organization.language}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  organization: { ...systemSettings.organization, language: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={systemSettings.organization.theme}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  organization: { ...systemSettings.organization, theme: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="orange">Orange</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Access</h3>
        <div className="space-y-4">
          {Object.entries(systemSettings.features).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.toUpperCase()} Management
                </label>
                <p className="text-xs text-gray-500">
                  Enable {key} management features for your organization
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    features: { ...systemSettings.features, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(systemSettings.limits).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                Max {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  limits: { ...systemSettings.limits, [key]: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'privacy': return renderPrivacySettings();
      case 'security': return renderSecuritySettings();
      case 'preferences': return renderPreferenceSettings();
      case 'system': return renderSystemSettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <UnifiedLayout
      title="Settings"
      subtitle="Manage your account preferences and system configuration"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={activeTab === 'system' ? handleSaveSystemSettings : handleSaveUserSettings}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <span className="mr-2">💾</span>
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="mr-2">🔄</span>
            Reset
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      <ResponsiveContainer maxWidth="full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="p-6">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                renderActiveTab()
              )}
            </Card>
          </div>
        </div>
      </ResponsiveContainer>

      {/* MFA Setup Modal */}
      <MFASetupModal
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onSuccess={handleMFASetupSuccess}
      />
    </UnifiedLayout>
  );
}
