"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { AuditLogViewer } from './AuditLogViewer';
import { SecurityEventViewer } from './SecurityEventViewer';

interface SecurityDashboardProps {
  initialLogs: any[];
  initialEvents: any[];
  onLoadMoreLogs: () => Promise<void>;
  onLoadMoreEvents: () => Promise<void>;
  isLoadingLogs?: boolean;
  isLoadingEvents?: boolean;
  hasMoreLogs?: boolean;
  hasMoreEvents?: boolean;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  initialLogs,
  initialEvents,
  onLoadMoreLogs,
  onLoadMoreEvents,
  isLoadingLogs = false,
  isLoadingEvents = false,
  hasMoreLogs = false,
  hasMoreEvents = false,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'events'>('logs');
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'logs' | 'events') => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'logs' ? 'default' : 'outline'}
            onClick={() => handleTabChange('logs')}
          >
            Audit Logs
          </Button>
          <Button
            variant={activeTab === 'events' ? 'default' : 'outline'}
            onClick={() => handleTabChange('events')}
          >
            Security Events
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {activeTab === 'logs' ? (
        <AuditLogViewer
          logs={initialLogs}
          onLoadMore={onLoadMoreLogs}
          isLoading={isLoadingLogs}
          hasMore={hasMoreLogs}
        />
      ) : (
        <SecurityEventViewer
          events={initialEvents}
          onLoadMore={onLoadMoreEvents}
          isLoading={isLoadingEvents}
          hasMore={hasMoreEvents}
        />
      )}
    </div>
  );
}; 