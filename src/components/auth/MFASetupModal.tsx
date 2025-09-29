'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function MFASetupModal({ isOpen, onClose, onSuccess }: MFASetupModalProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && step === 'setup') {
      generateMFASetup();
    }
  }, [isOpen, step]);

  const generateMFASetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await apiClient.setupMFA();
      setSetupData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate MFA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.verifyMFASetup(verificationCode);

      if (response.verified) {
        // Enable MFA
        await apiClient.enableMFA(verificationCode, setupData?.backupCodes);

        setBackupCodes(setupData?.backupCodes || []);
        setStep('success');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setVerificationCode('');
    setError(null);
    setSetupData(null);
    setBackupCodes([]);
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'setup' && 'Setup Multi-Factor Authentication'}
              {step === 'verify' && 'Verify Setup'}
              {step === 'success' && 'MFA Enabled Successfully'}
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

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : setupData ? (
                <>
                  <div className="text-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">📱 Step 1: Install Authenticator App</h3>
                      <p className="text-xs text-blue-700 mb-2">
                        Download one of these apps on your phone:
                      </p>
                      <div className="flex justify-center space-x-4 text-xs text-blue-600">
                        <span>• Google Authenticator</span>
                        <span>• Authy</span>
                        <span>• Microsoft Authenticator</span>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-2">📷 Step 2: Scan QR Code</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Open your authenticator app and scan this QR code:
                    </p>
                    <div className="flex justify-center mb-4">
                      <img 
                        src={setupData.qrCodeUrl} 
                        alt="QR Code for MFA setup"
                        className="border border-gray-200 rounded-lg shadow-sm"
                        style={{ width: '200px', height: '200px' }}
                      />
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <h4 className="text-xs font-medium text-yellow-900 mb-1">Can't scan? Enter manually:</h4>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <code className="text-xs font-mono text-gray-700 break-all flex-1 mr-2">
                          {setupData.secret}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(setupData.secret)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setStep('verify')}
                    className="w-full"
                  >
                    I've Added the Account
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Failed to generate MFA setup</p>
                  <Button onClick={generateMFASetup} className="mt-4">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-green-900 mb-2">🔐 Step 3: Verify Setup</h3>
                <p className="text-xs text-green-700">
                  Open your authenticator app and enter the 6-digit code it shows for this account.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code:
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The code refreshes every 30 seconds
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setStep('setup')}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={verifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Verify & Enable'}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  MFA Enabled Successfully!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your account is now protected with multi-factor authentication.
                </p>
              </div>

              {backupCodes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center">
                    🚨 Save Your Backup Codes
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    <strong>Important:</strong> These codes can be used to access your account if you lose your authenticator device. 
                    Store them in a safe place - you won't be able to see them again!
                  </p>
                  <div className="bg-white p-3 rounded border mb-3">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded border text-center font-bold">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const codesText = backupCodes.join('\n');
                      navigator.clipboard.writeText(codesText);
                      alert('Backup codes copied to clipboard!');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded"
                  >
                    📋 Copy All Codes to Clipboard
                  </button>
                </div>
              )}

              <Button onClick={handleSuccess} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
