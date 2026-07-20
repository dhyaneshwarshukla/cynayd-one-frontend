'use client';

import React, { useState } from 'react';
import { StepUpModal } from '../auth/StepUpModal';

export function useStepUpAction() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<(() => Promise<void>) | null>(null);

  const runWithStepUp = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e: unknown) {
      const err = e as Error & { code?: string };
      if (err.code === 'STEP_UP_REQUIRED' || err.message.includes('Step-up')) {
        setPending(() => action);
        setOpen(true);
        return;
      }
      throw e;
    }
  };

  const modal = (
    <StepUpModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        setPending(null);
      }}
      onSuccess={() => {
        setOpen(false);
        const fn = pending;
        setPending(null);
        if (fn) void fn();
      }}
    />
  );

  return { runWithStepUp, stepUpModal: modal };
}
