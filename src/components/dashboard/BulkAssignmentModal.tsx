"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { User, App, AppWithAccess } from '../../lib/api-client';
import apiClient from '../../lib/api-client';
import { 
  XMarkIcon, 
  UserPlusIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BulkAssignmentModalProps {
  apps: (App | AppWithAccess)[];
  isOpen: boolean;
  onClose: () => void;
  onAssignmentChange: () => void;
  currentUser?: {
    role: string;
    organizationId?: string;
  };
}

export const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({
  apps,
  isOpen,
  onClose,
  onAssignmentChange,
  currentUser
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<number | undefined>();
  const [expiresAt, setExpiresAt] = useState('');
  const [searchAppTerm, setSearchAppTerm] = useState('');
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [assignmentResults, setAssignmentResults] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset selections when modal opens
      setSelectedAppIds(new Set());
      setSelectedUserIds(new Set());
      setQuota(undefined);
      setExpiresAt('');
      setSearchAppTerm('');
      setSearchUserTerm('');
      setAssignmentResults(null);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      let orgUsers: User[] = [];
      
      if (currentUser?.role === 'SUPER_ADMIN') {
        // Super admin can see all users
        console.log('Loading users for SUPER_ADMIN - showing all users');
        const usersData = await apiClient.getUsers();
        // Handle paginated response
        const usersArray = Array.isArray(usersData) 
          ? usersData 
          : (usersData && typeof usersData === 'object' && 'data' in usersData) 
            ? usersData.data 
            : [];
        orgUsers = usersArray;
      } else if (currentUser?.role === 'ADMIN' && currentUser?.organizationId) {
        // Admin can only see users in their organization
        console.log('Loading users for ADMIN with org:', currentUser.organizationId, '- showing organization users only');
        orgUsers = await apiClient.getUsersForOrganization(
          currentUser.organizationId, 
          currentUser.role, 
          currentUser.organizationId
        );
      } else {
        console.warn('User does not have permission to assign apps');
        setUsers([]);
        return;
      }
      
      console.log('Loaded users for bulk assignment:', orgUsers.length);
      setUsers(orgUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppToggle = (appId: string) => {
    const newSelected = new Set(selectedAppIds);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedAppIds(newSelected);
  };

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAllApps = () => {
    if (selectedAppIds.size === filteredApps.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredApps.map(app => app.id)));
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedAppIds.size === 0 || selectedUserIds.size === 0) {
      alert('Please select at least one app and one user');
      return;
    }

    setIsAssigning(true);
    setAssignmentResults(null);
    
    try {
      const result = await apiClient.bulkAssignApps({
        appIds: Array.from(selectedAppIds),
        userIds: Array.from(selectedUserIds),
        quota: quota || undefined,
        expiresAt: expiresAt || undefined
      });

      setAssignmentResults(result);
      
      if (result.summary.failed === 0) {
        // All successful, refresh and close after a moment
        setTimeout(() => {
          onAssignmentChange();
          onClose();
        }, 2000);
      } else {
        // Some failed, keep modal open to show results
        onAssignmentChange();
      }
    } catch (error: any) {
      console.error('Failed to perform bulk assignment:', error);
      setAssignmentResults({
        success: false,
        error: error.message || 'Failed to perform bulk assignment',
        summary: {
          total: selectedAppIds.size * selectedUserIds.size,
          successful: 0,
          failed: selectedAppIds.size * selectedUserIds.size,
          skipped: 0
        }
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchAppTerm.toLowerCase()) ||
    app.slug.toLowerCase().includes(searchAppTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchUserTerm.toLowerCase()) || '') ||
    user.email.toLowerCase().includes(searchUserTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <UserPlusIcon className="w-6 h-6 mr-2 text-blue-600" />
              Bulk Assign Apps
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          {assignmentResults && (
            <div className={`mb-6 p-4 rounded-lg ${
              assignmentResults.success && assignmentResults.summary.failed === 0
                ? 'bg-green-50 border border-green-200'
                : assignmentResults.error
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start">
                {assignmentResults.success && assignmentResults.summary.failed === 0 ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    assignmentResults.success && assignmentResults.summary.failed === 0
                      ? 'text-green-800'
                      : 'text-yellow-800'
                  }`}>
                    {assignmentResults.success && assignmentResults.summary.failed === 0
                      ? 'Bulk Assignment Completed Successfully!'
                      : assignmentResults.error
                      ? 'Bulk Assignment Failed'
                      : 'Bulk Assignment Completed with Some Issues'}
                  </h3>
                  {assignmentResults.error ? (
                    <p className="text-red-700 text-sm">{assignmentResults.error}</p>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p className={assignmentResults.summary.failed === 0 ? 'text-green-700' : 'text-yellow-700'}>
                        <strong>Total:</strong> {assignmentResults.summary.total} assignments
                      </p>
                      <p className="text-green-700">
                        <strong>Successful:</strong> {assignmentResults.summary.successful}
                      </p>
                      {assignmentResults.summary.failed > 0 && (
                        <p className="text-red-700">
                          <strong>Failed:</strong> {assignmentResults.summary.failed}
                        </p>
                      )}
                      {assignmentResults.summary.skipped > 0 && (
                        <p className="text-yellow-700">
                          <strong>Skipped:</strong> {assignmentResults.summary.skipped}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Apps Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Apps ({selectedAppIds.size} selected)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllApps}
                  className="text-xs"
                >
                  {selectedAppIds.size === filteredApps.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <Input
                type="text"
                placeholder="Search apps..."
                value={searchAppTerm}
                onChange={(e) => setSearchAppTerm(e.target.value)}
                className="w-full"
              />

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No apps found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredApps.map((app) => (
                      <label
                        key={app.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAppIds.has(app.id)}
                          onChange={() => handleAppToggle(app.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.slug}</div>
                        </div>
                        {selectedAppIds.has(app.id) && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Users Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Users ({selectedUserIds.size} selected)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllUsers}
                  className="text-xs"
                >
                  {selectedUserIds.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <Input
                type="text"
                placeholder="Search users..."
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                className="w-full"
              />

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {users.length === 0 
                      ? (currentUser?.role === 'ADMIN' 
                          ? 'No users found in your organization' 
                          : 'No users found')
                      : 'No users match your search'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {user.name || user.email}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        {selectedUserIds.has(user.id) && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Quota (optional)"
              type="number"
              value={quota || ''}
              onChange={(e) => setQuota(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter usage quota"
            />
            <Input
              label="Expires At (optional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Summary */}
          {selectedAppIds.size > 0 && selectedUserIds.size > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Summary:</strong> This will create {selectedAppIds.size * selectedUserIds.size} assignment{selectedAppIds.size * selectedUserIds.size !== 1 ? 's' : ''} 
                ({selectedAppIds.size} app{selectedAppIds.size !== 1 ? 's' : ''} × {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''})
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAssigning}
            >
              {assignmentResults ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={
                isAssigning ||
                selectedAppIds.size === 0 ||
                selectedUserIds.size === 0
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAssigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Assign {selectedAppIds.size * selectedUserIds.size} Assignment{selectedAppIds.size * selectedUserIds.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

