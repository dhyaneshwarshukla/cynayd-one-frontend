"use client";

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Define helper functions locally
const canSeeNavigationItem = (userRole: string, requiredPermissions: string[]): boolean => {
  // Map permissions to roles that can access them
  const permissionToRoles: { [key: string]: string[] } = {
    'apps': ['ADMIN', 'SUPER_ADMIN'],
    'organizations': ['SUPER_ADMIN'],
    'users': ['ADMIN', 'SUPER_ADMIN'],
    'audit': ['ADMIN', 'SUPER_ADMIN'],
    'security': ['ADMIN', 'SUPER_ADMIN'],
    'roles': ['SUPER_ADMIN'],
    'settings': ['ADMIN', 'SUPER_ADMIN'],
    'support': ['ADMIN', 'SUPER_ADMIN']
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
import {
  HomeIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  CommandLineIcon,
  BuildingOfficeIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  LifebuoyIcon,
} from '@heroicons/react/24/outline';

interface AdminNavigationProps {
  variant?: 'sidebar' | 'mobile';
  className?: string;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  variant = 'sidebar',
  className = ''
}) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Only show admin navigation for admin users
  if (!isAdmin) {
    return null;
  }

  // Separate navigation items by category for better organization
  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon, permission: null },
  ];

  const managementNavigation = [
    { name: "Users", href: "/users", icon: UsersIcon, permission: 'users' },
    { name: "Apps", href: "/apps", icon: Squares2X2Icon, permission: 'apps' },
  ];

  const systemNavigation = [
    { name: "Organizations", href: "/organizations", icon: BuildingOfficeIcon, permission: 'organizations' },
    { name: "Plans & Pricing", href: "/admin/plans", icon: BanknotesIcon, permission: 'organizations' },
    { name: "Roles & Permissions", href: "/roles", icon: KeyIcon, permission: 'roles' },
    { name: "Security", href: "/security", icon: ShieldCheckIcon, permission: 'security' },
    { name: "Audit Logs", href: "/audit", icon: ClipboardDocumentListIcon, permission: 'audit' },
    { name: "Support", href: "/admin/support", icon: LifebuoyIcon, permission: 'support' },
    { name: "Settings", href: "/settings", icon: CogIcon, permission: 'settings' },
  ];

  // Combine all navigation for rendering
  const navigation = [
    ...mainNavigation,
    ...managementNavigation,
    ...systemNavigation,
  ];

  const isMobile = variant === 'mobile';
  const baseClasses = isMobile 
    ? "flex flex-col space-y-1 px-2 py-2" 
    : "flex flex-col space-y-1";

  return (
    <nav className={`${baseClasses} ${className}`}>
      {/* Main Navigation */}
      {mainNavigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon
              className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive
                  ? "text-gray-500"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
              aria-hidden="true"
            />
            <span>{item.name}</span>
          </Link>
        );
      })}

      {/* Management Section */}
      {managementNavigation.some(item => !item.permission || (user?.role && canSeeNavigationItem(user.role as any, [item.permission]))) && (
        <>
          <div className="px-2 py-2 mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Management
            </h3>
          </div>
          {managementNavigation.map((item) => {
            const isActive = pathname === item.href;
            
            // Check if user has permission to see this navigation item
            if (item.permission && user?.role && !canSeeNavigationItem(user.role as any, [item.permission])) {
              return null;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-blue-500"
                  }`}
                  aria-hidden="true"
                />
                <span className="font-medium">{item.name}</span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Admin
                </span>
              </Link>
            );
          })}
        </>
      )}

      {/* System Section */}
      {systemNavigation.some(item => !item.permission || (user?.role && canSeeNavigationItem(user.role as any, [item.permission]))) && (
        <>
          <div className="px-2 py-2 mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              System
            </h3>
          </div>
          {systemNavigation.map((item) => {
            const isActive = pathname === item.href;
            
            // Check if user has permission to see this navigation item
            if (item.permission && user?.role && !canSeeNavigationItem(user.role as any, [item.permission])) {
              return null;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-purple-100 text-purple-900"
                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive
                      ? "text-purple-500"
                      : "text-gray-400 group-hover:text-purple-500"
                  }`}
                  aria-hidden="true"
                />
                <span className="font-medium">{item.name}</span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  System
                </span>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
};
