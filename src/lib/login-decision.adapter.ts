import {
  authStatusUserMessage,
  handleAuthStatusCode,
  type AuthStatusCode,
  type AuthStatusHandling,
} from './auth-status.util';

/** Registry challenge types from LoginDecision / requiredChallenges. */
export type LoginChallengeType =
  | 'security_review'
  | 'mfa'
  | 'mobile_approval'
  | 'local_device';

export type LoginDecisionStatus =
  | 'allow'
  | 'challenge_required'
  | 'security_review_required'
  | 'temporarily_locked'
  | 'hard_block'
  | 'pre_auth_continue';

export type LoginChallengeEntry = {
  type: string;
  priority?: number;
  status?: 'pending' | 'completed' | 'skipped';
  strength?: number;
  onEnter?: string;
  riskFactors?: string[];
};

/** Partial LoginDecision / HTTP body (legacy + v2). */
export type LoginResponseBody = {
  code?: string;
  message?: string;
  status?: string;
  decision?: 'ALLOW' | 'CHALLENGE' | 'BLOCK' | Record<string, unknown>;
  challenges?: LoginChallengeEntry[];
  requiredChallenges?: string[];
  nextChallenge?: string | null;
  block?: { code?: string; message?: string };
  accessToken?: string;
  user?: unknown;
  userId?: string;
  email?: string;
  challengeId?: string;
  nonce?: string;
  reviewId?: string;
  challengeSessionId?: string;
  riskLevel?: string;
  riskScore?: number;
  riskReasons?: string[];
  retryAfterSeconds?: number;
  hardBlockReasons?: string[];
  preferredChallenge?: string;
  availableChallenges?: string[];
  requestContext?: Record<string, unknown>;
  expiresAt?: string;
  passkeyFallbackAllowed?: boolean;
  passkeyMfaAllowed?: boolean;
  emailOtpFallbackAllowed?: boolean;
  backupApprovalAllowed?: boolean;
  bootstrapNoDevices?: boolean;
  pushDelivered?: boolean;
  mfaMethods?: string[];
  emailOtpSent?: boolean;
  pollAfterMs?: number;
  matchCode?: string;
};

export type LoginChallengeContext = {
  challengeId?: string;
  nonce?: string;
  userId?: string;
  reviewId?: string;
  challengeSessionId?: string;
  message?: string;
  riskLevel?: string;
  riskReasons?: string[];
  riskScore?: number;
  requiredChallenges?: string[];
  nextChallenge?: string | null;
  challenges?: LoginChallengeEntry[];
  preferredChallenge?: string;
  availableChallenges?: string[];
  requestContext?: Record<string, unknown>;
  expiresAt?: string;
  passkeyFallbackAllowed?: boolean;
  emailOtpFallbackAllowed?: boolean;
  backupApprovalAllowed?: boolean;
  pushDelivered?: boolean;
  bootstrapNoDevices?: boolean;
  mfaMethods?: string[];
  emailOtpSent?: boolean;
  passkeyMfaAllowed?: boolean;
  pollAfterMs?: number;
  matchCode?: string;
};

export type LoginFlowHandling =
  | { kind: 'complete'; body: LoginResponseBody }
  | {
      kind: 'challenge';
      challenge: LoginChallengeType;
      legacyCode: AuthStatusCode;
      context: LoginChallengeContext;
      body: LoginResponseBody;
    }
  | {
      kind: 'blocked';
      code: AuthStatusCode;
      message?: string;
      retryAfterSeconds?: number;
      body: LoginResponseBody;
    }
  | { kind: 'unknown'; code: string; body: LoginResponseBody };

const LEGACY_CODE_TO_CHALLENGE: Record<string, LoginChallengeType> = {
  MFA_REQUIRED: 'mfa',
  APPROVAL_REQUIRED: 'mobile_approval',
  APPROVAL_EMAIL_OTP_REQUIRED: 'mobile_approval',
  LOCAL_DEVICE_APPROVAL_REQUIRED: 'local_device',
  SECURITY_REVIEW_REQUIRED: 'security_review',
};

const CHALLENGE_TO_LEGACY_CODE: Record<LoginChallengeType, AuthStatusCode> = {
  mfa: 'MFA_REQUIRED',
  mobile_approval: 'APPROVAL_REQUIRED',
  local_device: 'LOCAL_DEVICE_APPROVAL_REQUIRED',
  security_review: 'SECURITY_REVIEW_REQUIRED',
};

