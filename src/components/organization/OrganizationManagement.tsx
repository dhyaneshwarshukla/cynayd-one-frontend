"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { OrganizationForm } from './OrganizationForm';
import { Organization } from '../../lib/api-client';

interface OrganizationManagementProps {
  apiClient: any; // We'll type this properly later
}

export const OrganizationManagement: React.FC<OrganizationManagementProps> = ({ apiClient }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orgs = await apiClient.getOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const newOrg = await apiClient.createOrganization(data);
      setOrganizations([...organizations, newOrg]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      throw err; // Re-throw to let the form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: any) => {
    if (!selectedOrg) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const updatedOrg = await apiClient.updateOrganization(selectedOrg.id, data);
      setOrganizations(organizations.map(org => 
        org.id === updatedOrg.id ? updatedOrg : org
      ));
      setShowEditForm(false);
      setSelectedOrg(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
      throw err; // Re-throw to let the form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setSelectedOrg(null);
    setShowEditForm(false);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          <Button
            onClick={handleCancelCreate}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
        <OrganizationForm
          onSubmit={handleCreateOrganization}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (showEditForm && selectedOrg) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Organization</h1>
          <Button
            onClick={handleCancelEdit}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
        <OrganizationForm
          initialData={{
            name: selectedOrg.name,
            description: selectedOrg.description || '',
            website: '', // Add website field to Organization interface if needed
            logo: '', // Add logo field to Organization interface if needed
          }}
          onSubmit={handleUpdateOrganization}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={isLoading}
        >
          Create Organization
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading && organizations.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading organizations...</div>
        </div>
      ) : organizations.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first organization.</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Organization
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="text-gray-600 mb-2">{org.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Slug: {org.slug}</span>
                    <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(org.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleEditOrganization(org)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => {/* TODO: Implement view details */}}
                    variant="outline"
                    size="sm"
                  >
                    View
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
