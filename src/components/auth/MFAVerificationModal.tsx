'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient, type AuthResponse } from '../../lib/api-client';

interface MFAVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (response: AuthResponse) => void;
  userId: string;
  email: string;
  password?: string;
  attemptId?: string;
  attemptNonce?: string;
  mfaMethods?: string[];
  emailOtpSent?: boolean;
  mode?: 'legacy' | 'challenge' | 'passkey' | 'magic_link';
  passkeyMfaAllowed?: boolean;
  rememberMe?: boolean;
  onChallengeVerify?: (mfaToken: string) => Promise<AuthResponse>;
}

export function MFAVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  email,
  password,
  attemptId,
  attemptNonce,
  mfaMethods = ['totp'],
  emailOtpSent = false,
  mode = 'legacy',
  passkeyMfaAllowed = false,
  rememberMe = false,
  onChallengeVerify,
}: MFAVerificationModalProps) {
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const emailMfaAvailable = mfaMethods.includes('email');
  const totpAvailable = mfaMethods.includes('totp');

  useEffect(() => {
    if (isOpen) {
      setEmailCodeSent(emailOtpSent);
    }
  }, [isOpen, emailOtpSent]);

  const getVerificationMessage = (): React.ReactNode => {
    const otpSent = emailOtpSent || emailCodeSent;

    if (totpAvailable && emailMfaAvailable) {
      if (otpSent) {
        return (
          <>
            Enter the 6-digit code from your <strong>Cynayd app</strong> or authenticator app, or the code sent to{' '}
            <strong>{email}</strong>
          </>
        );
      }
      return (
        <>
          Enter the 6-digit code from your <strong>Cynayd app</strong> or authenticator app, or send a code to{' '}
          <strong>{email}</strong>
        </>
      );
    }

    if (emailMfaAvailable) {
      if (otpSent) {
        return (
          <>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </>
        );
      }
      return (
        <>
          A verification code will be sent to <strong>{email}</strong> — click &quot;Send code to email&quot;
        </>
      );
    }

    return (
      <>
        Enter the 6-digit code from your Cynayd app or authenticator app for <strong>{email}</strong>
      </>
    );
  };

  const completeLogin = async (mfaToken: string) => {
    if (mode === 'magic_link' && attemptId && attemptNonce) {
      return apiClient.completeMagicLinkLogin({
        challengeId: attemptId,
        nonce: attemptNonce,
        mfaToken,
      });
    }
    if (mode === 'passkey' && attemptId && attemptNonce) {
      return apiClient.webauthnAuthenticateFinish({
        challengeId: attemptId,
        nonce: attemptNonce,
        mfaToken,
      });
    }
    if (mode === 'challenge' && onChallengeVerify) {
      return onChallengeVerify(mfaToken);
    }
    if (!password) {
      throw new Error('Password is required for login');
    }
    return apiClient.login({
      email,
      password,
      mfaToken,
    });
  };

  const handleSendEmailCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (attemptId && attemptNonce) {
        await apiClient.sendMfaEmailCode({ attemptId, nonce: attemptNonce });
      } else {
        await apiClient.sendMfaEmailCode({ userId });
      }
      setEmailCodeSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send email code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessResponse = (response: AuthResponse) => {
    if (response.accessToken && response.refreshToken && response.user) {
      onSuccess(response);
    } else if (
      response.code === 'APPROVAL_REQUIRED' ||
      response.code === 'APPROVAL_EMAIL_OTP_REQUIRED'
    ) {
      onSuccess(response);
    } else if (response.accessToken && response.user) {
      onSuccess(response);
    } else {
      setError('Invalid response from server');
    }
  };

  const handleVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await completeLogin(mfaCode);
      handleSuccessResponse(response);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
      if (apiErr.response?.data?.code === 'INVALID_MFA_CODE') {
        setError('Invalid MFA code. Please try again.');
      } else {
        setError(apiErr.response?.data?.message || apiErr.message || 'Failed to verify MFA code');
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
      const response = await completeLogin(mfaCode);
      handleSuccessResponse(response);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
      if (apiErr.response?.data?.code === 'INVALID_MFA_CODE') {
        setError('Invalid backup code. Please try again.');
      } else {
        setError(apiErr.response?.data?.message || apiErr.message || 'Failed to verify backup code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyMfa = async () => {
    if (!attemptId || !attemptNonce) {
      setError('Login session expired. Please start again.');
      return;
    }
    if (!window.PublicKeyCredential) {
      setError('Passkeys are not supported in this browser.');
      return;
    }
    try {
      setPasskeyBusy(true);
      setError(null);
      const { authenticateWithPasskey } = await import('../../lib/webauthn');
      const options = await apiClient.startMfaPasskey(attemptId, attemptNonce);
      const assertion = await authenticateWithPasskey(options);
      const response = await apiClient.finishMfaPasskeyVerifyLogin({
        attemptId,
        nonce: attemptNonce,
        response: assertion,
        rememberMe,
      });
      handleSuccessResponse(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Passkey verification failed');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const passkeyButtonLabel = (): string => {
    if (typeof window === 'undefined') return 'Use passkey instead';
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Use Windows Hello instead';
    if (ua.includes('mac')) return 'Use Touch ID / passkey instead';
    return 'Use passkey instead';
  };

  const handleClose = () => {
    setMfaCode('');
    setError(null);
    setEmailCodeSent(false);
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
              {getVerificationMessage()}
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
                disabled={isLoading || passkeyBusy || mfaCode.length !== 6}
                className="w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Verify Code'}
              </Button>

              {passkeyMfaAllowed && attemptId && attemptNonce ? (
                <Button
                  onClick={() => void handlePasskeyMfa()}
                  disabled={isLoading || passkeyBusy}
                  variant="outline"
                  className="w-full"
                >
                  {passkeyBusy ? <LoadingSpinner size="sm" /> : passkeyButtonLabel()}
                </Button>
              ) : null}

              {emailMfaAvailable && (
                <Button
                  onClick={handleSendEmailCode}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {emailCodeSent ? 'Email code sent' : 'Send code to email'}
                </Button>
              )}

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
