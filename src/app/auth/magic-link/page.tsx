'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { MFAVerificationModal } from '@/components/auth/MFAVerificationModal';
import { AwaitingApprovalPanel } from '@/components/auth/AwaitingApprovalPanel';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

type MagicLinkStatus = 'loading' | 'ok' | 'error' | 'mfa' | 'approval' | 'email_otp';

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
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passkeyFallbackAllowed, setPasskeyFallbackAllowed] = useState(false);
  const [emailOtpFallbackAllowed, setEmailOtpFallbackAllowed] = useState(false);
  const [backupApprovalAllowed, setBackupApprovalAllowed] = useState(false);
  const [passkeyApprovalBusy, setPasskeyApprovalBusy] = useState(false);
  const [backupApprovalBusy, setBackupApprovalBusy] = useState(false);
  const [passkeyMfaAllowed, setPasskeyMfaAllowed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completeLogin = async (accessToken: string) => {
    apiClient.storeAuthToken(accessToken);
    const fullUser = await apiClient.getCurrentUser();
    setUserDirectly(fullUser);
    triggerLoginSuccess();
    setStatus('ok');
    router.push('/dashboard');
  };

  const handleVerifyResponse = (data: Record<string, unknown>) => {
    if (data.code === 'MFA_REQUIRED') {
      setUserId((data.userId as string) || null);
      setMfaMethods((data.mfaMethods as string[]) || ['totp']);
      setEmailOtpSent(Boolean(data.emailOtpSent));
      setPasskeyMfaAllowed(Boolean(data.passkeyMfaAllowed));
      setAttemptId((data.challengeId as string) || null);
      setAttemptNonce((data.nonce as string) || null);
      setStatus('mfa');
      return;
    }

    if (data.code === 'APPROVAL_REQUIRED' || data.code === 'APPROVAL_EMAIL_OTP_REQUIRED') {
      setAttemptId((data.challengeId as string) || null);
      setAttemptNonce((data.nonce as string) || null);
      setApprovalExpiresAt((data.expiresAt as string) || null);
      setApprovalContext((data.requestContext as Record<string, unknown>) || null);
      setPasskeyFallbackAllowed(data.passkeyFallbackAllowed === true);
      setEmailOtpFallbackAllowed(
        data.emailOtpFallbackAllowed === true || data.code === 'APPROVAL_EMAIL_OTP_REQUIRED'
      );
      setBackupApprovalAllowed(data.backupApprovalAllowed === true);
      const preferred = data.preferredChallenge as string | undefined;
      setApprovalMessage(
        data.code === 'APPROVAL_EMAIL_OTP_REQUIRED' || preferred === 'email'
          ? 'Check your email for an approval code, or approve from your mobile app.'
          : 'Approve this sign-in from your CYNAYD mobile app.'
      );
      setStatus(data.code === 'APPROVAL_EMAIL_OTP_REQUIRED' || preferred === 'email' ? 'email_otp' : 'approval');
      return;
    }

    if (data.accessToken && data.user) {
      void completeLogin(data.accessToken as string);
    } else {
      setStatus('error');
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (!token || !emailParam) {
      setStatus('error');
      return;
    }
    setEmail(emailParam);
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(
      `${base}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`
    )
      .then((r) => r.json())
      .then(handleVerifyResponse)
      .catch(() => setStatus('error'));
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'approval' || !attemptId || !attemptNonce) return;

    pollRef.current = setInterval(async () => {
      try {
        const challenge = await apiClient.getLoginChallengeStatus(attemptId, attemptNonce, false);
        if (challenge.status === 'approved' && challenge.accessToken) {
          if (pollRef.current) clearInterval(pollRef.current);
          await completeLogin(challenge.accessToken);
        } else if (
          challenge.status === 'rejected' ||
          challenge.status === 'cancelled' ||
          challenge.status === 'expired'
        ) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus('error');
        }
      } catch {
        // keep polling
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, attemptId, attemptNonce]);

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
        if (pollRef.current) clearInterval(pollRef.current);
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
        if (pollRef.current) clearInterval(pollRef.current);
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
    requestContext: approvalContext,
    expiresAt: approvalExpiresAt,
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
