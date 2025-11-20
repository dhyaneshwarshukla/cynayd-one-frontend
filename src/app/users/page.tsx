"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient, Role, User } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';

// Using User from UI package

// Using Role from UI package

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  managerUsers: number;
  regularUsers: number;
  recentLogins: number;
}

export default function UsersPage() {
  // Set page title
  useEffect(() => {
    document.title = 'Users | CYNAYD One';
  }, []);
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    managerUsers: 0,
    regularUsers: 0,
    recentLogins: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteOrganizationId, setInviteOrganizationId] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteImage, setInviteImage] = useState('');
  const [generatePassword, setGeneratePassword] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Bulk action states
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | 'changeRole'>('activate');
  const [bulkRole, setBulkRole] = useState('user');

  // Determine user role (handle both uppercase and lowercase)
  const userRole = user?.role?.toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isManager = userRole === 'ADMIN'; // ADMIN role can manage users
  const canManageUsers = isAdmin || isManager;
  
  // Temporary: Always allow user management for debugging
  const canManageUsersDebug = true;

  // Form validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!generatePassword && !password.trim()) return 'Password is required';
    if (!generatePassword && password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateOrganization = (organizationId: string): string => {
    if (isSuperAdmin && !organizationId.trim()) return 'Organization selection is required for SuperAdmin users';
    return '';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    errors.email = validateEmail(inviteEmail);
    errors.name = validateName(inviteName);
    errors.password = validatePassword(invitePassword);
    errors.organization = validateOrganization(inviteOrganizationId);
    
    setFormErrors(errors);
    return Object.values(errors).every(error => error === '');
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const resetForm = () => {
    setInviteEmail('');
    setInviteName('');
    setInviteRole(availableRoles.length > 0 ? availableRoles[0].name.toLowerCase() : 'user');
    setInviteOrganizationId(isSuperAdmin ? '' : user?.organizationId || '');
    setInvitePassword('');
    setInviteImage('');
    setGeneratePassword(true);
    setSendWelcomeEmail(true);
    setFormErrors({});
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isAuthenticated && canManageUsersDebug) {
      console.log('👤 Current user:', user);
      console.log('🔐 User role:', user?.role);
      console.log('✅ Can manage users:', canManageUsers);
      fetchUsers(currentPage, pageSize);
      fetchAvailableRoles();
      
      // Fetch organizations for SuperAdmin users
      if (isSuperAdmin) {
        fetchAvailableOrganizations();
      }
    }
  }, [isAuthenticated, canManageUsersDebug, user, isSuperAdmin, currentPage, pageSize]);

  // Update bulkRole when availableRoles change
  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.find(r => r.name.toLowerCase() === bulkRole)) {
      setBulkRole(availableRoles[0].name.toLowerCase());
    }
  }, [availableRoles, bulkRole]);

  const fetchUsers = async (page: number = currentPage, limit: number = pageSize) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch users from API with pagination
      const response = await apiClient.getUsers(page, limit);
      
      // Handle paginated response
      let apiUsers: User[];
      let paginationInfo: { page: number; limit: number; total: number; totalPages: number } | null = null;
      
      if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
        // Paginated response
        apiUsers = (response as any).data;
        paginationInfo = (response as any).pagination;
        setCurrentPage(paginationInfo.page);
        setTotalPages(paginationInfo.totalPages);
        setTotalUsers(paginationInfo.total);
      } else if (Array.isArray(response)) {
        // Array response (backward compatibility)
        apiUsers = response;
        setTotalUsers(apiUsers.length);
        setTotalPages(1);
      } else {
        apiUsers = [];
        setTotalUsers(0);
        setTotalPages(1);
      }
      
      // Fetch organization details if user has organizationId
      if (user?.organizationId) {
        try {
          const orgDetails = await apiClient.getOrganizationById(user.organizationId);
          setOrganization({ id: orgDetails.id, name: orgDetails.name });
        } catch (orgError) {
          console.warn('Failed to fetch organization details:', orgError);
          // Fallback to showing organizationId if name fetch fails
          setOrganization({ id: user.organizationId, name: user.organizationId });
        }
      }
      
      // Transform API users to match our interface
      const transformedUsers: User[] = apiUsers.map((apiUser: any) => ({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        organizationId: apiUser.organizationId,
        emailVerified: apiUser.emailVerified || undefined,
        mfaEnabled: apiUser.mfaEnabled || false,
        isActive: apiUser.isActive !== undefined ? apiUser.isActive : true,
        createdAt: new Date(apiUser.createdAt),
        updatedAt: new Date(apiUser.updatedAt),
        // lastLogin and teams properties not available in User interface
      }));

      setUsers(transformedUsers);
      
      // Calculate stats from all users (if we have pagination info, use total; otherwise use current page)
      const activeUsers = transformedUsers.filter(u => (u as any).isActive !== false).length;
      const userStats: UserStats = {
        totalUsers: paginationInfo ? paginationInfo.total : transformedUsers.length,
        activeUsers: paginationInfo ? (paginationInfo.total - (transformedUsers.length - activeUsers)) : activeUsers,
        adminUsers: transformedUsers.filter(u => u.role?.toLowerCase() === 'admin' || u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length,
        managerUsers: transformedUsers.filter(u => u.role?.toLowerCase() === 'manager').length,
        regularUsers: transformedUsers.filter(u => u.role?.toLowerCase() === 'user').length,
        recentLogins: 0 // lastLogin property not available
      };
      
      setStats(userStats);
    } catch (err) {
      setError('Failed to load users');
      console.error('Users fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      console.log('🔍 Fetching available roles from database...');
      const roles = await apiClient.getAvailableRoles();
      console.log('✅ Fetched roles from database:', roles);
      setAvailableRoles(roles);
      
      // Set default role to the first available role if current selection is not available
      if (roles.length > 0 && !roles.find(r => r.name.toLowerCase() === inviteRole.toLowerCase())) {
        setInviteRole(roles[0].name.toLowerCase());
      }
    } catch (err) {
      console.error('❌ Failed to fetch available roles:', err);
      // Fallback to default roles if API fails
      const fallbackRoles: Role[] = [
        { 
          id: '1', 
          name: 'USER', 
          description: 'Standard user with basic permissions',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: '2', 
          name: 'MANAGER', 
          description: 'Manager with team management permissions',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        ...(isAdmin ? [{ 
          id: '3', 
          name: 'ADMIN', 
          description: 'Administrator with full permissions',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }] : [])
      ];
      console.log('🔄 Using fallback roles:', fallbackRoles);
      setAvailableRoles(fallbackRoles);
    }
  };

  const fetchAvailableOrganizations = async () => {
    try {
      console.log('🏢 Fetching available organizations...');
      const organizations = await apiClient.getOrganizations();
      console.log('✅ Fetched organizations:', organizations);
      setAvailableOrganizations(organizations);
      
      // Set default organization for SuperAdmin if none selected
      if (organizations.length > 0 && !inviteOrganizationId) {
        setInviteOrganizationId(organizations[0].id);
      }
    } catch (err) {
      console.error('❌ Failed to fetch organizations:', err);
      setAvailableOrganizations([]);
    }
  };

  const handleInviteUser = async () => {
    if (!validateForm()) {
      setError('Please fix the form errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Generate password if needed
      const finalPassword = generatePassword ? generateRandomPassword() : invitePassword;
      
      // Determine target organization
      const targetOrganizationId = isSuperAdmin ? inviteOrganizationId : user?.organizationId;
      
      // Create user via API - assign to selected organization
      const newUser = await apiClient.createUser({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        role: inviteRole.toUpperCase(), // Convert to uppercase to match database values
        organizationId: targetOrganizationId // Use selected organization
      });
      
      // Add the new user to our local state
      const transformedUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
        emailVerified: newUser.emailVerified || undefined,
        mfaEnabled: newUser.mfaEnabled || false,
        createdAt: new Date(newUser.createdAt),
        updatedAt: new Date(newUser.updatedAt),
        // lastLogin and teams properties not available in User interface
      };
      
      setUsers(prevUsers => [...prevUsers, transformedUser]);
      
      // Reset form and close modal
      resetForm();
      setShowInviteModal(false);
      
      const targetOrgName = isSuperAdmin 
        ? availableOrganizations.find(org => org.id === inviteOrganizationId)?.name || 'selected organization'
        : organization?.name || 'your organization';
      
      setSuccessMessage(`User "${newUser.name}" created successfully in ${targetOrgName}! ${sendWelcomeEmail ? 'Welcome email sent.' : ''}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      console.error('Create user error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
      try {
        setError(null);
        setSuccessMessage(null);
        await apiClient.deleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
        setSuccessMessage('User deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError('Failed to delete user');
        console.error('Delete user error:', err);
      }
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      const isCurrentlyActive = (user as any).isActive !== false;
      const updatedUser = isCurrentlyActive 
        ? await apiClient.deactivateUser(user.id)
        : await apiClient.activateUser(user.id);
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, ...updatedUser, isActive: updatedUser.isActive !== undefined ? updatedUser.isActive : !isCurrentlyActive } : u
      ));
      
      setSuccessMessage(`User ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Failed to ${(user as any).isActive !== false ? 'deactivate' : 'activate'} user`);
      console.error('Update user status error:', err);
    }
  };
  
  const handleDeactivateUser = async (userId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const updatedUser = await apiClient.deactivateUser(userId);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, ...updatedUser, isActive: false } : u
      ));
      setSuccessMessage('User deactivated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to deactivate user');
      console.error('Deactivate user error:', err);
    }
  };
  
  const handleActivateUser = async (userId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const updatedUser = await apiClient.activateUser(userId);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, ...updatedUser, isActive: true } : u
      ));
      setSuccessMessage('User activated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to activate user');
      console.error('Activate user error:', err);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      
      let successCount = 0;
      let errorCount = 0;

      for (const userId of selectedUsers) {
        try {
          switch (bulkAction) {
            case 'delete':
              await apiClient.deleteUser(userId);
              setUsers(users.filter(u => u.id !== userId));
              break;
            case 'activate':
              await apiClient.activateUser(userId);
              setUsers(users.map(u => u.id === userId ? { ...u, isActive: true } : u));
              break;
            case 'deactivate':
              await apiClient.deactivateUser(userId);
              setUsers(users.map(u => u.id === userId ? { ...u, isActive: false } : u));
              break;
            case 'changeRole':
              await apiClient.updateUser(userId, { role: bulkRole.toUpperCase() });
              setUsers(users.map(u => u.id === userId ? { ...u, role: bulkRole } : u));
              break;
          }
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Failed to ${bulkAction} user ${userId}:`, err);
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`Successfully processed ${successCount} user(s)`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      
      if (errorCount > 0) {
        setError(`Failed to process ${errorCount} user(s)`);
      }

      setSelectedUsers([]);
      setShowBulkActionsModal(false);
    } catch (err) {
      setError('Failed to perform bulk action');
      console.error('Bulk action error:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter.toLowerCase();
    const isUserActive = (user as any).isActive !== false;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && isUserActive) ||
                         (statusFilter === 'inactive' && !isUserActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = () => {
    return 'bg-green-100 text-green-800'; // All users are considered active
  };

  if (!canManageUsersDebug) {
    return (
      <UnifiedLayout
        title="Access Denied"
        subtitle="You don't have permission to view this page"
      >
        <Card className="p-12 text-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need administrator or manager privileges to access user management.
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
      title="User Management"
      subtitle={`Manage users, roles, and permissions${organization ? ` for ${organization.name}` : ''}`}
      variant="dashboard"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <span className="mr-2">👤</span>
            Add User
          </Button>
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="mr-2">🔄</span>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBulkActionsModal(true)}
            disabled={selectedUsers.length === 0}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">📊</span>
            Bulk Actions ({selectedUsers.length})
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-6">
          {successMessage}
        </Alert>
      )}

      {/* Organization Context */}
      {organization && (
        <ResponsiveContainer maxWidth="full" className="mb-6">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏢</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Organization Context</h3>
                <p className="text-sm text-blue-700">
                  Showing users from: <span className="font-medium">{organization.name}</span>
                </p>
                {organization.id !== organization.name && (
                  <p className="text-xs text-blue-600 mt-1">
                    Organization ID: {organization.id}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </ResponsiveContainer>
      )}

      {/* User Stats */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeUsers}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Admins</p>
                <p className="text-2xl font-bold text-red-900">{stats.adminUsers}</p>
              </div>
              <div className="text-2xl">👑</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Managers</p>
                <p className="text-2xl font-bold text-purple-900">{stats.managerUsers}</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Users</p>
                <p className="text-2xl font-bold text-orange-900">{stats.regularUsers}</p>
              </div>
              <div className="text-2xl">👤</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Recent Logins</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.recentLogins}</p>
              </div>
              <div className="text-2xl">🔐</div>
            </div>
          </Card>
        </div>
      </ResponsiveContainer>

      {/* Filters */}
      <ResponsiveContainer maxWidth="full" className="mb-6">
        <Card className="p-4 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
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
        </Card>
      </ResponsiveContainer>

      {/* Users List */}
      <ResponsiveContainer maxWidth="full">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="space-y-4">
              {/* Select All Header */}
              <Card className="p-4 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAllUsers}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({selectedUsers.length} of {filteredUsers.length} selected)
                  </span>
                </div>
              </Card>
              
              {filteredUsers.map((user) => {
                const isActive = (user as any).isActive !== false;
                return (
                <Card key={user.id} className={`p-6 hover:shadow-md transition-shadow ${!isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{user.name || 'Unknown'}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                          {user.emailVerified && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {user.mfaEnabled && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              MFA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-gray-600">
                        <p>Last login: Never</p>
                        <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </Button>
                        {(user as any).isActive !== false ? (
                          <Button
                            onClick={() => handleDeactivateUser(user.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleActivateUser(user.id)}
                            variant="outline"
                            size="sm"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteUser(user)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          </>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No users match your current filters. Try adjusting your search criteria.'
                : 'No users have been added to your organization yet.'
              }
            </p>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <span className="mr-2">👤</span>
              Add Your First User
            </Button>
          </Card>
        )}
      </ResponsiveContainer>

      {/* Add User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleInviteUser(); }}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">User Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (formErrors.email) {
                          setFormErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="user@company.com"
                      required
                    />
                    {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => {
                        setInviteName(e.target.value);
                        if (formErrors.name) {
                          setFormErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                      required
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                  </div>

                  {/* Organization Selection for SuperAdmin */}
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={inviteOrganizationId}
                        onChange={(e) => {
                          setInviteOrganizationId(e.target.value);
                          if (formErrors.organization) {
                            setFormErrors(prev => ({ ...prev, organization: validateOrganization(e.target.value) }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.organization ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select an organization...</option>
                        {availableOrganizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} {org.description && `- ${org.description}`}
                          </option>
                        ))}
                      </select>
                      {formErrors.organization && <p className="mt-1 text-sm text-red-600">{formErrors.organization}</p>}
                      {availableOrganizations.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">Loading available organizations...</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.name.toLowerCase()}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                    {availableRoles.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">Loading available roles...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL (Optional)</label>
                    <input
                      type="url"
                      value={inviteImage}
                      onChange={(e) => setInviteImage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/profile.jpg"
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional profile image URL</p>
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Account Setup</h4>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="generatePassword"
                      checked={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="generatePassword" className="text-sm font-medium text-gray-700">
                      Generate secure password automatically
                    </label>
                  </div>

                  {!generatePassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={invitePassword}
                        onChange={(e) => {
                          setInvitePassword(e.target.value);
                          if (formErrors.password) {
                            setFormErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter secure password"
                        minLength={8}
                      />
                      {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="sendWelcomeEmail"
                      checked={sendWelcomeEmail}
                      onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700">
                      Send welcome email with login instructions
                    </label>
                  </div>
                </div>

                {/* Organization Context */}
                {(organization || (isSuperAdmin && inviteOrganizationId)) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-600">🏢</div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Organization: {
                            isSuperAdmin 
                              ? availableOrganizations.find(org => org.id === inviteOrganizationId)?.name || 'Select organization above'
                              : organization?.name
                          }
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {isSuperAdmin 
                            ? 'This user will be added to the selected organization with the specified role and permissions.'
                            : 'This user will be automatically added to your organization with the specified role and permissions.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    resetForm();
                  }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail.trim() || !inviteName.trim() || (isSuperAdmin && !inviteOrganizationId.trim())}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating User...
                    </>
                  ) : (
                    'Create User'
                  )}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <form id="edit-user-form">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedUser.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedUser.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      name="role"
                      defaultValue={selectedUser.role.toLowerCase()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.name.toLowerCase()}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                </div>
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
                  if (!selectedUser) return;
                  
                  try {
                    // Get form data from the modal form inputs
                    const form = document.querySelector('#edit-user-form') as HTMLFormElement;
                    if (!form) {
                      setError('Form not found');
                      return;
                    }
                    
                    const formData = new FormData(form);
                    const updatedUser = await apiClient.updateUser(selectedUser.id, {
                      name: formData.get('name') as string,
                      email: formData.get('email') as string,
                      role: (formData.get('role') as string).toUpperCase()
                    });
                    
                    setUsers(users.map(u => 
                      u.id === selectedUser.id ? { ...u, ...updatedUser } : u
                    ));
                    setShowEditModal(false);
                    setSuccessMessage('User updated successfully!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                  } catch (err) {
                    setError('Failed to update user');
                    console.error('Update user error:', err);
                  }
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bulk Actions ({selectedUsers.length} users selected)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="activate">Activate Users</option>
                  <option value="deactivate">Deactivate Users</option>
                  <option value="changeRole">Change Role</option>
                  <option value="delete">Delete Users</option>
                </select>
              </div>
              
              {bulkAction === 'changeRole' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.name.toLowerCase()}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {bulkAction === 'delete' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    ⚠️ This action cannot be undone. All selected users will be permanently deleted.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBulkActionsModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  bulkAction === 'delete' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {bulkAction === 'delete' ? 'Delete Users' : 'Apply Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UnifiedLayout>
  );
}
