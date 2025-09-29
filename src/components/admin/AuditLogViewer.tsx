"use client";

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';

interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  onLoadMore: () => Promise<void>;
  isLoading?: boolean;
  hasMore?: boolean;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  onLoadMore,
  isLoading = false,
  hasMore = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    try {
      await onLoadMore();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more logs');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getActionColor(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>
                <span className="text-sm text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              {log.user && (
                <span className="text-sm text-gray-600">
                  {log.user.firstName} {log.user.lastName}
                </span>
              )}
            </div>

            <div className="text-sm">
              <p className="font-medium">{log.resource}</p>
              <p className="text-gray-600 mt-1">{log.details}</p>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>IP: {log.ipAddress}</span>
              <span>User Agent: {log.userAgent}</span>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}; 