"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInactivityLock } from '../../hooks/useInactivityLock';
import { LockScreen } from './LockScreen';
import { usePathname } from 'next/navigation';
import apiClient from '../../lib/api-client';

interface SessionLockProviderProps {
  children: ReactNode;
}

/**
 * Provider component that handles session locking and PIN verification
 * Wraps the authenticated content and shows lock screen when needed
 */
export function SessionLockProvider({ children }: SessionLockProviderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [pinStatus, setPinStatus] = useState<{ pinEnabled: boolean; hasPIN: boolean } | null>(null);
  const [checkingPinStatus, setCheckingPinStatus] = useState(true);
  
  // Check if current route is security settings page
  const isSecuritySettingsPage = pathname?.includes('/dashboard/settings') || pathname?.includes('/settings');

  // Check PIN status when user is authenticated or when navigating to security settings
  useEffect(() => {
    const checkPINStatus = async () => {
      if (isAuthenticated && user) {
        try {
          const status = await apiClient.getPINStatus();
          setPinStatus(status);
          
          // If PIN is enabled, check if we should show lock screen on initial load
          if (status.pinEnabled) {
            // Check last activity from localStorage
            const lastActivity = localStorage.getItem('lastActivity');
            if (lastActivity) {
              const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
              const inactivityTimeout = 5 * 60 * 1000; // 5 minutes
              
              // If more than 5 minutes of inactivity, show lock screen
              if (timeSinceActivity >= inactivityTimeout) {
                setIsLocked(true);
              }
            } else {
              // No activity recorded, show lock screen
              setIsLocked(true);
            }
          }
        } catch (error) {
          console.error('Failed to check PIN status:', error);
        } finally {
          setCheckingPinStatus(false);
        }
      } else {
        setCheckingPinStatus(false);
      }
    };

    checkPINStatus();
  }, [isAuthenticated, user, pathname, isSecuritySettingsPage]);

  // Handle inactivity lock - always lock after 5 minutes if authenticated
  const handleLock = () => {
    console.log('🔒 Locking screen due to inactivity');
    setIsLocked(true);
  };

  // Enable inactivity lock if authenticated and not already locked
  // Lock regardless of PIN status - if PIN not enabled, user will need to login
  const { unlock: unlockInactivity } = useInactivityLock({
    inactivityTimeout: 5 * 60 * 1000, // 5 minutes
    onLock: handleLock,
    enabled: isAuthenticated && !isLocked && !checkingPinStatus,
  });

  const [pinAttemptsRemaining, setPinAttemptsRemaining] = useState<number | undefined>(undefined);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | undefined>(undefined);

  // Handle PIN unlock
  const handleUnlock = async (pin: string) => {
    try {
      const response = await apiClient.verifyPIN(pin);
      
      // Reset attempt tracking on success
      setPinAttemptsRemaining(undefined);
      setIsAccountLocked(false);
      setLockedUntil(undefined);
      
      // Update activity
      await apiClient.updateActivity();
      
      // Update localStorage
      const now = Date.now();
      localStorage.setItem('lastActivity', now.toString());
      
      // Unlock
      setIsLocked(false);
      unlockInactivity();
      
      console.log('🔓 Screen unlocked successfully');
    } catch (error: any) {
      console.error('❌ PIN verification failed:', error);
      
      // Check if account is locked
      if (error.response?.data?.code === 'ACCOUNT_LOCKED') {
        setIsAccountLocked(true);
        setLockedUntil(error.response.data.lockedUntil);
        throw new Error(error.response.data.message || 'Account is locked');
      }
      
      // Check for attempt count
      if (error.response?.data?.attemptsRemaining !== undefined) {
        setPinAttemptsRemaining(error.response.data.attemptsRemaining);
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Invalid PIN');
    }
  };

  // Update activity on user interaction when unlocked
  useEffect(() => {
    if (isAuthenticated && !isLocked && !checkingPinStatus) {
      // Update activity immediately when unlocked
      const updateActivity = async () => {
        try {
          await apiClient.updateActivity();
          localStorage.setItem('lastActivity', Date.now().toString());
        } catch (error) {
          console.error('Failed to update activity:', error);
        }
      };

      // Update immediately
      updateActivity();

      // Also update periodically (every minute)
      const activityInterval = setInterval(updateActivity, 60000);

      return () => clearInterval(activityInterval);
    }
  }, [isAuthenticated, isLocked, checkingPinStatus]);

  // Monitor PIN status when on security settings page and locked without PIN
  useEffect(() => {
    if (!pinStatus?.pinEnabled && isSecuritySettingsPage && isLocked && isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          const status = await apiClient.getPINStatus();
          if (status.pinEnabled) {
            // PIN was set up, update activity and unlock
            await apiClient.updateActivity();
            localStorage.setItem('lastActivity', Date.now().toString());
            setPinStatus(status);
            setIsLocked(false);
            unlockInactivity();
          }
        } catch (error) {
          console.error('Failed to check PIN status:', error);
        }
      }, 2000); // Check every 2 seconds while on security page
      
      return () => clearInterval(interval);
    }
  }, [pinStatus?.pinEnabled, isSecuritySettingsPage, isLocked, isAuthenticated, unlockInactivity]);

  // Don't show lock screen if:
  // - Still loading
  // - Not authenticated
  // - Checking PIN status
  // - Not locked
  // - On security settings page and PIN not enabled (allow access to set up PIN)
  if (isLoading || !isAuthenticated || checkingPinStatus || !isLocked) {
    return <>{children}</>;
  }

  // If locked but PIN not enabled, allow access to security settings page
  if (!pinStatus?.pinEnabled && isSecuritySettingsPage) {
    // Allow access to security settings page to set up PIN
    return <>{children}</>;
  }

  // If locked but PIN not enabled, show message or redirect to login
  if (!pinStatus?.pinEnabled) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md px-6 py-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-white/10 rounded-full p-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Session Locked</h2>
              <p className="text-white/80 mb-2">
                Your session has been locked due to inactivity.
              </p>
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6 mt-4">
                <p className="text-blue-200 text-sm font-medium mb-2">
                  💡 Set up a PIN to avoid logging in again!
                </p>
                <p className="text-blue-200/90 text-xs">
                  If you set up a PIN from Security settings, you won't have to login again. Just enter your PIN to unlock the portal.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    window.location.href = '/dashboard/settings?tab=security';
                  }}
                  className="w-full py-3 bg-blue-500/80 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go to Security Settings
                </button>
                <button
                  onClick={async () => {
                    await apiClient.logout();
                    window.location.href = '/auth/login';
                  }}
                  className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Login Again
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'none' }}>{children}</div>
      </>
    );
  }

  // Show lock screen with PIN
  return (
    <>
      <LockScreen
        onUnlock={handleUnlock}
        userName={user?.name || undefined}
        userEmail={user?.email || undefined}
        attemptsRemaining={pinAttemptsRemaining}
        isAccountLocked={isAccountLocked}
        lockedUntil={lockedUntil}
      />
      {/* Hide content behind lock screen */}
      <div style={{ display: 'none' }}>{children}</div>
    </>
  );
}

