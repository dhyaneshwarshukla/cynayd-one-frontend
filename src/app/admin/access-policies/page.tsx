'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ShieldCheckIcon,
  ClockIcon,
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/Alert';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/LoadingSpinner';
import ToastContainer from '@/components/common/ToastContainer';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { isAdminUser } from '@/utils/tenant';
import { SecurityRelatedLinks } from '@/components/security/SecurityRelatedLinks';

interface Policy {
  id: string;
  name: string;
  description?: string | null;
  priority: number;
  enabled: boolean;
  conditions: unknown;
  actions: unknown;
}

const ACTION_OPTIONS = [
  { id: 'allow', label: 'Allow', description: 'Permit sign-in when conditions match' },
  { id: 'block', label: 'Block', description: 'Deny sign-in' },
  { id: 'require_mfa', label: 'Require MFA', description: 'Challenge enrolled users; grace period for others' },
  {
    id: 'require_mfa_enrollment',
    label: 'Require MFA enrollment',
    description: 'Hard block until MFA is configured',
  },
  { id: 'require_step_up', label: 'Step-up auth', description: 'Require additional verification' },
] as const;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizePolicies(raw: Array<Record<string, unknown>>): Policy[] {
  return raw.map((p) => ({
    id: String(p.id),
    name: String(p.name ?? 'Untitled'),
    description: p.description as string | null | undefined,
    priority: Number(p.priority ?? 0),
    enabled: p.enabled !== false,
    conditions: p.conditions,
    actions: p.actions,
  }));
}

function getActions(policy: Policy): string[] {
  const parsed = parseJsonField<string[]>(policy.actions, []);
  return Array.isArray(parsed) ? parsed : [];
}

function getConditions(policy: Policy): Record<string, unknown> {
  return parseJsonField<Record<string, unknown>>(policy.conditions, {});
}

function formatConditionSummary(conditions: Record<string, unknown>): string[] {
  const parts: string[] = [];
  const countries = conditions.countries;
  if (Array.isArray(countries) && countries.length) {
    parts.push(`Countries: ${countries.join(', ')}`);
  }
  if (conditions.blockIfVpn) parts.push('VPN detected');
  if (conditions.blockIfProxy) parts.push('Proxy detected');
  if (typeof conditions.minTrustScore === 'number') {
    parts.push(`Min trust score: ${conditions.minTrustScore}`);
  }
  if (conditions.requireTrustedDevice) parts.push('Trusted device required');
  const schedule = conditions.schedule as Record<string, unknown> | undefined;
  if (schedule) {
    const days = Array.isArray(schedule.daysOfWeek)
      ? (schedule.daysOfWeek as number[])
          .map((d) => DAY_LABELS[d] ?? String(d))
          .join(', ')
      : 'Any day';
    const start = schedule.startHour ?? '?';
    const end = schedule.endHour ?? '?';
    const tz = schedule.timezone ?? 'UTC';
    parts.push(`Schedule: ${days}, ${start}:00–${end}:00 ${tz}`);
  }
  if (parts.length === 0) parts.push('Always applies (no extra conditions)');
  return parts;
}

function actionBadgeClass(action: string): string {
  switch (action) {
    case 'block':
      return 'bg-red-100 text-red-800 ring-red-200';
    case 'allow':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
    case 'require_mfa':
      return 'bg-amber-100 text-amber-900 ring-amber-200';
    case 'require_mfa_enrollment':
      return 'bg-orange-100 text-orange-900 ring-orange-200';
    case 'require_step_up':
      return 'bg-blue-100 text-blue-800 ring-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200';
  }
}

