'use client';

import { useState } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/common/Button';

export default function PrivacySettingsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const data = await apiClient.requestPrivacyExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cynayd-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Export downloaded.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!confirm('Request account deletion? An admin will process your DSAR.')) return;
    setBusy(true);
    setMessage(null);
    try {
      await apiClient.requestPrivacyDelete();
      setMessage('Deletion request submitted.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <UnifiedLayout title="Privacy">
      <div className="max-w-lg space-y-4 p-6">
        <p className="text-sm text-gray-600">
          Export your data or request deletion under GDPR. See our legal pages for details.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={busy}>
            Download my data
          </Button>
          <Button variant="outline" onClick={handleDeleteRequest} disabled={busy}>
            Request deletion
          </Button>
        </div>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>
    </UnifiedLayout>
  );
}
