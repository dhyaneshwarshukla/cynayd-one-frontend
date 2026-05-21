"use client";

import React, { createContext, useCallback, useContext, useMemo, ReactNode } from 'react';
import {
  clearSessionLocked,
  touchUserInteraction,
} from '../lib/session-lock-storage';

interface SessionLockContextValue {
  notifyPinSetupComplete: () => void;
  notifyLoginSuccess: () => void;
}

const SessionLockContext = createContext<SessionLockContextValue | null>(null);

export function SessionLockProviderBridge({
  children,
  onPinSetupComplete,
  onLoginSuccess,
}: {
  children: ReactNode;
  onPinSetupComplete: () => void;
  onLoginSuccess: () => void;
}) {
  const notifyPinSetupComplete = useCallback(() => {
    clearSessionLocked();
    touchUserInteraction();
    onPinSetupComplete();
  }, [onPinSetupComplete]);

  const notifyLoginSuccess = useCallback(() => {
    clearSessionLocked();
    touchUserInteraction();
    onLoginSuccess();
  }, [onLoginSuccess]);

  const value = useMemo(
    () => ({ notifyPinSetupComplete, notifyLoginSuccess }),
    [notifyPinSetupComplete, notifyLoginSuccess]
  );

  return (
    <SessionLockContext.Provider value={value}>{children}</SessionLockContext.Provider>
  );
}

export function useSessionLock(): SessionLockContextValue {
  const ctx = useContext(SessionLockContext);
  if (!ctx) {
    return {
      notifyPinSetupComplete: () => {
        clearSessionLocked();
        touchUserInteraction();
      },
      notifyLoginSuccess: () => {
        clearSessionLocked();
        touchUserInteraction();
      },
    };
  }
  return ctx;
}
