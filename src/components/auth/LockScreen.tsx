"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { formatInstantInTimezone } from '../../utils/datetime';

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<void>;
  onRequestUnlockEmail?: () => Promise<void>;
  onSignOut?: () => void;
  userName?: string;
  userEmail?: string;
  displayTimezone?: string;
  attemptsRemaining?: number;
  isAccountLocked?: boolean;
  lockedUntil?: string;
}

export function LockScreen({
  onUnlock,
  onRequestUnlockEmail,
  onSignOut,
  userName,
  userEmail,
  displayTimezone = 'UTC',
  attemptsRemaining,
  isAccountLocked,
  lockedUntil,
}: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);
  const [unlockEmailMessage, setUnlockEmailMessage] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formattedLockedUntil =
    lockedUntil && displayTimezone
      ? formatInstantInTimezone(lockedUntil, displayTimezone)
      : null;

  useEffect(() => {
    if (inputRef.current && !isAccountLocked) {
      inputRef.current.focus();
    }
  }, [isAccountLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAccountLocked) return;

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      await onUnlock(pin);
      setPin('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid PIN. Please try again.';
      if (!message.toLowerCase().includes('account is locked')) {
        setError(message);
      }
      setPin('');
      if (inputRef.current && !isAccountLocked) {
        inputRef.current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestUnlockEmail = async () => {
    if (!onRequestUnlockEmail) return;
    setIsRequestingUnlock(true);
    setUnlockEmailMessage(null);
    try {
      await onRequestUnlockEmail();
      setUnlockEmailMessage(
        'Unlock email sent. Check your inbox and follow the link, or sign out and use the login page.'
      );
    } catch (err: unknown) {
      setUnlockEmailMessage(
        err instanceof Error ? err.message : 'Failed to send unlock email.'
      );
    } finally {
      setIsRequestingUnlock(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length >= 4 && !isAccountLocked) {
      handleSubmit(e as React.FormEvent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 rounded-full p-4">
              <Lock className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Portal Locked</h2>
            {userName && <p className="text-white/80 text-lg">{userName}</p>}
            {userEmail && <p className="text-white/60 text-sm mt-1">{userEmail}</p>}
            <p className="text-white/70 text-sm mt-4">
              {isAccountLocked
                ? 'Your account is temporarily locked.'
                : 'Enter your PIN to unlock'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isAccountLocked && (
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={handlePinChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter PIN"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {isAccountLocked && (
              <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 space-y-2">
                <p className="text-orange-200 text-sm text-center font-semibold">
                  Account locked
                </p>
                {formattedLockedUntil && (
                  <p className="text-orange-200/90 text-sm text-center">
                    Try again after {formattedLockedUntil}
                  </p>
                )}
                <p className="text-orange-200/80 text-xs text-center">
                  Too many incorrect PIN attempts. Request an unlock email or sign out and
                  sign in again.
                </p>
              </div>
            )}

            {error && !isAccountLocked && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
                {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
                  <p className="text-red-200/80 text-xs text-center mt-1">
                    {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining
                    before account lock
                  </p>
                )}
              </div>
            )}

            {!isAccountLocked && (
              <button
                type="submit"
                disabled={isLoading || pin.length < 4}
                className="w-full py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {isLoading ? 'Unlocking...' : 'Unlock'}
              </button>
            )}

            {isAccountLocked && (
              <div className="space-y-2 pt-1">
                {onRequestUnlockEmail && userEmail && (
                  <button
                    type="button"
                    onClick={handleRequestUnlockEmail}
                    disabled={isRequestingUnlock}
                    className="w-full py-3 bg-blue-500/80 hover:bg-blue-500 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    {isRequestingUnlock ? 'Sending unlock email...' : 'Send unlock email'}
                  </button>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    Sign out
                  </button>
                )}
                {unlockEmailMessage && (
                  <p
                    className={`text-xs text-center ${
                      unlockEmailMessage.includes('sent')
                        ? 'text-green-300'
                        : 'text-red-300'
                    }`}
                  >
                    {unlockEmailMessage}
                  </p>
                )}
              </div>
            )}
          </form>

          {!isAccountLocked && onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full mt-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              Sign out and log in again
            </button>
          )}

          {!isAccountLocked && (
            <p className="text-white/50 text-xs text-center mt-6">PIN must be 4-6 digits</p>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            {new Intl.DateTimeFormat(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: displayTimezone,
            }).format(new Date())}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {new Intl.DateTimeFormat(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: displayTimezone,
            }).format(new Date())}
          </p>
        </div>
      </div>
    </div>
  );
}
