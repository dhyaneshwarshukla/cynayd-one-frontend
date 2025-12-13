"use client";

import React from 'react';
import Link from 'next/link';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { User } from '@/lib/api-client';

interface UserListProps {
  users: User[];
  loading: boolean;
  selectedUsers: string[];
  onSelectUser: (userId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onToggleApps: (userId: string) => void;
  expandedUsers: Set<string>;
  userApps: Record<string, any[]>;
  loadingApps: Record<string, boolean>;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchTerm?: string;
  roleFilter?: string;
  statusFilter?: string;
  onInviteClick?: () => void;
}

const getRoleBadgeColor = (role?: string): string => {
  const roleUpper = role?.toUpperCase() || '';
  if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
    return 'bg-red-100 text-red-800';
  } else if (roleUpper === 'MANAGER') {
    return 'bg-purple-100 text-purple-800';
  } else {
    return 'bg-blue-100 text-blue-800';
  }
};

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onToggleApps,
  expandedUsers,
  userApps,
  loadingApps,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchTerm,
  roleFilter,
  statusFilter,
  onInviteClick,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center space-x-4">
              <SkeletonLoader variant="avatar" />
              <div className="flex-1">
                <SkeletonLoader variant="text" lines={2} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No users found"
        description={
          searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
            ? 'No users match your current filters. Try adjusting your search criteria.'
            : 'No users have been added to your organization yet.'
        }
        action={
          onInviteClick
            ? {
                label: 'Add Your First User',
                onClick: onInviteClick,
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Select All Header */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedUsers.length === users.length && users.length > 0}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label="Select all users"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({selectedUsers.length} of {users.length} selected)
            </span>
          </div>
        </Card>

        {users.map((user) => {
          const isActive = (user as any).isActive !== false;
          return (
            <Card
              key={user.id}
              className={`p-6 hover:shadow-md transition-shadow ${
                !isActive ? 'opacity-75 bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label={`Select ${user.name || user.email}`}
                  />
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.emailVerified && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                      {user.mfaEnabled && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          MFA
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-600">
                    <p>Last login: Never</p>
                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onToggleApps(user.id)}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      {expandedUsers.has(user.id) ? '▼' : '▶'} Apps
                    </Button>
                    <Button
                      onClick={() => onEdit(user)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                    {isActive ? (
                      <Button
                        onClick={() => onDeactivate(user.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onActivate(user.id)}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      onClick={() => onDelete(user)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Assigned Apps Section */}
              {expandedUsers.has(user.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Assigned Apps</h4>
                    <Link
                      href="/apps"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Apps →
                    </Link>
                  </div>
                  {loadingApps[user.id] ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-600">Loading apps...</span>
                    </div>
                  ) : userApps[user.id] && userApps[user.id].length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userApps[user.id].map((app: any) => (
                        <div
                          key={app.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                              style={{
                                backgroundColor: app.color || '#6366f1',
                              }}
                            >
                              {app.icon || app.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {app.name}
                              </h5>
                              {app.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {app.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                {app.isActive !== false && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                                {app.quota && (
                                  <span className="text-xs text-gray-500">
                                    Quota: {app.usedQuota || 0}/{app.quota}
                                  </span>
                                )}
                              </div>
                              {app.url && (
                                <a
                                  href={app.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                                >
                                  Open App →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">No apps assigned to this user</p>
                      <Link
                        href="/apps"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                      >
                        Assign Apps →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Items per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalUsers}
            itemsPerPage={pageSize}
          />
        </div>
      )}
    </>
  );
};

