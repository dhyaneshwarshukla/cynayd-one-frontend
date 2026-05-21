"use client";

import React, { useState, useEffect } from 'react';
import { PINSetupModal } from './PINSetupModal';
import apiClient from '../../lib/api-client';

interface NoPinLockOverlayProps {
  onPinEnabled: () => void;
  onLogout: () => void;
}

export function NoPinLockOverlay({ onPinEnabled, onLogout }: NoPinLockOverlayProps) {
  const [showPINSetup, setShowPINSetup] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await apiClient.getPINStatus();
        if (status.requiresPin || status.pinEnabled) {
          onPinEnabled();
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [onPinEnabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 rounded-full p-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Session Locked</h2>
          <p className="text-white/80 mb-2">
            Your session has been locked due to inactivity.
          </p>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6 mt-4">
            <p className="text-blue-200 text-sm font-medium mb-2">
              Set up a PIN to unlock without logging in again
            </p>
            <p className="text-blue-200/90 text-xs">
              Create a 4–6 digit PIN below. After that, you can unlock the portal with your PIN when it locks.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowPINSetup(true)}
              className="w-full py-3 bg-blue-500/80 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Set Up PIN
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>

      <PINSetupModal
        isOpen={showPINSetup}
        onClose={() => setShowPINSetup(false)}
        onSuccess={() => {
          setShowPINSetup(false);
          onPinEnabled();
        }}
      />
    </div>
  );
}
