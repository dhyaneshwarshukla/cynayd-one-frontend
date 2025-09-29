import { useState, useCallback } from 'react';

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

interface UseSecurityDashboardProps {
  initialLogs?: AuditLog[];
  initialEvents?: SecurityEvent[];
  pageSize?: number;
}

interface UseSecurityDashboardReturn {
  logs: AuditLog[];
  events: SecurityEvent[];
  isLoadingLogs: boolean;
  isLoadingEvents: boolean;
  hasMoreLogs: boolean;
  hasMoreEvents: boolean;
  loadMoreLogs: () => Promise<void>;
  loadMoreEvents: () => Promise<void>;
  error: string | null;
}

export const useSecurityDashboard = ({
  initialLogs = [],
  initialEvents = [],
  pageSize = 20,
}: UseSecurityDashboardProps = {}): UseSecurityDashboardReturn => {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [events, setEvents] = useState<SecurityEvent[]>(initialEvents);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMoreLogs = useCallback(async () => {
    if (isLoadingLogs || !hasMoreLogs) return;

    try {
      setIsLoadingLogs(true);
      setError(null);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/audit-logs?page=${Math.floor(logs.length / pageSize) + 1}&pageSize=${pageSize}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load audit logs');
      }

      setLogs((prevLogs) => [...prevLogs, ...data.logs]);
      setHasMoreLogs(data.logs.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logs.length, isLoadingLogs, hasMoreLogs, pageSize]);

  const loadMoreEvents = useCallback(async () => {
    if (isLoadingEvents || !hasMoreEvents) return;

    try {
      setIsLoadingEvents(true);
      setError(null);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/security-events?page=${Math.floor(events.length / pageSize) + 1}&pageSize=${pageSize}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load security events');
      }

      setEvents((prevEvents) => [...prevEvents, ...data.events]);
      setHasMoreEvents(data.events.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security events');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [events.length, isLoadingEvents, hasMoreEvents, pageSize]);

  return {
    logs,
    events,
    isLoadingLogs,
    isLoadingEvents,
    hasMoreLogs,
    hasMoreEvents,
    loadMoreLogs,
    loadMoreEvents,
    error,
  };
}; 