"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';

// Define AuditLog interface locally
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string | Date;
  user?: {
    name: string;
    email: string;
  };
}
import {
  ClockIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BellIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  GlobeAltIcon,
  DocumentArrowDownIcon,
  SignalIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

interface ExtendedAuditLog extends AuditLog {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId?: string;
  };
  organization?: {
    name: string;
  };
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  userActions: number;
  systemActions: number;
  securityActions: number;
  dataChanges: number;
  loginEvents: number;
  adminActions: number;
  deviceCount: number;
  activeSessions: number;
}

interface DeviceInfo {
  userAgent: string;
  lastSeen: string;
  loginCount: number;
  ipAddress?: string;
  isCurrentDevice: boolean;
}

interface LiveMonitoringState {
  isActive: boolean;
  lastUpdate: Date;
  newLogsCount: number;
  connectionStatus: 'online' | 'offline';
}

export default function AuditPage() {
  const { user, isAuthenticated } = useAuth();
  const [auditLogs, setAuditLogs] = useState<ExtendedAuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    todayLogs: 0,
    userActions: 0,
    systemActions: 0,
    securityActions: 0,
    dataChanges: 0,
    loginEvents: 0,
    adminActions: 0,
    deviceCount: 0,
    activeSessions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ExtendedAuditLog | null>(null);
  
  // New state for live monitoring and device tracking
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [liveMonitoring, setLiveMonitoring] = useState<LiveMonitoringState>({
    isActive: false,
    lastUpdate: new Date(),
    newLogsCount: 0,
    connectionStatus: 'online'
  });
  const [activeTab, setActiveTab] = useState<'logs' | 'devices' | 'live'>('logs');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine user role - only SUPER_ADMIN can access audit logs
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setLiveMonitoring(prev => ({ ...prev, connectionStatus: 'online' }));
    const handleOffline = () => setLiveMonitoring(prev => ({ ...prev, connectionStatus: 'offline' }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
      fetchAuditStats();
      fetchDevices();
    }
  }, [isAuthenticated]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
      }
    };
  }, []);

  const fetchAuditLogs = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch audit logs from API
      const apiLogs = await apiClient.getAuditLogs({
        limit: 50,
        offset: 0
      });
      
      // Use real API data - no dummy data, API always provides user info
      const extendedLogs: ExtendedAuditLog[] = apiLogs;

      setAuditLogs(extendedLogs);
      setLiveMonitoring(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Audit fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchAuditStats = useCallback(async () => {
    try {
      const statsData = await apiClient.getAuditStats();
      setStats(statsData);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const devicesData = await apiClient.getAuditDevices();
      setDevices(devicesData);
    } catch (err) {
      console.error('Devices fetch error:', err);
    }
  }, []);

  const fetchLiveLogs = useCallback(async () => {
    try {
      const since = liveMonitoring.lastUpdate;
      const newLogs = await apiClient.getLiveAuditLogs(since);
      
      if (newLogs.length > 0) {
        // Use real API data - no dummy data, API always provides user info
        const extendedNewLogs: ExtendedAuditLog[] = newLogs;
        
        setAuditLogs(prev => [...extendedNewLogs, ...prev]);
        setLiveMonitoring(prev => ({ 
          ...prev, 
          newLogsCount: prev.newLogsCount + newLogs.length,
          lastUpdate: new Date()
        }));
      }
    } catch (err) {
      console.error('Live logs fetch error:', err);
    }
  }, [liveMonitoring.lastUpdate]);

  const handleExportLogs = async () => {
    try {
      const blob = await apiClient.exportAuditLogs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export audit logs');
    }
  };

  const handleViewDetails = (log: ExtendedAuditLog) => {
    setSelectedLog(log);
    alert(`Viewing details for: ${log.action}... (Feature in development)`);
  };

  const toggleLiveMonitoring = () => {
    if (liveMonitoring.isActive) {
      // Stop live monitoring
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
        liveUpdateIntervalRef.current = null;
      }
      setLiveMonitoring(prev => ({ ...prev, isActive: false }));
    } else {
      // Start live monitoring
      setLiveMonitoring(prev => ({ ...prev, isActive: true }));
      liveUpdateIntervalRef.current = setInterval(() => {
        if (liveMonitoring.connectionStatus === 'online') {
          fetchLiveLogs();
        }
      }, 5000); // Update every 5 seconds
    }
  };

  const handleManualRefresh = () => {
    fetchAuditLogs(true);
    fetchAuditStats();
    fetchDevices();
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />;
    }
    return <ComputerDesktopIcon className="w-5 h-5" />;
  };

  const getDeviceName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    return 'Desktop Browser';
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log as ExtendedAuditLog).user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
    const matchesUser = userFilter === 'all' || (log as ExtendedAuditLog).user?.email === userFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = logDate >= today;
          break;
        case 'yesterday':
          matchesDate = logDate >= yesterday && logDate < today;
          break;
        case 'week':
          matchesDate = logDate >= weekAgo;
          break;
      }
    }
    
    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return '🔐';
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('invite')) return '📧';
    if (action.includes('export')) return '📤';
    if (action.includes('security')) return '🛡️';
    if (action.includes('role')) return '👑';
    if (action.includes('organization')) return '🏢';
    if (action.includes('team')) return '👥';
    if (action.includes('product')) return '📦';
    return '📝';
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600';
    if (action.includes('security')) return 'text-orange-600';
    if (action.includes('admin') || action.includes('role')) return 'text-purple-600';
    if (action.includes('create') || action.includes('invite')) return 'text-green-600';
    return 'text-blue-600';
  };

  if (!isSuperAdmin) {
    return (
      <UnifiedLayout
        title="Access Denied"
        subtitle="You don't have permission to view this page"
      >
        <Card className="p-12 text-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need Super Administrator privileges to access audit logs.
          </p>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Go Back
          </Button>
        </Card>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Audit & Security Monitoring"
      subtitle="Track and monitor all system activities, user actions, and device registrations"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportLogs}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button
            variant="outline"
            onClick={toggleLiveMonitoring}
            className={`border-gray-300 text-gray-700 hover:bg-gray-50 ${
              liveMonitoring.isActive ? 'bg-green-50 border-green-300 text-green-700' : ''
            }`}
          >
            <SignalIcon className={`w-4 h-4 mr-2 ${liveMonitoring.isActive ? 'animate-pulse' : ''}`} />
            {liveMonitoring.isActive ? 'Stop Live Monitor' : 'Start Live Monitor'}
          </Button>
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Status Bar */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className={`flex items-center text-sm ${
              liveMonitoring.connectionStatus === 'online' ? 'text-green-600' : 'text-red-600'
            }`}>
              {liveMonitoring.connectionStatus === 'online' ? (
                <WifiIcon className="w-4 h-4 mr-1" />
              ) : (
                <SignalIcon className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">
                {liveMonitoring.connectionStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Last Updated */}
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>Last updated: {liveMonitoring.lastUpdate.toLocaleTimeString()}</span>
            </div>
            
            {/* Live Monitoring Status */}
            {liveMonitoring.isActive && (
              <div className="flex items-center text-sm text-green-600">
                <BellIcon className="w-4 h-4 mr-1 animate-pulse" />
                <span>Live monitoring active</span>
                {liveMonitoring.newLogsCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {liveMonitoring.newLogsCount} new
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Refresh Indicator */}
            {isRefreshing && (
              <div className="flex items-center text-sm text-blue-600">
                <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                <span>Refreshing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Audit Logs
            </div>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'devices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
              Devices ({devices.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'live'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <SignalIcon className="w-5 h-5 mr-2" />
              Live Monitor
            </div>
          </button>
        </nav>
      </div>

      {/* Audit Stats */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Logs</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalLogs}</p>
                <p className="text-xs text-blue-700 mt-1">All time</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Today's Activity</p>
                <p className="text-2xl font-bold text-green-900">{stats.todayLogs}</p>
                <p className="text-xs text-green-700 mt-1">Last 24 hours</p>
              </div>
              <ClockIcon className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Data Changes</p>
                <p className="text-2xl font-bold text-purple-900">{stats.dataChanges}</p>
                <p className="text-xs text-purple-700 mt-1">Create/Update/Delete</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Registered Devices</p>
                <p className="text-2xl font-bold text-orange-900">{stats.deviceCount}</p>
                <p className="text-xs text-orange-700 mt-1">Unique devices</p>
              </div>
              <DevicePhoneMobileIcon className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Active Sessions</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.activeSessions}</p>
                <p className="text-xs text-indigo-700 mt-1">Remember me</p>
              </div>
              <UserIcon className="w-8 h-8 text-indigo-600" />
            </div>
          </Card>
        </div>
      </ResponsiveContainer>

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters */}
          <ResponsiveContainer maxWidth="full">
            <Card className="p-4 bg-gray-50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Actions</option>
                    <option value="login">Login</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="invite">Invite</option>
                    <option value="export">Export</option>
                    <option value="security">Security</option>
                  </select>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                  </select>
                </div>
              </div>
            </Card>
          </ResponsiveContainer>

          {/* Audit Logs List */}
      <ResponsiveContainer maxWidth="full">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getActionIcon(log.action)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace('.', ' ').toUpperCase()}
                        </h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {log.resource}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{JSON.stringify(log.details)}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>User: {(log as ExtendedAuditLog).user?.name}</span>
                        <span>IP: {log.ipAddress || 'No IP recorded'}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        {(log as ExtendedAuditLog).organization && <span>Org: {(log as ExtendedAuditLog).organization?.name}</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleViewDetails(log)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || actionFilter !== 'all' || dateFilter !== 'all'
                ? 'No logs match your current filters. Try adjusting your search criteria.'
                : 'No audit logs have been recorded yet.'
              }
            </p>
          </Card>
        )}
      </ResponsiveContainer>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <ResponsiveContainer maxWidth="full">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Registered Devices</h3>
                <div className="text-sm text-gray-500">
                  {devices.length} device{devices.length !== 1 ? 's' : ''} registered
                </div>
              </div>
              
              {devices.length > 0 ? (
                <div className="space-y-4">
                  {devices.map((device, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        device.isCurrentDevice 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            device.isCurrentDevice 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getDeviceIcon(device.userAgent)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {getDeviceName(device.userAgent)}
                              </h4>
                              {device.isCurrentDevice && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {device.userAgent.length > 80 
                                ? `${device.userAgent.substring(0, 80)}...` 
                                : device.userAgent
                              }
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <GlobeAltIcon className="w-3 h-3 mr-1" />
                                {device.ipAddress || 'No IP recorded'}
                              </span>
                              <span className="flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                Last seen: {new Date(device.lastSeen).toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <UserIcon className="w-3 h-3 mr-1" />
                                {device.loginCount} login{device.loginCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {device.isCurrentDevice && (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DevicePhoneMobileIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No devices registered</h3>
                  <p className="text-gray-500">Device information will appear here after users log in.</p>
                </div>
              )}
            </Card>
          </ResponsiveContainer>
        </div>
      )}

      {/* Live Monitor Tab */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <ResponsiveContainer maxWidth="full">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Live Activity Monitor</h3>
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center text-sm ${
                    liveMonitoring.connectionStatus === 'online' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      liveMonitoring.connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {liveMonitoring.connectionStatus === 'online' ? 'Connected' : 'Disconnected'}
                  </div>
                  <Button
                    onClick={toggleLiveMonitoring}
                    variant={liveMonitoring.isActive ? "outline" : "default"}
                    className={liveMonitoring.isActive 
                      ? "border-red-300 text-red-700 hover:bg-red-50" 
                      : "bg-green-600 hover:bg-green-700 text-white"
                    }
                  >
                    {liveMonitoring.isActive ? 'Stop Monitoring' : 'Start Monitoring'}
                  </Button>
                </div>
              </div>
              
              {liveMonitoring.isActive ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <SignalIcon className="w-5 h-5 text-green-600 mr-2 animate-pulse" />
                      <span className="text-green-800 font-medium">Live monitoring is active</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      New activity will appear here in real-time. Updates every 5 seconds.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">New Logs</p>
                          <p className="text-2xl font-bold text-blue-900">{liveMonitoring.newLogsCount}</p>
                        </div>
                        <BellIcon className="w-8 h-8 text-blue-600" />
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Uptime</p>
                          <p className="text-2xl font-bold text-green-900">
                            {Math.floor((Date.now() - liveMonitoring.lastUpdate.getTime()) / 1000)}s
                          </p>
                        </div>
                        <ClockIcon className="w-8 h-8 text-green-600" />
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-purple-50 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Status</p>
                          <p className="text-lg font-bold text-purple-900">
                            {liveMonitoring.connectionStatus === 'online' ? 'Online' : 'Offline'}
                          </p>
                        </div>
                        <WifiIcon className="w-8 h-8 text-purple-600" />
                      </div>
                    </Card>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                      {auditLogs.slice(0, 5).map((log, index) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg">{getActionIcon(log.action)}</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.action}</p>
                              <p className="text-xs text-gray-500">{(log as ExtendedAuditLog).user?.name}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <SignalIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Live monitoring is inactive</h3>
                  <p className="text-gray-500 mb-4">Start live monitoring to see real-time activity updates.</p>
                  <Button onClick={toggleLiveMonitoring} className="bg-green-600 hover:bg-green-700 text-white">
                    Start Live Monitoring
                  </Button>
                </div>
              )}
            </Card>
          </ResponsiveContainer>
        </div>
      )}
    </UnifiedLayout>
  );
}
