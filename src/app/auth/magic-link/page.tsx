'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { MFAVerificationModal } from '@/components/auth/MFAVerificationModal';
import { AwaitingApprovalPanel } from '@/components/auth/AwaitingApprovalPanel';
import { AwaitingSecurityReviewPanel } from '@/components/auth/AwaitingSecurityReviewPanel';
import {
  markMobileApprovalSetupPrompt,
  useLoginChallengePolling,
} from '@/hooks/useLoginChallengePolling';
import { useSecurityReviewPolling } from '@/hooks/useSecurityReviewPolling';
import {
  approvalMessageForHandling,
  getLoginErrorResponseBody,
  isUnfulfillableMfaChallenge,
  loginApprovalStepForHandling,
  loginFlowUserMessage,
  MFA_ENROLLMENT_REQUIRED_MESSAGE,
  parseLoginResponse,
  resolveLoginMfaMethods,
  type LoginResponseBody,
} from '@/lib/login-decision.adapter';
import { getMagicLinkDeviceBindingHash } from '@/lib/device-identity.service';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

type MagicLinkStatus = 'loading' | 'ok' | 'error' | 'mfa' | 'approval' | 'security_review' | 'email_otp' | 'blocked';

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUserDirectly, triggerLoginSuccess } = useAuth();
  const [status, setStatus] = useState<MagicLinkStatus>('loading');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNonce, setAttemptNonce] = useState<string | null>(null);
  const [approvalExpiresAt, setApprovalExpiresAt] = useState<string | null>(null);
  const [approvalContext, setApprovalContext] = useState<Record<string, unknown> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [mfaMethods, setMfaMethods] = useState<string[]>(['totp']);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [approvalMatchCode, setApprovalMatchCode] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passkeyFallbackAllowed, setPasskeyFallbackAllowed] = useState(false);
  const [emailOtpFallbackAllowed, setEmailOtpFallbackAllowed] = useState(false);
  const [backupApprovalAllowed, setBackupApprovalAllowed] = useState(false);
  const [passkeyApprovalBusy, setPasskeyApprovalBusy] = useState(false);
  const [backupApprovalBusy, setBackupApprovalBusy] = useState(false);
  const [passkeyMfaAllowed, setPasskeyMfaAllowed] = useState(false);
  const [pushDelivered, setPushDelivered] = useState<boolean | undefined>(undefined);
  const [bootstrapNoDevices, setBootstrapNoDevices] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [securityReviewId, setSecurityReviewId] = useState<string | null>(null);
  const [securityReviewUserId, setSecurityReviewUserId] = useState<string | null>(null);
  const [securityChallengeSessionId, setSecurityChallengeSessionId] = useState<string | null>(null);
  const [securityReviewMessage, setSecurityReviewMessage] = useState<string | null>(null);
  const [securityRiskLevel, setSecurityRiskLevel] = useState<string | undefined>();
  const [securityRiskReasons, setSecurityRiskReasons] = useState<string[]>([]);

  const completeLogin = async (accessToken: string) => {
    apiClient.storeAuthToken(accessToken);
    const fullUser = await apiClient.getCurrentUser();
    setUserDirectly(fullUser);
    triggerLoginSuccess();
    setStatus('ok');
    router.push('/dashboard');
  };

  const handleVerifyResponse = (data: LoginResponseBody) => {
    const handling = parseLoginResponse(data);

    if (handling.kind === 'complete') {
      if (data.accessToken) {
        void completeLogin(data.accessToken as string);
      } else {
        setStatus('error');
      }
      return;
    }

    if (handling.kind === 'blocked' || handling.kind === 'unknown') {
      setBlockedMessage(loginFlowUserMessage(handling));
      setStatus('blocked');
      return;
    }

    const { context, challenge } = handling;
    if (context.challengeId) setAttemptId(context.challengeId);
    if (context.nonce) setAttemptNonce(context.nonce);

    if (challenge === 'mfa') {
      if (isUnfulfillableMfaChallenge(data)) {
        setBlockedMessage(
          (data.message as string | undefined) ??
            loginFlowUserMessage(parseLoginResponse(data)) ??
            MFA_ENROLLMENT_REQUIRED_MESSAGE
        );
        setStatus('blocked');
        return;
      }
      setUserId(context.userId ?? (data.userId as string) ?? null);
      setMfaMethods(resolveLoginMfaMethods(data, context.mfaMethods));
      setEmailOtpSent(Boolean(context.emailOtpSent ?? data.emailOtpSent));
      setPasskeyMfaAllowed(Boolean(context.passkeyMfaAllowed ?? data.passkeyMfaAllowed));
      setStatus('mfa');
      return;
    }

    if (challenge === 'security_review') {
      setSecurityReviewId((context.reviewId ?? data.reviewId) as string | null);
      setSecurityReviewUserId((context.userId ?? data.userId) as string | null);
      setSecurityChallengeSessionId(
        (context.challengeSessionId ?? data.challengeSessionId) as string | null
      );
      setSecurityReviewMessage((context.message ?? data.message) as string | null);
      setSecurityRiskLevel(context.riskLevel ?? (data.riskLevel as string | undefined));
      setSecurityRiskReasons(
        context.riskReasons ??
          (Array.isArray(data.riskReasons) ? (data.riskReasons as string[]) : [])
      );
      setStatus('security_review');
      return;
    }

    setApprovalExpiresAt((context.expiresAt ?? data.expiresAt) as string | null);
    setApprovalContext(
      (context.requestContext ?? data.requestContext) as Record<string, unknown> | null
    );
    setPasskeyFallbackAllowed(context.passkeyFallbackAllowed === true);
    setEmailOtpFallbackAllowed(context.emailOtpFallbackAllowed === true);
    setBackupApprovalAllowed(context.backupApprovalAllowed === true);
    setPushDelivered(
      typeof context.pushDelivered === 'boolean' ? context.pushDelivered : undefined
    );
    setApprovalMatchCode(context.matchCode ?? null);
    setBootstrapNoDevices(context.bootstrapNoDevices === true);
    setApprovalMessage(approvalMessageForHandling(handling));
    const approvalStep = loginApprovalStepForHandling(handling);
    setStatus(approvalStep === 'email_otp' ? 'email_otp' : 'approval');
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (!token || !emailParam) {
      setStatus('error');
      return;
    }
    setEmail(emailParam);

    void (async () => {
      try {
        const deviceBindingHash = (await getMagicLinkDeviceBindingHash()) ?? undefined;
        const data = await apiClient.consumeMagicLink({
          email: emailParam,
          token,
          deviceBindingHash,
        });
        handleVerifyResponse(data);
      } catch (err) {
        const errData = getLoginErrorResponseBody(err);
        if (errData) {
          const handling = parseLoginResponse(errData);
          if (
            handling.kind === 'challenge' ||
            handling.kind === 'blocked' ||
            handling.kind === 'complete'
          ) {
            handleVerifyResponse(errData);
            return;
          }
        }
        setStatus('error');
      }
    })();
  }, [searchParams]);

  useSecurityReviewPolling({
    reviewId: securityReviewId,
    nonce: attemptNonce,
    loginAttemptId: attemptId,
    enabled: status === 'security_review',
    poll: (id, nonce, loginAttemptId) =>
      apiClient.getSecurityReviewStatus(id, nonce, loginAttemptId),
    onApproved: async (pollStatus) => {
      try {
        const result = await apiClient.resumeSecurityReview({
          reviewId: securityReviewId!,
          userId: pollStatus.userId ?? securityReviewUserId!,
          resumeToken: pollStatus.resumeToken!,
          challengeSessionId: pollStatus.challengeSessionId ?? securityChallengeSessionId!,
          nonce: attemptNonce ?? undefined,
          rememberMe: false,
        });
        if (result.accessToken) {
          await completeLogin(result.accessToken);
          return;
        }
        handleVerifyResponse(result as LoginResponseBody);
      } catch (err) {
        const errData = getLoginErrorResponseBody(err);
        if (errData) {
          handleVerifyResponse(errData);
          return;
        }
        setBlockedMessage(
          err instanceof Error ? err.message : 'Sign-in could not be completed after review.'
        );
        setStatus('blocked');
      }
    },
    onTerminal: (status) => {
      setBlockedMessage(
        status.message ??
          'This sign-in request was denied or expired during security review.'
      );
      setStatus('blocked');
    },
  });

  useLoginChallengePolling({
    challengeId: attemptId,
    nonce: attemptNonce,
    rememberMe: false,
    enabled: status === 'approval',
    poll: (id, nonce, rememberMe) => apiClient.getLoginChallengeStatus(id, nonce, rememberMe),
    onApproved: async (challenge) => {
      if (challenge.accessToken) {
        await completeLogin(challenge.accessToken);
      }
    },
    onTerminal: () => setStatus('error'),
  });

  const handleVerifyOtp = async () => {
    if (!attemptId || !attemptNonce || !otpCode.trim()) return;
    setOtpError(null);
    try {
      const response = await apiClient.verifyChallengeEmailOtp({
        challengeId: attemptId,
        nonce: attemptNonce,
        otp: otpCode.trim(),
      });
      if (response.accessToken) {
        if (bootstrapNoDevices) {
          markMobileApprovalSetupPrompt();
        }
        await completeLogin(response.accessToken);
      }
    } catch {
      setOtpError('Invalid or expired code.');
    }
  };

  const handlePasskeyApprovalFallback = async () => {
    if (!attemptId || !attemptNonce || !window.PublicKeyCredential) return;
    setPasskeyApprovalBusy(true);
    try {
      const { authenticateWithPasskey } = await import('@/lib/webauthn');
      const options = await apiClient.startPasskeyApproval(attemptId, attemptNonce);
      const assertion = await authenticateWithPasskey(options);
      const response = await apiClient.finishPasskeyApproval({
        challengeId: attemptId,
        nonce: attemptNonce,
        response: assertion,
      });
      if (response.accessToken) {
        await completeLogin(response.accessToken);
      }
    } catch {
      setStatus('error');
    } finally {
      setPasskeyApprovalBusy(false);
    }
  };

  const handleBackupApprovalFallback = async (backupCode: string) => {
    if (!attemptId || !attemptNonce) return;
    setBackupApprovalBusy(true);
    try {
      const response = await apiClient.verifyBackupApproval({
        challengeId: attemptId,
        nonce: attemptNonce,
        backupCode,
      });
      if (response.accessToken) {
        await completeLogin(response.accessToken);
      }
    } catch {
      setStatus('error');
    } finally {
      setBackupApprovalBusy(false);
    }
  };

  const handleRequestApprovalEmailOtp = async () => {
    if (!attemptId || !attemptNonce) return;
    try {
      await apiClient.requestChallengeEmailOtp(attemptId, attemptNonce);
      setApprovalMessage('Approval code sent to your email.');
      setStatus('email_otp');
    } catch {
      setStatus('error');
    }
  };

  const approvalPanelProps = {
    message: approvalMessage,
    matchCode: approvalMatchCode,
    requestContext: approvalContext,
    expiresAt: approvalExpiresAt,
    pushDelivered,
    emailOtpFallbackAllowed,
    passkeyFallbackAllowed,
    backupApprovalAllowed,
    passkeyFallbackLoading: passkeyApprovalBusy,
    backupApprovalLoading: backupApprovalBusy,
    onUsePasskeyFallback: handlePasskeyApprovalFallback,
    onVerifyBackupCode: handleBackupApprovalFallback,
    onRequestEmailOtp: emailOtpFallbackAllowed ? handleRequestApprovalEmailOtp : undefined,
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {status === 'loading' && <p>Signing you in…</p>}
      {status === 'error' && <p>Invalid, denied, or expired magic link.</p>}
      {status === 'blocked' && (
        <div className="max-w-md text-center">
          <p className="text-gray-800">{blockedMessage ?? 'Sign-in could not be completed.'}</p>
          <Button type="button" className="mt-4" onClick={() => router.push('/auth/login')}>
            Back to sign in
          </Button>
        </div>
      )}
      {status === 'security_review' && (
        <div className="w-full max-w-md">
          <AwaitingSecurityReviewPanel
            message={securityReviewMessage ?? undefined}
            riskLevel={securityRiskLevel}
            riskReasons={securityRiskReasons}
          />
        </div>
      )}
      {status === 'approval' && (
        <div className="w-full max-w-md">
          <AwaitingApprovalPanel {...approvalPanelProps} />
        </div>
      )}
      {status === 'email_otp' && attemptId && attemptNonce && (
        <div className="w-full max-w-md space-y-4">
          <AwaitingApprovalPanel {...approvalPanelProps} />
          <Input
            label="Approval code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter code from email"
          />
          {otpError ? <p className="text-sm text-red-600">{otpError}</p> : null}
          <Button type="button" className="w-full" onClick={() => void handleVerifyOtp()}>
            Verify code
          </Button>
        </div>
      )}
      {status === 'mfa' && attemptId && attemptNonce && (
        <MFAVerificationModal
          isOpen
          onClose={() => setStatus('error')}
          userId={userId || ''}
          email={email}
          attemptId={attemptId}
          attemptNonce={attemptNonce}
          mfaMethods={mfaMethods}
          emailOtpSent={emailOtpSent}
          passkeyMfaAllowed={passkeyMfaAllowed}
          mode="magic_link"
          onSuccess={(response) => {
            if (response.accessToken && response.user) {
              void completeLogin(response.accessToken);
            }
          }}
        />
      )}
    </div>
  );
}
