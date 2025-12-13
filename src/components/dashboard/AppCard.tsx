import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAppAccess {
  id: string;
  userId: string;
  appId: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
  quota?: number;
  usedQuota: number;
}

export interface AppWithAccess extends App {
  userAccess?: UserAppAccess;
}

interface AppCardProps {
  app: AppWithAccess;
  isAdmin?: boolean;
  onAccess?: (app: AppWithAccess) => void;
  onManageAccess?: (app: AppWithAccess) => void;
  onViewUsage?: (app: AppWithAccess) => void;
  className?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  isAdmin = false,
  onAccess,
  onManageAccess,
  onViewUsage,
  className = '',
}) => {
  const hasAccess = app.userAccess?.isActive;
  const isExpired = app.userAccess?.expiresAt && 
    new Date(app.userAccess.expiresAt) < new Date();
  const quotaUsed = app.userAccess?.quota ? 
    (app.userAccess.usedQuota / app.userAccess.quota) * 100 : 0;

  const getStatusColor = () => {
    if (!hasAccess) return 'bg-gray-100 text-gray-600';
    if (isExpired) return 'bg-red-100 text-red-600';
    return 'bg-green-100 text-green-600';
  };

  const getStatusText = () => {
    if (!hasAccess) return 'No Access';
    if (isExpired) return 'Expired';
    return 'Active';
  };

  const getQuotaColor = () => {
    if (quotaUsed >= 90) return 'bg-red-500';
    if (quotaUsed >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className={`p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {app.icon && (
            <div 
              className="text-3xl p-3 rounded-xl shadow-sm"
              style={{ 
                backgroundColor: app.color ? `${app.color}15` : '#f3f4f6',
                border: `2px solid ${app.color ? `${app.color}30` : '#e5e7eb'}`
              }}
            >
              {app.icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.name}</h3>
            {app.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{app.description}</p>
            )}
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Enhanced Quota Usage */}
      {hasAccess && app.userAccess?.quota && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Usage</span>
            <span className="text-sm font-semibold text-gray-900">
              {app.userAccess.usedQuota} / {app.userAccess.quota}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className={`h-3 rounded-full transition-all duration-500 shadow-sm ${getQuotaColor()}`}
              style={{ width: `${Math.min(quotaUsed, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {quotaUsed.toFixed(1)}% used
          </div>
        </div>
      )}

      {/* Expiration Warning */}
      {hasAccess && app.userAccess?.expiresAt && !isExpired && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            Access expires on {new Date(app.userAccess.expiresAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="flex flex-col space-y-2">
        {hasAccess && !isExpired ? (
          <Button
            onClick={() => onAccess?.(app)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            size="sm"
          >
            <span className="mr-2">🚀</span>
            Access {app.name}
          </Button>
        ) : (
          <Button
            disabled
            className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
            size="sm"
            variant="outline"
          >
            <span className="mr-2">🔒</span>
            {isExpired ? 'Access Expired' : 'No Access'}
          </Button>
        )}

        {isAdmin && (
          <div className="flex space-x-2">
            <Button
              onClick={() => onManageAccess?.(app)}
              variant="outline"
              size="sm"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-1">⚙️</span>
              Manage
            </Button>
            {hasAccess && (
              <Button
                onClick={() => onViewUsage?.(app)}
                variant="ghost"
                size="sm"
                className="flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="mr-1">📊</span>
                Usage
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

