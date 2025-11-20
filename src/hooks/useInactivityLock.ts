"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

interface UseInactivityLockOptions {
  inactivityTimeout?: number; // in milliseconds, default 5 minutes
  onLock: () => void;
  enabled?: boolean;
}

/**
 * Hook to detect user inactivity and trigger lock screen
 * @param options Configuration options
 * @returns Object with lock state and methods
 */
export function useInactivityLock({
  inactivityTimeout = 5 * 60 * 1000, // 5 minutes default
  onLock,
  enabled = true,
}: UseInactivityLockOptions) {
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityHandlersRef = useRef<Array<() => void>>([]);
  const tabHiddenTimeRef = useRef<number | null>(null); // Track when tab was hidden

  const resetTimer = useCallback(() => {
    if (!enabled || isLocked) return;

    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity
    const now = Date.now();
    setLastActivity(now);

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastActivity', now.toString());
    }

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Inactivity timeout reached, locking screen...');
      setIsLocked(true);
      onLock();
    }, inactivityTimeout);
  }, [enabled, inactivityTimeout, onLock, isLocked]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  const handleActivity = useCallback(() => {
    if (!isLocked && enabled) {
      resetTimer();
    }
  }, [isLocked, resetTimer, enabled]);

  useEffect(() => {
    if (!enabled) {
      // When disabled, ensure we're not locked and clear any timers
      if (isLocked) {
        setIsLocked(false);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Restore last activity from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lastActivity');
      if (stored) {
        const storedTime = parseInt(stored, 10);
        const timeSinceActivity = Date.now() - storedTime;
        
        // If more than inactivity timeout has passed, lock immediately
        if (timeSinceActivity >= inactivityTimeout) {
          setIsLocked(true);
          onLock();
        } else {
          // Otherwise, set timer for remaining time
          setLastActivity(storedTime);
          timeoutRef.current = setTimeout(() => {
            setIsLocked(true);
            onLock();
          }, inactivityTimeout - timeSinceActivity);
        }
      } else {
        // No stored activity, start fresh
        resetTimer();
      }
    }

    // Activity event listeners - use document instead of window for better coverage
    const events = [
      'mousedown',
      'mousemove',
      'keydown', // Changed from keypress for better detection
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel', // Added wheel event
    ];

    const activityHandlers = events.map((event) => {
      const handler = () => {
        if (enabled && !isLocked) {
          handleActivity();
        }
      };
      // Use document for better event capture
      document.addEventListener(event, handler, { passive: true });
      return handler;
    });

    activityHandlersRef.current = activityHandlers;

    // Handle tab visibility changes (user switching tabs/windows)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab became hidden - pause timer and record time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        tabHiddenTimeRef.current = Date.now();
        console.log('👁️ Tab hidden - timer paused');
      } else if (document.visibilityState === 'visible' && !isLocked) {
        // Tab became visible - check if we should lock
        console.log('👁️ Tab visible - checking activity');
        
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('lastActivity');
          if (stored) {
            const storedTime = parseInt(stored, 10);
            const timeSinceActivity = Date.now() - storedTime;
            
            // If more than inactivity timeout has passed, lock immediately
            if (timeSinceActivity >= inactivityTimeout) {
              console.log('🔒 Locking due to inactivity while tab was hidden');
              setIsLocked(true);
              onLock();
            } else {
              // Resume timer with remaining time
              const remainingTime = inactivityTimeout - timeSinceActivity;
              console.log(`⏰ Resuming timer - ${Math.round(remainingTime / 1000)}s remaining`);
              timeoutRef.current = setTimeout(() => {
                setIsLocked(true);
                onLock();
              }, remainingTime);
            }
          } else {
            // No stored activity, start fresh
            resetTimer();
          }
        }
        
        tabHiddenTimeRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityHandlers.forEach((handler, index) => {
        document.removeEventListener(events[index], handler);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, inactivityTimeout, onLock, handleActivity, resetTimer, isLocked]);

  return {
    isLocked,
    unlock,
    lastActivity,
    resetTimer: handleActivity,
  };
}

