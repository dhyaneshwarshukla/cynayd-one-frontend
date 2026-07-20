'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { accessOpsClient, AccessOpsActivityItem } from '../../../lib/accessops/client';
import { humanizeAccessStatus } from '../../../lib/accessops/labels';
import { useAccessOpsFlow } from '../../../components/accessops/AccessOpsFlowContext';
import { LiveErrorRegion, LiveStatusRegion } from '../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../components/common/Button';

const filters = [
  ['all', 'All'],
  ['needs_action', 'Needs action'],
  ['requests', 'Requests'],
  ['expiring', 'Expiring'],
  ['removed', 'Removed'],
  ['failed', 'Failed'],
] as const;

export default function AccessOpsActivityPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { openGiveAccess, openRemoveAccess } = useAccessOpsFlow();
  const filter = params.get('filter') ?? 'needs_action';
  const focusedIds = [
    params.get('requestId'),
    params.get('caseId'),
    params.get('dlqId'),
    params.get('subjectId'),
  ].filter(Boolean);
  const [items, setItems] = useState<AccessOpsActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>();
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await accessOpsClient.listActivity({ filter, cursor, limit: 50 });
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load activity');
    }
  }, [cursor, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(item: AccessOpsActivityItem, action: string) {
    const meta = item.metadata ?? {};
    if (action === 'extend') {
      openGiveAccess({ userIds: valueList(meta.userId), applicationIds: valueList(meta.applicationId) });
      return;
    }
    if (action === 'remove_now') {
      openRemoveAccess({ userIds: valueList(meta.userId), applicationIds: valueList(meta.applicationId) });
      return;
    }
    setLoadingAction(`${item.id}:${action}`);
    setError(null);
    try {
      if (action === 'approve' || action === 'reject') {
        await accessOpsClient.decideAccessRequest(String(meta.requestId ?? item.subjectId ?? item.id), {
          stepId: meta.stepId,
          decision: action === 'approve' ? 'APPROVED' : 'REJECTED',
        });
      } else if (action === 'retry') {
        await accessOpsClient.requeueDeadLetter(String(meta.dlqId ?? item.subjectId ?? item.id));
      }
      setStatus(`${action.replace(/_/g, ' ')} submitted.`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-gray-900">Activity</h1><p className="mt-1 text-sm text-gray-600">Requests, removals, expirations, and work that needs action.</p></div>
      <nav className="flex flex-wrap gap-2" aria-label="Activity filters">
        {filters.map(([value, label]) => (
          <button key={value} type="button" aria-current={filter === value ? 'page' : undefined} onClick={() => { setCursor(undefined); router.push(`/accessops/activity?filter=${value}`); }} className={`rounded-full px-3 py-1.5 text-sm ${filter === value ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>{label}</button>
        ))}
      </nav>
      <LiveErrorRegion message={error} onRetry={load} />
      <LiveStatusRegion message={status} />
      <ul className="divide-y rounded-lg border bg-white shadow-sm">
        {items.map((item) => {
          const highlighted = focusedIds.includes(item.id) || (!!item.subjectId && focusedIds.includes(item.subjectId));
          return (
            <li key={item.id} className={`p-4 ${highlighted ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300' : ''}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div><h2 className="font-medium text-gray-900">{item.title}</h2>{item.detail && <p className="mt-1 text-sm text-gray-600">{item.detail}</p>}<p className="mt-1 text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''} {item.status ? `· ${humanizeAccessStatus(item.status)}` : ''}</p></div>
                {!!item.actions?.length && <div className="flex flex-wrap gap-2">{item.actions.map((action) => <Button key={action} type="button" size="sm" variant={action === 'reject' || action === 'remove_now' ? 'outline' : 'default'} loading={loadingAction === `${item.id}:${action}`} onClick={() => void act(item, action)}>{actionLabel(action)}</Button>)}</div>}
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="p-6 text-center text-sm text-gray-500">No activity for this filter.</li>}
      </ul>
      {nextCursor && <Button type="button" variant="outline" onClick={() => setCursor(nextCursor)}>Load more</Button>}
    </div>
  );
}

function valueList(value: unknown): string[] | undefined {
  return value ? [String(value)] : undefined;
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    approve: 'Approve',
    reject: 'Reject',
    retry: 'Retry',
    extend: 'Extend',
    remove_now: 'Remove now',
  };
  return labels[action] ?? action.replace(/_/g, ' ');
}
