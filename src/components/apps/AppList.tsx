"use client";

import React from 'react';
import { ResponsiveGrid } from '../layout/ResponsiveLayout';
import { EmptyState } from '../common/EmptyState';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { AppCard } from './AppCard';
import { AppWithAccess } from '@/lib/api-client';

interface AppListProps {
  apps: AppWithAccess[];
  loading: boolean;
  onAccess: (appId: string) => void;
  onManage?: (app: AppWithAccess) => void;
  isAccessing?: string | null;
  getAccessStatus: (app: AppWithAccess) => {
    status: string;
    color: string;
    icon: React.ReactNode;
  };
  getUsagePercentage: (app: AppWithAccess) => number;
  searchTerm?: string;
}

export const AppList: React.FC<AppListProps> = ({
  apps,
  loading,
  onAccess,
  onManage,
  isAccessing,
  getAccessStatus,
  getUsagePercentage,
  searchTerm,
}) => {
  if (loading) {
    return (
      <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="md">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 border border-gray-200 rounded-lg">
            <SkeletonLoader variant="card" />
          </div>
        ))}
      </ResponsiveGrid>
    );
  }

  if (apps.length === 0) {
    return (
      <EmptyState
        icon="📱"
        title={searchTerm ? 'No apps found' : 'No Apps Available'}
        description={
          searchTerm
            ? 'Try adjusting your search terms or filters.'
            : "You don't have access to any apps yet. Contact your administrator to get started."
        }
        action={
          !searchTerm
            ? {
                label: 'Contact Administrator',
                onClick: () => {},
              }
            : undefined
        }
      />
    );
  }

  return (
    <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="md">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          onAccess={onAccess}
          onManage={onManage}
          isAccessing={isAccessing === app.id}
          getAccessStatus={getAccessStatus}
          getUsagePercentage={getUsagePercentage}
        />
      ))}
    </ResponsiveGrid>
  );
};