const CHALLENGE_TYPE_ALIASES: Record<string, LoginChallengeType> = {
  security_review: 'security_review',
  mfa: 'mfa',
  mobile_approval: 'mobile_approval',
  local_device: 'local_device',
  local_device_approval: 'local_device',
  push: 'mobile_approval',
  push_approval: 'mobile_approval',
  totp: 'mfa',
  email: 'mobile_approval',
  passkey: 'mfa',
  passkey_step_up: 'mfa',
};

function normalizeChallengeType(raw: string | undefined | null): LoginChallengeType | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return CHALLENGE_TYPE_ALIASES[key] ?? null;
}

function pickPendingChallenge(
  challenges: LoginChallengeEntry[] | undefined
): LoginChallengeType | null {
  if (!challenges?.length) return null;
  const pending = challenges
    .filter((c) => c.status !== 'completed' && c.status !== 'skipped')
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  for (const entry of pending) {
    const mapped = normalizeChallengeType(entry.type);
    if (mapped) return mapped;
  }
  return null;
}

function legacyCodeForChallenge(
  challenge: LoginChallengeType,
  body: LoginResponseBody
): AuthStatusCode {
  if (body.code && LEGACY_CODE_TO_CHALLENGE[body.code]) {
    const codeChallenge = LEGACY_CODE_TO_CHALLENGE[body.code];
    if (codeChallenge === challenge) {
      return body.code as AuthStatusCode;
    }
  }
  if (challenge === 'mobile_approval') {
    if (
      body.code === 'APPROVAL_EMAIL_OTP_REQUIRED' ||
      body.preferredChallenge === 'email' ||
      body.bootstrapNoDevices
    ) {
      return 'APPROVAL_EMAIL_OTP_REQUIRED';
    }
  }
  return CHALLENGE_TO_LEGACY_CODE[challenge];
}

function extractChallengeContext(body: LoginResponseBody): LoginChallengeContext {
  return {
    challengeId: body.challengeId,
    nonce: body.nonce,
    userId: body.userId,
    reviewId: body.reviewId,
    challengeSessionId: body.challengeSessionId,
    message: body.message,
    riskLevel: body.riskLevel,
    riskReasons: Array.isArray(body.riskReasons) ? body.riskReasons : [],
    riskScore: body.riskScore,
    requiredChallenges: body.requiredChallenges,
    nextChallenge: body.nextChallenge,
    challenges: body.challenges,
    preferredChallenge: body.preferredChallenge,
    availableChallenges: body.availableChallenges,
    requestContext: body.requestContext,
    expiresAt: body.expiresAt,
    passkeyFallbackAllowed: body.passkeyFallbackAllowed === true,
    emailOtpFallbackAllowed:
      body.emailOtpFallbackAllowed === true ||
      body.code === 'APPROVAL_EMAIL_OTP_REQUIRED',
    backupApprovalAllowed: body.backupApprovalAllowed === true,
    pushDelivered:
      typeof body.pushDelivered === 'boolean' ? body.pushDelivered : undefined,
    bootstrapNoDevices:
      body.bootstrapNoDevices === true ||
      body.code === 'APPROVAL_EMAIL_OTP_REQUIRED',
    mfaMethods: body.mfaMethods,
    emailOtpSent: body.emailOtpSent,
    passkeyMfaAllowed: body.passkeyMfaAllowed,
    pollAfterMs: body.pollAfterMs,
    matchCode: body.matchCode,
  };
}

