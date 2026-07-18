export type AuthStatusCode =
  | 'MFA_REQUIRED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_EMAIL_OTP_REQUIRED'
  | 'LOCAL_DEVICE_APPROVAL_REQUIRED'
  | 'SECURITY_REVIEW_REQUIRED'
  | 'TEMPORARILY_LOCKED'
  | 'HARD_BLOCK'
  | 'LOGIN_BLOCKED'
  | 'LOGIN_BLOCKED_RISK'
  | 'MFA_REQUIRED_BY_POLICY'
  | 'UNKNOWN_AUTH_STATUS';

export type AuthStatusHandling =
  | { kind: 'continue' }
  | { kind: 'challenge'; code: AuthStatusCode }
  | { kind: 'blocked'; code: AuthStatusCode; message?: string; retryAfterSeconds?: number }
  | { kind: 'unknown'; code: string };

const KNOWN_CHALLENGE_CODES = new Set<string>([
  'MFA_REQUIRED',
  'APPROVAL_REQUIRED',
  'APPROVAL_EMAIL_OTP_REQUIRED',
  'LOCAL_DEVICE_APPROVAL_REQUIRED',
  'SECURITY_REVIEW_REQUIRED',
]);

const KNOWN_BLOCK_CODES = new Set<string>([
  'TEMPORARILY_LOCKED',
  'HARD_BLOCK',
  'LOGIN_BLOCKED',
  'LOGIN_BLOCKED_RISK',
  'MFA_REQUIRED_BY_POLICY',
]);

/**
 * Maps backend auth status codes to client handling.
 * Unknown codes → safe fallback; never clear device identity.
 */
export function handleAuthStatusCode(
  code: string | undefined,
  body?: { message?: string; retryAfterSeconds?: number }
): AuthStatusHandling {
  if (!code) return { kind: 'continue' };

  if (KNOWN_CHALLENGE_CODES.has(code)) {
    return { kind: 'challenge', code: code as AuthStatusCode };
  }

  if (KNOWN_BLOCK_CODES.has(code)) {
    return {
      kind: 'blocked',
      code: code as AuthStatusCode,
      message: body?.message,
      retryAfterSeconds: body?.retryAfterSeconds,
    };
  }

  return { kind: 'unknown', code };
}

export type { LoginFlowHandling, LoginResponseBody } from './login-decision.adapter';
export {
  parseLoginResponse,
  loginFlowUserMessage,
  toAuthStatusHandling,
  isLoginPollApproved,
  isLoginPollTerminal,
} from './login-decision.adapter';

export function authStatusUserMessage(handling: AuthStatusHandling): string {
  if (handling.kind === 'unknown') {
    return 'Sign-in could not be completed. Please try again or contact support.';
  }
  if (handling.kind !== 'blocked') return '';

  switch (handling.code) {
    case 'SECURITY_REVIEW_REQUIRED':
      return (
        handling.message ??
        'This sign-in needs administrator security review. Waiting for approval…'
      );
    case 'TEMPORARILY_LOCKED':
      return (
        handling.message ??
        `Too many attempts. Try again${handling.retryAfterSeconds ? ` in ${Math.ceil(handling.retryAfterSeconds / 60)} minutes` : ' later'}.`
      );
    case 'HARD_BLOCK':
    case 'LOGIN_BLOCKED':
    case 'LOGIN_BLOCKED_RISK':
      return handling.message ?? 'Sign-in was blocked for security reasons. Contact your administrator.';
    case 'MFA_REQUIRED_BY_POLICY':
      return handling.message ?? 'Multi-factor authentication must be enabled on your account.';
    default:
      return handling.message ?? 'Sign-in was blocked.';
  }
}
