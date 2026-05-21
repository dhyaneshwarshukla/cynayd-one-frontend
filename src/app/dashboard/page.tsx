"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import UserDashboard from '../../components/dashboard/UserDashboard';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import SuperAdminDashboard from '../../components/dashboard/SuperAdminDashboard';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Set page title
  useEffect(() => {
    document.title = 'Dashboard | CYNAYD One';
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const displayName = useMemo(() => {
    if (!user) return '';
    const name = user.name?.trim();
    if (name) return name.split(/\s+/)[0];
    return user.email?.split('@')[0] || 'there';
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <UnifiedLayout variant="dashboard">
        <DashboardSkeleton />
      </UnifiedLayout>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Determine user role for dashboard routing (case-insensitive)
  const userRole = user?.role?.toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const greeting = getTimeGreeting();

  const getWelcomeMessage = () => {
    if (isSuperAdmin) {
      return {
        title: 'Super Admin Dashboard',
        subtitle:
          'Manage organizations, system apps, and platform-wide settings from one place.',
      };
    }
    if (isAdmin) {
      return {
        title: `${greeting}, ${displayName}`,
        subtitle:
          'Overview of your organization — users, apps, and recent activity.',
      };
    }
    return {
      title: `${greeting}, ${displayName}`,
      subtitle: 'Open your assigned apps and manage your account settings.',
    };
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
