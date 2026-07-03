'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requiredEnrollment?: boolean;
}

type MFAMethod = 'cynayd' | 'external' | 'email' | 'both';
type SetupStep = 'setup' | 'waiting' | 'verify' | 'success';

interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl?: string;
  backupCodes: string[];
}

interface EnrollmentState {
  sessionId: string;
  expiresAt: string;
  deepLink: string;
  push: { sent: boolean; reason?: string };
}

export function MFASetupModal({
  isOpen,
  onClose,
  onSuccess,
  requiredEnrollment = false,
}: MFASetupModalProps) {
  const [step, setStep] = useState<SetupStep>('setup');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<MFAMethod>('cynayd');
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen && step === 'setup' && selectedMethod !== 'email') {
      generateMFASetup();
    }
    return () => stopPolling();
  }, [isOpen, step, selectedMethod, stopPolling]);

  const generateMFASetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.setupMFA();
      setSetupData(data);
      setBackupCodes(data.backupCodes);
    } catch (err: any) {
      setError(err.message || 'Failed to generate MFA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollmentPolling = useCallback(
    (sessionId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiClient.getMfaDeviceEnrollmentStatus(sessionId);
          if (status.status === 'completed') {
            stopPolling();
            if (selectedMethod === 'both') {
              await apiClient.enableEmailMFA();
            }
            setStep('success');
          } else if (status.status === 'cancelled') {
            stopPolling();
            setError('MFA setup was cancelled. Start again or use another method.');
            setStep('setup');
            setEnrollment(null);
          } else if (status.status === 'expired') {
            stopPolling();
            setWaitingMessage('This request expired. Start again or use another authenticator app.');
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
    },
    [selectedMethod, stopPolling]
  );

  const startCynaydEnrollment = async () => {
    if (!setupData?.backupCodes?.length) return;
    try {
      setIsLoading(true);
      setError(null);
      setWaitingMessage(null);
      const result = await apiClient.startMfaDeviceEnrollment(setupData.backupCodes);
      setEnrollment({
        sessionId: result.sessionId,
        expiresAt: result.expiresAt,
        deepLink: result.deepLink,
        push: result.push,
      });
      setStep('waiting');
      startEnrollmentPolling(result.sessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to start Cynayd Auth enrollment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPush = async () => {
    if (!enrollment) return;
    try {
      setIsLoading(true);
      const result = await apiClient.retryMfaDeviceEnrollmentPush(enrollment.sessionId);
      setEnrollment({ ...enrollment, push: result.push });
      if (!result.push.sent && result.push.reason === 'RETRY_LIMIT_REACHED') {
        setWaitingMessage('Retry limit reached. Open the Cynayd app manually.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retry notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEnrollment = async () => {
    stopPolling();
    if (enrollment) {
      try {
        await apiClient.cancelMfaDeviceEnrollment(enrollment.sessionId);
      } catch {
        /* best effort */
      }
    }
    setEnrollment(null);
    setStep('setup');
    setWaitingMessage(null);
  };

  const switchToExternal = async () => {
    stopPolling();
    if (enrollment) {
      try {
        await apiClient.cancelMfaDeviceEnrollment(enrollment.sessionId);
      } catch {
        /* best effort */
      }
    }
    setEnrollment(null);
    setWaitingMessage(null);
    setSelectedMethod('external');
    setStep('setup');
    setError(null);
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
        await apiClient.enableMFA(verificationCode, setupData?.backupCodes);
        if (selectedMethod === 'both') {
          await apiClient.enableEmailMFA();
        }
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

  const enableEmailOnly = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.enableEmailMFA();
      setBackupCodes([]);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to enable email MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    stopPolling();
    setStep('setup');
    setVerificationCode('');
    setError(null);
    setSetupData(null);
    setBackupCodes([]);
    setEnrollment(null);
    setWaitingMessage(null);
    setSelectedMethod('cynayd');
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  const renderBackupCodes = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-medium text-red-800 mb-2">Save your backup codes</h4>
      <p className="text-sm text-red-700 mb-3">
        Store these in a safe place. You will not be able to see them again.
      </p>
      <div className="bg-white p-3 rounded border mb-3">
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {(setupData?.backupCodes ?? backupCodes).map((code, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded border text-center font-bold">
              {code}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          const codes = setupData?.backupCodes ?? backupCodes;
          navigator.clipboard.writeText(codes.join('\n'));
          alert('Backup codes copied to clipboard!');
        }}
        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded"
      >
        Copy all codes
      </button>
    </div>
  );

  if (!isOpen) return null;

  const deepLinkQrUrl = enrollment
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrollment.deepLink)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'setup' &&
                (requiredEnrollment ? 'MFA required — set up now' : 'Setup Multi-Factor Authentication')}
              {step === 'waiting' && 'Waiting for your phone'}
              {step === 'verify' && 'Verify Setup'}
              {step === 'success' && 'MFA Enabled Successfully'}
            </h2>
            {!requiredEnrollment && (
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" type="button">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-900 mb-2">Choose MFA method</p>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="mfa-method"
                      checked={selectedMethod === 'cynayd'}
                      onChange={() => setSelectedMethod('cynayd')}
                    />
                    Cynayd Auth (recommended)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="mfa-method"
                      checked={selectedMethod === 'external'}
                      onChange={() => setSelectedMethod('external')}
                    />
                    Other authenticator app
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="mfa-method"
                      checked={selectedMethod === 'email'}
                      onChange={() => setSelectedMethod('email')}
                    />
                    Email OTP
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="mfa-method"
                      checked={selectedMethod === 'both'}
                      onChange={() => setSelectedMethod('both')}
                    />
                    Both (Cynayd Auth + Email OTP)
                  </label>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : selectedMethod === 'email' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Email OTP will be enabled as your MFA method.
                  </p>
                  <Button onClick={enableEmailOnly} className="w-full">
                    Enable Email MFA
                  </Button>
                </div>
              ) : setupData ? (
                <>
                  {selectedMethod === 'cynayd' || selectedMethod === 'both' ? (
                    <>
                      <p className="text-sm text-gray-600">
                        Cynayd will generate verification codes on your phone. No third-party app needed.
                      </p>
                      {renderBackupCodes()}
                      <Button onClick={startCynaydEnrollment} className="w-full" disabled={isLoading}>
                        Continue with Cynayd Auth
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 font-medium mb-1">Use a third-party app</p>
                        <p className="text-xs text-blue-700">
                          Google Authenticator, Authy, or Microsoft Authenticator
                        </p>
                      </div>
                      {renderBackupCodes()}
                      <div className="flex justify-center mb-4">
                        <img
                          src={setupData.qrCodeUrl}
                          alt="QR Code for MFA setup"
                          className="border border-gray-200 rounded-lg shadow-sm"
                          style={{ width: '200px', height: '200px' }}
                        />
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-yellow-900 mb-1">Manual entry:</p>
                        <code className="text-xs font-mono break-all">{setupData.secret}</code>
                      </div>
                      <Button onClick={() => setStep('verify')} className="w-full">
                        I&apos;ve added the account
                      </Button>
                    </>
                  )}
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

          {step === 'waiting' && enrollment && (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <LoadingSpinner size="lg" />
              </div>
              <p className="text-sm text-gray-700 text-center">
                We sent a request to your Cynayd app. Complete setup on your phone to continue.
              </p>

              {enrollment.push.sent === false && enrollment.push.reason === 'NO_ACTIVE_PUSH_TOKEN' && (
                <Alert variant="warning">
                  We could not send a push notification. Open the Cynayd app while signed in and go to
                  Security → Pending MFA Setup.
                </Alert>
              )}

              {waitingMessage && <Alert variant="warning">{waitingMessage}</Alert>}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                <p className="font-medium">If you did not receive it:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Open the Cynayd app</li>
                  <li>Go to Security</li>
                  <li>Tap Pending MFA Setup</li>
                  <li>Tap Enable on this device</li>
                </ol>
                <p className="text-xs pt-2">Or scan this QR with your phone:</p>
              </div>

              {deepLinkQrUrl && (
                <div className="flex justify-center">
                  <img
                    src={deepLinkQrUrl}
                    alt="Deep link QR for Cynayd app"
                    className="border border-gray-200 rounded-lg"
                    width={200}
                    height={200}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={handleRetryPush} variant="outline" disabled={isLoading}>
                  Retry notification
                </Button>
                <Button onClick={switchToExternal} variant="outline">
                  Use other authenticator app
                </Button>
                <Button onClick={handleCancelEnrollment} variant="outline">
                  Cancel setup
                </Button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app.
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-center text-lg font-mono tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <div className="flex space-x-3">
                <Button onClick={() => setStep('setup')} variant="outline" className="flex-1">
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
              <p className="text-sm text-gray-600 text-center">
                Your account is now protected with multi-factor authentication.
              </p>
              {backupCodes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-2">Reminder: save your backup codes if you have not already.</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-center">
                        {code}
                      </div>
                    ))}
                  </div>
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
