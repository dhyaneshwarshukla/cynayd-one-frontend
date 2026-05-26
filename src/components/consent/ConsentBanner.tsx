'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/common/Button';

export function ConsentBanner() {
  const [missing, setMissing] = useState<Array<{ purpose: string; version: string; label: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ required }, granted] = await Promise.all([
          apiClient.getRequiredConsents(),
          apiClient.getUserConsents(),
        ]);
        const grantedSet = new Set(granted.map((g) => `${g.purpose}:${g.version}`));
        setMissing(required.filter((r) => !grantedSet.has(`${r.purpose}:${r.version}`)));
      } catch {
        setMissing([]);
      }
    })();
  }, []);

  if (missing.length === 0) return null;

  const acceptAll = async () => {
    setSaving(true);
    try {
      for (const item of missing) {
        await apiClient.grantConsent(item.purpose, item.version);
      }
      setMissing([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Please accept our updated policies to continue: {missing.map((m) => m.label).join(', ')}.
        </p>
        <Button onClick={acceptAll} disabled={saving}>
          {saving ? 'Saving…' : 'Accept'}
        </Button>
      </div>
    </div>
  );
}
