"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ResponsiveGrid, ResponsiveContainer } from '@/components/layout/ResponsiveLayout';
import { Input } from '@/components/common/Input';
import { apiClient, UserAppAccess as ApiUserAppAccess } from '@/lib/api-client';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  url?: string;
  domain?: string;
  isActive: boolean;
  systemApp: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface UserAppAccessWithDetails {
  id: string;
  userId: string;
  appId: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
  quota?: number;
  usedQuota: number;
  user: User;
  app: App;
}

export default function AppManagement() {
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userAppAccess, setUserAppAccess] = useState<UserAppAccessWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [newApp, setNewApp] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📱',
    color: '#3B82F6',
    url: '',
    domain: ''
  });

  const [editApp, setEditApp] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📱',
    color: '#3B82F6',
    url: '',
    domain: '',
    isActive: true
  });

  const [assignmentData, setAssignmentData] = useState({
    userId: '',
    quota: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to fetch data...');
      console.log('Environment API URL:', process.env.NEXT_PUBLIC_API_URL || 'Not set');
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });

      try {
        console.log('Attempting to fetch apps...');
        const appsData = await apiClient.getApps();
        console.log('Apps fetched:', appsData);
        
        console.log('Attempting to fetch users...');
        const usersData = await apiClient.getUsers();
        console.log('Users fetched:', usersData);
        
        console.log('Attempting to fetch user app access...');
        const accessData = await apiClient.getAllUserAppAccess();
        console.log('User app access fetched:', accessData);
        
        // Set the data
        setApps(Array.isArray(appsData) ? appsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setUserAppAccess(Array.isArray(accessData) ? accessData as UserAppAccessWithDetails[] : []);
        
        console.log('All data fetched successfully');
        return; // Exit early since we handled everything above
      } catch (individualError) {
        console.error('Individual API call failed:', individualError);
        throw individualError; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // Check if it's an authentication error
      if (err instanceof Error && err.message.includes('Request timeout')) {
        setError('Request timed out. The server may be slow or unresponsive.');
      } else if (err instanceof Error && err.message.includes('401')) {
        setError('Authentication required. Please log in to access this page.');
      } else if (err instanceof Error && err.message.includes('403')) {
        setError('Access denied. You need admin privileges to access this page.');
      } else if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) {
        setError('Backend server is not running. Please start the backend server on port 4000.');
      } else {
        setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      // Set empty arrays on error to prevent further issues
      setApps([]);
      setUsers([]);
      setUserAppAccess([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    try {
      await apiClient.createApp(newApp);
      setShowCreateAppModal(false);
      setNewApp({ name: '', slug: '', description: '', icon: '📱', color: '#3B82F6', url: '', domain: '' });
      fetchData();
    } catch (err) {
      setError('Failed to create app');
      console.error('Error creating app:', err);
    }
  };

  const openEditModal = (app: App) => {
    setSelectedApp(app);
    setEditApp({
      name: app.name,
      slug: app.slug,
      description: app.description || '',
      icon: app.icon || '📱',
      color: app.color || '#3B82F6',
      url: app.url || '',
      domain: app.domain || '',
      isActive: app.isActive
    });
    setShowEditModal(true);
  };

  const handleEditApp = async () => {
    if (!selectedApp) return;
    
    try {
      await apiClient.updateApp(selectedApp.id, editApp);
      setShowEditModal(false);
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setError('Failed to update app');
      console.error('Error updating app:', err);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiClient.deleteApp(appId);
      fetchData();
    } catch (err) {
      setError('Failed to delete app');
      console.error('Error deleting app:', err);
    }
  };

  const handleAssignAccess = async () => {
    if (!selectedApp || !assignmentData.userId) return;
    
    try {
      await apiClient.assignAppAccess(selectedApp.id, assignmentData.userId, {
        quota: assignmentData.quota ? parseInt(assignmentData.quota) : undefined,
        expiresAt: assignmentData.expiresAt ? new Date(assignmentData.expiresAt) : undefined
      });
      setShowAssignModal(false);
      setAssignmentData({ userId: '', quota: '', expiresAt: '' });
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      setError('Failed to assign access');
      console.error('Error assigning access:', err);
    }
  };

  const handleRevokeAccess = async (access: UserAppAccessWithDetails) => {
    try {
      await apiClient.revokeAppAccess(access.appId, access.userId);
      fetchData();
    } catch (err) {
      setError('Failed to revoke access');
      console.error('Error revoking access:', err);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && app.isActive) ||
                         (filterStatus === 'inactive' && !app.isActive);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">App Management</h2>
            <p className="text-gray-600 mt-1">Manage applications and user access</p>
          </div>
          <Button 
            onClick={() => setShowCreateAppModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New App
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterStatus('all')}
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              className="text-sm"
            >
              All Apps
            </Button>
            <Button
              onClick={() => setFilterStatus('active')}
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              className="text-sm"
            >
              Active
            </Button>
            <Button
              onClick={() => setFilterStatus('inactive')}
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              className="text-sm"
            >
              Inactive
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-red-800 font-medium">Error</h3>
              </div>
              <Button
                onClick={fetchData}
                variant="outline"
                className="text-sm"
              >
                Retry
              </Button>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Apps Grid */}
        <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="lg">
          {filteredApps.map((app) => (
            <Card key={app.id} className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: app.color }}
                  >
                    {app.icon}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                    <p className="text-sm text-gray-500">{app.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {app.systemApp && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      System
                    </span>
                  )}
                  {app.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {app.description && (
                <p className="text-gray-600 text-sm mb-4">{app.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Created: {new Date(app.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedApp(app);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <UserPlusIcon className="w-4 h-4 mr-1" />
                  Assign Access
                </Button>
                {!app.systemApp && (
                  <>
                    <Button
                      onClick={() => openEditModal(app)}
                      variant="outline"
                      className="px-3"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteApp(app.id)}
                      variant="outline"
                      className="px-3 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {app.systemApp && (
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded flex items-center">
                    <ShieldCheckIcon className="w-4 h-4 mr-1" />
                    Protected
                  </div>
                )}
              </div>
            </Card>
          ))}
        </ResponsiveGrid>

        {/* User Access Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Access</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  {userAppAccess.filter(access => access.user && access.app).length} assignments
                </div>
          </div>

          {userAppAccess.filter(access => access.user && access.app).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Assignments</h3>
              <p className="text-gray-500">No user access assignments found. Create apps and assign access to users to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      App
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userAppAccess.filter(access => access.user && access.app).map((access) => (
                  <tr key={access.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-700">
                            {(access.user?.name || access.user?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {access.user?.name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">{access.user?.email || 'No Email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs mr-2"
                          style={{ backgroundColor: access.app?.color || '#3b82f6' }}
                        >
                          {access.app?.icon || '📱'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{access.app?.name || 'Unknown App'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {access.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(access.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${access.quota ? (access.usedQuota / access.quota) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {access.usedQuota}/{access.quota || '∞'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => handleRevokeAccess(access)}
                        className="text-red-600 hover:text-red-900"
                        variant="outline"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Create App Modal */}
        {showCreateAppModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New App</h3>
              <div className="space-y-4">
                <Input
                  label="App Name"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  placeholder="Enter app name"
                />
                <Input
                  label="Slug"
                  value={newApp.slug}
                  onChange={(e) => setNewApp({ ...newApp, slug: e.target.value })}
                  placeholder="Enter app slug"
                />
                <Input
                  label="Description"
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  placeholder="Enter app description"
                />
                <Input
                  label="Icon"
                  value={newApp.icon}
                  onChange={(e) => setNewApp({ ...newApp, icon: e.target.value })}
                  placeholder="Enter icon (emoji or text)"
                />
                <Input
                  label="Color"
                  type="color"
                  value={newApp.color}
                  onChange={(e) => setNewApp({ ...newApp, color: e.target.value })}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowCreateAppModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateApp}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Create App
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit App Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit App</h3>
              <div className="space-y-4">
                <Input
                  label="App Name"
                  value={editApp.name}
                  onChange={(e) => setEditApp({ ...editApp, name: e.target.value })}
                  placeholder="Enter app name"
                />
                <Input
                  label="Slug"
                  value={editApp.slug}
                  onChange={(e) => setEditApp({ ...editApp, slug: e.target.value })}
                  placeholder="Enter app slug"
                />
                <Input
                  label="Description"
                  value={editApp.description}
                  onChange={(e) => setEditApp({ ...editApp, description: e.target.value })}
                  placeholder="Enter app description"
                />
                <Input
                  label="Icon"
                  value={editApp.icon}
                  onChange={(e) => setEditApp({ ...editApp, icon: e.target.value })}
                  placeholder="Enter icon (emoji or text)"
                />
                <Input
                  label="Color"
                  type="color"
                  value={editApp.color}
                  onChange={(e) => setEditApp({ ...editApp, color: e.target.value })}
                />
                <Input
                  label="App URL"
                  value={editApp.url}
                  onChange={(e) => setEditApp({ ...editApp, url: e.target.value })}
                  placeholder="https://app.example.com or app.example.com"
                />
                <Input
                  label="Domain (optional)"
                  value={editApp.domain}
                  onChange={(e) => setEditApp({ ...editApp, domain: e.target.value })}
                  placeholder="example.com"
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editApp.isActive}
                    onChange={(e) => setEditApp({ ...editApp, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditApp}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update App
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Access Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Assign Access to {selectedApp?.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assignmentData.userId}
                    onChange={(e) => setAssignmentData({ ...assignmentData, userId: e.target.value })}
                  >
                    <option value="">Choose a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Quota (optional)"
                  type="number"
                  value={assignmentData.quota}
                  onChange={(e) => setAssignmentData({ ...assignmentData, quota: e.target.value })}
                  placeholder="Enter usage quota"
                />
                <Input
                  label="Expires At (optional)"
                  type="datetime-local"
                  value={assignmentData.expiresAt}
                  onChange={(e) => setAssignmentData({ ...assignmentData, expiresAt: e.target.value })}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowAssignModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignAccess}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Assign Access
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
}
