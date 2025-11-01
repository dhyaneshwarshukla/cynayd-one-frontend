"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient, SecurityEvent, AuditLog } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';

// Using SecurityEvent directly since it already has the correct user type

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  recentEvents: number;
  blockedAttempts: number;
  suspiciousActivity: number;
}

interface SecuritySettings {
  mfaRequired: boolean;
  mfaRequiredForAllDevices: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  sessionTimeout: number;
  ipWhitelist: string[];
  failedLoginLimit: number;
  accountLockoutDuration: number;
}

// Using AuditLog from UI package

interface ThreatAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export default function SecurityPage() {
  const { user, isAuthenticated } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    highEvents: 0,
    mediumEvents: 0,
    lowEvents: 0,
    recentEvents: 0,
    blockedAttempts: 0,
    suspiciousActivity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'audit' | 'threats' | 'settings'>('events');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    mfaRequired: false,
    mfaRequiredForAllDevices: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false
    },
    sessionTimeout: 30,
    ipWhitelist: [],
    failedLoginLimit: 5,
    accountLockoutDuration: 15
  });
  const [newIpAddress, setNewIpAddress] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  // Determine user role - ADMIN and SUPER_ADMIN can access security features
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isAuthenticated) {
      fetchSecurityData();
      fetchAuditLogs();
      fetchThreatAlerts();
      fetchSecuritySettings();
    }
  }, [isAuthenticated]);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [apiEvents, apiStats] = await Promise.all([
        apiClient.getSecurityEvents({
          limit: 50,
          offset: 0
        }),
        apiClient.getSecurityStats().catch(() => null)
      ]);
      
      setSecurityEvents(apiEvents as SecurityEvent[]);
      
      if (apiStats) {
        const securityStats: SecurityStats = {
          totalEvents: apiStats.totalEvents,
          criticalEvents: apiStats.eventsBySeverity.find(s => s.severity === 'critical')?.count || 0,
          highEvents: apiStats.eventsBySeverity.find(s => s.severity === 'high' || s.severity === 'HIGH')?.count || 0,
          mediumEvents: apiStats.eventsBySeverity.find(s => s.severity === 'medium')?.count || 0,
          lowEvents: apiStats.eventsBySeverity.find(s => s.severity === 'low')?.count || 0,
          recentEvents: apiStats.recentEvents,
          blockedAttempts: apiEvents.filter(e => 
            e.eventType.includes('attack') || e.eventType.includes('brute_force') || e.eventType.includes('LOGIN_FAILED')
          ).length,
          suspiciousActivity: apiEvents.filter(e => 
            e.eventType.includes('suspicious') || e.eventType.includes('hijacking') || e.eventType.includes('SUSPICIOUS_ACTIVITY')
          ).length
        };
        setStats(securityStats);
      } else {
        const securityStats: SecurityStats = {
          totalEvents: apiEvents.length,
          criticalEvents: apiEvents.filter(e => e.severity === 'critical').length,
          highEvents: apiEvents.filter(e => e.severity === 'high' || e.severity === 'HIGH').length,
          mediumEvents: apiEvents.filter(e => e.severity === 'medium').length,
          lowEvents: apiEvents.filter(e => e.severity === 'low').length,
          recentEvents: apiEvents.filter(e => 
            new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
          blockedAttempts: apiEvents.filter(e => 
            e.eventType.includes('attack') || e.eventType.includes('brute_force') || e.eventType.includes('LOGIN_FAILED')
          ).length,
          suspiciousActivity: apiEvents.filter(e => 
            e.eventType.includes('suspicious') || e.eventType.includes('hijacking') || e.eventType.includes('SUSPICIOUS_ACTIVITY')
          ).length
        };
        setStats(securityStats);
      }
    } catch (err) {
      setError('Failed to load security data');
      console.error('Security fetch error:', err);
      setSecurityEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await apiClient.getAuditLogs({
        limit: 100,
        offset: 0
      });
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    }
  };

  const fetchThreatAlerts = async () => {
    try {
      const alerts = await apiClient.getThreatAlerts();
      setThreatAlerts(alerts);
    } catch (err) {
      console.error('Failed to fetch threat alerts:', err);
      setThreatAlerts([]);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const [ipWhitelist, securitySettings] = await Promise.all([
        apiClient.getIpWhitelist(),
        apiClient.getSecuritySettings().catch(() => null)
      ]);
      
      setSettings(prev => ({ ...prev, ipWhitelist }));
      
      if (securitySettings) {
        setSettings(prev => ({
          ...prev,
          mfaRequired: securitySettings.mfaRequired,
          passwordPolicy: {
            minLength: securitySettings.passwordMinLength,
            requireUppercase: securitySettings.passwordRequireUppercase,
            requireLowercase: securitySettings.passwordRequireLowercase,
            requireNumbers: securitySettings.passwordRequireNumbers,
            requireSymbols: securitySettings.passwordRequireSymbols
          },
          sessionTimeout: securitySettings.sessionTimeout,
          failedLoginLimit: securitySettings.failedLoginLimit,
          accountLockoutDuration: securitySettings.accountLockoutDuration
        }));
      }
    } catch (err) {
      console.error('Failed to fetch security settings:', err);
    }
  };

  const handleAcknowledgeThreat = async (alertId: string) => {
    try {
      await apiClient.acknowledgeThreatAlert(alertId);
      setThreatAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (err) {
      alert('Failed to acknowledge threat alert');
    }
  };

  const handleAddIpToWhitelist = async () => {
    if (!newIpAddress.trim()) return;
    
    try {
      await apiClient.addToIpWhitelist(newIpAddress.trim());
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIpAddress.trim()]
      }));
      setNewIpAddress('');
      alert('IP address added to whitelist successfully!');
    } catch (err) {
      alert('Failed to add IP address to whitelist');
    }
  };

  const handleRemoveIpFromWhitelist = async (ipAddress: string) => {
    try {
      await apiClient.removeFromIpWhitelist(ipAddress);
      setSettings(prev => ({
        ...prev,
        ipWhitelist: prev.ipWhitelist.filter(ip => ip !== ipAddress)
      }));
      alert('IP address removed from whitelist successfully!');
    } catch (err) {
      alert('Failed to remove IP address from whitelist');
    }
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      const blob = await apiClient.exportSecurityReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Failed to export ${format.toUpperCase()} report`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await apiClient.updateSecuritySettings({
        mfaRequired: settings.mfaRequired,
        mfaRequiredForAllDevices: settings.mfaRequiredForAllDevices,
        passwordMinLength: settings.passwordPolicy.minLength,
        passwordRequireUppercase: settings.passwordPolicy.requireUppercase,
        passwordRequireLowercase: settings.passwordPolicy.requireLowercase,
        passwordRequireNumbers: settings.passwordPolicy.requireNumbers,
        passwordRequireSymbols: settings.passwordPolicy.requireSymbols,
        sessionTimeout: settings.sessionTimeout,
        failedLoginLimit: settings.failedLoginLimit,
        accountLockoutDuration: settings.accountLockoutDuration
      });
      alert('Security settings saved successfully!');
    } catch (err) {
      alert('Failed to save security settings');
    }
  };

  const filteredEvents = (Array.isArray(securityEvents) ? securityEvents : []).filter(event => {
    if (!event || typeof event !== 'object') return false;
    
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesType = eventTypeFilter === 'all' || event.eventType === eventTypeFilter;
    
    return matchesSeverity && matchesType;
  });

  if (!isAdmin) {
    return (
      <UnifiedLayout
        title="Access Denied"
        subtitle="You don't have permission to view this page"
      >
        <Card className="p-12 text-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need Super Administrator privileges to access security monitoring.
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
      title="Security Center"
      subtitle="Monitor security events and manage security settings"
      actions={
        isAdmin ? (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleExportReport('pdf')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <span className="mr-2">📊</span>
              Export Report
            </Button>
           
            <Button
              variant="outline"
              onClick={fetchSecurityData}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <span className="mr-2">🔄</span>
              Refresh
            </Button>
          </div>
        ) : null
      }
    >
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Security Stats */}
      <ResponsiveContainer maxWidth="full" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticalEvents}</p>
              </div>
              <div className="text-2xl">🚨</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-900">{stats.highEvents}</p>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Events</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEvents}</p>
              </div>
              <div className="text-2xl">🔍</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Blocked Attempts</p>
                <p className="text-2xl font-bold text-green-900">{stats.blockedAttempts}</p>
              </div>
              <div className="text-2xl">🛡️</div>
            </div>
          </Card>
        </div>
      </ResponsiveContainer>

      {/* Tab Navigation */}
      <ResponsiveContainer maxWidth="full" className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'events', name: 'Security Events', icon: '🔍' },
              { id: 'audit', name: 'Audit Logs', icon: '📋' },
              { id: 'threats', name: 'Threat Detection', icon: '🚨' },
              { id: 'settings', name: 'Security Settings', icon: '⚙️' }
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
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </ResponsiveContainer>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <ResponsiveContainer maxWidth="full" className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Security Events</h2>
              <div className="flex gap-3">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Event Types</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="LOGIN_FAILED">Login Failed</option>
                  <option value="MFA_ENABLED">MFA Enabled</option>
                  <option value="PASSWORD_CHANGE">Password Change</option>
                  <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                  <option value="BRUTE_FORCE_ATTACK">Brute Force Attack</option>
                </select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">
                            {event.eventType === 'LOGIN_SUCCESS' ? '✅' :
                             event.eventType === 'LOGIN_FAILED' ? '❌' :
                             event.eventType === 'MFA_ENABLED' ? '🔐' :
                             event.eventType === 'PASSWORD_CHANGE' ? '🔑' :
                             event.eventType === 'SUSPICIOUS_ACTIVITY' ? '⚠️' :
                             event.eventType === 'BRUTE_FORCE_ATTACK' ? '🚫' : '🔍'}
                          </span>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {event.eventType.replace('_', ' ')}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.details}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>IP: {event.ipAddress}</span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          {event.user && <span>User: {event.user.name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          onClick={() => {}}
                          className="border-red-300 text-red-700 hover:bg-red-50 opacity-50 cursor-not-allowed"
                        >
                          Block IP
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          onClick={() => {}}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 opacity-50 cursor-not-allowed"
                        >
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-600">No security events found</p>
                <p className="text-sm text-gray-500 mt-2">Security events will appear here when they occur</p>
              </div>
            )}
          </Card>
        </ResponsiveContainer>
      )}

      {activeTab === 'audit' && (
        <ResponsiveContainer maxWidth="full" className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('csv')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-2">📊</span>
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchAuditLogs}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <span className="mr-2">🔄</span>
                  Refresh
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">
                            {log.action === 'LOGIN' ? '🔐' :
                             log.action === 'PASSWORD_CHANGE' ? '🔑' :
                             log.action === 'MFA_ENABLED' ? '🛡️' :
                             log.action === 'LOGOUT' ? '🚪' :
                             log.action === 'PROFILE_UPDATE' ? '👤' : '📝'}
                          </span>
                          <h4 className="font-medium text-gray-900">{log.action}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {log.resource}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{JSON.stringify(log.details)}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>User: {log.userId}</span>
                          <span>IP: {log.ipAddress}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-600">No audit logs found</p>
                  <p className="text-sm text-gray-500 mt-2">Audit logs will appear here when users perform actions</p>
                </div>
              )}
            </div>
          </Card>
        </ResponsiveContainer>
      )}

      {activeTab === 'threats' && (
        <ResponsiveContainer maxWidth="full" className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Alerts */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Threats</h2>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {threatAlerts.filter(t => !t.acknowledged).length} Active
                </span>
              </div>
              
              <div className="space-y-3">
                {threatAlerts.length > 0 ? (
                  threatAlerts.map((threat) => (
                    <div key={threat.id} className={`border rounded-lg p-4 ${
                      threat.acknowledged 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">🚨</span>
                            <h4 className="font-medium text-gray-900">{threat.type}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              threat.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              threat.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              threat.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-green-200 text-green-800'
                            }`}>
                              {threat.severity.toUpperCase()}
                            </span>
                            {threat.acknowledged && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                ACKNOWLEDGED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{threat.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>Source: {threat.source}</span>
                            <span>{new Date(threat.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        {!threat.acknowledged && (
                          <Button
                            onClick={() => handleAcknowledgeThreat(threat.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-100"
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-600">No active threats detected</p>
                    <p className="text-sm text-gray-500 mt-2">System is secure</p>
                  </div>
                )}
              </div>
            </Card>

            {/* IP Whitelist Management */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">IP Whitelist</h2>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {settings.ipWhitelist.length} IPs
                </span>
              </div>
              
              <div className="space-y-4">
                {/* Add IP Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleAddIpToWhitelist}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add IP
                  </Button>
                </div>
                
                {/* IP List */}
                <div className="space-y-2">
                  {settings.ipWhitelist.length > 0 ? (
                    settings.ipWhitelist.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="font-mono text-sm">{ip}</span>
                        <Button
                          onClick={() => handleRemoveIpFromWhitelist(ip)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No IP addresses whitelisted</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </ResponsiveContainer>
      )}

      {activeTab === 'settings' && (
        <ResponsiveContainer maxWidth="full" className="mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Configuration</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MFA Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Multi-Factor Authentication</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.mfaRequired}
                      onChange={(e) => setSettings({...settings, mfaRequired: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Require MFA for all users</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.mfaRequiredForAllDevices}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (confirm('This will enable MFA for all devices across all users. Continue?')) {
                            setSettings({...settings, mfaRequiredForAllDevices: true});
                            alert('MFA will be enabled for all devices. This may require users to re-authenticate.');
                            // TODO: Implement API call to enable MFA for all devices
                          }
                        } else {
                          setSettings({...settings, mfaRequiredForAllDevices: false});
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable MFA for all devices</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    When enabled, all users will be required to set up MFA on their devices. Existing sessions may be invalidated.
                  </p>
                </div>
              </div>

              {/* Password Policy */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Password Policy</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Length</label>
                    <input
                      type="number"
                      value={settings.passwordPolicy.minLength}
                      onChange={(e) => setSettings({
                        ...settings,
                        passwordPolicy: {...settings.passwordPolicy, minLength: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireUppercase}
                        onChange={(e) => setSettings({
                          ...settings,
                          passwordPolicy: {...settings.passwordPolicy, requireUppercase: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Require uppercase letters</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireLowercase}
                        onChange={(e) => setSettings({
                          ...settings,
                          passwordPolicy: {...settings.passwordPolicy, requireLowercase: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Require lowercase letters</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireNumbers}
                        onChange={(e) => setSettings({
                          ...settings,
                          passwordPolicy: {...settings.passwordPolicy, requireNumbers: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Require numbers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.passwordPolicy.requireSymbols}
                        onChange={(e) => setSettings({
                          ...settings,
                          passwordPolicy: {...settings.passwordPolicy, requireSymbols: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Require symbols</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Session Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Session Management</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Failed Login Limit</label>
                    <input
                      type="number"
                      value={settings.failedLoginLimit}
                      onChange={(e) => setSettings({...settings, failedLoginLimit: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.accountLockoutDuration}
                      onChange={(e) => setSettings({...settings, accountLockoutDuration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Security Actions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Security Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleExportReport('json')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <span className="mr-2">📊</span>
                    Export Security Report (JSON)
                  </Button>
                  <Button
                    onClick={() => alert('Terminate All Sessions functionality coming soon')}
                    variant="outline"
                    disabled
                    className="w-full border-red-300 text-red-700 hover:bg-red-50 opacity-50 cursor-not-allowed"
                  >
                    <span className="mr-2">🚫</span>
                    Terminate All Sessions
                  </Button>
                  <Button
                    onClick={() => alert('Security Audit functionality coming soon')}
                    variant="outline"
                    disabled
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 opacity-50 cursor-not-allowed"
                  >
                    <span className="mr-2">🔍</span>
                    Run Security Audit
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={handleSaveSettings}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save All Settings
              </Button>
            </div>
          </Card>
        </ResponsiveContainer>
      )}
    </UnifiedLayout>
  );
}
