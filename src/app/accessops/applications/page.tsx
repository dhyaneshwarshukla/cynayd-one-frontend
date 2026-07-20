'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { accessOpsClient, ApplicationUser } from '../../../lib/accessops/client';
import { humanizeAccessStatus, humanizeProvisioningMode } from '../../../lib/accessops/labels';
import { useAccessOpsFlow } from '../../../components/accessops/AccessOpsFlowContext';
import { LiveErrorRegion } from '../../../components/accessops/LiveErrorRegion';
import { Button } from '../../../components/common/Button';

export default function AccessOpsApplicationsPage() {
  const { openGiveAccess, openRemoveAccess } = useAccessOpsFlow();
  const [apps, setApps] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<ApplicationUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApps(await accessOpsClient.listApplications());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadUsers = useCallback(async (app: Record<string, unknown>, term = '') => {
    setSelected(app);
    setSelectedUsers([]);
    setError(null);
    try {
      const page = await accessOpsClient.listApplicationUsers(String(app.id), { search: term || undefined, limit: 100 });
      setUsers(page.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load application users');
    }
  }, []);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-gray-900">Applications</h1><p className="mt-1 text-sm text-gray-600">Manage who can use each application.</p></div>
      <LiveErrorRegion message={error} onRetry={load} />
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-gray-50"><tr>{['Application', 'Users', 'Access method', 'Status', 'Manage users'].map((label) => <th key={label} className="px-4 py-3 text-left font-medium text-gray-600">{label}</th>)}</tr></thead>
          <tbody className="divide-y">
            {apps.map((app) => (
              <tr key={String(app.id)}>
                <td className="px-4 py-3 font-medium">{String(app.name ?? app.displayName ?? app.id)}</td>
                <td className="px-4 py-3">{String(app.userCount ?? app.usersWithAccess ?? 0)}</td>
                <td className="px-4 py-3">{humanizeProvisioningMode(app.accessMethod ?? app.provisioningMode)}</td>
                <td className="px-4 py-3">{humanizeAccessStatus(app.status ?? (app.active === false ? 'INACTIVE' : 'ACTIVE'))}</td>
                <td className="px-4 py-3"><Button type="button" size="sm" variant="outline" onClick={() => void loadUsers(app)}>Manage users</Button></td>
              </tr>
            ))}
            {!loading && apps.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No applications found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation">
          <aside role="dialog" aria-modal="true" aria-labelledby="application-drawer-title" className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex justify-between">
              <h2 id="application-drawer-title" className="text-xl font-semibold">{String(selected.name ?? selected.displayName)}</h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">×</button>
            </div>
            <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); void loadUsers(selected, search.trim()); }}>
              <input aria-label="Search application users" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm" />
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <div className="mt-4 max-h-[60vh] divide-y overflow-y-auto rounded-md border">
              {users.map((user) => (
                <label key={user.id} className="flex gap-3 p-3 text-sm">
                  <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers((ids) => ids.includes(user.id) ? ids.filter((id) => id !== user.id) : [...ids, user.id])} />
                  <span><span className="block font-medium">{user.name}</span><span className="text-gray-500">{user.email}</span></span>
                </label>
              ))}
              {users.length === 0 && <p className="p-4 text-sm text-gray-500">No users found.</p>}
            </div>
            <div className="mt-6 flex gap-2 border-t pt-4">
              <Button type="button" onClick={() => openGiveAccess({ applicationIds: [String(selected.id)] })}>Add users</Button>
              <Button type="button" variant="outline" disabled={selectedUsers.length === 0} onClick={() => openRemoveAccess({ applicationIds: [String(selected.id)], userIds: selectedUsers })}>Remove users</Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
