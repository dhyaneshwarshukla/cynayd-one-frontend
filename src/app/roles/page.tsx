"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/common/ToastContainer';
import { cn } from '@/utils/cn';

// Define Role and Permission interfaces locally
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  organizationId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userCount?: number;
}

interface Permission {
  id: string;
  name?: string;
  action: string;
  description?: string;
  category?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ExtendedPermission extends Permission {
  category: string;
}

interface ExtendedRole extends Role {
  userCount?: number;
}

interface RoleStats {
  totalRoles: number;
  totalPermissions: number;
  totalUsers: number;
  customRoles: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function RolesPage() {
  const { user, isAuthenticated } = useAuth();
  const [toasts, toastActions] = useToast();
  const [roles, setRoles] = useState<ExtendedRole[]>([]);
  const [permissions, setPermissions] = useState<ExtendedPermission[]>([]);
  const [roleUsers, setRoleUsers] = useState<Record<string, User[]>>({});
  const [stats, setStats] = useState<RoleStats>({
    totalRoles: 0,
    totalPermissions: 0,
    totalUsers: 0,
    customRoles: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ExtendedRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<ExtendedRole | null>(null);
  
  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Pagination states
  const [currentRolePage, setCurrentRolePage] = useState(1);
  const [currentPermissionPage, setCurrentPermissionPage] = useState(1);
  const itemsPerPage = 10;

  // Determine user role
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchRolesAndPermissions();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchRolesAndPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch permissions and roles from API
      const [apiPermissions, apiRoles] = await Promise.all([
        apiClient.getPermissions(),
        apiClient.getRoles()
      ]);
      
      // Transform permissions to include category for display
      const extendedPermissions: ExtendedPermission[] = apiPermissions.map(perm => ({
        ...perm,
        category: perm.category || 'General'
      }));
      
      // Transform roles to include user count for display
      const extendedRoles: ExtendedRole[] = apiRoles.map(role => ({
        ...role,
        userCount: role.userCount || 0 // Use actual user count from API
      }));

      setPermissions(extendedPermissions);
      setRoles(extendedRoles);
      
      // Calculate stats
      const roleStats: RoleStats = {
        totalRoles: extendedRoles.length,
        totalPermissions: extendedPermissions.length,
        totalUsers: extendedRoles.reduce((sum, role) => sum + (role.userCount || 0), 0),
        customRoles: extendedRoles.filter(role => !['Super Admin', 'Organization Admin', 'Team Manager', 'Regular User'].includes(role.name)).length
      };
      
      setStats(roleStats);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load roles and permissions';
      setError(errorMessage);
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      console.error('Roles fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoleUsers = async (roleId: string) => {
    try {
      const users = await apiClient.getUsersWithRole(roleId);
      setRoleUsers(prev => ({ ...prev, [roleId]: users }));
      return users;
    } catch (err: any) {
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load users for this role'
      });
      return [];
    }
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toastActions.showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Role name is required'
      });
      return;
    }

    try {
      setIsOperationLoading(true);
      setError(null);
      
      // Create role via API
      const newRole = await apiClient.createRole({
        name: roleName.trim(),
        description: roleDescription.trim() || undefined
      });

      // Assign permissions if any are selected
      if (selectedPermissions.length > 0) {
        await apiClient.updateRolePermissions(newRole.id, selectedPermissions);
      }

      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
      setShowCreateRoleModal(false);
      
      // Refresh data
      await fetchRolesAndPermissions();
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: `Role "${roleName}" created successfully!`
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create role';
      setError(errorMessage);
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      console.error('Create role error:', err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleEditRole = (role: ExtendedRole) => {
    setSelectedRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions.map(p => p.id));
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    if (!editRoleName.trim()) {
      toastActions.showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Role name is required'
      });
      return;
    }