export default function AccessPoliciesPage() {
  const { user } = useAuth();
  const [toasts, { showToast, hideToast }] = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [scheduleStart, setScheduleStart] = useState(9);
  const [scheduleEnd, setScheduleEnd] = useState(18);
  const [countries, setCountries] = useState('');
  const [blockIfVpn, setBlockIfVpn] = useState(false);
  const [blockAction, setBlockAction] = useState(false);
  const [minTrustScore, setMinTrustScore] = useState(50);
  const [selectedActions, setSelectedActions] = useState<string[]>(['require_mfa']);

  const canManage = isAdminUser(user?.role);

  const load = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background && hasLoadedOnce.current;
    if (!background) {
      setLoading(true);
    }
    try {
      const data = await apiClient.getAccessPolicies();
      setPolicies(normalizePolicies(data));
    } catch {
      if (!hasLoadedOnce.current) {
        setPolicies([]);
      }
      showToast({
        type: 'error',
        title: 'Failed to load policies',
        message: 'Check your connection and try again.',
      });
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const enabled = policies.filter((p) => p.enabled).length;
    return { total: policies.length, enabled, disabled: policies.length - enabled };
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return policies;
    return policies.filter((p) => {
      const actions = getActions(p).join(' ');
      const cond = formatConditionSummary(getConditions(p)).join(' ');
      return (
        p.name.toLowerCase().includes(q) ||
        actions.toLowerCase().includes(q) ||
        cond.toLowerCase().includes(q)
      );
    });
  }, [policies, search]);

  const notifySuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  };

  const notifyError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  };

  const createPolicy = async (body: Record<string, unknown>) => {
    if (!canManage) return;
    setSaving(true);
    try {
      await apiClient.createAccessPolicy(body);
      notifySuccess('Policy created', String(body.name));
      setName('');
      await load({ background: true });
    } catch {
      notifyError('Could not create policy', 'Verify the name and settings, then try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (policy: Policy) => {
    if (!canManage) return;
    try {
      await apiClient.updateAccessPolicy(policy.id, { enabled: !policy.enabled });
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, enabled: !p.enabled } : p))
      );
      notifySuccess(policy.enabled ? 'Policy disabled' : 'Policy enabled', policy.name);
    } catch {
      notifyError('Update failed', 'Could not change policy status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteAccessPolicy(deleteTarget.id);
      notifySuccess('Policy deleted', deleteTarget.name);
      setDeleteTarget(null);
      await load({ background: true });
    } catch {
      notifyError('Delete failed', 'The policy could not be removed.');
    } finally {
      setDeleting(false);
    }
  };

  const createCustomPolicy = async () => {
    if (!name.trim()) {
      notifyError('Name required', 'Enter a policy name before creating.');
      return;
    }
    const countryList = countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    await createPolicy({
      name: name.trim(),
      priority: 15,
      conditions: {
        ...(countryList.length ? { countries: countryList } : {}),
        ...(blockIfVpn ? { blockIfVpn: true } : {}),
        minTrustScore,
      },
      actions: blockAction ? ['block'] : selectedActions.length ? selectedActions : ['allow'],
    });
  };

  return (
    <UnifiedLayout title="Access policies">
      <ToastContainer toasts={toasts} onClose={hideToast} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete access policy?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed immediately. Users affected by this rule may regain access on their next sign-in.`
            : ''
        }
        confirmText="Delete policy"
        variant="danger"
        isLoading={deleting}
      />

      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <SecurityRelatedLinks current="policies" />
        <header className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheckIcon className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Access policies</h1>
                <p className="text-sm text-gray-600">
                  Rules evaluated at sign-in (block, allow, MFA). Higher priority runs first.
                </p>
              </div>
            </div>
            <Link
              href="/security"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Security Center →
            </Link>
          </div>
        </header>

        {!canManage && (
          <Alert variant="warning">
            <AlertTitle>View only</AlertTitle>
            <AlertDescription>
              Admin access is required to create or change policies. You can review active rules below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total policies" value={stats.total} />
          <StatCard label="Active" value={stats.enabled} accent="text-emerald-600" />
          <StatCard label="Disabled" value={stats.disabled} accent="text-gray-500" />
        </div>

        <InstructionsPanel
          expanded={showInstructions}
          onToggle={() => setShowInstructions((v) => !v)}
          canManage={canManage}
        />

        <div className="grid gap-8 lg:grid-cols-5">
          <section className="lg:col-span-3 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active policies</h2>
              <div className="relative max-w-xs w-full sm:w-64">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Search policies…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton lines={3} />
                  </Card>
                ))}
              </div>
            ) : filteredPolicies.length === 0 ? (
              <EmptyState
                icon={<ShieldCheckIcon className="h-full w-full" />}
                title={search ? 'No matching policies' : 'No access policies yet'}
                description={
                  search
                    ? 'Try a different search term or clear the filter.'
                    : canManage
                      ? 'Create a quick template or custom policy to control who can sign in and under what conditions.'
                      : 'Your organization has not configured any access policies.'
                }
                action={
                  canManage && !search
                    ? {
                        label: 'Create your first policy',
                        onClick: () => setShowCustomForm(true),
                        variant: 'default',
                      }
                    : undefined
                }
              />
            ) : (
              <ul className="space-y-3">
                {filteredPolicies.map((policy) => (
                  <PolicyCard
                    key={policy.id}
                    policy={policy}
                    canManage={canManage}
                    onToggle={() => void toggleEnabled(policy)}
                    onDelete={() => setDeleteTarget(policy)}
                  />
                ))}
              </ul>
            )}
          </section>

          {canManage && (
            <aside className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Add policy</h2>

              <div className="space-y-3">
                <TemplateCard
                  icon={<GlobeAltIcon className="h-5 w-5" />}
                  title="Block VPN sign-ins"
                  description="Deny login when a VPN connection is detected."
                  disabled={saving}
                  onUse={() =>
                    void createPolicy({
                      name: name.trim() || 'Block VPN sign-ins',
                      priority: 10,
                      conditions: { blockIfVpn: true },
                      actions: ['block'],
                    })
                  }
                />
                <TemplateCard
                  icon={<ClockIcon className="h-5 w-5" />}
                  title="Business hours + MFA"
                  description={`Weekdays ${scheduleStart}:00–${scheduleEnd}:00 UTC with device trust check.`}
                  disabled={saving}
                  onUse={() =>
                    void createPolicy({
                      name: name.trim() || 'Business hours MFA',
                      priority: 20,
                      conditions: {
                        schedule: {
                          daysOfWeek: [1, 2, 3, 4, 5],
                          startHour: scheduleStart,
                          endHour: scheduleEnd,
                          timezone: 'UTC',
                        },
                        minTrustScore: 50,
                      },
                      actions: ['require_mfa'],
                    })
                  }
                />
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Schedule hours (UTC)</CardTitle>
                  <CardDescription>Used by the business-hours template above.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start hour"
                    type="number"
                    min={0}
                    max={23}
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(Number(e.target.value))}
                  />
                  <Input
                    label="End hour"
                    type="number"
                    min={0}
                    max={23}
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(Number(e.target.value))}
                  />
                </CardContent>
              </Card>

              <Input
                label="Policy name (optional for templates)"
                placeholder="e.g. Remote workforce MFA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                helperText="Leave blank to use the template default name."
              />

              <Card>
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => setShowCustomForm((v) => !v)}
                  aria-expanded={showCustomForm}
                >
                  <div className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-gray-900">Custom policy builder</span>
                  </div>
                  {showCustomForm ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {showCustomForm && (
                  <CardContent className="space-y-4 border-t pt-4">
                    <Input
                      label="Policy name"
                      required
                      placeholder="e.g. US & CA — require MFA"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      label="Countries"
                      placeholder="US, CA, GB"
                      helperText="Comma-separated ISO country codes. Leave empty for all regions."
                      value={countries}
                      onChange={(e) => setCountries(e.target.value)}
                    />

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={blockIfVpn}
                        onChange={(e) => setBlockIfVpn(e.target.checked)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">Match VPN logins</span>
                        <span className="block text-xs text-gray-500">Apply when the session appears to use a VPN.</span>
                      </span>
                    </label>

                    <Input
                      label="Minimum device trust score"
                      type="number"
                      min={0}
                      max={100}
                      value={minTrustScore}
                      onChange={(e) => setMinTrustScore(Number(e.target.value))}
                    />

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-gray-700">Actions when matched</legend>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          checked={blockAction}
                          onChange={(e) => setBlockAction(e.target.checked)}
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-900">Block sign-in</span>
                          <span className="block text-xs text-gray-500">Overrides action checkboxes below.</span>
                        </span>
                      </label>
                      {!blockAction && (
                        <div className="space-y-2">
                          {ACTION_OPTIONS.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={selectedActions.includes(opt.id)}
                                onChange={(e) => {
                                  setSelectedActions((prev) =>
                                    e.target.checked
                                      ? [...prev, opt.id]
                                      : prev.filter((x) => x !== opt.id)
                                  );
                                }}
                              />
                              <span>
                                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                                <span className="block text-xs text-gray-500">{opt.description}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </fieldset>

                    <Button
                      className="w-full"
                      loading={saving}
                      disabled={saving}
                      onClick={() => void createCustomPolicy()}
                    >
                      Create custom policy
                    </Button>
                  </CardContent>
                )}
              </Card>
            </aside>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
}

function InstructionsPanel({
  expanded,
  onToggle,
  canManage,
}: {
  expanded: boolean;
  onToggle: () => void;
  canManage: boolean;
}) {
  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white">
      <button
        type="button"
        className="flex w-full items-start gap-3 p-5 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
          <BookOpenIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900">How access policies work</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            Rules are evaluated at sign-in, before a session token is issued. Click to{' '}
            {expanded ? 'hide' : 'show'} full instructions.
          </p>
        </div>
        {expanded ? (
          <ChevronUpIcon className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
        ) : (
          <ChevronDownIcon className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
        )}
      </button>

      {expanded && (
        <CardContent className="space-y-6 border-t border-indigo-100/80 pt-0 text-sm text-gray-700">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-medium text-gray-900">
              <InformationCircleIcon className="h-4 w-4 text-indigo-600" aria-hidden />
              Evaluation order
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-gray-600">
              <li>Only <strong>enabled</strong> policies are considered.</li>
              <li>
                Policies with a <strong>higher priority number</strong> are checked first (shown on each
                card).
              </li>
              <li>
                When conditions match, the policy&apos;s <strong>action</strong> is applied (allow, block,
                require MFA, etc.).
              </li>
              <li>Changes apply on the user&apos;s <strong>next sign-in</strong>, not to existing sessions.</li>
            </ul>
          </section>

          {canManage && (
            <section className="space-y-2">
              <h3 className="font-medium text-gray-900">Getting started</h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-gray-600">
                <li>
                  Choose a <strong>quick template</strong> on the right (VPN block, business-hours MFA) or
                  open the <strong>custom policy builder</strong> for country lists and trust scores.
                </li>
                <li>
                  Optionally enter a <strong>policy name</strong> before using a template; otherwise the
                  default name is used.
                </li>
                <li>
                  Confirm the new rule appears under <strong>Active policies</strong> on the left.
                </li>
                <li>
                  Use the <strong>On/Off toggle</strong> to test without deleting. Disable a policy if sign-in
                  behaves unexpectedly before removing it.
                </li>
                <li>
                  Have a test user sign out and sign in again to verify the rule.
                </li>
              </ol>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="font-medium text-gray-900">Conditions you can configure</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <InstructionItem
                title="Countries"
                detail="ISO codes (e.g. US, GB). Leave empty in custom policies to match all regions."
              />
              <InstructionItem
                title="VPN / proxy"
                detail="Match sign-ins that appear to use a VPN or proxy."
              />
              <InstructionItem
                title="Schedule"
                detail="Weekday hours in UTC (business-hours template). Days use 0 = Sunday through 6 = Saturday."
              />
              <InstructionItem
                title="Device trust score"
                detail="Require a minimum trust score from the device risk engine (0–100)."
              />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-medium text-gray-900">Actions when a policy matches</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr>
                    <td className="px-3 py-2 font-medium">allow</td>
                    <td className="px-3 py-2">Permit sign-in when conditions match.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">block</td>
                    <td className="px-3 py-2">Deny sign-in.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">require_mfa</td>
                    <td className="px-3 py-2">
                      MFA challenge for enrolled users. Users without MFA may sign in once, then must
                      complete MFA setup in the app.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">require_mfa_enrollment</td>
                    <td className="px-3 py-2">
                      Hard block until MFA is configured (403 for users without MFA). Use sparingly.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">require_step_up</td>
                    <td className="px-3 py-2">Require additional verification at sign-in.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <Alert variant="warning" className="text-sm">
            <AlertTitle>Best practices</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Add one policy at a time and verify sign-in with a test account.</li>
                <li>Prefer <strong>require_mfa</strong> over <strong>require_mfa_enrollment</strong> unless you must block all access until MFA is set up.</li>
                <li>Schedule hours are in <strong>UTC</strong>; adjust templates if your org uses another timezone.</li>
                <li>Deleting a policy is permanent; disabling is safer while troubleshooting.</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

function InstructionItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-0.5 text-xs text-gray-600">{detail}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'text-gray-900',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${accent}`}>{value}</p>
    </Card>
  );
}

