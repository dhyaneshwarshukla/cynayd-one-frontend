'use client';

import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';

interface MFAVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessToken: string, refreshToken: string, user: any) => void;
  userId: string;
  email: string;
  password: string;
}

export function MFAVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  email, 
  password 
}: MFAVerificationModalProps) {
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    console.log('=== MFA VERIFICATION START ===');
    console.log('MFA Code entered:', mfaCode);
    console.log('Email:', email);
    console.log('User ID:', userId);

    try {
      setIsLoading(true);
      setError(null);

      // Complete the login with MFA token
      console.log('MFA Verification - Making login request with MFA token');
      const response = await apiClient.login({
        email,
        password,
        mfaToken: mfaCode,
      });

      console.log('MFA Verification - Response received:', { 
        hasAccessToken: !!response.accessToken, 
        hasRefreshToken: !!response.refreshToken, 
        hasUser: !!response.user,
        response: response
      });

      if (response.accessToken && response.refreshToken) {
        console.log('MFA Verification - Calling onSuccess with user:', response.user);
        console.log('MFA Verification - onSuccess callback exists:', !!onSuccess);
        
        // Call onSuccess callback
        try {
          onSuccess(response.accessToken!, response.refreshToken!, response.user);
          console.log('MFA Verification - onSuccess callback completed');
        } catch (callbackError) {
          console.error('MFA Verification - Error in onSuccess callback:', callbackError);
          setError('Error completing login. Please try again.');
        }
      } else {
        console.log('MFA Verification - Invalid response from server:', response);
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.log('=== MFA VERIFICATION ERROR ===');
      console.log('MFA Verification - Error occurred:', err);
      console.log('MFA Verification - Error response:', err.response?.data);
      console.log('MFA Verification - Error message:', err.message);
      console.log('MFA Verification - Full error:', err);
      
      if (err.response?.data?.code === 'INVALID_MFA_CODE') {
        setError('Invalid MFA code. Please try again.');
      } else {
        setError(err.message || 'Failed to verify MFA code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCode = async () => {
    if (!mfaCode || mfaCode.length !== 8) {
      setError('Please enter a valid 8-character backup code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Complete the login with backup code
      const response = await apiClient.login({
        email,
        password,
        mfaToken: mfaCode,
      });

      if (response.accessToken && response.refreshToken) {
        console.log('MFA Verification (Backup) - Calling onSuccess with user:', response.user);
        try {
          onSuccess(response.accessToken!, response.refreshToken!, response.user);
          console.log('MFA Verification (Backup) - onSuccess callback completed');
        } catch (callbackError) {
          console.error('MFA Verification (Backup) - Error in onSuccess callback:', callbackError);
          setError('Error completing login. Please try again.');
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'INVALID_MFA_CODE') {
        setError('Invalid backup code. Please try again.');
      } else {
        setError(err.message || 'Failed to verify backup code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMfaCode('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Multi-Factor Authentication
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Enter Verification Code
            </h3>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app for <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="000000"
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={8}
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleVerify}
                disabled={isLoading || mfaCode.length !== 6}
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Verify Code'}
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-gray-500">or</span>
              </div>
              
              <Button 
                onClick={handleBackupCode}
                disabled={isLoading || mfaCode.length !== 8}
                variant="outline"
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Use Backup Code'}
              </Button>

            </div>

            <div className="text-center">
              <button
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
