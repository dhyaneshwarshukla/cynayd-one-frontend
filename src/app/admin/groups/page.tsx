'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { apiClient } from '@/lib/api-client';

export default function GroupsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await apiClient.getGroups());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      void load();
    }
  }, [authLoading, user, load]);

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    await apiClient.createGroup({ name: form.name, slug: form.slug });
    setForm({ name: '', slug: '' });
    await load();
  };

  if (authLoading) return null;
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <UnifiedLayout>
        <p className="p-8 text-gray-600">Access denied.</p>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <p className="text-sm text-gray-600">
          Manage organization groups for group-based app role mapping. Map groups to roles on each app&apos;s SSO
          settings.
        </p>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Create group</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="flex-1 min-w-[140px] rounded border px-3 py-2 text-sm"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="flex-1 min-w-[140px] rounded border px-3 py-2 text-sm"
              placeholder="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            />
            <Button onClick={handleCreate} className="bg-blue-600 text-white">
              Add
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your groups</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-gray-500">No groups yet.</p>
          ) : (
            <ul className="divide-y">
              {groups.map((g) => (
                <li key={g.id} className="py-3 flex justify-between">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-gray-500 text-sm font-mono">{g.slug}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </UnifiedLayout>
  );
}