function resolveActiveChallenge(body: LoginResponseBody): LoginChallengeType | null {
  const fromChallenges = pickPendingChallenge(body.challenges);
  if (fromChallenges) return fromChallenges;

  const fromNext = normalizeChallengeType(body.nextChallenge ?? undefined);
  if (fromNext) return fromNext;

  const fromRequired = body.requiredChallenges
    ?.map((c) => normalizeChallengeType(c))
    .find((c): c is LoginChallengeType => c != null);
  if (fromRequired) return fromRequired;

  const nestedDecision =
    body.decision && typeof body.decision === 'object'
      ? (body.decision as Record<string, unknown>)
      : null;
  if (nestedDecision) {
    const nestedChallenges = nestedDecision.challenges as LoginChallengeEntry[] | undefined;
    const nestedPending = pickPendingChallenge(nestedChallenges);
    if (nestedPending) return nestedPending;

    const nestedNext = normalizeChallengeType(
      (nestedDecision.nextChallenge as string | null | undefined) ?? undefined
    );
    if (nestedNext) return nestedNext;

    const nestedRequired = (nestedDecision.requiredChallenges as string[] | undefined)
      ?.map((c) => normalizeChallengeType(c))
      .find((c): c is LoginChallengeType => c != null);
    if (nestedRequired) return nestedRequired;
  }

  const decisionStatus = (
    body.status ??
    (nestedDecision?.status as string | undefined)
  ) as LoginDecisionStatus | undefined;

  if (decisionStatus === 'security_review_required') return 'security_review';
  if (decisionStatus === 'challenge_required') {
    return (
      normalizeChallengeType(body.nextChallenge ?? undefined) ??
      normalizeChallengeType(body.requiredChallenges?.[0]) ??
      null
    );
  }

  if (body.decision === 'CHALLENGE') {
    return (
      pickPendingChallenge(body.challenges) ??
      normalizeChallengeType(body.nextChallenge ?? undefined) ??
      normalizeChallengeType(body.requiredChallenges?.[0]) ??
      null
    );
  }

  const fromLegacy = body.code ? LEGACY_CODE_TO_CHALLENGE[body.code] : null;
  if (fromLegacy) return fromLegacy;

  return null;
}

function blockedFromBody(body: LoginResponseBody): LoginFlowHandling | null {
  if (body.decision === 'BLOCK' || body.block) {
    const code = (body.block?.code ?? body.code ?? 'HARD_BLOCK') as AuthStatusCode;
    const legacy = handleAuthStatusCode(code, {
      message: body.block?.message ?? body.message,
      retryAfterSeconds: body.retryAfterSeconds,
    });
    if (legacy.kind === 'blocked') {
      return {
        kind: 'blocked',
        code: legacy.code,
        message: legacy.message ?? body.block?.message ?? body.message,
        retryAfterSeconds: legacy.retryAfterSeconds,
        body,
      };
    }
    if (legacy.kind === 'unknown') {
      return { kind: 'unknown', code: legacy.code, body };
    }
  }

  const status = body.status as LoginDecisionStatus | undefined;
  if (status === 'temporarily_locked') {
    return {
      kind: 'blocked',
      code: 'TEMPORARILY_LOCKED',
      message: body.message,
      retryAfterSeconds: body.retryAfterSeconds,
      body,
    };
  }
  if (status === 'hard_block') {
    return {
      kind: 'blocked',
      code: (body.code ?? 'HARD_BLOCK') as AuthStatusCode,
      message: body.message,
      body,
    };
  }

  if (body.code) {
    const legacy = handleAuthStatusCode(body.code, {
      message: body.message,
      retryAfterSeconds: body.retryAfterSeconds,
    });
    if (legacy.kind === 'blocked') {
      return {
        kind: 'blocked',
        code: legacy.code,
        message: legacy.message ?? body.message,
        retryAfterSeconds: legacy.retryAfterSeconds,
        body,
      };
    }
    if (legacy.kind === 'unknown') {
      return { kind: 'unknown', code: legacy.code, body };
    }
  }

  return null;
}

/**
 * Normalizes legacy `code` responses and LoginDecision-shaped bodies
 * (`challenges`, `requiredChallenges`, `nextChallenge`, `status`) into one flow outcome.
 */
export function parseLoginResponse(body: LoginResponseBody | null | undefined): LoginFlowHandling {
  const safe = body ?? {};

  if (safe.accessToken && safe.user) {
    return { kind: 'complete', body: safe };
  }

  if (safe.decision === 'ALLOW') {
    return { kind: 'complete', body: safe };
  }

  const blocked = blockedFromBody(safe);
  if (blocked) return blocked;

  const activeChallenge = resolveActiveChallenge(safe);
  if (activeChallenge) {
    const legacyCode = legacyCodeForChallenge(activeChallenge, safe);
    return {
      kind: 'challenge',
      challenge: activeChallenge,
      legacyCode,
      context: extractChallengeContext(safe),
      body: safe,
    };
  }

  if (!safe.code && (safe.status === 'allow' || safe.status === 'pre_auth_continue')) {
    return { kind: 'complete', body: safe };
  }

  if (safe.code) {
    const legacy = handleAuthStatusCode(safe.code, {
      message: safe.message,
      retryAfterSeconds: safe.retryAfterSeconds,
    });
    if (legacy.kind === 'unknown') {
      return { kind: 'unknown', code: legacy.code, body: safe };
    }
  }

  return { kind: 'complete', body: safe };
}

