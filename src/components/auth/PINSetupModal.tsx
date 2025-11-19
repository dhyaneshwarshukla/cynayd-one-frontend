"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, X } from 'lucide-react';

interface PINSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isUpdate?: boolean; // If true, it's updating existing PIN
}

export function PINSetupModal({ isOpen, onClose, onSuccess, isUpdate = false }: PINSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const confirmPinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [isOpen]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, isConfirm = false) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      if (isConfirm) {
        setConfirmPin(value);
      } else {
        setPin(value);
        // Auto-focus confirm field when PIN is 4+ digits
        if (value.length >= 4 && confirmPinInputRef.current) {
          confirmPinInputRef.current.focus();
        }
      }
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pin.length > 6) {
      setError('PIN must be at most 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { apiClient } = await import('../../lib/api-client');
      
      if (isUpdate) {
        await apiClient.updatePIN(pin);
      } else {
        await apiClient.setupPIN(pin);
      }

      // Reset form
      setPin('');
      setConfirmPin('');
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to set PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isUpdate ? 'Update PIN' : 'Set Up PIN'}
              </h2>
              <p className="text-sm text-gray-500">
                {isUpdate ? 'Change your portal lock PIN' : 'Create a PIN to unlock your portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isUpdate ? 'New PIN' : 'PIN'} (4-6 digits)
            </label>
            <div className="relative">
              <input
                ref={pinInputRef}
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinChange(e, false)}
                placeholder="Enter PIN"
                maxLength={6}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPin ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <input
                ref={confirmPinInputRef}
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => handlePinChange(e, true)}
                placeholder="Confirm PIN"
                maxLength={6}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPin ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Your PIN will be used to unlock the portal after 5 minutes of inactivity. 
              Make sure to remember it or you'll need to login again.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || pin.length < 4 || pin !== confirmPin}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting...' : isUpdate ? 'Update PIN' : 'Set PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

