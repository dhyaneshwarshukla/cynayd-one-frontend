import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

const canSeeNavigationItem = (userRole: string, requiredPermissions: string[]): boolean => {
  // Map permissions to roles that can access them
  const permissionToRoles: { [key: string]: string[] } = {
    'apps': ['ADMIN', 'SUPER_ADMIN'],
    'organizations': ['SUPER_ADMIN'],
    'users': ['ADMIN', 'SUPER_ADMIN'],
    'audit': ['SUPER_ADMIN'],
    'security': ['SUPER_ADMIN'],
    'roles': ['SUPER_ADMIN'],
    'settings': ['SUPER_ADMIN']
  };

  // Check if user's role has any of the required permissions
  return requiredPermissions.some(permission => {
    const allowedRoles = permissionToRoles[permission] || [];
    return allowedRoles.includes(userRole);
  });
};

const getRoleDisplayName = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'USER': 'User'
  };
  return roleMap[role] || role;
};

export const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">CYNAYD One</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </a>
                
                {/* Role-based navigation items */}
                {user?.role && canSeeNavigationItem(user.role as any, ['apps']) && (
                  <a href="/apps" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Apps
                  </a>
                )}
                
                {user?.role && canSeeNavigationItem(user.role as any, ['organizations']) && (
                  <a href="/organizations" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Organizations
                  </a>
                )}
                
                {user?.role && canSeeNavigationItem(user.role as any, ['users']) && (
                  <a href="/users" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Users
                  </a>
                )}
                
                {user?.role && canSeeNavigationItem(user.role as any, ['audit']) && (
                  <a href="/audit" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Audit
                  </a>
                )}
                
                {user?.role && canSeeNavigationItem(user.role as any, ['security']) && (
                  <a href="/security" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Security
                  </a>
                )}
                
                {user?.role && canSeeNavigationItem(user.role as any, ['roles']) && (
                  <a href="/roles" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Roles
                  </a>
                )}
                
                {user?.role && canSeeNavigationItem(user.role as any, ['settings']) && (
                  <a href="/settings" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Settings
                  </a>
                )}
              </>
            ) : (
              <>
                <a href="/auth/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </a>
                <a href="/auth/register" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Register
                </a>
              </>
            )}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name} ({user?.role && getRoleDisplayName(user.role as any)})
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <a href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </a>
                <a href="/auth/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
