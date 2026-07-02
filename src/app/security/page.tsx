'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { apiClient, SecurityEvent } from '@/lib/api-client';
import { LiveSessionMonitor } from '@/components/security/LiveSessionMonitor';
import { SecurityEventCard } from '@/components/security/SecurityEventCard';
import { SecurityEventDetailModal } from '@/components/security/SecurityEventDetailModal';
import { SecurityRelatedLinks } from '@/components/security/SecurityRelatedLinks';
import { RejectedLoginAlerts } from '@/components/security/RejectedLoginAlerts';
import { RejectedLoginSummaryWidget } from '@/components/security/RejectedLoginSummaryWidget';
import {
  COMMON_EVENT_TYPES,
  normalizeSeverity,
} from '@/components/security/security-event-utils';
import {
  mapApiToSecuritySettings,
  type SecuritySettingsFormState,
} from '@/components/security/SecuritySettingsPanel';
import ToastContainer from '@/components/common/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { isAdminUser } from '@/utils/tenant';
import { ResponsiveContainer } from '@/components/layout/ResponsiveLayout';
import { DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ThreatAlert {
  id: string;
  type: string;
  severity: string;
  description: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

type TabId = 'events' | 'threats' | 'sessions' | 'settings';
const VALID_TABS: TabId[] = ['events', 'threats', 'sessions', 'settings'];

const DEFAULT_SETTINGS: SecuritySettingsFormState = {
  mfaRequired: false,
  passkeySatisfiesMfa: true,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  sessionTimeout: 30,
  failedLoginLimit: 5,
  accountLockoutDuration: 15,
  maxConcurrentSessions: 10,
  botDetectionEnabled: true,
  credentialStuffingEnabled: true,
  impossibleTravelMaxKmh: 900,
};

function countBySeverity(events: SecurityEvent[], level: string): number {
  return events.filter((e) => normalizeSeverity(e.severity) === level).length;
}

function SecurityPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toasts, { showToast, hideToast }] = useToast();
  const isAdmin = isAdminUser(user?.role);

  const [activeTab, setActiveTab] = useState<TabId>('events');
  const [tabLoading, setTabLoading] = useState(false);
  const [securingEventId, setSecuringEventId] = useState<string | null>(null);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [eventTypeOptions, setEventTypeOptions] = useState<string[]>([]);
  const [eventStats, setEventStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [_settings, setSettings] = useState<SecuritySettingsFormState>(DEFAULT_SETTINGS);

  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [newIpAddress, setNewIpAddress] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const notify = (title: string, type: 'success' | 'error', message?: string) => {
    showToast({ type, title, message });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as TabId)) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams]);

  const selectTab = (tabId: TabId) => {
    setActiveTab(tabId);
    router.replace(`/security?tab=${tabId}`, { scroll: false });
  };


  const loadEvents = useCallback(async () => {
    const [eventsRes, statsRes] = await Promise.all([
      apiClient.getSecurityEvents({ limit: 50, offset: 0 }),
      apiClient.getSecurityStats().catch(() => null),
    ]);
    const events = eventsRes ?? [];
    setSecurityEvents(events);

    if (statsRes) {
      const findCount = (sev: string) =>
        statsRes.eventsBySeverity.find(
          (s) => s.severity.toLowerCase() === sev.toLowerCase()
        )?.count ?? 0;
      setEventStats({
        total: statsRes.totalEvents,
        critical: findCount('critical'),
        high: findCount('high') + findCount('HIGH'),
        medium: findCount('medium') + findCount('WARNING'),
        low: findCount('low') + findCount('INFO'),
      });
      const fromApi = statsRes.eventsByType.map((t) => t.eventType);
      setEventTypeOptions(Array.from(new Set([...COMMON_EVENT_TYPES, ...fromApi])).sort());
    } else {
      setEventStats({
        total: events.length,
        critical: countBySeverity(events, 'critical'),
        high: countBySeverity(events, 'high'),
        medium: countBySeverity(events, 'medium'),
        low: countBySeverity(events, 'low'),
      });
      setEventTypeOptions(
        Array.from(new Set([...COMMON_EVENT_TYPES, ...events.map((e) => e.eventType)])).sort()
      );
    }
  }, []);

  const handleSecureAccount = useCallback(async (eventId: string) => {
    setSecuringEventId(eventId);
    try {
      const result = await apiClient.secureAccountFromSecurityEvent(eventId);
      const msg =
        result.code === 'SECURITY_ACTION_ALREADY_APPLIED'
          ? 'Account protection was already applied for this alert.'
          : 'Account protection applied. Check your email if a reset was sent.';
      showToast({ type: 'success', title: msg });
      await loadEvents();
    } catch {
      showToast({ type: 'error', title: 'Unable to secure account. Try again later.' });
    } finally {
      setSecuringEventId(null);
    }
  }, [loadEvents, showToast]);

  const loadThreats = useCallback(async () => {
    const [threats, whitelist] = await Promise.all([
      apiClient.getThreatAlerts().catch(() => []),
      apiClient.getIpWhitelist().catch(() => []),
    ]);
    setThreatAlerts(threats);
    setIpWhitelist(whitelist);
  }, []);

  const loadSettings = useCallback(async () => {
    const secSettings = await apiClient.getSecuritySettings().catch(() => null);
    if (secSettings) {
      setSettings(mapApiToSecuritySettings(secSettings as Record<string, unknown>));
    }
  }, []);

  const loadTab = useCallback(
    async (tab: TabId) => {
      if (!isAuthenticated || !isAdmin) return;
      if (tab === 'sessions') return;

      setTabLoading(true);
      setError(null);
      try {
        if (tab === 'events') await loadEvents();
        else if (tab === 'threats') await loadThreats();
        else if (tab === 'settings') await loadSettings();
      } catch {
        setError('Failed to load security data');
      } finally {
        setTabLoading(false);
      }
    },
    [isAuthenticated, isAdmin, loadEvents, loadThreats, loadSettings]
  );

  useEffect(() => {
    if (isAdmin && isAuthenticated) {
      void loadTab(activeTab);
    }
  }, [activeTab, isAdmin, isAuthenticated, loadTab]);

  const filteredEvents = useMemo(() => {
    return securityEvents.filter((event) => {
      const matchesSeverity =
        severityFilter === 'all' ||
        normalizeSeverity(event.severity) === severityFilter;
      const matchesType =
        eventTypeFilter === 'all' || event.eventType === eventTypeFilter;
      return matchesSeverity && matchesType;
    });
  }, [securityEvents, severityFilter, eventTypeFilter]);

  const handleWhitelistIp = async (ip: string) => {
    if (!ip.trim()) return;
    try {
      await apiClient.addToIpWhitelist(ip.trim());
      setIpWhitelist((prev) =>
        prev.includes(ip.trim()) ? prev : [...prev, ip.trim()]
      );
      notify('IP whitelisted', 'success', `${ip} is on the allow list for this organization.`);
    } catch {
      notify('Failed to whitelist IP', 'error');
    }
  };

  const handleAcknowledgeThreat = async (alertId: string) => {
    try {
      await apiClient.acknowledgeThreatAlert(alertId);
      setThreatAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
      notify('Threat acknowledged', 'success');
    } catch {
      notify('Failed to acknowledge threat', 'error');
    }
  };

  const handleRemoveIp = async (ip: string) => {
    try {
      await apiClient.removeFromIpWhitelist(ip);
      setIpWhitelist((prev) => prev.filter((x) => x !== ip));
      notify('IP removed', 'success');
    } catch {
      notify('Failed to remove IP', 'error');
    }
  };

  const handleExportReport = async (format: 'csv' | 'json') => {
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
      notify('Report exported', 'success');
    } catch {
      notify('Export failed', 'error');
    }
  };

  const refresh = () => {
    void loadTab(activeTab);
  };

  if (authLoading) {
    return (
      <UnifiedLayout title="Security Center" subtitle="Loading…">
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </UnifiedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <UnifiedLayout title="Access Denied" subtitle="Administrator access required">
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900">Access restricted</h3>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            You need administrator privileges to use Security Center.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/settings">
              <Button variant="outline">Account settings</Button>
            </Link>
            <Button variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        </Card>
      </UnifiedLayout>
    );
  }

  const tabs: { id: TabId; name: string }[] = [
    { id: 'events', name: 'Events' },
    { id: 'threats', name: 'Threats & allow list' },
    { id: 'sessions', name: 'Sessions' },
    { id: 'settings', name: 'Org settings' },
  ];

  return (
    <UnifiedLayout
      title="Security Center"
      subtitle="Monitor sign-in activity, threats, sessions, and organization security policy"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleExportReport('json')}>
            <DocumentArrowDownIcon className="mr-1.5 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleExportReport('csv')}>
            <DocumentArrowDownIcon className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <ArrowPathIcon className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      <ToastContainer toasts={toasts} onClose={hideToast} />
      <SecurityRelatedLinks current="security" />
      <SecurityEventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onWhitelistIp={(ip) => void handleWhitelistIp(ip)}
      />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {activeTab === 'events' && (
        <ResponsiveContainer maxWidth="full" className="mb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Critical" value={eventStats.critical} tone="text-red-700" />
            <StatCard label="High" value={eventStats.high} tone="text-orange-700" />
            <StatCard label="Medium" value={eventStats.medium} tone="text-amber-700" />
            <StatCard label="Total" value={eventStats.total} tone="text-gray-900" />
          </div>
        </ResponsiveContainer>
      )}

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {tabLoading && activeTab !== 'sessions' ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {activeTab === 'events' && (
            <section className="space-y-4">
              <RejectedLoginSummaryWidget />
              <RejectedLoginAlerts
                events={securityEvents}
                userEmail={user?.email}
                onSecureAccount={handleSecureAccount}
                securingEventId={securingEventId}
              />
              <div className="flex flex-wrap gap-3">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All event types</option>
                  {eventTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {filteredEvents.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">No security events found.</Card>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => (
                    <SecurityEventCard
                      key={event.id}
                      event={event}
                      onInvestigate={setSelectedEvent}
                      onWhitelistIp={(ip) => void handleWhitelistIp(ip)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'threats' && (
            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Threat alerts</h2>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    {threatAlerts.filter((t) => !t.acknowledged).length} open
                  </span>
                </div>
                {threatAlerts.length === 0 ? (
                  <p className="text-sm text-gray-500">No threat alerts.</p>
                ) : (
                  <ul className="space-y-3">
                    {threatAlerts.map((threat) => (
                      <li
                        key={threat.id}
                        className={`rounded-lg border p-4 ${
                          threat.acknowledged
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-red-200 bg-red-50/50'
                        }`}
                      >
                        <div className="flex justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{threat.type}</p>
                            <p className="mt-1 text-sm text-gray-600">{threat.description}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {threat.source} · {new Date(threat.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!threat.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleAcknowledgeThreat(threat.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-sm text-gray-600">
                  To <strong>block</strong> sign-ins (VPN, country, schedule), use{' '}
                  <Link href="/admin/security-policies" className="text-indigo-600 hover:underline">
                    security policies
                  </Link>
                  .
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="mb-2 text-lg font-semibold">IP allow list</h2>
                <p className="mb-4 text-sm text-gray-600">
                  These IPs are allowed when a policy or control references this list. This does
                  not block unknown IPs — use access policies to deny sign-in.
                </p>
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.1"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={() => {
                      void handleWhitelistIp(newIpAddress);
                      setNewIpAddress('');
                    }}
                  >
                    Add IP
                  </Button>
                </div>
                <ul className="space-y-2">
                  {ipWhitelist.length === 0 ? (
                    <li className="text-sm text-gray-500">No IPs on the allow list.</li>
                  ) : (
                    ipWhitelist.map((ip) => (
                      <li
                        key={ip}
                        className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
                      >
                        <span className="font-mono text-sm">{ip}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => void handleRemoveIp(ip)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            </section>
          )}

          {activeTab === 'sessions' && (
            <section>
              <p className="mb-4 text-sm text-gray-600">
                Revoke active sessions for users in your organization. For your own passkeys and
                MFA, use{' '}
                <Link href="/settings?tab=security" className="text-indigo-600 hover:underline">
                  account settings
                </Link>
                .
              </p>
              <LiveSessionMonitor />
            </section>
          )}

          {activeTab === 'settings' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">Organization security</h2>
              <p className="mt-2 text-sm text-gray-600">
                Password policy, lockout, MFA requirements, and conditional access rules are managed
                in one place.
              </p>
              <Link
                href="/admin/security-policies"
                className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:underline"
              >
                Open Security policies →
              </Link>
            </Card>
          )}
        </>
      )}
    </UnifiedLayout>
  );
}

export default function SecurityPage() {
  return (
    <Suspense
      fallback={
        <UnifiedLayout title="Security Center" subtitle="Loading…">
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        </UnifiedLayout>
      }
    >
      <SecurityPageContent />
    </Suspense>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </Card>
  );
}
