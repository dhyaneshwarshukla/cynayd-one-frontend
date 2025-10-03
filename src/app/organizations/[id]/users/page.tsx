"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { useRouter } from 'next/navigation';

interface OrganizationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  isOrgAdmin: boolean;
  isOrgCreator: boolean;
  appCount: number;
}

interface OrganizationData {
  id: string;
  name: string;
  userCount: number;
}

interface UserData {
  users: OrganizationUser[];
  organization: OrganizationData;
}

export default function OrganizationUsersPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [usersData, setUsersData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Only SUPER_ADMIN can view users across organizations
    if (user?.role !== 'SUPER_ADMIN') {
      setError('Access denied. Only Super Administrators can view organization users.');
      setIsLoading(false);
      return;
    }

    fetchOrganizationUsers();
  }, [isAuthenticated, user, params.id]);

  const fetchOrganizationUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/organizations/${params.id}/users-detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsersData(data.data);
    } catch (err) {
      console.error('Failed to fetch organization users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization users');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN':
      case 'ORGN_ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'USER':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INVITED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (user: OrganizationUser) => {
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>;
    }
    if (user.lastLogin) {
      const lastLogin = new Date(user.lastLogin);
      const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLogin <= 7) {
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      } else if (daysSinceLogin <= 30) {
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Away</span>;
      } else {
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
      }
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>;
  };

  if (isLoading) {
    return (
      <UnifiedLayout
        title="Loading Users"
        subtitle="Fetching organization users"
        variant="dashboard"
      >
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </UnifiedLayout>
    );
  }

  if (error) {
    return (
      <UnifiedLayout
        title="Error"
        subtitle="Failed to load organization users"
        variant="dashboard"
      >
        <Alert variant="error" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Error Loading Users</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={fetchOrganizationUsers}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </Alert>
      </UnifiedLayout>
    );
  }

  if (!usersData) {
    return (
      <UnifiedLayout
        title="No Data"
        subtitle="Organization users not found"
        variant="dashboard"
      >
        <div className="text-center py-8">
          <p>No organization data available.</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title={`Users - ${usersData.organization.name}`}
      subtitle={`${usersData.users.length} users in this organization`}
      variant="dashboard"
      actions={
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/organizations')}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back to Organizations
          </Button>
          <Button
            onClick={fetchOrganizationUsers}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            🔄 Refresh
          </Button>
        </div>
      }
    >
      {usersData.users.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This organization doesn't have any users yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Organization Summary */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-900">{usersData.organization.name}</h3>
                <p className="text-blue-700">Organization ID: {usersData.organization.id}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{usersData.users.length}</p>
                <p className="text-sm text-blue-600">Total Users</p>
              </div>
            </div>
          </Card>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Since
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                            {user.isOrgCreator && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                Creator
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {(user.jobTitle || user.department) && (
                            <div className="text-xs text-gray-400">
                              {user.jobTitle}{user.jobTitle && user.department ? ' • ' : ''}{user.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.appCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {usersData.users.filter(u => u.isActive).length}
                </div>
                <div className="text-sm text-green-600">Active Users</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {usersData.users.filter(u => u.role === 'ADMIN' || u.role === 'ORGN_ADMIN').length}
                </div>
                <div className="text-sm text-blue-600">Admins</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {usersData.users.reduce((sum, u) => sum + (u.appCount || 0), 0)}
                </div>
                <div className="text-sm text-purple-600">Total App Access</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">
                  {usersData.users.filter(u => u.lastLogin && new Date(u.lastLogin) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-orange-600">Active (7d)</div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </UnifiedLayout>
  );
}
