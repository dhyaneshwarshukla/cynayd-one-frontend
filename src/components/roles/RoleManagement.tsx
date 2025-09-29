"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RoleManagementProps {
  apiClient: any; // We'll type this properly later
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ apiClient }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch roles and permissions on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRoles = await apiClient.getRoles();
      setRoles(fetchedRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const fetchedPermissions = await apiClient.getPermissions();
      setPermissions(fetchedPermissions);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const handleCreateRole = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const newRole = await apiClient.createRole(data);
      setRoles([...roles, newRole]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
      throw err; // Re-throw to let the form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (data: any) => {
    if (!selectedRole) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const updatedRole = await apiClient.updateRole(selectedRole.id, data);
      setRoles(roles.map(role => 
        role.id === updatedRole.id ? updatedRole : role
      ));
      setShowEditForm(false);
      setSelectedRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      throw err; // Re-throw to let the form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setSelectedRole(null);
    setShowEditForm(false);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleToggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const updatedRole = await apiClient.updateRole(roleId, { isActive: !currentStatus });
      setRoles(roles.map(role => 
        role.id === updatedRole.id ? updatedRole : role
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role status');
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Create Role</h1>
          <Button
            onClick={handleCancelCreate}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
        <RoleForm
          permissions={permissions}
          onSubmit={handleCreateRole}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (showEditForm && selectedRole) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
          <Button
            onClick={handleCancelEdit}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
        <RoleForm
          initialData={{
            name: selectedRole.name,
            description: selectedRole.description,
            permissions: selectedRole.permissions,
          }}
          permissions={permissions}
          onSubmit={handleUpdateRole}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={isLoading}
        >
          Create Role
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading && roles.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading roles...</div>
        </div>
      ) : roles.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first role with specific permissions.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Role
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {role.name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      role.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-gray-600 mb-3">{role.description}</p>
                  )}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.length > 0 ? (
                        role.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {permission}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No permissions assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleEditRole(role)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleToggleRoleStatus(role.id, role.isActive)}
                    variant={role.isActive ? "outline" : "default"}
                    size="sm"
                  >
                    {role.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Role Form Component
interface RoleFormProps {
  initialData?: {
    name: string;
    description: string;
    permissions: string[];
  };
  permissions: Permission[];
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const RoleForm: React.FC<RoleFormProps> = ({
  initialData,
  permissions,
  onSubmit,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Role Information</h2>
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Permissions
          </label>
          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
            {permissions.length > 0 ? (
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">
                      {permission.name} - {permission.description}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No permissions available</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Role'}
        </Button>
      </form>
    </Card>
  );
};
