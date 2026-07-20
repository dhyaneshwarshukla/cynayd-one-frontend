'use client';

import React, { Suspense, lazy } from 'react';
import { useAccessOpsFlow } from './AccessOpsFlowContext';

const GiveAccessStepper = lazy(() =>
  import('./GiveAccessStepper').then((m) => ({ default: m.GiveAccessStepper }))
);
const RemoveAccessStepper = lazy(() =>
  import('./RemoveAccessStepper').then((m) => ({ default: m.RemoveAccessStepper }))
);

export function AccessOpsFlowHost() {
  const { kind, context, closeFlow } = useAccessOpsFlow();

  if (!kind) return null;

  return (
    <Suspense fallback={null}>
      {kind === 'give' && (
        <GiveAccessStepper
          initialUserIds={context.userIds}
          initialApplicationIds={context.applicationIds}
          onClose={closeFlow}
        />
      )}
      {kind === 'remove' && (
        <RemoveAccessStepper
          initialUserIds={context.userIds}
          initialApplicationIds={context.applicationIds}
          removeAll={context.removeAll}
          onClose={closeFlow}
        />
      )}
    </Suspense>
  );
}
