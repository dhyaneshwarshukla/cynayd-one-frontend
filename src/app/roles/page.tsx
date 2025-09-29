"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';

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

export default function RolesPage() {
  const { user, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<ExtendedRole[]>([]);
  const [permissions, setPermissions] = useState<ExtendedPermission[]>([]);
  const [stats, setStats] = useState<RoleStats>({
    totalRoles: 0,
    totalPermissions: 0,
    totalUsers: 0,
    customRoles: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ExtendedRole | null>(null);
  
  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
        totalUsers: extendedRoles.reduce((sum, role) => sum + role.userCount, 0),
        customRoles: extendedRoles.filter(role => !['Super Admin', 'Organization Admin', 'Team Manager', 'Regular User'].includes(role.name)).length
      };
      
      setStats(roleStats);
    } catch (err) {
      setError('Failed to load roles and permissions');
      console.error('Roles fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setError(null);
      
      // Create role via API
      const newRole = await apiClient.createRole({
        name: roleName,
        description: roleDescription
      });

      // Assign permissions if any are selected
      if (selectedPermissions.length > 0) {
        await apiClient.updateRolePermissions(newRole.id, selectedPermissions);
      }

      // Transform to extended role for display
      const extendedRole: ExtendedRole = {
        ...newRole,
        userCount: 0,
        permissions: permissions.filter(p => selectedPermissions.includes(p.id))
      };

      setRoles([extendedRole, ...roles]);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
      setShowCreateRoleModal(false);
      
      // Refresh data
      fetchRolesAndPermissions();
      
      alert('Role created successfully!');
    } catch (err) {
      setError('Failed to create role');
      console.error('Create role error:', err);
    }
  };

  const handleEditRole = (role: ExtendedRole) => {
    setSelectedRole(role);
    setShowEditRoleModal(true);
  };

  const handleDeleteRole = async (role: ExtendedRole) => {
    if (confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      try {
        await apiClient.deleteRole(role.id);
        setRoles(roles.filter(r => r.id !== role.id));
        alert('Role deleted successfully!');
        // Refresh data
        fetchRolesAndPermissions();
      } catch (err) {
        setError('Failed to delete role');
        console.error('Delete role error:', err);
      }
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
      setError(null);
      
      // Update role permissions via API
      await apiClient.updateRolePermissions(selectedRole.id, selectedPermissions);
      
      // Update local state
      const updatedRoles = roles.map(role => 
        role.id === selectedRole.id 
          ? { 
              ...role, 
              permissions: permissions.filter(p => selectedPermissions.includes(p.id))
            }
          : role
      );
      setRoles(updatedRoles);
      
      setShowPermissionsModal(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
      
      alert('Role permissions updated successfully!');
    } catch (err) {
      setError('Failed to update role permissions');
      console.error('Update permissions error:', err);
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
    <UnifiedLayout
      title="Roles & Permissions"
      subtitle="Manage user roles and permissions across your organization"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowCreateRoleModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <span className="mr-2">➕</span>
            Create Role
          </Button>
          <Button
            variant="outline"
            onClick={() => alert('Import roles coming soon!')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="mr-2">📥</span>
            Import Roles
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
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-xl">👑</span>
          <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
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
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <Card key={role.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role.name)}`}>
                          {role.permissions.length} permissions
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{role.userCount} users</span>
                        <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleManagePermissions(role)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Permissions
                    </Button>
                    <Button
                      onClick={() => handleEditRole(role)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteRole(role)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ResponsiveContainer>

      {/* Permissions List */}
      <ResponsiveContainer maxWidth="full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔐</span>
            <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="User Management">User Management</option>
              <option value="Team Management">Team Management</option>
              <option value="Product Management">Product Management</option>
              <option value="Organization Management">Organization Management</option>
              <option value="Role Management">Role Management</option>
              <option value="Security">Security</option>
              <option value="Reports">Reports</option>
            </select>
          </div>
        </div>
        
        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="md">
          {filteredPermissions.map((permission) => (
            <Card key={permission.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{permission.action}</h4>
                  <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(permission.category)}`}>
                  {permission.category}
                </span>
              </div>
            </Card>
          ))}
        </ResponsiveGrid>
      </ResponsiveContainer>

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2">
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
                        <span className="text-xs text-gray-600 ml-2">({permission.category})</span>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Role
              </button>
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
                  <option value="User Management">User Management</option>
                  <option value="Team Management">Team Management</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Organization Management">Organization Management</option>
                  <option value="Role Management">Role Management</option>
                  <option value="Security">Security</option>
                  <option value="Reports">Reports</option>
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
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedRole(null);
                  setSelectedPermissions([]);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRolePermissions}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Update Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </UnifiedLayout>
  );
}
