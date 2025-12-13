"use client";

import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AppWithAccess } from '@/lib/api-client';
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AppCardProps {
  app: AppWithAccess;
  onAccess: (appId: string) => void;
  onManage?: (app: AppWithAccess) => void;
  isAccessing?: boolean;
  getAccessStatus: (app: AppWithAccess) => {
    status: string;
    color: string;
    icon: React.ReactNode;
  };
  getUsagePercentage: (app: AppWithAccess) => number;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onAccess,
  onManage,
  isAccessing = false,
  getAccessStatus,
  getUsagePercentage,
}) => {
  const accessStatus = getAccessStatus(app);
  const usagePercentage = getUsagePercentage(app);

  return (
    <Card
      className="p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 group"
    >
      {/* App Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-200"
            style={{ backgroundColor: app.color || '#3b82f6' }}
            role="img"
            aria-label={`${app.name} icon`}
          >
            {app.icon || '📱'}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {app.name}
            </h3>
            <p className="text-sm text-gray-500">{app.slug}</p>
            <div className="flex items-center mt-1">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  accessStatus.color === 'green'
                    ? 'bg-green-500'
                    : accessStatus.color === 'yellow'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                aria-label={`Status: ${accessStatus.status}`}
              />
              <span className="text-xs text-gray-600">{accessStatus.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {app.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{app.description}</p>
      )}

      {/* Usage/Quota */}
      {app.access?.quota && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Usage</span>
            <span>
              {app.access.usedQuota || 0} / {app.access.quota}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercentage >= 90
                  ? 'bg-red-500'
                  : usagePercentage >= 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              role="progressbar"
              aria-valuenow={usagePercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Usage: ${usagePercentage}%`}
            />
          </div>
        </div>
      )}

      {/* Access Info */}
      {app.access && (
        <div className="mb-4 space-y-1 text-xs text-gray-600">
          {app.access.assignedAt && (
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" aria-hidden="true" />
              <span>Assigned: {new Date(app.access.assignedAt).toLocaleDateString()}</span>
            </div>
          )}
          {app.access.expiresAt && (
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" aria-hidden="true" />
              <span>Expires: {new Date(app.access.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => onAccess(app.id)}
          disabled={isAccessing}
          loading={isAccessing && isAccessing}
          className="flex-1"
          aria-label={`Access ${app.name}`}
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" aria-hidden="true" />
          Access
        </Button>
        {onManage && (
          <Button
            onClick={() => onManage(app)}
            variant="outline"
            size="sm"
            aria-label={`Manage ${app.name}`}
          >
            Manage
          </Button>
        )}
      </div>
    </Card>
  );
};

