'use client';

import { clearMobileApprovalSetupPrompt, shouldShowMobileApprovalSetupPrompt } from '@/hooks/useLoginChallengePolling';
import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function MobileApprovalSetupBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowMobileApprovalSetupPrompt());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    clearMobileApprovalSetupPrompt();
    setVisible(false);
  };

  return (
    <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-950">Install CYNAYD One Auth</p>
          <p className="mt-1 text-sm text-indigo-900">
            You signed in with an email code. Install the mobile app to approve future sign-ins with a
            tap and receive push notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-indigo-700 hover:bg-indigo-100"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
