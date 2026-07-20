'use client';

import React, { useEffect, useState } from 'react';
import {
  accessOpsClient,
  AccessOpsPerson,
  AsyncAccepted,
  BatchOutcome,
  RemoveAllPreview,
} from '../../lib/accessops/client';
import { Button } from '../common/Button';
import { LiveErrorRegion } from './LiveErrorRegion';
import { useStepUpAction } from './StepUpGate';
import { ChoiceList, Outcome } from './GiveAccessStepper';

const steps = ['Who', 'What', 'When', 'Review'];

export function RemoveAccessStepper({
  initialUserIds = [],
  initialApplicationIds = [],
  removeAll = false,
  onClose,
}: {
  initialUserIds?: string[];
  initialApplicationIds?: string[];
  removeAll?: boolean;
  onClose: () => void;
}) {
  const { runWithStepUp, stepUpModal } = useStepUpAction();
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState<AccessOpsPerson[]>([]);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [userIds, setUserIds] = useState(initialUserIds);
  const [applicationIds, setApplicationIds] = useState(initialApplicationIds);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [timing, setTiming] = useState<'now' | 'scheduled'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RemoveAllPreview | null>(null);
  const [result, setResult] = useState<BatchOutcome | AsyncAccepted | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
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

  const effectiveAt = timing === 'scheduled' && scheduledAt
    ? new Date(scheduledAt).toISOString()
    : null;

  async function prepareOrSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (removeAll && !preview) {
        const snap = await accessOpsClient.previewRemoveAll({
          userId: userIds[0],
          userIds,
          reason: reason || undefined,
        });
        setPreview({
          ...snap,
          previewToken: snap.snapshotId,
          accessItems: snap.grantIds?.length ?? snap.items?.length ?? snap.accessItems,
          affectedUsers: 1,
          items: snap.items,
        });
        return;
      }
      await runWithStepUp(async () => {
        const response = removeAll
          ? await accessOpsClient.confirmRemoveAll({
              snapshotId: preview?.snapshotId || preview?.previewToken,
              reason: reason || undefined,
            })
          : await accessOpsClient.batchRemoveAccess({
              userIds,
              applicationIds,
              removeAt: effectiveAt || 'now',
              effectiveAt,
              reason: reason || undefined,
            });
        setResult(response);
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to remove access');
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue =
    (step === 0 && userIds.length > 0) ||
    (step === 1 && (removeAll || applicationIds.length > 0)) ||
    (step === 2 && (timing === 'now' || !!scheduledAt)) ||
    step === 3;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="remove-access-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
          <header className="flex items-start justify-between border-b px-6 py-4">
            <div>
              <h2 id="remove-access-title" className="text-lg font-semibold text-gray-900">Remove access</h2>
              <ol className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                {steps.map((label, index) => (
                  <li key={label} className={index === step ? 'font-semibold text-red-700' : ''}>{index + 1}. {label}</li>
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
                    title="Whose access should be removed?"
                    search={search}
                    onSearch={setSearch}
                    rows={people.map((p) => ({ id: p.id, label: p.name, detail: p.email }))}
                    selected={userIds}
                    onChange={setUserIds}
                  />
                )}
                {step === 1 && (removeAll ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <h3 className="font-semibold text-amber-950">Remove all application access</h3>
                    <p className="mt-1 text-sm text-amber-800">A preview will show the affected access items before anything is removed.</p>
                  </div>
                ) : (
                  <ChoiceList
                    title="What access should be removed?"
                    rows={applications.map((app) => ({
                      id: String(app.id),
                      label: String(app.name ?? app.displayName ?? app.id),
                    }))}
                    selected={applicationIds}
                    onChange={setApplicationIds}
                  />
                ))}
                {step === 2 && (
                  <div className="space-y-4">
                    <fieldset>
                      <legend className="text-sm font-semibold">When should access be removed?</legend>
                      <label className="mt-3 block rounded-md border p-3 text-sm">
                        <input type="radio" checked={timing === 'now'} onChange={() => setTiming('now')} className="mr-2" />
                        Remove now
                      </label>
                      <label className="mt-2 block rounded-md border p-3 text-sm">
                        <input type="radio" checked={timing === 'scheduled'} onChange={() => setTiming('scheduled')} className="mr-2" />
                        Schedule removal
                      </label>
                    </fieldset>
                    {timing === 'scheduled' && (
                      <label className="block text-sm">Removal date and time
                        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                      </label>
                    )}
                    <details className="rounded-md border p-3">
                      <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
                      <label className="mt-3 block text-sm">Reason or justification
                        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                      </label>
                    </details>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-gray-50 p-4 text-sm">
                      <h3 className="font-semibold">Review removal</h3>
                      <p className="mt-2">{userIds.length} person(s) · {removeAll ? 'All applications' : `${applicationIds.length} application(s)`} · {timing === 'now' ? 'Now' : scheduledAt}</p>
                    </div>
                    {preview && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                        Preview: {preview.accessItems} access item(s) across {preview.affectedUsers} user(s)
                        {preview.unmanagedItems ? `, including ${preview.unmanagedItems} unmanaged item(s)` : ''}.
                      </div>
                    )}
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
                <Button type="button" variant="outline" onClick={step === 0 ? onClose : () => { setPreview(null); setStep(step - 1); }}>
                  {step === 0 ? 'Cancel' : 'Back'}
                </Button>
                {step < 3 ? (
                  <Button type="button" disabled={!canContinue || loading} onClick={() => setStep(step + 1)}>Continue</Button>
                ) : (
                  <Button type="button" className="bg-red-600 hover:bg-red-700" loading={submitting} onClick={prepareOrSubmit}>
                    {removeAll && !preview ? 'Preview remove all' : 'Remove access'}
                  </Button>
                )}
              </>
            )}
          </footer>
        </section>
      </div>
      {stepUpModal}
    </>
  );
}
