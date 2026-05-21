"use client";

import { useEffect, useCallback, useRef } from 'react';
import {
  touchUserInteraction,
  getLastUserInteraction,
  getMsSinceLastInteraction,
} from '../lib/session-lock-storage';

interface UseInactivityLockOptions {
  inactivityTimeout?: number;
  onLock: () => void;
  enabled?: boolean;
}

/**
 * Detects user inactivity and calls onLock. Parent owns lock UI state.
 */
export function useInactivityLock({
  inactivityTimeout = 5 * 60 * 1000,
  onLock,
  enabled = true,
}: UseInactivityLockOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleLock = useCallback(
    (delayMs: number) => {
      clearTimer();
      if (delayMs <= 0) {
        onLockRef.current();
        return;
      }
      timeoutRef.current = setTimeout(() => {
        onLockRef.current();
      }, delayMs);
    },
    [clearTimer]
  );

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    touchUserInteraction();
    scheduleLock(inactivityTimeout);
  }, [enabled, inactivityTimeout, scheduleLock]);

  const unlock = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleActivity = useCallback(() => {
    if (enabled) {
      resetTimer();
    }
  }, [enabled, resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    const last = getLastUserInteraction();
    if (last !== null) {
      const elapsed = Date.now() - last;
      if (elapsed >= inactivityTimeout) {
        onLockRef.current();
      } else {
        scheduleLock(inactivityTimeout - elapsed);
      }
    } else {
      touchUserInteraction();
      scheduleLock(inactivityTimeout);
    }

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ];

    const handlers = events.map((event) => {
      const handler = () => handleActivity();
      document.addEventListener(event, handler, { passive: true });
      return { event, handler };
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearTimer();
      } else {
        const msSince = getMsSinceLastInteraction();
        if (msSince === null) {
          resetTimer();
        } else if (msSince >= inactivityTimeout) {
          onLockRef.current();
        } else {
          scheduleLock(inactivityTimeout - msSince);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimer();
      handlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    enabled,
    inactivityTimeout,
    handleActivity,
    resetTimer,
    scheduleLock,
    clearTimer,
  ]);

  return {
    unlock,
    resetTimer: handleActivity,
  };
}
