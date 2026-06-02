"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import { MFAVerificationModal } from './MFAVerificationModal';
import type { AuthResponse } from '../../lib/api-client';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [error, setError] = useState<string | null>(() => {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      const storedError = sessionStorage.getItem('login_error');
      if (storedError) {
        sessionStorage.removeItem('login_error');
        return storedError;
      }
    }
    return null;
  });
  const errorRef = useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendOption, setShowResendOption] = useState(() => {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('show_resend_option') === 'true';
    }
    return false;
  });
  const [showUnlockOption, setShowUnlockOption] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('resend_user_email');
      if (storedEmail) {
        return storedEmail;
      }
    }
    return '';
  });
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);
  const { isLoading, resendVerification, setUserDirectly, triggerLoginSuccess } = useAuth();
  const router = useRouter();
  const formLoadedAtRef = useRef(Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkBusy, setMagicLinkBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'email_otp' | 'awaiting_approval'>('email');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeNonce, setChallengeNonce] = useState<string | null>(null);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [pendingRememberMe, setPendingRememberMe] = useState(false);
  const [approvalContext, setApprovalContext] = useState<Record<string, unknown> | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Sync ref with state
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const completeLoginRedirect = async () => {
    const { apiClient } = await import('../../lib/api-client');
    const fullUser = await apiClient.getCurrentUser();
    setUserDirectly(fullUser);
    triggerLoginSuccess();
    router.push('/dashboard');
  };

  const handleLoginPasswordResult = async (
    result: AuthResponse,
    password: string,
    rememberMe: boolean,
    email: string
  ) => {
    if (result.code === 'APPROVAL_REQUIRED' || result.code === 'APPROVAL_EMAIL_OTP_REQUIRED') {
      setPendingPassword(password);
      setPendingRememberMe(rememberMe);
      setPendingEmail(email);
      setApprovalContext((result as AuthResponse & { requestContext?: Record<string, unknown> }).requestContext ?? null);
      setApprovalMessage(
        result.code === 'APPROVAL_EMAIL_OTP_REQUIRED'
          ? 'Check your email for an approval code, or approve from your mobile app.'
          : 'Approve this sign-in from your CYNAYD mobile app.'
      );
      if (result.code === 'APPROVAL_EMAIL_OTP_REQUIRED') {
        setLoginStep('email_otp');
      } else {
        setLoginStep('awaiting_approval');
      }
      return;
    }

    if (result.user && result.accessToken) {
      await completeLoginRedirect();
    }
  };

  const startApprovalPolling = (id: string, nonce: string, rememberMe: boolean) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(async () => {
      try {
        const { apiClient } = await import('../../lib/api-client');
        const status = await apiClient.getLoginChallengeStatus(id, nonce, rememberMe);
        if (status.status === 'approved' && status.accessToken) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          await completeLoginRedirect();
        } else if (status.status === 'cancelled' || status.status === 'expired') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setError(
            status.status === 'cancelled'
              ? 'Login approval was rejected.'
              : 'Login approval expired. Please try again.'
          );
          setLoginStep('password');
        }
      } catch {
        // Keep polling during in-progress login
      }
    }, 2000);
  };

  useEffect(() => {
    if (loginStep === 'awaiting_approval' && challengeId && challengeNonce) {
      startApprovalPolling(challengeId, challengeNonce, pendingRememberMe);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [loginStep, challengeId, challengeNonce, pendingRememberMe]);

  const onSubmit = async (data: LoginFormData, e?: React.BaseSyntheticEvent) => {
    // Explicitly prevent default form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      errorRef.current = null;
      // Clear from sessionStorage too
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('login_error');
        sessionStorage.removeItem('show_resend_option');
        sessionStorage.removeItem('resend_user_email');
      }
      setError(null);
      setResendMessage(null);
      setShowResendOption(false);
      setIsSubmitting(true);
      
      // Normalize email: trim and convert to lowercase for case-insensitive login
      const normalizedEmail = data.email.trim().toLowerCase();
      
      const { apiClient } = await import('../../lib/api-client');
      if (loginStep === 'email') {
        const start = await apiClient.loginStart(normalizedEmail);
        if (!start.challengeId || !start.nonce) {
          throw new Error('Password challenge unavailable. Please retry.');
        }
        setLoginStep('password');
        setChallengeId(start.challengeId);
        setChallengeNonce(start.nonce);
        setError(null);
        return;
      }

      if (loginStep === 'password') {
        if (!data.password) {
          setError('Password is required');
          return;
        }
        if (challengeId && challengeNonce) {
          try {
            const result = await apiClient.loginPassword({
              challengeId,
              nonce: challengeNonce,
              password: data.password,
              rememberMe: data.rememberMe,
            });
            await handleLoginPasswordResult(
              result,
              data.password,
              Boolean(data.rememberMe),
              normalizedEmail
            );
          } catch (err: unknown) {
            const apiErr = err as {
              response?: { data?: { code?: string; message?: string; userId?: string; email?: string } };
              message?: string;
            };
            if (apiErr.response?.data?.code === 'MFA_REQUIRED') {
              setPendingEmail(normalizedEmail);
              setPendingPassword(data.password);
              setPendingRememberMe(Boolean(data.rememberMe));
              setMfaUserId(apiErr.response.data.userId || null);
              setShowMfaModal(true);
              return;
            }
            throw err;
          }
          return;
        }
        setError('Password challenge expired. Start again from email step.');
        setLoginStep('email');
        return;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Extract error message from response data first, then fallback to error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to login';
      
      // Always set error message to display it
      errorRef.current = errorMessage; // Set ref first
      
      // Store in sessionStorage to persist across remounts
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('login_error', errorMessage);
      }
      
      setError(errorMessage);
      
      // Force a re-render by using setTimeout to ensure state update
      setTimeout(() => {
        if (errorRef.current && !error) {
          setError(errorRef.current);
        }
      }, 0);
      
      // Check if it's an account locked error FIRST (before setting generic error)
      if (err.response?.data?.code === 'ACCOUNT_LOCKED' || errorMessage.toLowerCase().includes('account is locked') || errorMessage.toLowerCase().includes('locked until')) {
        const lockedUntil = err.response?.data?.lockedUntil;
        const userEmail = err.response?.data?.userEmail || data.email;
        const lockMessage = lockedUntil 
          ? `Account is locked until ${new Date(lockedUntil).toLocaleString()}.`
          : errorMessage.includes('locked') ? errorMessage : 'Account is locked.';
        setError(lockMessage);
        // Always show unlock option if account is locked
        setShowUnlockOption(true);
        setUserEmail(userEmail);
        setIsSubmitting(false);
        return;
      }

      // Check if it's an invalid credentials error with attempt count
      if (err.response?.data?.code === 'INVALID_CREDENTIALS') {
        const attemptsRemaining = err.response.data.attemptsRemaining;
        const errorMsg = err.response.data.message || errorMessage;
        setError(errorMsg);
        // Show warning if attempts are low
        if (attemptsRemaining <= 3 && attemptsRemaining > 0) {
          console.warn(`⚠️ Only ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before account lock`);
        }
        setIsSubmitting(false);
        return;
      }

      // Check if it's an email verification error
      if (errorMessage.includes('verify your email') || errorMessage.includes('EMAIL_NOT_VERIFIED') || errorMessage.toLowerCase().includes('email verification')) {
        setShowResendOption(true);
        setUserEmail(data.email);
        // Store in sessionStorage to persist across remounts
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('show_resend_option', 'true');
          sessionStorage.setItem('resend_user_email', data.email);
        }
      }
    } finally {
      // Ensure submitting state is always reset
      setIsSubmitting(false);
    }
  };

  const handleVerifyFallbackOtp = async (rememberMe?: boolean) => {
    if (!challengeId || !challengeNonce || !otpCode.trim()) return;
    setIsSubmitting(true);
    try {
      const { apiClient } = await import('../../lib/api-client');
      const response = await apiClient.verifyChallengeEmailOtp({
        challengeId,
        nonce: challengeNonce,
        otp: otpCode.trim(),
        rememberMe,
      });
      if (response.accessToken && response.user) {
        await completeLoginRedirect();
      } else if (
        response.code === 'APPROVAL_REQUIRED' ||
        response.code === 'APPROVAL_EMAIL_OTP_REQUIRED'
      ) {
        await handleLoginPasswordResult(
          response as AuthResponse,
          pendingPassword,
          Boolean(rememberMe),
          pendingEmail
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestApprovalEmailOtp = async () => {
    if (!challengeId || !challengeNonce) return;
    setIsSubmitting(true);
    try {
      const { apiClient } = await import('../../lib/api-client');
      await apiClient.requestChallengeEmailOtp(challengeId, challengeNonce);
      setApprovalMessage('Approval code sent to your email.');
      setLoginStep('email_otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send approval code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setResendMessage(null);
      await resendVerification(userEmail);
      setResendMessage('Verification email sent successfully! Please check your inbox.');
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleRequestUnlockEmail = async () => {
    try {
      setIsRequestingUnlock(true);
      setUnlockMessage(null);
      const apiClient = (await import('../../lib/api-client')).apiClient;
      await apiClient.requestUnlockEmail(userEmail);
      setUnlockMessage('Unlock email sent successfully! Please check your inbox and click the unlock link.');
      setShowUnlockOption(false);
    } catch (err) {
      setUnlockMessage(err instanceof Error ? err.message : 'Failed to send unlock email');
    } finally {
      setIsRequestingUnlock(false);
    }
  };

  const handleMagicLink = async () => {
    const email = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim();
    if (!email) {
      setError('Enter your email to receive a magic link.');
      return;
    }
    setMagicLinkBusy(true);
    setMagicLinkSent(false);
    try {
      const { apiClient } = await import('../../lib/api-client');
      await apiClient.requestMagicLink(email.toLowerCase());
      setMagicLinkSent(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setMagicLinkBusy(false);
    }
  };

  const handlePasskeyLogin = async () => {
    const email = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim().toLowerCase();
    if (!email) {
      setError('Enter your email before using a passkey.');
      return;
    }
    if (!window.PublicKeyCredential) {
      setError('Passkeys are not supported in this browser.');
      return;
    }
    setPasskeyBusy(true);
    try {
      const { apiClient } = await import('../../lib/api-client');
      const { authenticateWithPasskey } = await import('../../lib/webauthn');
      const options = await apiClient.webauthnAuthenticateStart(email);
      const assertion = await authenticateWithPasskey(options);
      const response = await apiClient.webauthnAuthenticateFinish(assertion);
      if (response.accessToken) {
        apiClient.storeAuthToken(response.accessToken);
        const fullUser = await apiClient.getCurrentUser();
        setUserDirectly(fullUser);
        triggerLoginSuccess();
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey sign-in failed');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        {/* Security Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full security-badge">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Secure Connection</span>
          </div>
        </div>
        
        {(() => {
          // Use ref and sessionStorage as fallback if state is null
          let displayError = error || errorRef.current;
          
          // Check sessionStorage as last resort
          if (!displayError && typeof window !== 'undefined') {
            const storedError = sessionStorage.getItem('login_error');
            if (storedError) {
              displayError = storedError;
              errorRef.current = storedError;
              // Restore state
              if (!error) {
                setError(storedError);
              }
              // Check if this is an email verification error and restore resend option
              if ((storedError.includes('verify your email') || storedError.includes('EMAIL_NOT_VERIFIED') || storedError.toLowerCase().includes('email verification')) && !showResendOption) {
                setShowResendOption(true);
                const storedEmail = sessionStorage.getItem('resend_user_email');
                if (storedEmail) {
                  setUserEmail(storedEmail);
                }
              }
            }
          }
          
          if (displayError) {
            return (
              <Alert variant="error" className="mb-6 border-red-200 bg-red-50">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span>{displayError}</span>
                </div>
              </Alert>
            );
          }
          
          return null;
        })()}

        {showResendOption && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Email Verification Required
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Please verify your email address before logging in. Check your inbox for the verification email.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnlockOption && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800 mb-2">
                  Account Locked
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  Your account has been locked. Click the button below to receive an unlock link via email.
                </p>
                <button
                  type="button"
                  onClick={handleRequestUnlockEmail}
                  disabled={isRequestingUnlock}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRequestingUnlock ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-orange-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Unlock Email
                    </>
                  )}
                </button>
                {unlockMessage && (
                  <p className={`text-sm mt-2 ${unlockMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {unlockMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {resendMessage && (
          <Alert variant={resendMessage.includes('successfully') ? 'success' : 'error'} className="mb-6">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${resendMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {resendMessage}
            </div>
          </Alert>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }} 
          className="space-y-6"
        >
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="absolute opacity-0 h-0 w-0 pointer-events-none"
            aria-hidden
          />
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent enterprise-input placeholder:text-gray-500 text-gray-900 ${
                  errors.email 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                } ${isFormLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ color: '#111827 !important' }}
                placeholder="Enter your email address"
                disabled={isFormLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          {loginStep === 'password' && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent enterprise-input placeholder:text-gray-500 text-gray-900 ${
                  errors.password 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                } ${isFormLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ color: '#111827 !important' }}
                placeholder="Enter your password"
                disabled={isFormLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.password.message}
              </p>
            )}
          </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isFormLoading}
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {loginStep === 'email_otp' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email OTP</label>
              <Input
                value={otpCode}
                onChange={(e) => setOtpCode((e.target as HTMLInputElement).value)}
                placeholder="Enter OTP"
              />
              <Button
                type="button"
                className="w-full"
                onClick={() => handleVerifyFallbackOtp(Boolean((document.querySelector('input[type="checkbox"]') as HTMLInputElement)?.checked))}
                disabled={isFormLoading}
              >
                Verify OTP
              </Button>
            </div>
          )}

          {loginStep === 'awaiting_approval' && (
            <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-medium text-violet-900">
                {approvalMessage || 'Waiting for mobile approval…'}
              </p>
              {approvalContext?.ipAddress ? (
                <p className="text-xs text-violet-800">
                  Sign-in attempt from {String(approvalContext.ipAddress)}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleRequestApprovalEmailOtp}
                disabled={isFormLoading}
              >
                Send email code instead
              </Button>
            </div>
          )}

          {/* Submit Button */}
          {(loginStep === 'email' || loginStep === 'password') && (
          <Button
            type="submit"
            className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-lg enterprise-button"
            disabled={isFormLoading}
            loading={isFormLoading}
          >
            {isFormLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Sign in to your account
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
          </Button>
          )}
        </form>

        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkBusy || isFormLoading}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
          >
            {magicLinkBusy ? 'Sending…' : 'Email me a magic link'}
          </button>
          {magicLinkSent && (
            <p className="text-sm text-green-700">Check your inbox for a sign-in link.</p>
          )}
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={passkeyBusy || isFormLoading}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
          >
            {passkeyBusy ? 'Waiting for passkey…' : 'Sign in with passkey'}
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/auth/register"
              className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
            >
              Create one now
            </a>
          </p>
        </div>

        <LegalFooterLinks className="mt-6 pt-6 border-t border-gray-100" />
      </Card>

      <MFAVerificationModal
        isOpen={showMfaModal}
        onClose={() => setShowMfaModal(false)}
        userId={mfaUserId || ''}
        email={pendingEmail}
        mode="challenge"
        onChallengeVerify={async (mfaToken) => {
          if (!challengeId || !challengeNonce) {
            throw new Error('Login session expired. Please start again.');
          }
          const { apiClient } = await import('../../lib/api-client');
          return apiClient.loginPassword({
            challengeId,
            nonce: challengeNonce,
            password: pendingPassword,
            rememberMe: pendingRememberMe,
            mfaToken,
          });
        }}
        onSuccess={async (result) => {
          setShowMfaModal(false);
          await handleLoginPasswordResult(
            result,
            pendingPassword,
            pendingRememberMe,
            pendingEmail
          );
        }}
      />
    </div>
  );
}; 