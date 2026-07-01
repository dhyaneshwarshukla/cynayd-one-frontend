'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { MFAVerificationModal } from '@/components/auth/MFAVerificationModal';

type MagicLinkStatus = 'loading' | 'ok' | 'error' | 'mfa' | 'approval' | 'email_otp';

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUserDirectly, triggerLoginSuccess } = useAuth();
  const [status, setStatus] = useState<MagicLinkStatus>('loading');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNonce, setAttemptNonce] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [mfaMethods, setMfaMethods] = useState<string[]>(['totp']);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
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
      setAttemptId((data.challengeId as string) || null);
      setAttemptNonce((data.nonce as string) || null);
      setStatus('mfa');
      return;
    }

    if (data.code === 'APPROVAL_REQUIRED' || data.code === 'APPROVAL_EMAIL_OTP_REQUIRED') {
      setAttemptId((data.challengeId as string) || null);
      setAttemptNonce((data.nonce as string) || null);
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
        } else if (challenge.status === 'cancelled' || challenge.status === 'expired') {
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === 'loading' && <p>Signing you in…</p>}
      {status === 'error' && <p>Invalid or expired magic link.</p>}
      {(status === 'approval' || status === 'email_otp') && (
        <div className="max-w-md text-center">
          <p>{approvalMessage}</p>
          {status === 'email_otp' && attemptId && attemptNonce && (
            <p className="mt-2 text-sm text-gray-500">Enter the code from your email to continue.</p>
          )}
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
