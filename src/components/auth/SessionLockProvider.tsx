"use client";

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useInactivityLock } from '../../hooks/useInactivityLock';
import { LockScreen } from './LockScreen';
import { NoPinLockOverlay } from './NoPinLockOverlay';
import { SessionLockProviderBridge } from '../../contexts/SessionLockContext';
import apiClient, { type PinLock } from '../../lib/api-client';
import {
  markSessionLocked,
  clearSessionLocked,
  touchUserInteraction,
  clearAllSessionLockData,
  shouldShowPinLockScreen,
  shouldShowNoPinLockOverlay,
} from '../../lib/session-lock-storage';

interface SessionLockProviderProps {
  children: ReactNode;
}

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

function LockLoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
    </div>
  );
}

export function SessionLockProvider({ children }: SessionLockProviderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [pinStatus, setPinStatus] = useState<PinLock | null>(null);
  const [checkingPinStatus, setCheckingPinStatus] = useState(true);
  const [pinAttemptsRemaining, setPinAttemptsRemaining] = useState<number | undefined>(
    undefined
  );
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | undefined>(undefined);

  const completeUnlock = useCallback(async () => {
    clearSessionLocked();
    touchUserInteraction();
    try {
      await apiClient.updateActivity();
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
    setPinAttemptsRemaining(undefined);
    setIsAccountLocked(false);
    setLockedUntil(undefined);
    setIsLocked(false);
  }, []);

  const handlePinEnabledFromOverlay = useCallback(async () => {
    try {
      const status = await apiClient.getPINStatus();
      setPinStatus(status);
      if (status.requiresPin || status.pinEnabled) {
        await completeUnlock();
      }
    } catch (error) {
      console.error('Failed to refresh PIN status:', error);
    }
  }, [completeUnlock]);

  const handlePinSetupCompleteBridge = useCallback(async () => {
    try {
      const status = await apiClient.getPINStatus();
      setPinStatus(status);
    } catch {
      // ignore
    }
    if (isLocked) {
      await completeUnlock();
    }
  }, [isLocked, completeUnlock]);

  const handleLoginSuccessBridge = useCallback(() => {
    // Login clears stale no-PIN lock; PIN users still lock on next checkPINStatus
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setIsLocked(false);
      setPinStatus(null);
      setPinAttemptsRemaining(undefined);
      setIsAccountLocked(false);
      setLockedUntil(undefined);
      clearAllSessionLockData();
    }
  }, [isAuthenticated, isLoading]);

  const syncPinLockFromServer = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCheckingPinStatus(false);
      return;
    }

    setCheckingPinStatus(true);
    try {
      // Prefer /api/users/me pinLock; fall back to /api/auth/pin/status
      let pinLock: PinLock | undefined = user.pinLock;
      if (!pinLock) {
        try {
          const me = await apiClient.getCurrentUser();
          pinLock = me.pinLock;
        } catch {
          // ignore; try dedicated status endpoint
        }
      }
      if (!pinLock) {
        pinLock = await apiClient.getPINStatus();
      }
      setPinStatus(pinLock);

      if (shouldShowPinLockScreen(pinLock) || shouldShowNoPinLockOverlay(pinLock)) {
        setIsLocked(true);
      } else {
        clearSessionLocked();
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Failed to check PIN status:', error);
    } finally {
      setCheckingPinStatus(false);
    }
  }, [isAuthenticated, user]);

  // On load and route change: use server pinLock (not only sessionStorage)
  useEffect(() => {
    if (isLoading) return;
    syncPinLockFromServer();
  }, [syncPinLockFromServer, pathname, isLoading]);

  const handleLock = useCallback(() => {
    markSessionLocked();
    setIsLocked(true);
  }, []);

  const { unlock: unlockInactivity } = useInactivityLock({
    inactivityTimeout: INACTIVITY_TIMEOUT_MS,
    onLock: handleLock,
    enabled: isAuthenticated && !isLocked && !checkingPinStatus,
  });

  const handleUnlock = async (pin: string) => {
    try {
      await apiClient.verifyPIN(pin);
      setIsLocked(false);
      unlockInactivity();
      await completeUnlock();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { code?: string; message?: string; lockedUntil?: string; attemptsRemaining?: number } };
        message?: string;
      };
      console.error('PIN verification failed:', error);

      if (err.response?.data?.code === 'ACCOUNT_LOCKED') {
        setIsAccountLocked(true);
        setLockedUntil(err.response.data.lockedUntil);
        throw new Error(err.response.data.message || 'Account is locked');
      }

      if (err.response?.data?.attemptsRemaining !== undefined) {
        setPinAttemptsRemaining(err.response.data.attemptsRemaining);
      }

      throw new Error(
        err.response?.data?.message || err.message || 'Invalid PIN'
      );
    }
  };

  useEffect(() => {
    if (!isAuthenticated || isLocked || checkingPinStatus) return;

    const syncServerActivity = async () => {
      try {
        await apiClient.updateActivity();
      } catch (error) {
        console.error('Failed to update activity:', error);
      }
    };

    syncServerActivity();
    const activityInterval = setInterval(syncServerActivity, 60000);
    return () => clearInterval(activityInterval);
  }, [isAuthenticated, isLocked, checkingPinStatus]);

  const handleLogout = async () => {
    clearAllSessionLockData();
    await apiClient.logout();
    window.location.href = '/auth/login';
  };

  if (isLoading) {
    return <LockLoadingShell />;
  }

  if (!isAuthenticated) {
    return (
      <SessionLockProviderBridge
        onPinSetupComplete={handlePinSetupCompleteBridge}
        onLoginSuccess={handleLoginSuccessBridge}
      >
        {children}
      </SessionLockProviderBridge>
    );
  }

  if (checkingPinStatus) {
    return <LockLoadingShell />;
  }

  if (isLocked) {
    return (
      <SessionLockProviderBridge
        onPinSetupComplete={handlePinSetupCompleteBridge}
        onLoginSuccess={handleLoginSuccessBridge}
      >
        {pinStatus?.requiresPin ? (
          <LockScreen
            onUnlock={handleUnlock}
            userName={user?.name || undefined}
            userEmail={user?.email || undefined}
            attemptsRemaining={pinAttemptsRemaining}
            isAccountLocked={isAccountLocked}
            lockedUntil={lockedUntil}
          />
        ) : (
          <NoPinLockOverlay onPinEnabled={handlePinEnabledFromOverlay} onLogout={handleLogout} />
        )}
      </SessionLockProviderBridge>
    );
  }

  return (
    <SessionLockProviderBridge
      onPinSetupComplete={handlePinSetupCompleteBridge}
      onLoginSuccess={handleLoginSuccessBridge}
    >
      {children}
    </SessionLockProviderBridge>
  );
}
