"use client";

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';

interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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

interface SecurityEventViewerProps {
  events: SecurityEvent[];
  onLoadMore: () => Promise<void>;
  isLoading?: boolean;
  hasMore?: boolean;
}

export const SecurityEventViewer: React.FC<SecurityEventViewerProps> = ({
  events,
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
      setError(err instanceof Error ? err.message : 'Failed to load more events');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Security Events</h2>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(
                    event.severity
                  )}`}
                >
                  {event.severity.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              {event.user && (
                <span className="text-sm text-gray-600">
                  {event.user.firstName} {event.user.lastName}
                </span>
              )}
            </div>

            <div className="text-sm">
              <p className="font-medium">{event.eventType}</p>
              <p className="text-gray-600 mt-1">{event.details}</p>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>IP: {event.ipAddress}</span>
              <span>User Agent: {event.userAgent}</span>
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