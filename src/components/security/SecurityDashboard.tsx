"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  details?: any;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: any;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  mediumSeverityEvents: number;
  lowSeverityEvents: number;
  last24Hours: number;
  last7Days: number;
}

interface SecurityDashboardProps {
  apiClient: any; // We'll type this properly later
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ apiClient }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'audit'>('overview');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch security events, audit logs, and metrics
      const [events, logs, securityMetrics] = await Promise.all([
        apiClient.getSecurityEvents(),
        apiClient.getAuditLogs(),
        apiClient.getSecurityMetrics(),
      ]);
      
      setSecurityEvents(events);
      setAuditLogs(logs);
      setMetrics(securityMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security data');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading && !metrics) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading security dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <Button
          onClick={fetchSecurityData}
          disabled={isLoading}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: 'Security Events' },
            { id: 'audit', label: 'Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-semibold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Events</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.totalEvents}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-semibold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Critical</p>
                  <p className="text-2xl font-semibold text-red-600">{metrics.criticalEvents}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-semibold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">High Severity</p>
                  <p className="text-2xl font-semibold text-orange-600">{metrics.highSeverityEvents}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">24h</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Last 24 Hours</p>
                  <p className="text-2xl font-semibold text-blue-600">{metrics.last24Hours}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Events</h3>
            <div className="space-y-3">
              {securityEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-900">{event.type}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatTimestamp(event.timestamp)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Security Events</h2>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{event.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {event.userId && <span>User: {event.userId}</span>}
                      {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                      <span>Time: {formatTimestamp(event.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">{log.action}</span>
                      <span className="text-sm text-gray-500">on</span>
                      <span className="text-sm font-medium text-gray-900">{log.resource}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <span>User: {log.userName}</span>
                      <span>Resource ID: {log.resourceId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Time: {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