    try {
      setIsOperationLoading(true);
      setError(null);
      
      // Update role via API
      const updatedRole = await apiClient.updateRole(selectedRole.id, {
        name: editRoleName.trim(),
        description: editRoleDescription.trim() || undefined
      });

      // Update permissions if changed
      await apiClient.updateRolePermissions(selectedRole.id, selectedPermissions);

      setShowEditRoleModal(false);
      setSelectedRole(null);
      setEditRoleName('');
      setEditRoleDescription('');
      setSelectedPermissions([]);
      
      // Refresh data
      await fetchRolesAndPermissions();
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: `Role "${editRoleName}" updated successfully!`
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update role';
      setError(errorMessage);
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      console.error('Update role error:', err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setIsOperationLoading(true);
      setError(null);
      
      await apiClient.deleteRole(roleToDelete.id);
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
      
      // Refresh data
      await fetchRolesAndPermissions();
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: `Role "${roleToDelete.name}" deleted successfully!`
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete role';
      setError(errorMessage);
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      console.error('Delete role error:', err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const confirmDeleteRole = (role: ExtendedRole) => {
    if (role.userCount && role.userCount > 0) {
      toastActions.showToast({
        type: 'warning',
        title: 'Cannot Delete',
        message: `Cannot delete role "${role.name}" because it has ${role.userCount} user(s) assigned. Please reassign users first.`
      });
      return;
    }
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const handleDuplicateRole = async (role: ExtendedRole) => {
    try {
      setIsOperationLoading(true);
      setError(null);
      
      // Create new role with "Copy" suffix
      const newRole = await apiClient.createRole({
        name: `${role.name} (Copy)`,
        description: role.description || undefined
      });

      // Copy permissions
      if (role.permissions.length > 0) {
        const permissionIds = role.permissions.map(p => p.id);
        await apiClient.updateRolePermissions(newRole.id, permissionIds);
      }

      // Refresh data
      await fetchRolesAndPermissions();
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: `Role "${role.name}" duplicated successfully!`
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to duplicate role';
      setError(errorMessage);
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      console.error('Duplicate role error:', err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleViewUsers = async (role: ExtendedRole) => {
    setSelectedRole(role);
    setShowUsersModal(true);
    
    // Fetch users if not already loaded
    if (!roleUsers[role.id]) {
      await fetchRoleUsers(role.id);
    }
  };

  const handleManagePermissions = (role: ExtendedRole) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map(p => p.id));
    setShowPermissionsModal(true);
  };

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      setIsOperationLoading(true);
      setError(null);
      
      // Update role permissions via API
      await apiClient.updateRolePermissions(selectedRole.id, selectedPermissions);
      
      setShowPermissionsModal(false);
      const tempSelectedRole = selectedRole;
      setSelectedRole(null);
      setSelectedPermissions([]);
      
      // Refresh data
      await fetchRolesAndPermissions();
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: `Permissions for "${tempSelectedRole.name}" updated successfully!`
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update role permissions';
      setError(errorMessage);
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      console.error('Update permissions error:', err);
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Filtered and paginated roles
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
                           (role.description || '').toLowerCase().includes(roleSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [roles, roleSearchTerm]);

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentRolePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRoles.slice(startIndex, endIndex);
  }, [filteredRoles, currentRolePage]);

  const totalRolePages = Math.ceil(filteredRoles.length / itemsPerPage);

  // Filtered and paginated permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (permission.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [permissions, searchTerm, categoryFilter]);

  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPermissionPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPermissions.slice(startIndex, endIndex);
  }, [filteredPermissions, currentPermissionPage]);

  const totalPermissionPages = Math.ceil(filteredPermissions.length / itemsPerPage);

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Super Admin': return 'bg-red-100 text-red-800';
      case 'Organization Admin': return 'bg-purple-100 text-purple-800';
      case 'Team Manager': return 'bg-blue-100 text-blue-800';
      case 'Regular User': return 'bg-green-100 text-green-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'User Management': return 'bg-blue-100 text-blue-800';
      case 'Team Management': return 'bg-green-100 text-green-800';
      case 'Product Management': return 'bg-purple-100 text-purple-800';
      case 'Organization Management': return 'bg-orange-100 text-orange-800';
      case 'Role Management': return 'bg-red-100 text-red-800';
      case 'Security': return 'bg-yellow-100 text-yellow-800';
      case 'Reports': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <UnifiedLayout
        title="Access Denied"
        subtitle="You don't have permission to view this page"
      >
        <Card className="p-12 text-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need administrator privileges to access role and permission management.
          </p>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Go Back
          </Button>
        </Card>
      </UnifiedLayout>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={toastActions.hideToast} />
      
      <UnifiedLayout
        title="Roles & Permissions"
        subtitle="Manage user roles and permissions across your organization"
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setRoleName('');
                setRoleDescription('');
                setSelectedPermissions([]);
                setShowCreateRoleModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={isOperationLoading}
            >
              <span className="mr-2">➕</span>
              Create Role
            </Button>
          </div>
        }
      >
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

