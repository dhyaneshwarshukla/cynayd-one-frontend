"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { MFASetupModal } from '@/components/auth/MFASetupModal';
import { Button } from '@/components/common/Button';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';

// Define UserSettings interface locally
interface UserSettings {
  profile: {
    name: string;
    email: string;
    bio: string;
    timezone: string;
    language: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    security: boolean;
    updates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: string;
    showEmail: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
  };
  security: {
    mfaEnabled: boolean;
    mfaMethod: string;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
  preferences: {
    theme: string;
    sidebarCollapsed: boolean;
    compactMode: boolean;
    animations: boolean;
  };
}

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [showMFASetup, setShowMFASetup] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch user settings or set defaults
      setUserSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: user.name || '',
          email: user.email || ''
        }
      }));
      
      // Fetch real MFA status from backend
      fetchMFAStatus();
    }
  }, [isAuthenticated, user]);

  const fetchMFAStatus = async () => {
    try {
      const mfaStatus = await apiClient.getMFAStatus();
      setUserSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          mfaEnabled: mfaStatus.enabled
        }
      }));
    } catch (error) {
      console.error('Failed to fetch MFA status:', error);
    }
  };

  const handleEnableMFA = async () => {
    if (userSettings.security.mfaEnabled) {
      // Disable MFA
      try {
        await apiClient.disableMFA('current-password');
        // Refresh MFA status from backend
        await fetchMFAStatus();
      } catch (err: any) {
        console.error('Failed to disable MFA:', err);
      }
    } else {
      // Enable MFA - show setup modal
      setShowMFASetup(true);
    }
  };

  const handleMFASetupSuccess = async () => {
    // Refresh MFA status from backend
    await fetchMFAStatus();
    setShowMFASetup(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'privacy', name: 'Privacy', icon: '👤' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={user.name || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">Greenwich Mean Time</option>
              </select>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Update Password
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Multi-Factor Authentication (MFA)</h3>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">Multi-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userSettings.security.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userSettings.security.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
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
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Product Updates</p>
                    <p className="text-sm text-gray-600">Get notified about new product releases</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Security Alerts</p>
                    <p className="text-sm text-gray-600">Important security notifications</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Team Invitations</p>
                    <p className="text-sm text-gray-600">When you're invited to join a team</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Browser Notifications</p>
                    <p className="text-sm text-gray-600">Show notifications in your browser</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Save Preferences
            </button>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Profile Visibility</p>
                    <p className="text-sm text-gray-600">Control who can see your profile information</p>
                  </div>
                  <select className="px-3 py-1 border border-gray-300 rounded-md">
                    <option value="private">Private</option>
                    <option value="team">Team Only</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Activity Tracking</p>
                    <p className="text-sm text-gray-600">Allow tracking of your activity for analytics</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download a copy of your personal data
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Request Data Export
              </button>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Deletion</h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all associated data
              </p>
              <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <UnifiedLayout variant="dashboard"
      title="Settings"
      subtitle="Manage your account preferences and security settings"
    >
      <div className="max-w-4xl">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <Card className="p-6">
          {renderTabContent()}
        </Card>
      </div>

      {/* MFA Setup Modal */}
      <MFASetupModal
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onSuccess={handleMFASetupSuccess}
      />
    </UnifiedLayout>
  );
}
