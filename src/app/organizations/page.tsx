"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient, Plan } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { useApiState } from '@/hooks/useApiState';
import { useToast } from '@/hooks/useToast';

// Define Organization interface locally
interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  settings?: any;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ExtendedOrganization extends Organization {
  userCount?: number;
  teamCount?: number;
  appCount?: number;
  isActive: boolean;
  planId?: string;
  plan?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isDefault: boolean;
  };
}

interface OrganizationStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalTeams: number;
  totalApps: number;
}

export default function OrganizationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [toasts, toastActions] = useToast();

  // Set page title
  useEffect(() => {
    document.title = 'Organizations | CYNAYD One';
  }, []);
  
  // Use API state for organizations with manual control
  const [organizationsState, organizationsActions] = useApiState<ExtendedOrganization[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalTeams: 0,
    totalApps: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<ExtendedOrganization | null>(null);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  
  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);

  // Determine user role - only SUPER_ADMIN can access organizations
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      fetchOrganizations();
      fetchAllPlans();
    }
  }, [isAuthenticated, isSuperAdmin]);

  const fetchAllPlans = async () => {
    try {
      const plans = await apiClient.getPlans(true);
      setAllPlans(Array.isArray(plans) ? plans : []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchOrganizations = async () => {
    // Prevent multiple simultaneous requests
    if (isRequestInProgress) {
      console.log('Request already in progress, skipping...');
      return;
    }

    try {
      setIsRequestInProgress(true);
      organizationsActions.setLoading(true);
      
      // Fetch organizations with real user counts from API
      const apiOrganizations = await apiClient.getOrganizations();
      
      // Transform API data to include additional fields for display
      const extendedOrganizations: ExtendedOrganization[] = apiOrganizations.map((org: any) => ({
        ...org,
        userCount: org.userCount || 0,
        teamCount: 1, // Each organization is treated as a team  
        appCount: org.appCount || 0,
        isActive: org.settings?.isActive !== false // Use settings or default to true
      }));

      organizationsActions.setData(extendedOrganizations);
      
      // Calculate stats from the organizations data
      const totalUsers = extendedOrganizations.reduce((sum, org) => sum + (org.userCount || 0), 0);
      const totalApps = extendedOrganizations.reduce((sum, org) => sum + (org.appCount || 0), 0);
      
      setStats({
        totalOrganizations: extendedOrganizations.length,
        activeOrganizations: extendedOrganizations.filter(org => org.isActive).length,
        totalUsers: totalUsers,
        totalTeams: extendedOrganizations.length, // Each org is a team
        totalApps: totalApps
      });
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toastActions.showToast({
        type: 'error',
        title: 'Failed to load organizations',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      organizationsActions.setLoading(false);
      setIsRequestInProgress(false);
    }
  };

  const handleCreateOrganization = async () => {
    // Enhanced validation
    const validationErrors: string[] = [];
    
    if (!orgName.trim()) {
      validationErrors.push('Organization name is required');
    } else if (orgName.trim().length < 2) {
      validationErrors.push('Organization name must be at least 2 characters');
    }
    
    if (!orgSlug.trim()) {
      validationErrors.push('Organization slug is required');
    } else if (orgSlug.trim().length < 2) {
      validationErrors.push('Organization slug must be at least 2 characters');
    } else if (!/^[a-z0-9-]+$/.test(orgSlug.trim())) {
      validationErrors.push('Organization slug can only contain lowercase letters, numbers, and hyphens');
    }
    
    if (validationErrors.length > 0) {
      toastActions.showToast({
        type: 'error',
        title: 'Validation Error',
        message: validationErrors.join(', ')
      });
      return;
    }

    await organizationsActions.execute(
      async () => {
        // Create organization via API
        const newOrg = await apiClient.createOrganization({
          name: orgName.trim(),
          slug: orgSlug.trim()
        });

        // Transform to extended organization for display
        const extendedOrg: ExtendedOrganization = {
          ...newOrg,
          userCount: 0,
          teamCount: 0,
          appCount: 0,
          isActive: true
        };

        const currentOrgs = organizationsState.data || [];
        const updatedOrgs = [extendedOrg, ...currentOrgs];
        organizationsActions.setData(updatedOrgs);
        
        // Refresh stats from API
        try {
          const apiStats = await apiClient.getOrganizationStats();
          setStats({
            totalOrganizations: apiStats.totalOrganizations,
            activeOrganizations: apiStats.activeOrganizations,
            totalUsers: apiStats.totalUsers,
            totalTeams: apiStats.totalTeams,
            totalApps: apiStats.totalApps
          });
        } catch (error) {
          console.warn('Failed to refresh stats after creating organization:', error);
        }
        
        setOrgName('');
        setOrgSlug('');
        setShowCreateModal(false);
        
        return extendedOrg;
      },
      () => {
        toastActions.showToast({
          type: 'success',
          title: 'Success',
          message: 'Organization created successfully!'
        });
      },
      (error) => {
        toastActions.showToast({
          type: 'error',
          title: 'Failed to create organization',
          message: error.message
        });
      }
    );
  };

  const handleEditOrganization = (org: ExtendedOrganization) => {
    setSelectedOrg(org);
    setShowEditModal(true);
  };

  const handleViewOrganization = (org: ExtendedOrganization) => {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  };

  const handleDeleteOrganization = async (org: ExtendedOrganization) => {
    if (confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      await organizationsActions.execute(
        async () => {
          await apiClient.deleteOrganization(org.id);
          const currentOrgs = organizationsState.data || [];
          const updatedOrgs = currentOrgs.filter(o => o.id !== org.id);
          organizationsActions.setData(updatedOrgs);
          
          // Refresh stats from API
          try {
            const apiStats = await apiClient.getOrganizationStats();
            setStats({
              totalOrganizations: apiStats.totalOrganizations,
              activeOrganizations: apiStats.activeOrganizations,
              totalUsers: apiStats.totalUsers,
              totalTeams: apiStats.totalTeams,
              totalApps: apiStats.totalApps
            });
          } catch (error) {
            console.warn('Failed to refresh stats after deleting organization:', error);
          }
          
          return null;
        },
        () => {
          toastActions.showToast({
            type: 'success',
            title: 'Success',
            message: 'Organization deleted successfully!'
          });
        },
        (error) => {
          toastActions.showToast({
            type: 'error',
            title: 'Failed to delete organization',
            message: error.message
          });
        }
      );
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedOrgs.size === 0) {
      toastActions.showToast({
        type: 'error',
        title: 'No Selection',
        message: 'Please select at least one organization'
      });
      return;
    }

    const actionText = action === 'delete' ? 'delete' : `${action} selected organizations`;
    if (!confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    await organizationsActions.execute(
      async () => {
        const currentOrgs = organizationsState.data || [];
        const selectedOrgIds = Array.from(selectedOrgs);
        
        if (action === 'delete') {
          // Delete selected organizations
          await Promise.all(selectedOrgIds.map(id => apiClient.deleteOrganization(id)));
          const updatedOrgs = currentOrgs.filter(o => !selectedOrgs.has(o.id));
          organizationsActions.setData(updatedOrgs);
          
          // Refresh stats from API
          try {
            const apiStats = await apiClient.getOrganizationStats();
            setStats({
              totalOrganizations: apiStats.totalOrganizations,
              activeOrganizations: apiStats.activeOrganizations,
              totalUsers: apiStats.totalUsers,
              totalTeams: apiStats.totalTeams,
              totalApps: apiStats.totalApps
            });
          } catch (error) {
            console.warn('Failed to refresh stats after bulk delete:', error);
          }
        } else {
          // Toggle status for selected organizations
          const isActivating = action === 'activate';
          await Promise.all(selectedOrgIds.map(id => {
            const org = currentOrgs.find(o => o.id === id);
            if (org && org.isActive !== isActivating) {
              return apiClient.updateOrganization(id, {
                settings: {
                  ...org.settings,
                  isActive: isActivating
                }
              });
            }
          }));
          
          const updatedOrgs = currentOrgs.map(o => 
            selectedOrgs.has(o.id) ? { ...o, isActive: action === 'activate' } : o
          );
          organizationsActions.setData(updatedOrgs);
          
          // Refresh stats from API
          try {
            const apiStats = await apiClient.getOrganizationStats();
            setStats({
              totalOrganizations: apiStats.totalOrganizations,
              activeOrganizations: apiStats.activeOrganizations,
              totalUsers: apiStats.totalUsers,
              totalTeams: apiStats.totalTeams,
              totalApps: apiStats.totalApps
            });
          } catch (error) {
            console.warn('Failed to refresh stats after bulk action:', error);
          }
        }
        
        setSelectedOrgs(new Set());
        setShowBulkActions(false);
        return null;
      },
      () => {
        toastActions.showToast({
          type: 'success',
          title: 'Success',
          message: `Bulk ${action} completed successfully!`
        });
      },
      (error) => {
        toastActions.showToast({
          type: 'error',
          title: 'Failed to perform bulk action',
          message: error.message
        });
      }
    );
  };

  const handleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedOrgs.size === filteredOrganizations.length) {
      setSelectedOrgs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedOrgs(new Set(filteredOrganizations.map(o => o.id)));
      setShowBulkActions(true);
    }
  };

  const handleToggleOrganizationStatus = async (org: ExtendedOrganization) => {
    const newStatus = !org.isActive;
    const actionText = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${actionText} "${org.name}"?`)) {
      return;
    }

    await organizationsActions.execute(
      async () => {
        // Update organization status via API
        const updatedOrg = await apiClient.updateOrganization(org.id, {
          settings: {
            ...org.settings,
            isActive: newStatus
          }
        });
        
        const currentOrgs = organizationsState.data || [];
        const updatedOrgs = currentOrgs.map(o => 
          o.id === org.id ? { ...o, isActive: newStatus } : o
        );
        organizationsActions.setData(updatedOrgs);
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          activeOrganizations: prevStats.activeOrganizations + (newStatus ? 1 : -1)
        }));
        
        return updatedOrg;
      },
      () => {
        toastActions.showToast({
          type: 'success',
          title: 'Success',
          message: `Organization ${actionText}d successfully!`
        });
      },
      (error) => {
        toastActions.showToast({
          type: 'error',
          title: 'Failed to update organization status',
          message: error.message
        });
      }
    );
  };

  const filteredOrganizations = (organizationsState.data || []).filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && org.isActive) ||
                         (statusFilter === 'inactive' && !org.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'blue': return 'from-blue-400 to-blue-600';
      case 'green': return 'from-green-400 to-green-600';
      case 'purple': return 'from-purple-400 to-purple-600';
      case 'orange': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (!isSuperAdmin) {
    return (
      <UnifiedLayout
        title="Access Denied"
        subtitle="You don't have permission to view this page"
        variant="dashboard"
      >
        <Card className="p-12 text-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need Super Administrator privileges to access organization management.
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
      title="Organization Management"
      subtitle="Manage organizations, settings, and configurations across the platform"
      variant="dashboard"
      actions={
        <div className="flex flex-wrap gap-3">
          
          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={`border-gray-300 text-gray-700 hover:bg-gray-50 ${showBulkActions ? 'bg-gray-100' : ''}`}
          >
            <span className="mr-2">📊</span>
            Bulk Actions
          </Button>
        </div>
      }
    >
      {organizationsState.error && (
        <Alert variant="error" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Error Loading Organizations</h4>
              <p className="text-sm mt-1">{organizationsState.error}</p>
            </div>
            <Button
              onClick={fetchOrganizations}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </Alert>
      )}

        {/* Connection Status - Removed since we're not using real-time updates */}

      {/* Organization Stats */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Organizations</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalOrganizations}</p>
              </div>
              <div className="text-2xl">🏢</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeOrganizations}</p>
              </div>
              <div className="text-2xl">✅</div>
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
                <p className="text-sm font-medium text-orange-600">Total Teams</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalTeams}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Total Apps</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.totalApps}</p>
              </div>
              <div className="text-2xl">📦</div>
            </div>
          </Card>
        </div>
      </ResponsiveContainer>

      {/* Filters and Bulk Actions */}
      <ResponsiveContainer maxWidth="full" className="mb-6">
        <Card className="p-4 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search organizations by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions Panel */}
          {showBulkActions && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.size === filteredOrganizations.length && filteredOrganizations.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Select All ({selectedOrgs.size} selected)
                  </label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleBulkAction('activate')}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Activate Selected
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('deactivate')}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    Deactivate Selected
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('delete')}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </ResponsiveContainer>

      {/* Organizations List */}
      <ResponsiveContainer maxWidth="full">
        {organizationsState.loading ? (
          <ResponsiveGrid cols={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="md">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 bg-gray-200 rounded">
                      <div className="h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    <div className="p-2 bg-gray-200 rounded">
                      <div className="h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    <div className="p-2 bg-gray-200 rounded">
                      <div className="h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
        ) : filteredOrganizations.length > 0 ? (
          <ResponsiveGrid cols={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="md">
            {filteredOrganizations.map((org) => (
              <Card key={org.id} className={`p-6 hover:shadow-lg transition-shadow group ${selectedOrgs.has(org.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {showBulkActions && (
                      <input
                        type="checkbox"
                        checked={selectedOrgs.has(org.id)}
                        onChange={() => handleSelectOrg(org.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <div className={`h-12 w-12 bg-gradient-to-br ${getThemeColor(org.settings?.theme || 'blue')} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-600">@{org.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(org.isActive)}`}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{org.userCount || 0}</p>
                      <p className="text-xs text-gray-600">Users</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{org.teamCount || 0}</p>
                      <p className="text-xs text-gray-600">Teams</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{org.appCount || 0}</p>
                      <p className="text-xs text-gray-600">Apps</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {org.plan && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 mb-2">
                        <span className="text-xs font-medium text-blue-700">Plan:</span>
                        <span className="text-xs font-bold text-blue-900">{org.plan.name}</span>
                      </div>
                    )}
                    <p className="truncate">Created: {new Date(org.createdAt).toLocaleDateString()}</p>
                    <p className="truncate">Updated: {new Date(org.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleViewOrganization(org)}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowPlanChangeModal(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Change Plan
                  </Button>
                  <Button
                    onClick={() => handleEditOrganization(org)}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-0 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleToggleOrganizationStatus(org)}
                    variant="outline"
                    size="sm"
                    className={`flex-1 min-w-0 ${org.isActive ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                  >
                    {org.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleDeleteOrganization(org)}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-0 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No organizations match your current filters. Try adjusting your search criteria.'
                : 'No organizations have been created yet.'
              }
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <span className="mr-2">➕</span>
              Create Your First Organization
            </Button>
          </Card>
        )}
      </ResponsiveContainer>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOrgName(value);
                    // Auto-generate slug from name, but allow manual editing
                    if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/\s+/g, '-')) {
                      setOrgSlug(value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setOrgSlug(value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="organization-slug"
                />
                <p className="text-xs text-gray-500 mt-1">Used in URLs and API calls</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrganization}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Organization</h3>
            <form id="edit-form" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedOrg.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={selectedOrg.slug}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                  name="theme"
                  defaultValue={selectedOrg.settings?.theme || 'blue'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
            </form>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await organizationsActions.execute(
                    async () => {
                      if (selectedOrg) {
                        const formData = new FormData(document.getElementById('edit-form') as HTMLFormElement);
                        const name = formData.get('name') as string;
                        const slug = formData.get('slug') as string;
                        const theme = formData.get('theme') as string;
                        
                        const updatedOrg = await apiClient.updateOrganization(selectedOrg.id, {
                          name,
                          slug,
                          settings: { 
                            ...selectedOrg.settings,
                            theme, 
                            features: selectedOrg.settings?.features || [] 
                          }
                        });
                        
                        // Update local state
                        const currentOrgs = organizationsState.data || [];
                        const updatedOrgs = currentOrgs.map(o => 
                          o.id === selectedOrg.id ? { ...o, ...updatedOrg } : o
                        );
                        organizationsActions.setData(updatedOrgs);
                        
                        setShowEditModal(false);
                        return updatedOrg;
                      }
                    },
                    () => {
                      toastActions.showToast({
                        type: 'success',
                        title: 'Success',
                        message: 'Organization updated successfully!'
                      });
                    },
                    (error) => {
                      toastActions.showToast({
                        type: 'error',
                        title: 'Failed to update organization',
                        message: error.message
                      });
                    }
                  );
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Update Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {showDetailsModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Organization Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Organization Header */}
              <div className="flex items-center space-x-4">
                <div className={`h-16 w-16 bg-gradient-to-br ${getThemeColor(selectedOrg.settings?.theme || 'blue')} rounded-lg flex items-center justify-center text-white font-bold text-2xl`}>
                  {selectedOrg.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h4>
                  <p className="text-lg text-gray-600">@{selectedOrg.slug}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedOrg.isActive)}`}>
                    {selectedOrg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{selectedOrg.userCount || 0}</div>
                  <div className="text-sm text-blue-600">Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{selectedOrg.teamCount || 0}</div>
                  <div className="text-sm text-green-600">Teams</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{selectedOrg.appCount || 0}</div>
                  <div className="text-sm text-purple-600">Apps</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">{selectedOrg.settings?.theme || 'blue'}</div>
                  <div className="text-sm text-orange-600">Theme</div>
                </div>
              </div>
              
              {/* Organization Information */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-900">Organization Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">{new Date(selectedOrg.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-sm text-gray-900">{new Date(selectedOrg.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedOrg.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <p className="text-sm text-gray-900">{selectedOrg.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
              
              {/* Settings */}
              {selectedOrg.settings && Object.keys(selectedOrg.settings).length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900">Settings</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedOrg.settings, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditOrganization(selectedOrg);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showPlanChangeModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Plan for {selectedOrg.name}
            </h3>
            
            {selectedOrg.plan && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">Current Plan:</p>
                <p className="text-lg font-bold text-blue-900">{selectedOrg.plan.name}</p>
              </div>
            )}

            <div className="space-y-3">
              {allPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={async () => {
                    try {
                      await apiClient.assignPlanToOrganization(selectedOrg.id, plan.id);
                      
                      // Update local state
                      const currentOrgs = organizationsState.data || [];
                      const updatedOrgs = currentOrgs.map(org =>
                        org.id === selectedOrg.id
                          ? { ...org, planId: plan.id, plan: { id: plan.id, name: plan.name, slug: plan.slug, description: plan.description, isDefault: plan.isDefault } }
                          : org
                      );
                      organizationsActions.setData(updatedOrgs);
                      
                      setShowPlanChangeModal(false);
                      setSelectedOrg(null);
                      
                      toastActions.showToast({
                        type: 'success',
                        title: 'Success',
                        message: `Plan changed to ${plan.name} successfully!`
                      });
                    } catch (error) {
                      toastActions.showToast({
                        type: 'error',
                        title: 'Failed to change plan',
                        message: error instanceof Error ? error.message : 'Unknown error'
                      });
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOrg.planId === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                      {plan.description && (
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      )}
                    </div>
                    {selectedOrg.planId === plan.id && (
                      <span className="text-blue-600 font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPlanChangeModal(false);
                  setSelectedOrg(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
    </UnifiedLayout>
  );
}
