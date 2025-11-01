"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface ProfileStats {
  products: number;
  lastActive: string;
  activity: string;
  memberSince: Date;
  totalApps: number;
  recentActivity: number;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Set page title
  useEffect(() => {
    document.title = 'Profile | CYNAYD One';
  }, []);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const stats = await apiClient.getUserProfileStats();
        setProfileStats(stats);
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (isAuthenticated && user) {
      fetchProfileStats();
    }
  }, [isAuthenticated, user]);

  const onSubmitPasswordChange = async (data: ChangePasswordFormData) => {
    try {
      setIsChangingPassword(true);
      setPasswordMessage(null);
      
      await apiClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowChangePassword(false);
      reset();
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordMessage({ 
        type: 'error', 
        text: error.message || 'Failed to change password. Please try again.' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout
      title="Profile"
      subtitle="Manage your personal information and account settings"
      variant="dashboard"
    >
      <div className="w-full">
        <Card className="p-6">
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-white shadow-lg"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=3b82f6&color=ffffff&size=80`}
                  alt={`${user.name || user.email} profile`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6b7280&color=ffffff&size=80`;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-4 border-white rounded-full"></span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name || user.email}</h2>
                <p className="text-gray-600 capitalize">{user.role?.toLowerCase()}</p>
                <p className="text-sm text-green-600 font-medium">● Online</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    placeholder="Your email address"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email addresses can only be changed by administrators
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoadingStats ? '...' : profileStats?.products || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Last Active</p>
                      <p className="text-sm font-bold text-gray-900">
                        {isLoadingStats ? '...' : profileStats?.lastActive || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Activity</p>
                      <p className="text-sm font-bold text-gray-900">
                        {isLoadingStats ? '...' : profileStats?.activity || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                <button
                  onClick={() => {
                    setShowChangePassword(!showChangePassword);
                    setPasswordMessage(null);
                    reset();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  {showChangePassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {passwordMessage && (
                <div className={`mb-4 p-3 rounded-md ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              {showChangePassword && (
                <form onSubmit={handleSubmit(onSubmitPasswordChange)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      {...register('currentPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your current password"
                    />
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      {...register('newPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your new password"
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm your new password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? 'Changing...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordMessage(null);
                        reset();
                      }}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Card>
      </div>
    </UnifiedLayout>
  );
}
