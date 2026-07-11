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
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, X } from 'lucide-react';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import { MFAVerificationModal } from './MFAVerificationModal';
import { AwaitingApprovalPanel } from './AwaitingApprovalPanel';
import { AwaitingSecurityReviewPanel } from './AwaitingSecurityReviewPanel';
import {
  markMobileApprovalSetupPrompt,
  useLoginChallengePolling,
} from '../../hooks/useLoginChallengePolling';
import { useSecurityReviewPolling } from '../../hooks/useSecurityReviewPolling';
import type { AuthResponse } from '../../lib/api-client';
import {
  approvalMessageForHandling,
  getLoginErrorResponseBody,
  isSecurityReviewLoginBody,
  isTerminalLoginBlock,
  isUnfulfillableMfaChallenge,
  loginApprovalStepForHandling,
  loginFlowUserMessage,
  MFA_ENROLLMENT_REQUIRED_MESSAGE,
  parseLoginResponse,
  resolveLoginMfaMethods,
} from '../../lib/login-decision.adapter';
import {
  addRecentAccount,
  getAccountInitials,
  getRecentAccounts,
  removeRecentAccount,
  type RecentAccount,
} from '../../lib/recent-accounts';
import { formatInstantForDisplay } from '../../utils/datetime';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  rememberMe: z.coerce.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;
type PendingPrimaryMethod = 'password' | 'passkey' | 'magic_link';