export type LoginApprovalStep = 'email_otp' | 'awaiting_approval' | 'awaiting_security_review';

export function loginApprovalStepForHandling(
  handling: Extract<LoginFlowHandling, { kind: 'challenge' }>
): LoginApprovalStep {
  if (handling.challenge === 'security_review') return 'awaiting_security_review';
  if (handling.challenge === 'local_device') return 'awaiting_approval';
  if (handling.challenge === 'mfa') return 'awaiting_approval';
  if (
    handling.legacyCode === 'APPROVAL_EMAIL_OTP_REQUIRED' ||
    handling.context.preferredChallenge === 'email' ||
    handling.context.bootstrapNoDevices
  ) {
    return 'email_otp';
  }
  return 'awaiting_approval';
}

export function approvalMessageForHandling(
  handling: Extract<LoginFlowHandling, { kind: 'challenge' }>
): string {
  if (handling.challenge === 'security_review') {
    return (
      handling.context.message ??
      'This sign-in needs administrator security review. Waiting for approval…'
    );
  }
  if (handling.challenge === 'local_device') {
    return 'Confirm this sign-in on this device.';
  }
  if (handling.challenge === 'mfa') {
    return handling.context.message ?? 'Multi-factor authentication is required.';
  }
  const step = loginApprovalStepForHandling(handling);
  if (step === 'email_otp') {
    return 'Check your email for a verification code.';
  }
  return 'Approve this sign-in from your CYNAYD mobile app.';
}

export function loginFlowUserMessage(handling: LoginFlowHandling): string {
  if (handling.kind === 'blocked' || handling.kind === 'unknown') {
    if (handling.kind === 'unknown') {
      return authStatusUserMessage({ kind: 'unknown', code: handling.code });
    }
    return (
      authStatusUserMessage({
        kind: 'blocked',
        code: handling.code,
        message: handling.message,
        retryAfterSeconds: handling.retryAfterSeconds,
      }) || handling.message || 'Sign-in was blocked.'
    );
  }
  if (handling.kind === 'challenge') {
    return handling.context.message ?? approvalMessageForHandling(handling);
  }
  return '';
}

/** Maps parseLoginResponse output to legacy AuthStatusHandling for gradual migration. */
export function toAuthStatusHandling(handling: LoginFlowHandling): AuthStatusHandling {
  if (handling.kind === 'complete') return { kind: 'continue' };
  if (handling.kind === 'blocked') {
    return {
      kind: 'blocked',
      code: handling.code,
      message: handling.message,
      retryAfterSeconds: handling.retryAfterSeconds,
    };
  }
  if (handling.kind === 'challenge') {
    return { kind: 'challenge', code: handling.legacyCode };
  }
  return { kind: 'unknown', code: handling.code };
}

export type LoginChallengePollBody = LoginResponseBody & {
  status?: string;
};

const POLL_TERMINAL_STATUSES = new Set([
  'rejected',
  'cancelled',
  'expired',
  'denied',
]);

const POLL_TERMINAL_CODES = new Set([
  'CHALLENGE_EXPIRED',
  'LOGIN_REJECTED',
  'CHALLENGE_CANCELLED',
]);

/**
 * Whether an approval/security-review poll response has reached a terminal state.
 */
export function isLoginPollTerminal(body: LoginChallengePollBody): boolean {
  if (body.status && POLL_TERMINAL_STATUSES.has(body.status)) return true;
  if (body.code && POLL_TERMINAL_CODES.has(body.code)) return true;
  if (body.decision === 'BLOCK') return true;
  const parsed = parseLoginResponse(body);
  return parsed.kind === 'blocked' && parsed.code !== 'TEMPORARILY_LOCKED';
}

export function isLoginPollApproved(body: LoginChallengePollBody): boolean {
  if (body.status === 'approved' && body.accessToken) return true;
  if (body.decision === 'ALLOW' && body.accessToken) return true;
  const parsed = parseLoginResponse(body);
  return parsed.kind === 'complete' && Boolean(body.accessToken);
}

export { authStatusUserMessage, handleAuthStatusCode };
