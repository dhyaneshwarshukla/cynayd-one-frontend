'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import type { App } from '@/lib/api-client';

type AuthMode = 'basic' | 'group_based' | 'fixed_roles' | 'custom_mapping';

interface RoleTemplate {
  id: string;
  roleKey: string;
  displayName: string;
  externalValue: string;
  isDefault: boolean;
}

interface GroupRow {
  id: string;
  name: string;
  slug: string;
}

interface GroupAppRoleRow {
  groupId: string;
  roleTemplateId: string;
}

interface AppFederationPanelProps {
  app: App;
  users: Array<{ id: string; name?: string; email: string }>;
}

export function AppFederationPanel({ app, users }: AppFederationPanelProps) {
  const [authorizationMode, setAuthorizationMode] = useState<AuthMode>('basic');
  const [claimProviderId, setClaimProviderId] = useState('default');
  const [samlProviderArn, setSamlProviderArn] = useState('');
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [groupRoles, setGroupRoles] = useState<GroupAppRoleRow[]>([]);
  const [newTemplate, setNewTemplate] = useState({
    roleKey: '',
    displayName: '',
    externalValue: '',
  });
  const [previewUserId, setPreviewUserId] = useState('');
  const [previewJson, setPreviewJson] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fed, tpls, grps, mappings] = await Promise.all([
        apiClient.getAppFederation(app.slug),
        apiClient.getAppRoleTemplates(app.slug),
        apiClient.getGroups(),
        apiClient.getAppGroupRoles(app.slug),
      ]);
      setAuthorizationMode((fed.app?.authorizationMode as AuthMode) || 'basic');
      setClaimProviderId(fed.app?.claimProviderId || 'default');
      setSamlProviderArn(fed.federation?.samlProviderArn || '');
      setTemplates(tpls);
      setGroups(grps);
      setGroupRoles(
        mappings.map((m: { groupId: string; roleTemplateId: string }) => ({
          groupId: m.groupId,
          roleTemplateId: m.roleTemplateId,
        }))
      );
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load federation' });
    } finally {
      setLoading(false);
    }
  }, [app.slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveFederation = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.putAppFederation(app.slug, {
        authorizationMode,
        claimProviderId: authorizationMode === 'custom_mapping' ? 'aws' : claimProviderId,
        samlProviderArn: samlProviderArn || null,
        config: { claimProvider: authorizationMode === 'custom_mapping' ? 'aws' : claimProviderId },
      });
      setMessage({ type: 'success', text: 'Federation settings saved' });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.roleKey || !newTemplate.displayName || !newTemplate.externalValue) return;
    try {
      await apiClient.createAppRoleTemplate(app.slug, newTemplate);
      setNewTemplate({ roleKey: '', displayName: '', externalValue: '' });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to add template' });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await apiClient.deleteAppRoleTemplate(app.slug, id);
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete template' });
    }
  };

  const handleSaveGroupRoles = async () => {
    try {
      await apiClient.putAppGroupRoles(app.slug, groupRoles);
      setMessage({ type: 'success', text: 'Group role mappings saved' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save group mappings' });
    }
  };

  const handlePreview = async () => {
    if (!previewUserId) return;
    try {
      const result = await apiClient.getClaimPreview(app.slug, previewUserId);
      setPreviewJson(JSON.stringify(result, null, 2));
    } catch (e) {
      setPreviewJson(e instanceof Error ? e.message : 'Preview failed');
    }
  };

  const addGroupRoleRow = () => {
    setGroupRoles([...groupRoles, { groupId: groups[0]?.id || '', roleTemplateId: templates[0]?.id || '' }]);
  };

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading federation settings…</p>;
  }

  return (
    <div className="space-y-6 border-t border-gray-200 pt-6 mt-6">
      <h4 className="text-sm font-semibold text-gray-900">Authorization &amp; role mapping</h4>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Authorization mode</label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={authorizationMode}
          onChange={(e) => setAuthorizationMode(e.target.value as AuthMode)}
        >
          <option value="basic">Basic access (login only)</option>
          <option value="group_based">Group based (pass groups claim)</option>
          <option value="fixed_roles">Fixed roles (template per assignment)</option>
          <option value="custom_mapping">Custom mapping (e.g. AWS IAM ARNs)</option>
        </select>
      </div>

      {authorizationMode === 'custom_mapping' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AWS SAML provider ARN</label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            value={samlProviderArn}
            onChange={(e) => setSamlProviderArn(e.target.value)}
            placeholder="arn:aws:iam::123456789012:saml-provider/CYNAYD-One"
          />
        </div>
      )}

      <Button onClick={handleSaveFederation} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
        {saving ? 'Saving…' : 'Save authorization settings'}
      </Button>

      {authorizationMode !== 'basic' && (
        <>
          <div>
            <h5 className="text-sm font-medium text-gray-800 mb-2">Role templates</h5>
            <div className="space-y-2 mb-3">
              {templates.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-2 rounded border border-gray-200 p-2 text-sm">
                  <div>
                    <div className="font-medium">{t.displayName}</div>
                    <div className="text-gray-500 font-mono text-xs">{t.externalValue}</div>
                  </div>
                  <button type="button" className="text-red-600 text-xs" onClick={() => handleDeleteTemplate(t.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className="rounded border px-2 py-1 text-sm"
                placeholder="role_key"
                value={newTemplate.roleKey}
                onChange={(e) => setNewTemplate({ ...newTemplate, roleKey: e.target.value })}
              />
              <input
                className="rounded border px-2 py-1 text-sm"
                placeholder="Display name"
                value={newTemplate.displayName}
                onChange={(e) => setNewTemplate({ ...newTemplate, displayName: e.target.value })}
              />
              <input
                className="rounded border px-2 py-1 text-sm font-mono"
                placeholder="External value (IAM ARN)"
                value={newTemplate.externalValue}
                onChange={(e) => setNewTemplate({ ...newTemplate, externalValue: e.target.value })}
              />
            </div>
            <Button onClick={handleAddTemplate} className="mt-2 text-sm" variant="outline">
              Add template
            </Button>
          </div>

          {(authorizationMode === 'group_based' || authorizationMode === 'custom_mapping') && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 mb-2">Group → role mapping</h5>
              {groupRoles.map((gr, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    value={gr.groupId}
                    onChange={(e) => {
                      const next = [...groupRoles];
                      next[idx] = { ...gr, groupId: e.target.value };
                      setGroupRoles(next);
                    }}
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    value={gr.roleTemplateId}
                    onChange={(e) => {
                      const next = [...groupRoles];
                      next[idx] = { ...gr, roleTemplateId: e.target.value };
                      setGroupRoles(next);
                    }}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={addGroupRoleRow} className="text-sm">
                  Add mapping
                </Button>
                <Button onClick={handleSaveGroupRoles} className="text-sm bg-gray-800 text-white">
                  Save group mappings
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-4">
            <h5 className="text-sm font-medium text-gray-800 mb-2">Preview claims</h5>
            <div className="flex gap-2 mb-2">
              <select
                className="flex-1 rounded border px-2 py-1 text-sm"
                value={previewUserId}
                onChange={(e) => setPreviewUserId(e.target.value)}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
              <Button onClick={handlePreview} variant="outline" className="text-sm">
                Preview
              </Button>
            </div>
            {previewJson && (
              <pre className="text-xs overflow-auto max-h-48 bg-white border rounded p-2 font-mono">{previewJson}</pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
