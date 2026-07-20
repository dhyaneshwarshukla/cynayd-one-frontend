'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AccessOpsFlowKind = 'give' | 'remove' | null;

export interface AccessOpsFlowLaunchContext {
  userIds?: string[];
  applicationIds?: string[];
  removeAll?: boolean;
}

interface AccessOpsFlowState {
  kind: AccessOpsFlowKind;
  context: AccessOpsFlowLaunchContext;
  openGiveAccess: (ctx?: AccessOpsFlowLaunchContext) => void;
  openRemoveAccess: (ctx?: AccessOpsFlowLaunchContext) => void;
  closeFlow: () => void;
}

const AccessOpsFlowContext = createContext<AccessOpsFlowState | null>(null);

export function AccessOpsFlowProvider({ children }: { children: React.ReactNode }) {
  const [kind, setKind] = useState<AccessOpsFlowKind>(null);
  const [context, setContext] = useState<AccessOpsFlowLaunchContext>({});

  const openGiveAccess = useCallback((ctx: AccessOpsFlowLaunchContext = {}) => {
    setContext(ctx);
    setKind('give');
  }, []);

  const openRemoveAccess = useCallback((ctx: AccessOpsFlowLaunchContext = {}) => {
    setContext(ctx);
    setKind('remove');
  }, []);

  const closeFlow = useCallback(() => {
    setKind(null);
    setContext({});
  }, []);

  const value = useMemo(
    () => ({ kind, context, openGiveAccess, openRemoveAccess, closeFlow }),
    [kind, context, openGiveAccess, openRemoveAccess, closeFlow]
  );

  return <AccessOpsFlowContext.Provider value={value}>{children}</AccessOpsFlowContext.Provider>;
}

export function useAccessOpsFlow(): AccessOpsFlowState {
  const ctx = useContext(AccessOpsFlowContext);
  if (!ctx) {
    throw new Error('useAccessOpsFlow must be used within AccessOpsFlowProvider');
  }
  return ctx;
}