function TemplateCard({
  icon,
  title,
  description,
  onUse,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onUse: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={disabled}
            onClick={onUse}
          >
            Use template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PolicyCard({
  policy,
  canManage,
  onToggle,
  onDelete,
}: {
  policy: Policy;
  canManage: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const actions = getActions(policy);
  const conditions = getConditions(policy);
  const summaries = formatConditionSummary(conditions);

  return (
    <li>
      <Card className={!policy.enabled ? 'opacity-75 bg-gray-50/50' : ''}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    policy.enabled
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-gray-100 text-gray-600 ring-gray-200'
                  }`}
                >
                  {policy.enabled ? 'Active' : 'Disabled'}
                </span>
                <span className="text-xs text-gray-400">Priority {policy.priority}</span>
              </div>

              <ul className="space-y-1">
                {summaries.map((line) => (
                  <li key={line} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {actions.length ? (
                  actions.map((a) => (
                    <span
                      key={a}
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${actionBadgeClass(a)}`}
                    >
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No actions defined</span>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={policy.enabled}
                    onChange={onToggle}
                    aria-label={`${policy.enabled ? 'Disable' : 'Enable'} ${policy.name}`}
                  />
                  <span className="hidden sm:inline">{policy.enabled ? 'On' : 'Off'}</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={onDelete}
                  aria-label={`Delete ${policy.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
