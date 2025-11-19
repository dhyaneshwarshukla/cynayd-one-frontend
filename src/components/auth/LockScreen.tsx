"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<void>;
  userName?: string;
  userEmail?: string;
  attemptsRemaining?: number;
  isAccountLocked?: boolean;
  lockedUntil?: string;
}

export function LockScreen({ onUnlock, userName, userEmail, attemptsRemaining, isAccountLocked, lockedUntil }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      await onUnlock(pin);
      setPin('');
    } catch (err: any) {
      setError(err.message || 'Invalid PIN. Please try again.');
      setPin('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length >= 4) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 rounded-full p-4">
              <Lock className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Portal Locked</h2>
            {userName && (
              <p className="text-white/80 text-lg">{userName}</p>
            )}
            {userEmail && (
              <p className="text-white/60 text-sm mt-1">{userEmail}</p>
            )}
            <p className="text-white/70 text-sm mt-4">
              Enter your PIN to unlock
            </p>
          </div>

          {/* PIN Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                {showPin ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {isAccountLocked && (
              <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 mb-4">
                <p className="text-orange-200 text-sm text-center font-semibold">
                  Account Locked
                </p>
                {lockedUntil && (
                  <p className="text-orange-200/80 text-xs text-center mt-1">
                    Locked until: {new Date(lockedUntil).toLocaleString()}
                  </p>
                )}
                <p className="text-orange-200/80 text-xs text-center mt-1">
                  Please contact support or try again later.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
                {attemptsRemaining !== undefined && attemptsRemaining > 0 && !isAccountLocked && (
                  <p className="text-red-200/80 text-xs text-center mt-1">
                    {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining before account lock
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || pin.length < 4 || isAccountLocked}
              className="w-full py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {isLoading ? 'Unlocking...' : isAccountLocked ? 'Account Locked' : 'Unlock'}
            </button>
          </form>

          {/* PIN Hint */}
          <p className="text-white/50 text-xs text-center mt-6">
            PIN must be 4-6 digits
          </p>
        </div>

        {/* Time Display */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