      {/* Role Stats */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Roles</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalRoles}</p>
              </div>
              <div className="text-2xl">👑</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Permissions</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalPermissions}</p>
              </div>
              <div className="text-2xl">🔐</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalUsers}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Custom Roles</p>
                <p className="text-2xl font-bold text-orange-900">{stats.customRoles}</p>
              </div>
              <div className="text-2xl">⚙️</div>
            </div>
          </Card>
        </div>
      </ResponsiveContainer>

      {/* Roles List */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">👑</span>
            <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
            <span className="text-sm text-gray-500">({filteredRoles.length})</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search roles..."
              value={roleSearchTerm}
              onChange={(e) => {
                setRoleSearchTerm(e.target.value);
                setCurrentRolePage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : paginatedRoles.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">👑</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {roleSearchTerm ? 'No roles found' : 'No roles yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {roleSearchTerm 
                ? `No roles match "${roleSearchTerm}". Try a different search term.`
                : 'Get started by creating your first role to manage user permissions.'}
            </p>
            {!roleSearchTerm && (
              <Button
                onClick={() => setShowCreateRoleModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <span className="mr-2">➕</span>
                Create Your First Role
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedRoles.map((role) => (
                <Card key={role.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role.name)}`}>
                            {role.permissions.length} permissions
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{role.description || 'No description'}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <button
                            onClick={() => handleViewUsers(role)}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{role.userCount || 0} users</span>
                            {(role.userCount || 0) > 0 && <span>👁️</span>}
                          </button>
                          <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                          <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleViewUsers(role)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        disabled={isOperationLoading}
                      >
                        Users
                      </Button>
                      <Button
                        onClick={() => handleManagePermissions(role)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        disabled={isOperationLoading}
                      >
                        Permissions
                      </Button>
                      <Button
                        onClick={() => handleDuplicateRole(role)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        disabled={isOperationLoading}
                      >
                        Duplicate
                      </Button>
                      <Button
                        onClick={() => handleEditRole(role)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        disabled={isOperationLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => confirmDeleteRole(role)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        disabled={isOperationLoading || (role.userCount || 0) > 0}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination for Roles */}
            {totalRolePages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {((currentRolePage - 1) * itemsPerPage) + 1} to {Math.min(currentRolePage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentRolePage(prev => Math.max(1, prev - 1))}
                    disabled={currentRolePage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalRolePages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        onClick={() => setCurrentRolePage(page)}
                        variant={currentRolePage === page ? 'default' : 'outline'}
                        size="sm"
                        className={currentRolePage === page ? '' : 'border-gray-300'}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setCurrentRolePage(prev => Math.min(totalRolePages, prev + 1))}
                    disabled={currentRolePage === totalRolePages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ResponsiveContainer>

      {/* Permissions List */}
      <ResponsiveContainer maxWidth="full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔐</span>
            <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
            <span className="text-sm text-gray-500">({filteredPermissions.length})</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPermissionPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPermissionPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(permissions.map(p => p.category || 'General'))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredPermissions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || categoryFilter !== 'all' ? 'No permissions found' : 'No permissions yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No permissions have been created yet.'}
            </p>
          </Card>
        ) : (
          <>
            <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="md">
              {paginatedPermissions.map((permission) => (
                <Card key={permission.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{permission.action}</h4>
                      <p className="text-xs text-gray-600 mt-1">{permission.description || 'No description'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getCategoryColor(permission.category)}`}>
                      {permission.category}
                    </span>
                  </div>
                </Card>
              ))}
            </ResponsiveGrid>
            
            {/* Pagination for Permissions */}
            {totalPermissionPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {((currentPermissionPage - 1) * itemsPerPage) + 1} to {Math.min(currentPermissionPage * itemsPerPage, filteredPermissions.length)} of {filteredPermissions.length} permissions
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPermissionPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPermissionPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPermissionPages, 5) }, (_, i) => {
                      let page;
                      if (totalPermissionPages <= 5) {
                        page = i + 1;
                      } else if (currentPermissionPage <= 3) {
                        page = i + 1;
                      } else if (currentPermissionPage >= totalPermissionPages - 2) {
                        page = totalPermissionPages - 4 + i;
                      } else {
                        page = currentPermissionPage - 2 + i;
                      }
                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPermissionPage(page)}
                          variant={currentPermissionPage === page ? 'default' : 'outline'}
                          size="sm"
                          className={currentPermissionPage === page ? '' : 'border-gray-300'}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => setCurrentPermissionPage(prev => Math.min(totalPermissionPages, prev + 1))}
                    disabled={currentPermissionPage === totalPermissionPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ResponsiveContainer>

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateRoleModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
                  disabled={isOperationLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role description"
                  rows={3}
                  disabled={isOperationLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                          }
                        }}
                        className="rounded border-gray-300"
                        disabled={isOperationLoading}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{permission.action}</span>
                        <span className="text-xs text-gray-600 ml-2">({permission.category})</span>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowCreateRoleModal(false)}
                variant="outline"
                disabled={isOperationLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={isOperationLoading}
                loading={isOperationLoading}
                className="flex-1"
              >
                Create Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowEditRoleModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
                  disabled={isOperationLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role description"
                  rows={3}
                  disabled={isOperationLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                          }
                        }}
                        className="rounded border-gray-300"
                        disabled={isOperationLoading}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{permission.action}</span>
                        <span className="text-xs text-gray-600 ml-2">({permission.category})</span>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowEditRoleModal(false);
                  setSelectedRole(null);
                  setEditRoleName('');
                  setEditRoleDescription('');
                  setSelectedPermissions([]);
                }}
                variant="outline"
                disabled={isOperationLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={isOperationLoading}
                loading={isOperationLoading}
                className="flex-1"
              >
                Update Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && roleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the role <strong>"{roleToDelete.name}"</strong>? This action cannot be undone.
            </p>
            {roleToDelete.userCount && roleToDelete.userCount > 0 && (
              <Alert variant="warning" className="mb-4">
                This role has {roleToDelete.userCount} user(s) assigned. Please reassign users before deleting.
              </Alert>
            )}
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoleToDelete(null);
                }}
                variant="outline"
                disabled={isOperationLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteRole}
                disabled={isOperationLoading || (roleToDelete.userCount || 0) > 0}
                loading={isOperationLoading}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowUsersModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Users with Role: "{selectedRole.name}"
            </h3>
            <div className="mt-4">
              {roleUsers[selectedRole.id] ? (
                roleUsers[selectedRole.id].length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No users assigned</h4>
                    <p className="text-gray-600">No users are currently assigned to this role.</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {roleUsers[selectedRole.id].map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => {
                  setShowUsersModal(false);
                  setSelectedRole(null);
                }}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Permissions for "{selectedRole.name}"
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set(permissions.map(p => p.category || 'General'))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                {filteredPermissions.map((permission) => (
                  <label key={permission.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{permission.action}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getCategoryColor(permission.category)}`}>
                        {permission.category}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedRole(null);
                  setSelectedPermissions([]);
                }}
                variant="outline"
                disabled={isOperationLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRolePermissions}
                disabled={isOperationLoading}
                loading={isOperationLoading}
                className="flex-1"
              >
                Update Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
      </UnifiedLayout>
    </>
  );
}
