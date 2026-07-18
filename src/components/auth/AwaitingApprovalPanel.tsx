'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Smartphone } from 'lucide-react';

interface AwaitingApprovalPanelProps {
  message?: string | null;
  matchCode?: string | null;
  requestContext?: Record<string, unknown> | null;
  expiresAt?: string | null;
  pushDelivered?: boolean;
  onRequestEmailOtp?: () => void;
  emailOtpLoading?: boolean;
  emailOtpFallbackAllowed?: boolean;
  passkeyFallbackAllowed?: boolean;
  backupApprovalAllowed?: boolean;
  passkeyFallbackLoading?: boolean;
  backupApprovalLoading?: boolean;
  onUsePasskeyFallback?: () => void;
  onVerifyBackupCode?: (code: string) => void;
  supportEmail?: string;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function passkeyButtonLabel(): string {
  if (typeof window === 'undefined') return 'Use passkey instead';
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Use Windows Hello instead';
  if (ua.includes('mac')) return 'Use Touch ID / passkey instead';
  return 'Use passkey instead';
}

export function AwaitingApprovalPanel({
  message,
  matchCode,
  requestContext,
  expiresAt,
  pushDelivered,
  onRequestEmailOtp,
  emailOtpLoading,
  emailOtpFallbackAllowed = false,
  passkeyFallbackAllowed = false,
  backupApprovalAllowed = false,
  passkeyFallbackLoading = false,
  backupApprovalLoading = false,
  onUsePasskeyFallback,
  onVerifyBackupCode,
  supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@cynayd.com',
}: AwaitingApprovalPanelProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const passkeySupported =
    typeof window !== 'undefined' && Boolean(window.PublicKeyCredential);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemainingMs(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const ip = requestContext?.ipAddress ?? requestContext?.ip;
  const browser = requestContext?.browser;
  const os = requestContext?.os;
  const location = requestContext?.location as { city?: string; country?: string } | undefined;
  const attemptedAt = requestContext?.attemptedAt;

  const showFallbackSection =
    (passkeyFallbackAllowed && passkeySupported && onUsePasskeyFallback) ||
    (backupApprovalAllowed && onVerifyBackupCode) ||
    (emailOtpFallbackAllowed && onRequestEmailOtp);

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-violet-100 p-2 text-violet-700">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-violet-950">Approve this login from your Cynayd One Auth app</p>
          <p className="mt-1 text-sm text-violet-900">
            {message || 'We sent an approval request to your registered device.'}
          </p>
          {matchCode ? (
            <p className="mt-3 rounded-lg border border-violet-200 bg-white px-4 py-3 text-center">
              <span className="block text-xs font-medium uppercase tracking-wide text-violet-700">
                Confirm this number in the app
              </span>
              <span className="mt-1 block font-mono text-3xl font-bold tracking-widest text-violet-950">
                {matchCode}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {remainingMs !== null && (
        <p className="text-sm font-medium text-violet-800">
          Expires in {formatCountdown(remainingMs)}
        </p>
      )}

      {pushDelivered === false ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          No push notification was sent. Open the <strong>CYNAYD One Auth</strong> app manually to
          approve this sign-in.
        </p>
      ) : null}

      <div className="rounded-lg border border-violet-100 bg-white/70 p-3 text-xs text-violet-900">
        {browser ? <p>Browser: {String(browser)}</p> : null}
        {os ? <p>Device: {String(os)}</p> : null}
        {location?.city || location?.country ? (
          <p>
            Location: {[location.city, location.country].filter(Boolean).join(', ')}
          </p>
        ) : null}
        {ip ? <p>IP: {String(ip)}</p> : null}
        {attemptedAt ? <p>Time: {new Date(String(attemptedAt)).toLocaleString()}</p> : null}
      </div>

      {showFallbackSection ? (
        <div className="space-y-3 border-t border-violet-100 pt-3">
          <p className="text-sm font-medium text-violet-900">Didn&apos;t get it?</p>

          {passkeyFallbackAllowed && passkeySupported && onUsePasskeyFallback ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onUsePasskeyFallback}
              disabled={passkeyFallbackLoading || emailOtpLoading || backupApprovalLoading}
              loading={passkeyFallbackLoading}
            >
              {passkeyFallbackLoading ? 'Waiting for passkey…' : passkeyButtonLabel()}
            </Button>
          ) : null}

          {backupApprovalAllowed && onVerifyBackupCode ? (
            <div className="space-y-2">
              {!showRecoveryInput ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRecoveryInput(true)}
                  disabled={passkeyFallbackLoading || emailOtpLoading || backupApprovalLoading}
                >
                  Use recovery code
                </Button>
              ) : (
                <>
                  <Input
                    value={recoveryCode}
                    onChange={(e) =>
                      setRecoveryCode((e.target as HTMLInputElement).value.replace(/\s/g, '').slice(0, 8))
                    }
                    placeholder="8-character recovery code"
                    className="font-mono tracking-widest"
                  />
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => onVerifyBackupCode(recoveryCode)}
                    disabled={
                      recoveryCode.length !== 8 ||
                      backupApprovalLoading ||
                      passkeyFallbackLoading ||
                      emailOtpLoading
                    }
                    loading={backupApprovalLoading}
                  >
                    Verify recovery code
                  </Button>
                </>
              )}
            </div>
          ) : null}

          {emailOtpFallbackAllowed && onRequestEmailOtp ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onRequestEmailOtp}
              disabled={emailOtpLoading || passkeyFallbackLoading || backupApprovalLoading}
              loading={emailOtpLoading}
            >
              Send email code instead
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="text-center text-sm">
        <a
          href={`mailto:${supportEmail}?subject=Login%20approval%20help`}
          className="font-medium text-violet-800 underline hover:text-violet-950"
        >
          Contact administrator
        </a>
      </div>
    </div>
  );
}
