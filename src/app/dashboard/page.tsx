"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserDashboard from '../../components/dashboard/UserDashboard';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import SuperAdminDashboard from '../../components/dashboard/SuperAdminDashboard';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <UnifiedLayout
        title="Loading..."
        subtitle="Checking authentication status"
        variant="dashboard"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedLayout>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Debug logging to see what's happening
  console.log('=== DASHBOARD DEBUG ===');
  console.log('User:', user);
  console.log('User Role:', user?.role);
  console.log('Is Authenticated:', isAuthenticated);
  console.log('User Role Type:', typeof user?.role);

  // Determine user role for dashboard routing
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isRegularUser = user?.role === 'USER';

  console.log('Is Super Admin:', isSuperAdmin);
  console.log('Is Admin:', isAdmin);
  console.log('Is Regular User:', isRegularUser);
  console.log('Will show Admin Dashboard:', isAdmin || isSuperAdmin);
  console.log('Will show User Dashboard:', isRegularUser);
  console.log('========================');

  // Get role-specific welcome message
  const getWelcomeMessage = () => {
    if (isSuperAdmin) {
      return {
        title: "Super Admin Dashboard",
        subtitle: `Welcome back, ${user?.name || user?.email}! Manage all organizations and system-wide settings.`,
        icon: "👑"
      };
    } else if (isAdmin) {
      return {
        title: "Admin Dashboard",
        subtitle: `Welcome back, ${user?.name || user?.email}! Manage your organization's products and users.`,
        icon: "🛡️"
      };
    } else {
      return {
        title: "My Workspace",
        subtitle: `Welcome back, ${user?.name || user?.email}! Access your assigned products and collaborate with your team.`,
        icon: "🚀"
      };
    }
  };

  const welcome = getWelcomeMessage();

  return (
    <UnifiedLayout
      title={welcome.title}
      subtitle={welcome.subtitle}
      variant="dashboard"
    >
      {/* Route to appropriate dashboard based on user role */}
        {isSuperAdmin ? (
        <SuperAdminDashboard user={user} />
      ) : isAdmin ? (
        <AdminDashboard user={user} />
      ) : (
        <UserDashboard user={user} />
      )}
    </UnifiedLayout>
  );
}
