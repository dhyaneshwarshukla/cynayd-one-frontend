"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/common/Input';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { 
  CogIcon, 
  BuildingOfficeIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UsersIcon,
  Squares2X2Icon,
  CalendarIcon,
  GlobeAltIcon,
  KeyIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface OrganizationSettingsProps {
  organizationId: string;
  currentUserRole: string;
  dashboardStats: any;
}

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export default function OrganizationSettings({ 
  organizationId, 
  currentUserRole,
  dashboardStats 
}: OrganizationSettingsProps) {
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const orgData = await apiClient.getOrganizationById(organizationId);
      setOrganization(orgData);
      setEditData({
        name: orgData.name,
        slug: orgData.slug,
        description: orgData.description || ''
      });
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.updateOrganization(organizationId, editData);
      await fetchOrganization(); // Refresh data
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    }
  };

  const handleCancel = () => {
    setEditData({
      name: organization?.name || '',
      slug: organization?.slug || '',
      description: organization?.description || ''
    });
    setIsEditing(false);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setEditData({
      ...editData,
      name,
      slug: generateSlug(name)
    });
  };

  if (isLoading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Organization</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button 
            onClick={fetchOrganization}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Organization Settings</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your organization's information and preferences
          </p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          {isEditing ? 'Cancel' : 'Edit Settings'}
        </Button>
      </div>

      {/* Organization Information */}
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <BuildingOfficeIcon className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Organization Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter organization name"
                />
              ) : (
                <p className="text-gray-900 font-medium">{organization?.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Slug
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editData.slug}
                  onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                  placeholder="organization-slug"
                />
              ) : (
                <p className="text-gray-900 font-mono">{organization?.slug}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Enter organization description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900">
                  {organization?.description || 'No description provided'}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <p className="text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                {organization?.createdAt ? 
                  new Date(organization.createdAt).toLocaleDateString() : 
                  'Unknown'
                }
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                {organization?.updatedAt ? 
                  new Date(organization.updatedAt).toLocaleDateString() : 
                  'Unknown'
                }
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization ID
              </label>
              <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                {organization?.id}
              </p>
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editData.name || !editData.slug}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      {/* Statistics Overview */}
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <ChartBarIcon className="w-6 h-6 text-green-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Statistics Overview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <UsersIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">
              {dashboardStats?.users.total || 0}
            </p>
            <p className="text-sm text-blue-700">Total Users</p>
            <p className="text-xs text-blue-600 mt-1">
              {dashboardStats?.users.active || 0} active
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Squares2X2Icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">
              {dashboardStats?.apps.total || 0}
            </p>
            <p className="text-sm text-green-700">Available Apps</p>
            <p className="text-xs text-green-600 mt-1">
              {dashboardStats?.apps.activeAccess || 0} active access
            </p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <BellIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">
              {dashboardStats?.activity.recentActivity || 0}
            </p>
            <p className="text-sm text-yellow-700">Recent Activity</p>
            <p className="text-xs text-yellow-600 mt-1">Last 7 days</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <ShieldCheckIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-900">
              {dashboardStats?.activity.securityEvents || 0}
            </p>
            <p className="text-sm text-red-700">Security Events</p>
            <p className="text-xs text-red-600 mt-1">Last 30 days</p>
          </div>
        </div>
      </Card>

      {/* Security & Access */}
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <ShieldCheckIcon className="w-6 h-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Security & Access</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <KeyIcon className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">SSO Configuration</p>
                <p className="text-sm text-gray-600">Single Sign-On settings</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <GlobeAltIcon className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Domain Management</p>
                <p className="text-sm text-gray-600">Manage allowed domains</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Security Policies</p>
                <p className="text-sm text-gray-600">Password and access policies</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <div className="flex items-center mb-6">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-900">Delete Organization</p>
              <p className="text-sm text-red-700">
                Permanently delete this organization and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Delete Organization
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
