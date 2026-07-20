'use client';

import React, { useEffect, useState } from 'react';
import {
  accessOpsClient,
  AccessOpsPerson,
  AsyncAccepted,
  BatchOutcome,
} from '../../lib/accessops/client';
import { Button } from '../common/Button';
import { LiveErrorRegion } from './LiveErrorRegion';

const steps = ['Who', 'What', 'How long', 'Review'];

export function GiveAccessStepper({
  initialUserIds = [],
  initialApplicationIds = [],
  onClose,
}: {
  initialUserIds?: string[];
  initialApplicationIds?: string[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState<AccessOpsPerson[]>([]);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [userIds, setUserIds] = useState(initialUserIds);
  const [applicationIds, setApplicationIds] = useState(initialApplicationIds);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [duration, setDuration] = useState<'never' | '30' | '90' | 'custom'>('never');
  const [customDate, setCustomDate] = useState('');
  const [quota, setQuota] = useState('');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchOutcome | AsyncAccepted | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      accessOpsClient.listPeople({ search: debouncedSearch || undefined, limit: 50 }),
      accessOpsClient.listApplications(),
    ])
      .then(([peoplePage, apps]) => {
        if (!active) return;
        setPeople(peoplePage.items);
        setApplications(apps);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load access options'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  function expiresAt(): string | null {
    if (duration === 'never') return null;
    if (duration === 'custom') return customDate ? new Date(`${customDate}T23:59:59`).toISOString() : null;
    const date = new Date();
    date.setDate(date.getDate() + Number(duration));
    return date.toISOString();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      setResult(
        await accessOpsClient.batchGiveAccess({
          userIds,
          applicationIds,
          expiresAt: expiresAt(),
          quota: quota ? Number(quota) : null,
          businessJustification: justification || undefined,
        })
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to give access');
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue =
    (step === 0 && userIds.length > 0) ||
    (step === 1 && applicationIds.length > 0) ||
    (step === 2 && (duration !== 'custom' || !!customDate)) ||
    step === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-access-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 id="give-access-title" className="text-lg font-semibold text-gray-900">Give access</h2>
            <ol className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
              {steps.map((label, index) => (
                <li key={label} className={index === step ? 'font-semibold text-indigo-700' : ''}>
                  {index + 1}. {label}
                </li>
              ))}
            </ol>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500" aria-label="Close">×</button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <LiveErrorRegion message={error} />
          {result ? (
            <Outcome result={result} />
          ) : loading ? (
            <p className="text-sm text-gray-500" role="status">Loading people and applications…</p>
          ) : (
            <>
              {step === 0 && (
                <ChoiceList
                  title="Who needs access?"
                  search={search}
                  onSearch={setSearch}
                  rows={people.map((p) => ({ id: p.id, label: p.name, detail: p.email }))}
                  selected={userIds}
                  onChange={setUserIds}
                />
              )}
              {step === 1 && (
                <ChoiceList
                  title="What should they access?"
                  rows={applications.map((app) => ({
                    id: String(app.id),
                    label: String(app.name ?? app.displayName ?? app.id),
                    detail: app.description ? String(app.description) : undefined,
                  }))}
                  selected={applicationIds}
                  onChange={setApplicationIds}
                />
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <fieldset>
                    <legend className="text-sm font-semibold text-gray-900">How long?</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-4">
                      {[
                        ['never', 'Ongoing'],
                        ['30', '30 days'],
                        ['90', '90 days'],
                        ['custom', 'Custom'],
                      ].map(([value, label]) => (
                        <label key={value} className="rounded-md border p-3 text-sm">
                          <input
                            type="radio"
                            name="duration"
                            value={value}
                            checked={duration === value}
                            onChange={() => setDuration(value as typeof duration)}
                            className="mr-2"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {duration === 'custom' && (
                    <label className="block text-sm font-medium text-gray-700">
                      End date
                      <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                    </label>
                  )}
                  <details className="rounded-md border p-3">
                    <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
                    <div className="mt-3 space-y-3">
                      <label className="block text-sm">Quota
                        <input type="number" min="0" value={quota} onChange={(e) => setQuota(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                      </label>
                      <label className="block text-sm">Business justification
                        <textarea rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                      </label>
                    </div>
                  </details>
                </div>
              )}
              {step === 3 && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <h3 className="font-semibold text-gray-900">Review access change</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <dt className="text-gray-500">People</dt><dd>{userIds.length}</dd>
                    <dt className="text-gray-500">Applications</dt><dd>{applicationIds.length}</dd>
                    <dt className="text-gray-500">Duration</dt><dd>{duration === 'never' ? 'Ongoing' : duration === 'custom' ? customDate : `${duration} days`}</dd>
                    <dt className="text-gray-500">Changes</dt><dd>{userIds.length * applicationIds.length}</dd>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="flex justify-between border-t px-6 py-4">
          {result ? (
            <Button type="button" onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={step === 0 ? onClose : () => setStep(step - 1)}>
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              {step < 3 ? (
                <Button type="button" disabled={!canContinue || loading} onClick={() => setStep(step + 1)}>Continue</Button>
              ) : (
                <Button type="button" loading={submitting} onClick={submit}>Give access</Button>
              )}
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

export function ChoiceList({
  title,
  rows,
  selected,
  onChange,
  search,
  onSearch,
}: {
  title: string;
  rows: Array<{ id: string; label: string; detail?: string }>;
  selected: string[];
  onChange: (value: string[]) => void;
  search?: string;
  onSearch?: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-900">{title}</legend>
      {onSearch && (
        <input aria-label="Search people" placeholder="Search people" value={search} onChange={(e) => onSearch(e.target.value)} className="mt-3 w-full rounded-md border px-3 py-2 text-sm" />
      )}
      <div className="mt-3 max-h-72 divide-y overflow-y-auto rounded-md border">
        {rows.map((row) => (
          <label key={row.id} className="flex cursor-pointer gap-3 p-3 text-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selected.includes(row.id)}
              onChange={() => onChange(selected.includes(row.id) ? selected.filter((id) => id !== row.id) : [...selected, row.id])}
            />
            <span><span className="block font-medium">{row.label}</span>{row.detail && <span className="text-gray-500">{row.detail}</span>}</span>
          </label>
        ))}
        {rows.length === 0 && <p className="p-3 text-sm text-gray-500">No matches.</p>}
      </div>
    </fieldset>
  );
}

export function Outcome({ result }: { result: BatchOutcome | AsyncAccepted }) {
  if (result.async || result.status === 'accepted') {
    const accepted = result as AsyncAccepted;
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-950">Batch accepted</h3>
        <p className="mt-1 text-sm text-blue-800">
          Batch {accepted.batchId} is processing
          {accepted.activityRef ? `. Activity reference: ${accepted.activityRef}` : ''}.
          {accepted.message ? ` ${accepted.message}` : ''}
        </p>
      </div>
    );
  }
  const outcome = result as BatchOutcome;
  const granted = outcome.granted ?? outcome.counts?.granted ?? 0;
  const approvalRequested = outcome.approvalRequested ?? outcome.counts?.approvalRequested ?? 0;
  const alreadyHadAccess = outcome.alreadyHadAccess ?? outcome.counts?.alreadyHadAccess ?? 0;
  const failed = outcome.failed ?? outcome.counts?.failed ?? 0;
  const revoked = outcome.revoked ?? outcome.counts?.revoked ?? 0;
  const scheduled = outcome.scheduled ?? outcome.counts?.scheduled ?? 0;
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <h3 className="font-semibold text-green-950">Access outcomes</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <dt>Granted</dt><dd>{granted}</dd>
        <dt>Approval requested</dt><dd>{approvalRequested}</dd>
        <dt>Already had access</dt><dd>{alreadyHadAccess}</dd>
        <dt>Revoked</dt><dd>{revoked}</dd>
        <dt>Scheduled</dt><dd>{scheduled}</dd>
        <dt>Failed</dt><dd>{failed}</dd>
      </dl>
    </div>
  );
}
