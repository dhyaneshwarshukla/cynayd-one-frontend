'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  accessOpsClient,
  AccessOpsPerson,
  EmployeeAccessSnapshot,
} from '../../../lib/accessops/client';
import { humanizeAccessStatus } from '../../../lib/accessops/labels';
import { useAccessOpsFlow } from '../../../components/accessops/AccessOpsFlowContext';
import { LiveErrorRegion } from '../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../components/common/Button';

export default function AccessOpsPeoplePage() {
  const { openGiveAccess, openRemoveAccess } = useAccessOpsFlow();
  const [people, setPeople] = useState<AccessOpsPerson[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | null>();
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([]);
  const [selected, setSelected] = useState<AccessOpsPerson | null>(null);
  const [snapshot, setSnapshot] = useState<EmployeeAccessSnapshot | null>(null);
  const [tab, setTab] = useState<'current' | 'pending' | 'history'>('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await accessOpsClient.listPeople({ search: query || undefined, cursor, limit: 25 });
      setPeople(page.items);
      setNextCursor(page.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load people');
    } finally {
      setLoading(false);
    }
  }, [cursor, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function manage(person: AccessOpsPerson) {
    setSelected(person);
    setTab('current');
    setSnapshot(null);
    setError(null);
    try {
      setSnapshot(await accessOpsClient.getEmployeeAccess(person.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load access details');
    }
  }

  const current = snapshot?.governed?.length ? snapshot.governed : snapshot?.grants ?? [];
  const pending = snapshot?.pendingRequests ?? [];
  const history = snapshot?.history ?? snapshot?.expiredRevoked ?? [];
  const unmanagedCount =
    snapshot?.ungovernedRuntime?.length ??
    snapshot?.unmanagedRuntime?.length ??
    selected?.unmanagedCount ??
    0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">People</h1>
        <p className="mt-1 text-sm text-gray-600">See and manage application access by person.</p>
      </div>
      <LiveErrorRegion message={error} onRetry={load} />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setCursor(undefined);
          setCursorHistory([]);
          setQuery(search.trim());
        }}
      >
        <input aria-label="Search people" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm" />
        <Button type="submit">Search</Button>
      </form>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-gray-50">
            <tr>{['Person', 'Applications', 'Expiring', 'Status', 'Manage'].map((label) => <th key={label} className="px-4 py-3 text-left font-medium text-gray-600">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {people.map((person) => (
              <tr key={person.id}>
                <td className="px-4 py-3"><span className="block font-medium">{person.name}</span><span className="text-gray-500">{person.email}</span></td>
                <td className="px-4 py-3">{person.applications}</td>
                <td className="px-4 py-3">{person.expiring}</td>
                <td className="px-4 py-3">{humanizeAccessStatus(person.status)}</td>
                <td className="px-4 py-3"><Button type="button" size="sm" variant="outline" onClick={() => void manage(person)}>Manage</Button></td>
              </tr>
            ))}
            {!loading && people.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No people found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={cursorHistory.length === 0} onClick={() => {
          const history = [...cursorHistory];
          setCursor(history.pop());
          setCursorHistory(history);
        }}>Previous</Button>
        <Button type="button" variant="outline" disabled={!nextCursor} onClick={() => {
          setCursorHistory((items) => [...items, cursor]);
          setCursor(nextCursor ?? undefined);
        }}>Next</Button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation">
          <aside role="dialog" aria-modal="true" aria-labelledby="person-drawer-title" className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex justify-between">
              <div><h2 id="person-drawer-title" className="text-xl font-semibold">{selected.name}</h2><p className="text-sm text-gray-500">{selected.email}</p></div>
              <button type="button" aria-label="Close" onClick={() => setSelected(null)}>×</button>
            </div>
            {unmanagedCount > 0 && <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{unmanagedCount} access item(s) need review</p>}
            <div className="mt-5 flex gap-2 border-b">
              {(['current', 'pending', 'history'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setTab(value)} className={`border-b-2 px-3 py-2 text-sm capitalize ${tab === value ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}>{value}</button>
              ))}
            </div>
            <AccessRows rows={tab === 'current' ? current : tab === 'pending' ? pending : history} />
            <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" onClick={() => openGiveAccess({ userIds: [selected.id] })}>Give more</Button>
              <Button type="button" variant="outline" onClick={() => openRemoveAccess({ userIds: [selected.id] })}>Remove</Button>
              <Button type="button" variant="outline" className="border-red-300 text-red-700" onClick={() => openRemoveAccess({ userIds: [selected.id], removeAll: true })}>Remove all</Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function AccessRows({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <ul className="mt-4 divide-y rounded-md border">
      {rows.map((row, index) => (
        <li key={String(row.id ?? index)} className="p-3 text-sm">
          <span className="block font-medium">{String(row.applicationName ?? row.name ?? row.applicationId ?? 'Access item')}</span>
          <span className="text-gray-500">{String(row.status ?? row.outcome ?? '')}</span>
        </li>
      ))}
      {rows.length === 0 && <li className="p-4 text-sm text-gray-500">Nothing to show.</li>}
    </ul>
  );
}
