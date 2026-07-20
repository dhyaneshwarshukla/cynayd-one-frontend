'use client';

import React, { useState } from 'react';
import { Button } from '../../../../components/common/Button';
import { LiveErrorRegion } from '../../../../components/accessops/LiveErrorRegion';
import { accessOpsClient } from '../../../../lib/accessops/client';

const SAMPLE_PERMISSIONS = [
  'cynayd-vault:vault:finance:document.read',
  'cynayd-drive:folder:shared:write',
  'cynayd-mail:mailbox:default:send',
];

export default function AccessOpsRoleBuilderPage() {
  const [roleName, setRoleName] = useState('Finance reviewer');
  const [permissions, setPermissions] = useState<string[]>(['cynayd-vault:vault:finance:document.read']);
  const [draft, setDraft] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPermission = () => {
    const value = draft.trim();
    if (!value || permissions.includes(value)) return;
    setPermissions((prev) => [...prev, value]);
    setDraft('');
  };

  const rolePermissions = () =>
    permissions.map((token) => {
      const [applicationId, resourceType, resourceId, action] = token.split(':');
      return { applicationId, resourceType, resourceId, action };
    });

  const save = async (): Promise<string> => {
    const created = await accessOpsClient.roles.create({
      name: roleName,
      permissions: rolePermissions(),
    }) as { id: string };
    setRoleId(created.id);
    return created.id;
  };

  const submit = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const id = roleId || await save();
      if (publish) {
        await accessOpsClient.roles.publish(id, {
          permissions: rolePermissions(),
          changeSummary: 'Published from Access Ops role builder',
        });
      }
      setMessage(publish ? 'Role version published.' : 'Role draft saved.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Role builder</h1>
        <p className="mt-1 text-sm text-gray-600">Compose versioned access roles from application permissions.</p>
      </div>
      <LiveErrorRegion message={error} />
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700" htmlFor="role-name">
          Role name
        </label>
        <input
          id="role-name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
        />
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-medium text-gray-900">Permissions</h2>
        <ul className="space-y-2">
          {permissions.map((permission) => (
            <li key={permission} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <span>{permission}</span>
              <button
                type="button"
                className="text-red-600"
                onClick={() => setPermissions((prev) => prev.filter((item) => item !== permission))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            aria-label="Permission token"
            list="permission-suggestions"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="application:resourceType:resourceId:action"
            className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <datalist id="permission-suggestions">
            {SAMPLE_PERMISSIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <Button type="button" variant="outline" onClick={addPermission}>
            Add
          </Button>
        </div>
      </section>

      <div className="flex gap-2">
        <Button type="button" disabled={saving} onClick={() => void submit(false)}>
          Save draft
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={() => void submit(true)}>
          Publish version
        </Button>
      </div>
    </div>
  );
}
