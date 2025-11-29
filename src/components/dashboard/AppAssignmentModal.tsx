"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { User, App, AppWithAccess } from '../../lib/api-client';
import apiClient from '../../lib/api-client';
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';

interface AppAssignmentModalProps {
  app: App | AppWithAccess;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentChange: () => void;
  currentUser?: {
    role: string;
    organizationId?: string;
  };
}

interface UserAppAccess {
  id: string;
  userId: string;
  appId: string;
  isActive?: boolean;
  quota?: number;
  expiresAt?: string;
  assignedAt: string;
  usedQuota: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const AppAssignmentModal: React.FC<AppAssignmentModalProps> = ({
  app,
  isOpen,
  onClose,
  onAssignmentChange,
  currentUser
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<UserAppAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quota, setQuota] = useState<number | undefined>();
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, app.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('=== APP ASSIGNMENT MODAL DEBUG ===');
      console.log('Current user:', currentUser);
      console.log('App:', app);
      console.log('===============================');
      
      // Load users and assignments based on current user's role
      let orgUsers: User[] = [];
      let userAppAccess: any[] = [];
      
      if (currentUser?.role === 'SUPER_ADMIN') {
        // Super admin can see all users and assignments
        console.log('Loading data for SUPER_ADMIN - showing all users');
        const [usersData, userAppAccessData] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getAllUserAppAccess()
        ]);
        // Handle paginated response for usersData
        orgUsers = Array.isArray(usersData) 
          ? usersData 
          : (usersData && typeof usersData === 'object' && 'data' in usersData) 
            ? usersData.data 
            : [];
        userAppAccess = Array.isArray(userAppAccessData) ? userAppAccessData : [];
      } else if (currentUser?.role === 'ADMIN' && currentUser?.organizationId) {
        // Admin can only see users in their organization
        console.log('Loading data for ADMIN with org:', currentUser.organizationId, '- showing organization users only');
        [orgUsers, userAppAccess] = await Promise.all([
          apiClient.getUsersForOrganization(currentUser.organizationId, currentUser.role, currentUser.organizationId),
          apiClient.getAllUserAppAccess() // Backend now filters by organization
        ]);
      } else {
        // Regular users cannot assign apps
        console.warn('User does not have permission to assign apps');
        return;
      }
      
      console.log('Loaded users:', orgUsers.length);
      console.log('Loaded assignments:', userAppAccess.length);
      
      setUsers(orgUsers);
      
      // Filter assignments for this specific app
      // Only include active, non-expired access records
      const appAssignments = userAppAccess.filter(access => {
        if (access.appId !== app.id) return false;
        // Check if access is active
        if (!access.isActive) return false;
        // Check if access is not expired
        if (access.expiresAt && new Date(access.expiresAt) < new Date()) return false;
        return true;
      });
      setAssignedUsers(appAssignments);
      
      console.log('App assignments for this app:', appAssignments.length);
    } catch (error) {
      console.error('Failed to load assignment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignApp = async () => {
    if (!selectedUserId) return;
    
    setIsAssigning(true);
    try {
      await apiClient.assignAppToUser(
        app.id,
        selectedUserId,
        quota || undefined,
        expiresAt || undefined
      );
      
      // Refresh data
      await loadData();
      onAssignmentChange();
      
      // Reset form
      setSelectedUserId('');
      setQuota(undefined);
      setExpiresAt('');
    } catch (error) {
      console.error('Failed to assign app:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeApp = async (userId: string) => {
    try {
      await apiClient.revokeAppFromUser(app.id, userId);
      await loadData();
      onAssignmentChange();
    } catch (error) {
      console.error('Failed to revoke app:', error);
    }
  };

  const getAvailableUsers = () => {
    const assignedUserIds = new Set(assignedUsers.map(access => access.userId));
    return users.filter(user => !assignedUserIds.has(user.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {app.systemApp ? 'Assign System App' : 'Manage App Access'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {app.name} {app.systemApp && <span className="text-purple-600 font-medium">(System App)</span>}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assign New User */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assign to User</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {currentUser?.role === 'SUPER_ADMIN' 
                    ? 'You can assign this app to any user across all organizations.'
                    : 'You can assign this app to users in your organization only.'
                  }
                </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Select User
                        </label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={getAvailableUsers().length === 0}
                        >
                          <option value="">
                            {getAvailableUsers().length === 0 
                              ? 'No users available for assignment' 
                              : 'Choose a user...'
                            }
                          </option>
                          {getAvailableUsers().map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email}) - {user.role}
                            </option>
                          ))}
                        </select>
                        {getAvailableUsers().length === 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            {currentUser?.role === 'SUPER_ADMIN' 
                              ? 'All users already have access to this app.'
                              : 'All users in your organization already have access to this app.'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Quota (optional)
                        </label>
                        <Input
                          type="number"
                          value={quota || ''}
                          onChange={(e) => setQuota(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Usage limit"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Expires At (optional)
                        </label>
                        <Input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                <div className="mt-4">
                  <Button
                    onClick={handleAssignApp}
                    disabled={!selectedUserId || isAssigning || getAvailableUsers().length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isAssigning ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                    )}
                    Assign App
                  </Button>
                </div>
              </div>

              {/* Current Assignments */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h3>
                {assignedUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No users assigned to this app</p>
                ) : (
                  <div className="space-y-3">
                    {assignedUsers.map(access => (
                      <div key={access.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium text-gray-900">{access.user.name}</p>
                              <p className="text-sm text-gray-500">{access.user.email}</p>
                            </div>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {access.user.role}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Assigned: {new Date(access.assignedAt).toLocaleDateString()}</span>
                            {access.quota && (
                              <span>Quota: {access.usedQuota}/{access.quota}</span>
                            )}
                            {access.expiresAt && (
                              <span>Expires: {new Date(access.expiresAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRevokeApp(access.userId)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinusIcon className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
