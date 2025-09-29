"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

interface RoleManagementProps {
  roles: Role[];
  onUpdateRole: (id: string, data: RoleFormData) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  roles,
  onUpdateRole,
  onDeleteRole,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const handleFormSubmit = async (data: RoleFormData) => {
    try {
      if (editingRole) {
        await onUpdateRole(editingRole.id, data);
        setSuccess('Role updated successfully');
      } else {
        // Handle creating new role
        setSuccess('Role created successfully');
      }
      setError(null);
      reset();
      setEditingRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
      setSuccess(null);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    reset({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await onDeleteRole(id);
        setSuccess('Role deleted successfully');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete role');
        setSuccess(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </h2>
        
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            type="text"
            label="Role Name"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            type="text"
            label="Description"
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </Button>
            {editingRole && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingRole(null);
                  reset();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Existing Roles</h2>
        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{role.name}</h3>
                {role.description && (
                  <p className="text-sm text-gray-500">{role.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(role)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(role.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}; 