function isEmailNotVerifiedError(err: unknown, errorMessage: string): boolean {
  const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
  const msg = errorMessage.toLowerCase();
  return (
    code === 'EMAIL_NOT_VERIFIED' ||
    msg.includes('email not verified') ||
    msg.includes('verify your email') ||
    msg.includes('email verification')
  );
}

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
  const [honeypot, setHoneypot] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkBusy, setMagicLinkBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [loginStep, setLoginStep] = useState<
    'email' | 'password' | 'email_otp' | 'awaiting_approval' | 'awaiting_security_review'
  >('email');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeNonce, setChallengeNonce] = useState<string | null>(null);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [mfaMethods, setMfaMethods] = useState<string[]>([]);
  const [mfaEmailOtpSent, setMfaEmailOtpSent] = useState(false);
  const [mfaModalMode, setMfaModalMode] = useState<'challenge' | 'passkey'>('challenge');
  const [mfaAttemptId, setMfaAttemptId] = useState<string | null>(null);
  const [mfaAttemptNonce, setMfaAttemptNonce] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [pendingRememberMe, setPendingRememberMe] = useState(false);
  const [pendingPrimaryMethod, setPendingPrimaryMethod] = useState<PendingPrimaryMethod>('password');
  const [approvalContext, setApprovalContext] = useState<Record<string, unknown> | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [approvalExpiresAt, setApprovalExpiresAt] = useState<string | null>(null);
  const [passkeyFallbackAllowed, setPasskeyFallbackAllowed] = useState(false);
  const [emailOtpFallbackAllowed, setEmailOtpFallbackAllowed] = useState(false);
  const [backupApprovalAllowed, setBackupApprovalAllowed] = useState(false);
  const [passkeyApprovalBusy, setPasskeyApprovalBusy] = useState(false);
  const [backupApprovalBusy, setBackupApprovalBusy] = useState(false);
  const [passkeyMfaAllowed, setPasskeyMfaAllowed] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pushDelivered, setPushDelivered] = useState<boolean | undefined>(undefined);
  const [approvalMatchCode, setApprovalMatchCode] = useState<string | null>(null);
  const [bootstrapNoDevices, setBootstrapNoDevices] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState('');
  const [securityReviewId, setSecurityReviewId] = useState<string | null>(null);
  const [securityReviewUserId, setSecurityReviewUserId] = useState<string | null>(null);
  const [securityChallengeSessionId, setSecurityChallengeSessionId] = useState<string | null>(null);
  const [securityReviewMessage, setSecurityReviewMessage] = useState<string | null>(null);
  const [securityRiskLevel, setSecurityRiskLevel] = useState<string | undefined>();
  const [securityRiskReasons, setSecurityRiskReasons] = useState<string[]>([]);

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Sync ref with state
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useSecurityReviewPolling({
    reviewId: securityReviewId,
    nonce: challengeNonce,
    loginAttemptId: challengeId,
    enabled: loginStep === 'awaiting_security_review',
    poll: async (id, nonce, loginAttemptId) => {
      const { apiClient } = await import('../../lib/api-client');
      return apiClient.getSecurityReviewStatus(id, nonce, loginAttemptId);
    },
    onApproved: async (status) => {
      const { apiClient } = await import('../../lib/api-client');
      const emailForFlow = pendingEmail || getActiveLoginEmail();
      try {
        const result = await apiClient.resumeSecurityReview({
          reviewId: securityReviewId!,
          userId: status.userId ?? securityReviewUserId!,
          resumeToken: status.resumeToken!,
          challengeSessionId: status.challengeSessionId ?? securityChallengeSessionId!,
          nonce: challengeNonce ?? undefined,
          rememberMe: pendingRememberMe,
        });
        if (result.accessToken) {
          apiClient.storeAuthToken(result.accessToken);
          await completeLoginRedirect();
          return;
        }
        await handleLoginPasswordResult(
          result as AuthResponse,
          pendingPassword,
          pendingRememberMe,
          emailForFlow
        );
      } catch (err) {
        const errData = getLoginErrorResponseBody(err);
        if (errData) {
          await handleLoginPasswordResult(
            errData as AuthResponse,
            pendingPassword,
            pendingRememberMe,
            emailForFlow
          );
          return;
        }
        setError(err instanceof Error ? err.message : 'Sign-in could not be completed after review.');
        setLoginStep('password');
      }
    },
    onTerminal: (status) => {
      setError(
        status.message ??
          (status.status === 'denied'
            ? 'This sign-in request was denied by your administrator.'
            : 'Security review expired. Please try again.')
      );
      setLoginStep('password');
    },
  });

  useLoginChallengePolling({
    challengeId,
    nonce: challengeNonce,
    rememberMe: pendingRememberMe,
    enabled: loginStep === 'awaiting_approval',
    poll: async (id, nonce, rememberMe) => {
      const { apiClient } = await import('../../lib/api-client');
      return apiClient.getLoginChallengeStatus(id, nonce, rememberMe);
    },
    onApproved: async () => {
      await completeLoginRedirect();
    },
    onTerminal: (status) => {
      setError(
        status.status === 'rejected' || status.status === 'cancelled'
          ? 'Login denied. The sign-in attempt was rejected.'
          : 'Login approval expired. Please try again.'
      );
      setLoginStep('password');
    },
  });

  useEffect(() => {
    const accounts = getRecentAccounts();
    setRecentAccounts(accounts);
    if (accounts.length > 0) {
      setShowAccountPicker(true);
    }
  }, []);

  const refreshRecentAccounts = () => {
    const accounts = getRecentAccounts();
    setRecentAccounts(accounts);
    return accounts;
  };

  const resetToEmailStep = (options?: { useAnotherAccount?: boolean }) => {
    setChallengeId(null);
    setChallengeNonce(null);
    setSelectedAccountEmail('');
    const accounts = refreshRecentAccounts();
    if (options?.useAnotherAccount) {
      setShowAccountPicker(false);
    } else {
      setShowAccountPicker(accounts.length > 0);
    }
    setLoginStep('email');
  };

  const hasActiveChallengeSession =
    Boolean(securityChallengeSessionId) ||
    showMfaModal ||
    loginStep === 'awaiting_security_review' ||
    loginStep === 'awaiting_approval';

  const getActiveLoginEmail = (): string => {
    const fromState = selectedAccountEmail || getValues('email')?.trim();
    if (fromState) return fromState.toLowerCase();
    const input = document.querySelector('input[name="email"]') as HTMLInputElement | null;
    return input?.value?.trim().toLowerCase() || '';
  };

  const beginLoginStart = async (normalizedEmail: string) => {
    const { apiClient } = await import('../../lib/api-client');
    const start = await apiClient.loginStart(normalizedEmail);
    if (!start.challengeId || !start.nonce) {
      throw new Error('Password challenge unavailable. Please retry.');
    }
    setLoginStep('password');
    setChallengeId(start.challengeId);
    setChallengeNonce(start.nonce);
    setSelectedAccountEmail(normalizedEmail);
    setShowAccountPicker(false);
    setError(null);
  };

  const completeLoginRedirect = async () => {
    const { apiClient } = await import('../../lib/api-client');
    const fullUser = await apiClient.getCurrentUser();
    addRecentAccount({ email: fullUser.email, name: fullUser.name });
    refreshRecentAccounts();
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
    const handling = parseLoginResponse(result);

    if (handling.kind === 'complete') {
      if (result.user && result.accessToken) {
        await completeLoginRedirect();
      }
      return;
    }

    if (handling.kind === 'blocked' || handling.kind === 'unknown') {
      setShowMfaModal(false);
      setLoginStep('password');
      const msg =
        isTerminalLoginBlock(result) || result.code === 'SECURITY_REVIEW_UNAVAILABLE'
          ? result.message ?? MFA_ENROLLMENT_REQUIRED_MESSAGE
          : loginFlowUserMessage(handling);
      setError(msg);
      return;
    }

    const { context, challenge } = handling;
    if (context.challengeId) setChallengeId(context.challengeId);
    if (context.nonce) setChallengeNonce(context.nonce);
    setPendingPassword(password);
    setPendingRememberMe(rememberMe);
    setPendingEmail(email);

    if (challenge === 'security_review') {
      if (context.reviewId) setSecurityReviewId(context.reviewId);
      if (context.userId) setSecurityReviewUserId(context.userId);
      if (context.challengeSessionId) setSecurityChallengeSessionId(context.challengeSessionId);
      setSecurityReviewMessage(context.message ?? null);
      setSecurityRiskLevel(context.riskLevel);
      setSecurityRiskReasons(context.riskReasons ?? []);
      setShowMfaModal(false);
      setMfaEmailOtpSent(false);
      setLoginStep('awaiting_security_review');
      errorRef.current = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('login_error');
      }
      setError(null);
      return;
    }

    if (challenge === 'mfa') {
      if (isUnfulfillableMfaChallenge(result)) {
        setShowMfaModal(false);
        setLoginStep('password');
        setError(
          result.message ??
            loginFlowUserMessage(parseLoginResponse(result)) ??
            MFA_ENROLLMENT_REQUIRED_MESSAGE
        );
        return;
      }
      setMfaUserId(context.userId ?? result.userId ?? null);
      setMfaMethods(resolveLoginMfaMethods(result, context.mfaMethods));
      setMfaEmailOtpSent(Boolean(context.emailOtpSent));
      setPasskeyMfaAllowed(Boolean(context.passkeyMfaAllowed));
      setMfaModalMode(pendingPrimaryMethod === 'passkey' ? 'passkey' : 'challenge');
      setMfaAttemptId(context.challengeId ?? challengeId);
      setMfaAttemptNonce(context.nonce ?? challengeNonce);
      setLoginStep('password');
      setShowMfaModal(true);
      setError(null);
      return;
    }

    setApprovalContext(context.requestContext ?? null);
    setApprovalExpiresAt(context.expiresAt ?? null);
    setPasskeyFallbackAllowed(context.passkeyFallbackAllowed === true);
    setEmailOtpFallbackAllowed(context.emailOtpFallbackAllowed === true);
    setBackupApprovalAllowed(context.backupApprovalAllowed === true);
    setPushDelivered(context.pushDelivered);
    setApprovalMatchCode(context.matchCode ?? null);
    setBootstrapNoDevices(context.bootstrapNoDevices === true);
    setApprovalMessage(approvalMessageForHandling(handling));
    const approvalStep = loginApprovalStepForHandling(handling);
    setLoginStep(approvalStep === 'email_otp' ? 'email_otp' : 'awaiting_approval');
    setError(null);
  };

  const applyApprovalError = (err: unknown) => {
    const apiErr = err as {
      response?: { data?: { code?: string; message?: string }; status?: number };
      message?: string;
    };
    const code = apiErr.response?.data?.code;
    const message =
      apiErr.response?.data?.message || apiErr.message || 'Sign-in could not be completed.';
    if (code === 'APPROVAL_UNAVAILABLE') {
      setError(
        'Mobile approval is required but no approval method is available. Install CYNAYD One Auth or contact your administrator.'
      );
      setLoginStep('password');
      return;
    }
    if (code === 'APPROVAL_CHALLENGE_REQUIRED') {
      setError('Mobile approval is required. Please start sign-in again.');
      resetToEmailStep();
      return;
    }
    setError(message);
  };

  const applyLoginStartError = (err: unknown, email: string) => {
    const apiErr = err as {
      response?: {
        data?: {
          code?: string;
          message?: string;
          lockedUntil?: string;
          userEmail?: string;
          attemptsRemaining?: number;
        };
      };
      message?: string;
    };
    const errorMessage =
      apiErr.response?.data?.message || (err instanceof Error ? err.message : '') || 'Failed to login';
    errorRef.current = errorMessage;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('login_error', errorMessage);
    }
    setError(errorMessage);

    if (
      apiErr.response?.data?.code === 'ACCOUNT_LOCKED' ||
      errorMessage.toLowerCase().includes('account is locked') ||
      errorMessage.toLowerCase().includes('locked until')
    ) {
      const lockedUntil = apiErr.response?.data?.lockedUntil;
      const lockMessage = lockedUntil
        ? `Account is locked until ${formatInstantForDisplay(lockedUntil)}.`
        : 'Account is locked due to too many failed attempts.';
      setError(lockMessage);
      setShowUnlockOption(true);
      setUserEmail(apiErr.response?.data?.userEmail || email);
      return;
    }

    if (isEmailNotVerifiedError(apiErr, errorMessage)) {
      setShowResendOption(true);
      setUserEmail(email);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('show_resend_option', 'true');
        sessionStorage.setItem('resend_user_email', email);
      }
    }
  };

  const selectAccount = async (account: RecentAccount) => {
    try {
      errorRef.current = null;
      setError(null);
      setIsSubmitting(true);
      setValue('email', account.email);
      await beginLoginStart(account.email);
    } catch (err) {
      console.error('Login start error:', err);
      applyLoginStartError(err, account.email);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseAnotherAccount = () => {
    resetToEmailStep({ useAnotherAccount: true });
    setValue('email', '');
    setError(null);
  };

  const handleChangeAccount = () => {
    resetToEmailStep();
    setError(null);
  };

  const handleRemoveRecentAccount = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentAccount(email);
    const accounts = refreshRecentAccounts();
    if (accounts.length === 0) {
      setShowAccountPicker(false);
    }
  };

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
      
      if (loginStep === 'email') {
        await beginLoginStart(normalizedEmail);
        return;
      }

      const { apiClient } = await import('../../lib/api-client');

      if (loginStep === 'password') {
        setPendingPrimaryMethod('password');
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
              response?: { data?: AuthResponse };
              message?: string;
            };
            const errData = apiErr.response?.data;
            const mfaHandling = errData ? parseLoginResponse(errData) : null;
            if (mfaHandling?.kind === 'challenge' && mfaHandling.challenge === 'mfa' && errData) {
              await handleLoginPasswordResult(
                errData,
                data.password,
                Boolean(data.rememberMe),
                normalizedEmail
              );
              return;
            }
            if (
              mfaHandling?.kind === 'challenge' &&
              mfaHandling.challenge === 'security_review' &&
              errData
            ) {
              await handleLoginPasswordResult(
                errData,
                data.password,
                Boolean(data.rememberMe),
                normalizedEmail
              );
              return;
            }
            if (isSecurityReviewLoginBody(errData)) {
              await handleLoginPasswordResult(
                errData!,
                data.password,
                Boolean(data.rememberMe),
                normalizedEmail
              );
              return;
            }
            throw err;
          }
          return;
        }
        setError('Password challenge expired. Start again from email step.');
        resetToEmailStep();
        return;
      }
    } catch (err: unknown) {
      if (
        (err as { response?: { data?: { code?: string } } })?.response?.data?.code ===
          'APPROVAL_UNAVAILABLE' ||
        (err as { response?: { data?: { code?: string } } })?.response?.data?.code ===
          'APPROVAL_CHALLENGE_REQUIRED'
      ) {
        applyApprovalError(err);
        setIsSubmitting(false);
        return;
      }
      const errAny = err as {
        response?: {
          data?: {
            code?: string;
            message?: string;
            lockedUntil?: string;
            userEmail?: string;
            attemptsRemaining?: number;
          };
        };
        message?: string;
      };
      const errorMessage = errAny.response?.data?.message || errAny.message || 'Failed to login';

      const errData = errAny.response?.data as AuthResponse | undefined;
      if (
        isSecurityReviewLoginBody(errData) &&
        (loginStep === 'password' || loginStep === 'email')
      ) {
        const emailForReview = (data.email ?? pendingEmail).trim().toLowerCase();
        await handleLoginPasswordResult(
          errData!,
          data.password ?? pendingPassword,
          Boolean(data.rememberMe ?? pendingRememberMe),
          emailForReview
        );
        return;
      }
      
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
      if (errAny.response?.data?.code === 'ACCOUNT_LOCKED' || errorMessage.toLowerCase().includes('account is locked') || errorMessage.toLowerCase().includes('locked until')) {
        const lockedUntil = errAny.response?.data?.lockedUntil;
        const userEmail = errAny.response?.data?.userEmail || data.email;
        const lockMessage = lockedUntil
          ? `Account is locked until ${formatInstantForDisplay(lockedUntil)}.`
          : 'Account is locked due to too many failed attempts.';
        setError(lockMessage);
        // Always show unlock option if account is locked
        setShowUnlockOption(true);
        setUserEmail(userEmail);
        setIsSubmitting(false);
        return;
      }

      // Check if it's an invalid credentials error with attempt count
      if (errAny.response?.data?.code === 'INVALID_CREDENTIALS') {
        const attemptsRemaining = errAny.response.data.attemptsRemaining;
        const errorMsg = errAny.response.data.message || errorMessage;
        setError(errorMsg);
        // Show warning if attempts are low
        if (attemptsRemaining <= 3 && attemptsRemaining > 0) {
          console.warn(`⚠️ Only ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before account lock`);
        }
        setIsSubmitting(false);
        return;
      }

      // Check if it's an email verification error
      if (isEmailNotVerifiedError(err, errorMessage)) {
        setShowResendOption(true);
        setUserEmail(data.email);
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
        if (bootstrapNoDevices) {
          markMobileApprovalSetupPrompt();
        }
        await completeLoginRedirect();
      } else {
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

  const handlePasskeyApprovalFallback = async () => {
    if (!challengeId || !challengeNonce) return;
    if (!window.PublicKeyCredential) {
      setError('Passkeys are not supported in this browser.');
      return;
    }
    setPasskeyApprovalBusy(true);
    setError(null);
    try {
      const { apiClient } = await import('../../lib/api-client');
      const { authenticateWithPasskey } = await import('../../lib/webauthn');
      const options = await apiClient.startPasskeyApproval(challengeId, challengeNonce);
      const assertion = await authenticateWithPasskey(options);
      const response = await apiClient.finishPasskeyApproval({
        challengeId,
        nonce: challengeNonce,
        response: assertion,
        rememberMe: pendingRememberMe,
      });
      if (response.accessToken && response.user) {
        apiClient.storeAuthToken(response.accessToken);
        await completeLoginRedirect();
        return;
      }
      setError('Unable to complete login with passkey.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey approval failed');
    } finally {
      setPasskeyApprovalBusy(false);
    }
  };

  const handleBackupApprovalFallback = async (backupCode: string) => {
    if (!challengeId || !challengeNonce) return;
    setBackupApprovalBusy(true);
    setError(null);
    try {
      const { apiClient } = await import('../../lib/api-client');
      const response = await apiClient.verifyBackupApproval({
        challengeId,
        nonce: challengeNonce,
        backupCode,
        rememberMe: pendingRememberMe,
      });
      if (response.accessToken && response.user) {
        apiClient.storeAuthToken(response.accessToken);
        await completeLoginRedirect();
        return;
      }
      setError('Invalid recovery code.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery code verification failed');
    } finally {
      setBackupApprovalBusy(false);
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
    const email = getActiveLoginEmail();
    if (!email) {
      setError('Enter your email to receive a magic link.');
      return;
    }
    setMagicLinkBusy(true);
    setMagicLinkSent(false);
    try {
      const { apiClient } = await import('../../lib/api-client');
      const { getMagicLinkDeviceBindingHash } = await import('../../lib/device-identity.service');
      const deviceBindingHash = (await getMagicLinkDeviceBindingHash()) ?? undefined;
      await apiClient.requestMagicLink(email, { deviceBindingHash });
      setMagicLinkSent(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setMagicLinkBusy(false);
    }
  };

  const handlePasskeyLogin = async () => {
    const email = getActiveLoginEmail();
    if (!email) {
      setError('Enter your email before using a passkey.');
      return;
    }
    if (!window.PublicKeyCredential) {
      setError('Passkeys are not supported in this browser.');
      return;
    }
    setPasskeyBusy(true);
    setPendingPrimaryMethod('passkey');
    try {
      const { apiClient } = await import('../../lib/api-client');
      const { authenticateWithPasskey } = await import('../../lib/webauthn');
      const options = await apiClient.webauthnAuthenticateStart(email);
      const assertion = await authenticateWithPasskey(options);
      const response = await apiClient.webauthnAuthenticateFinish(assertion);

      const passkeyHandling = parseLoginResponse(response);
      if (passkeyHandling.kind === 'challenge' && passkeyHandling.challenge === 'mfa') {
        if (isUnfulfillableMfaChallenge(response)) {
          setError(
            response.message ??
              loginFlowUserMessage(passkeyHandling) ??
              MFA_ENROLLMENT_REQUIRED_MESSAGE
          );
          return;
        }
        setPendingEmail(email);
        setMfaUserId(passkeyHandling.context.userId ?? response.userId ?? null);
        setMfaMethods(resolveLoginMfaMethods(response, passkeyHandling.context.mfaMethods));
        setMfaEmailOtpSent(Boolean(passkeyHandling.context.emailOtpSent));
        setMfaModalMode('passkey');
        setMfaAttemptId(passkeyHandling.context.challengeId ?? response.challengeId ?? null);
        setMfaAttemptNonce(passkeyHandling.context.nonce ?? response.nonce ?? null);
        setPasskeyMfaAllowed(Boolean(
        passkeyHandling.context.passkeyMfaAllowed ??
        response.passkeyMfaAllowed ??
        (Array.isArray(response.availableMethods) && response.availableMethods.includes('passkey'))
      ));
        setLoginStep('password');
        setShowMfaModal(true);
        return;
      }

      if (
        passkeyHandling.kind === 'challenge' &&
        (passkeyHandling.challenge === 'mobile_approval' ||
          passkeyHandling.challenge === 'local_device')
      ) {
        setPendingEmail(email);
        if (passkeyHandling.context.challengeId) {
          setChallengeId(passkeyHandling.context.challengeId);
        }
        if (passkeyHandling.context.nonce) setChallengeNonce(passkeyHandling.context.nonce);
        await handleLoginPasswordResult(response, '', false, email);
        return;
      }

      if (response.accessToken && response.user) {
        apiClient.storeAuthToken(response.accessToken);
        addRecentAccount({ email: response.user.email, name: response.user.name });
        refreshRecentAccounts();
        const fullUser = await apiClient.getCurrentUser();
        setUserDirectly(fullUser);
        triggerLoginSuccess();
        router.push('/dashboard');
      }
    } catch (err) {
      const errData = getLoginErrorResponseBody(err);
      if (errData) {
        const handling = parseLoginResponse(errData);
        if (handling.kind === 'challenge' || handling.kind === 'blocked') {
          await handleLoginPasswordResult(errData as AuthResponse, '', false, email);
          return;
        }
      }
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
              if (isEmailNotVerifiedError(null, storedError) && !showResendOption) {
                setShowResendOption(true);
                const storedEmail = sessionStorage.getItem('resend_user_email');
                if (storedEmail) {
                  setUserEmail(storedEmail);
                }
              }
            }
          }
          
          if (displayError && loginStep !== 'awaiting_security_review') {
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
          {/* Recent accounts picker */}
          {loginStep === 'email' && showAccountPicker && recentAccounts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Choose an account</p>
              <ul className="space-y-2" role="list">
                {recentAccounts.map((account) => (
                  <li
                    key={account.email}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => selectAccount(account)}
                      disabled={isFormLoading}
                      className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {getAccountInitials(account)}
                      </span>
                      <span className="min-w-0 flex-1">
                        {account.name ? (
                          <span className="block truncate text-sm font-medium text-gray-900">
                            {account.name}
                          </span>
                        ) : null}
                        <span className="block truncate text-sm text-gray-600">{account.email}</span>
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentAccount(account.email, e)}
                      disabled={isFormLoading}
                      className="mr-2 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                      aria-label={`Remove ${account.email}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleUseAnotherAccount}
                disabled={isFormLoading}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                Use another account
              </button>
            </div>
          )}

          {/* Email field (manual entry or hidden value on password step) */}
          {loginStep === 'password' || loginStep === 'awaiting_security_review' ? (
            <>
              <input type="hidden" {...register('email')} />
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">Signing in as</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {selectedAccountEmail || getValues('email')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleChangeAccount}
                  disabled={isFormLoading}
                  className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </>
          ) : (
            !(showAccountPicker && recentAccounts.length > 0) && (
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
            )
          )}

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
          {(loginStep === 'password' || loginStep === 'email') && (
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
          )}

          {loginStep === 'email_otp' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email verification code</label>
              {bootstrapNoDevices ? (
                <p className="text-sm text-gray-600">
                  Check your email for the sign-in code. After you sign in, install{' '}
                  <strong>CYNAYD One Auth</strong> to approve future sign-ins from your phone.
                </p>
              ) : (
                <p className="text-sm text-gray-600">{approvalMessage}</p>
              )}
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

          {loginStep === 'awaiting_security_review' && (
            <AwaitingSecurityReviewPanel
              message={securityReviewMessage ?? undefined}
              riskLevel={securityRiskLevel}
              riskReasons={securityRiskReasons}
            />
          )}

          {loginStep === 'awaiting_approval' && (
            <AwaitingApprovalPanel
              message={approvalMessage}
              matchCode={approvalMatchCode}
              requestContext={approvalContext}
              expiresAt={approvalExpiresAt}
              pushDelivered={pushDelivered}
              onRequestEmailOtp={
                emailOtpFallbackAllowed ? handleRequestApprovalEmailOtp : undefined
              }
              emailOtpLoading={isFormLoading}
              emailOtpFallbackAllowed={emailOtpFallbackAllowed}
              passkeyFallbackAllowed={passkeyFallbackAllowed}
              backupApprovalAllowed={backupApprovalAllowed}
              passkeyFallbackLoading={passkeyApprovalBusy}
              backupApprovalLoading={backupApprovalBusy}
              onUsePasskeyFallback={handlePasskeyApprovalFallback}
              onVerifyBackupCode={handleBackupApprovalFallback}
            />
          )}

          {/* Submit Button */}
          {(loginStep === 'password' ||
            (loginStep === 'email' && !(showAccountPicker && recentAccounts.length > 0))) && (
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
                {loginStep === 'email' ? 'Continue' : 'Sign in to your account'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
          </Button>
          )}
        </form>

        {(loginStep === 'email' || loginStep === 'password') && (
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
            disabled={passkeyBusy || isFormLoading || hasActiveChallengeSession}
            title={
              hasActiveChallengeSession
                ? 'Complete the current sign-in step before starting a new passkey login'
                : undefined
            }
            className="text-sm text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
          >
            {passkeyBusy ? 'Waiting for passkey…' : 'Sign in with passkey'}
          </button>
        </div>
        )}

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
        onClose={() => {
          setShowMfaModal(false);
          setMfaEmailOtpSent(false);
        }}
        userId={mfaUserId || ''}
        email={pendingEmail}
        attemptId={mfaAttemptId || challengeId || undefined}
        attemptNonce={mfaAttemptNonce || challengeNonce || undefined}
        mfaMethods={mfaMethods}
        emailOtpSent={mfaEmailOtpSent}
        passkeyMfaAllowed={passkeyMfaAllowed}
        rememberMe={pendingRememberMe}
        mode={mfaModalMode}
        onChallengeVerify={async (mfaToken) => {
          const id = mfaAttemptId || challengeId;
          const nonce = mfaAttemptNonce || challengeNonce;
          if (!id || !nonce) {
            throw new Error('Login session expired. Please start again.');
          }
          const { apiClient } = await import('../../lib/api-client');
          return apiClient.loginPassword({
            challengeId: id,
            nonce,
            password: pendingPassword,
            rememberMe: pendingRememberMe,
            mfaToken,
          });
        }}
        onSuccess={async (result) => {
          setShowMfaModal(false);
          setMfaEmailOtpSent(false);
          if (result.accessToken && result.user) {
            const { apiClient } = await import('../../lib/api-client');
            apiClient.storeAuthToken(result.accessToken);
            const fullUser = await apiClient.getCurrentUser();
            setUserDirectly(fullUser);
            triggerLoginSuccess();
            router.push('/dashboard');
            return;
          }
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