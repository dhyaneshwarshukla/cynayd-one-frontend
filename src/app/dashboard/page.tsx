"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { MobileApprovalSetupBanner } from '@/components/auth/MobileApprovalSetupBanner';
import UserDashboard from '../../components/dashboard/UserDashboard';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import SuperAdminDashboard from '../../components/dashboard/SuperAdminDashboard';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRoleLabel(role?: string): string {
  if (!role) return 'Member';
  const normalized = role.replace(/_/g, ' ').toLowerCase();
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Dashboard | CYNAYD One';
  }, []);

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

  if (isLoading) {
    return (
      <UnifiedLayout variant="dashboard" breadcrumb={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}>
        <DashboardSkeleton />
      </UnifiedLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const userRole = user?.role?.toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const greeting = getTimeGreeting();

  const welcome = (() => {
    if (isSuperAdmin) {
      return {
        title: 'Platform overview',
        subtitle:
          'Manage organizations, system applications, and platform-wide configuration.',
      };
    }
    if (isAdmin) {
      return {
        title: `${greeting}, ${displayName}`,
        subtitle:
          'Monitor your organization — users, applications, security, and activity.',
      };
    }
    return {
      title: `${greeting}, ${displayName}`,
      subtitle: 'Launch your assigned applications and manage your workspace settings.',
    };
  })();

  const breadcrumb = [
    { label: 'Home', href: '/dashboard' },
    { label: isSuperAdmin ? 'Platform' : 'Dashboard' },
  ];

  return (
    <UnifiedLayout
      title={welcome.title}
      subtitle={welcome.subtitle}
      variant="dashboard"
      breadcrumb={breadcrumb}
    >
      <MobileApprovalSetupBanner />
      {isSuperAdmin ? (
        <SuperAdminDashboard user={user} />
      ) : isAdmin ? (
        <AdminDashboard user={user} />
      ) : (
        <UserDashboard user={user} roleLabel={formatRoleLabel(user.role)} />
      )}
    </UnifiedLayout>
  );
}
