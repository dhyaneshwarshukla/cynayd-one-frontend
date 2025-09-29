"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/common/Input';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { 
  Squares2X2Icon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface OrganizationApp {
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

interface OrganizationAppManagementProps {
  organizationId: string;
  currentUserRole: string;
}

export default function OrganizationAppManagement({ 
  organizationId, 
  currentUserRole 
}: OrganizationAppManagementProps) {
  const [apps, setApps] = useState<OrganizationApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    slug: '',
    description: '',
    url: '',
    domain: '',
    icon: '',
    color: '#3b82f6'
  });

  useEffect(() => {
    fetchApps();
  }, [organizationId]);

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const appsData = await apiClient.getAppsForOrganization(
        organizationId, 
        currentUserRole, 
        organizationId
      );
      
      setApps(appsData);
    } catch (err) {
      console.error('Error fetching apps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load apps');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApp = async () => {
    try {
      await apiClient.createApp(createData);
      
      setShowCreateModal(false);
      setCreateData({
        name: '',
        slug: '',
        description: '',
        url: '',
        domain: '',
        icon: '',
        color: '#3b82f6'
      });
      fetchApps(); // Refresh the list
    } catch (err) {
      console.error('Error creating app:', err);
      setError(err instanceof Error ? err.message : 'Failed to create app');
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (app: OrganizationApp) => {
    return app.isActive ? 
      <CheckCircleIcon className="w-4 h-4 text-green-500" /> : 
      <XCircleIcon className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (app: OrganizationApp) => {
    return app.isActive ? 'Active' : 'Inactive';
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setCreateData({
      ...createData,
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
          <h3 className="text-red-800 font-medium">Error Loading Apps</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button 
            onClick={fetchApps}
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
          <h2 className="text-xl font-semibold text-gray-900">App Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage applications in your organization ({apps.length} total)
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create App
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search apps by name, slug, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchApps}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Apps Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <Card key={app.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: app.color || '#3b82f6' }}
                    >
                      {app.icon || app.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{app.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(app)}
                  </div>
                </div>
                
                {app.description && (
                  <p className="text-sm text-gray-600 mb-4">{app.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${
                      app.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getStatusText(app)}
                    </span>
                  </div>
                  
                  {app.url && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">URL</span>
                      <a 
                        href={app.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        Visit
                      </a>
                    </div>
                  )}
                  
                  {app.domain && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Domain</span>
                      <span className="font-mono text-gray-900">{app.domain}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.systemApp ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {app.systemApp ? 'System' : 'Custom'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {!app.systemApp && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 text-gray-500">
          <Squares2X2Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'No apps found' : 'No apps yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first app to get started'}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First App
            </Button>
          )}
        </Card>
      )}

      {/* Create App Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New App</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App Name *
                  </label>
                  <Input
                    type="text"
                    value={createData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter app name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <Input
                    type="text"
                    value={createData.slug}
                    onChange={(e) => setCreateData({ ...createData, slug: e.target.value })}
                    placeholder="app-slug"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Enter app description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App URL
                  </label>
                  <Input
                    type="url"
                    value={createData.url}
                    onChange={(e) => setCreateData({ ...createData, url: e.target.value })}
                    placeholder="https://app.example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain
                  </label>
                  <Input
                    type="text"
                    value={createData.domain}
                    onChange={(e) => setCreateData({ ...createData, domain: e.target.value })}
                    placeholder="app.example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <Input
                    type="text"
                    value={createData.icon}
                    onChange={(e) => setCreateData({ ...createData, icon: e.target.value })}
                    placeholder="🚀 or icon name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={createData.color}
                      onChange={(e) => setCreateData({ ...createData, color: e.target.value })}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={createData.color}
                      onChange={(e) => setCreateData({ ...createData, color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateApp}
                disabled={!createData.name || !createData.slug}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create App
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
