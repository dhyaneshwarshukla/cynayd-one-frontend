import {
  approvalMessageForHandling,
  getLoginErrorResponseBody,
  isLoginPollApproved,
  isLoginPollTerminal,
  isSecurityReviewLoginError,
  isTerminalLoginBlock,
  isUnfulfillableMfaChallenge,
  loginApprovalStepForHandling,
  parseLoginResponse,
  resolveAvailableMethods,
  resolveLoginMfaMethods,
  toAuthStatusHandling,
} from '../login-decision.adapter';

describe('login-decision.adapter', () => {
  it('maps legacy MFA_REQUIRED code to mfa challenge', () => {
    const h = parseLoginResponse({
      code: 'MFA_REQUIRED',
      userId: 'u1',
      challengeId: 'c1',
      nonce: 'n1',
      mfaMethods: ['totp'],
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(h.challenge).toBe('mfa');
      expect(h.legacyCode).toBe('MFA_REQUIRED');
      expect(h.context.challengeId).toBe('c1');
    }
  });

  it('maps legacy SECURITY_REVIEW_REQUIRED with review fields', () => {
    const h = parseLoginResponse({
      code: 'SECURITY_REVIEW_REQUIRED',
      reviewId: 'r1',
      challengeSessionId: 's1',
      riskLevel: 'high',
      riskReasons: ['new_device'],
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(h.challenge).toBe('security_review');
      expect(h.context.reviewId).toBe('r1');
      expect(h.context.riskReasons).toEqual(['new_device']);
    }
  });

  it('prefers pending challenges array over legacy code when both present', () => {
    const h = parseLoginResponse({
      code: 'MFA_REQUIRED',
      challenges: [
        { type: 'security_review', priority: 1, status: 'pending' },
        { type: 'mfa', priority: 2, status: 'pending' },
      ],
      nextChallenge: 'security_review',
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(h.challenge).toBe('security_review');
      expect(h.legacyCode).toBe('SECURITY_REVIEW_REQUIRED');
    }
  });

  it('uses requiredChallenges and nextChallenge when no legacy code', () => {
    const h = parseLoginResponse({
      status: 'challenge_required',
      requiredChallenges: ['mfa', 'mobile_approval'],
      nextChallenge: 'mfa',
      challengeId: 'c1',
      nonce: 'n1',
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(h.challenge).toBe('mfa');
      expect(h.context.requiredChallenges).toEqual(['mfa', 'mobile_approval']);
    }
  });

  it('maps decision BLOCK to blocked handling', () => {
    const h = parseLoginResponse({
      decision: 'BLOCK',
      block: { code: 'HARD_BLOCK', message: 'Blocked by policy' },
    });
    expect(h.kind).toBe('blocked');
    if (h.kind === 'blocked') {
      expect(h.code).toBe('HARD_BLOCK');
      expect(h.message).toBe('Blocked by policy');
    }
  });

  it('maps temporarily_locked status to blocked handling', () => {
    const h = parseLoginResponse({
      status: 'temporarily_locked',
      message: 'Too many attempts',
      retryAfterSeconds: 300,
    });
    expect(h.kind).toBe('blocked');
    if (h.kind === 'blocked') {
      expect(h.code).toBe('TEMPORARILY_LOCKED');
      expect(h.retryAfterSeconds).toBe(300);
    }
  });

  it('detects complete login from accessToken', () => {
    const h = parseLoginResponse({
      accessToken: 'tok',
      user: { id: 'u1', email: 'a@b.com', name: 'A', role: 'USER' },
    });
    expect(h.kind).toBe('complete');
  });

  it('derives approval UI step from preferredChallenge email', () => {
    const h = parseLoginResponse({
      code: 'APPROVAL_REQUIRED',
      preferredChallenge: 'email',
      challengeId: 'c1',
      nonce: 'n1',
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(loginApprovalStepForHandling(h)).toBe('email_otp');
      expect(approvalMessageForHandling(h)).toMatch(/email/i);
    }
  });

  it('converts to legacy AuthStatusHandling', () => {
    const h = parseLoginResponse({ code: 'MFA_REQUIRED' });
    expect(toAuthStatusHandling(h)).toEqual({ kind: 'challenge', code: 'MFA_REQUIRED' });
  });

  it('extracts matchCode for mobile approval display', () => {
    const h = parseLoginResponse({
      code: 'APPROVAL_REQUIRED',
      matchCode: '42',
      challengeId: 'c1',
      nonce: 'n1',
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(h.context.matchCode).toBe('42');
    }
  });

  it('detects poll terminal and approved states', () => {
    expect(isLoginPollTerminal({ status: 'rejected' })).toBe(true);
    expect(isLoginPollTerminal({ code: 'CHALLENGE_EXPIRED' })).toBe(true);
    expect(isLoginPollApproved({ status: 'approved', accessToken: 't' })).toBe(true);
    expect(isLoginPollApproved({ decision: 'ALLOW', accessToken: 't' })).toBe(true);
  });

  it('detects unfulfillable MFA when no methods and no passkey fallback', () => {
    expect(
      isUnfulfillableMfaChallenge({
        code: 'MFA_REQUIRED',
        challengeId: 'c1',
        nonce: 'n1',
        mfaMethods: [],
        passkeyMfaAllowed: false,
      })
    ).toBe(true);
    expect(
      isUnfulfillableMfaChallenge({
        code: 'MFA_REQUIRED',
        mfaMethods: ['totp'],
      })
    ).toBe(false);
    expect(isUnfulfillableMfaChallenge({ code: 'MFA_REQUIRED_BY_POLICY' })).toBe(true);
  });

  it('resolves MFA methods without totp default', () => {
    expect(resolveLoginMfaMethods({ mfaMethods: ['email'] })).toEqual(['email']);
    expect(resolveLoginMfaMethods({})).toEqual([]);
    expect(
      resolveLoginMfaMethods({
        availableMethods: ['passkey', 'email_otp'],
      })
    ).toEqual(['passkey', 'email']);
  });

  it('detects terminal login blocks and resolves availableMethods', () => {
    expect(isTerminalLoginBlock({ code: 'MFA_ENROLLMENT_REQUIRED' })).toBe(true);
    expect(isTerminalLoginBlock({ code: 'SECURITY_REVIEW_UNAVAILABLE' })).toBe(true);
    expect(isTerminalLoginBlock({ code: 'MFA_REQUIRED' })).toBe(false);
    expect(
      resolveAvailableMethods({
        availableMethods: ['passkey', 'email_otp', 'backup_code'],
      })
    ).toEqual(['passkey', 'email', 'backup']);
  });

  it('extracts login error body from apiClient thrown errors', () => {
    const body = {
      code: 'SECURITY_REVIEW_REQUIRED',
      reviewId: 'r1',
      challengeId: 'c1',
      nonce: 'n1',
    };
    const err = { response: { status: 403, data: body } };
    expect(getLoginErrorResponseBody(err)).toEqual(body);
    expect(getLoginErrorResponseBody(new Error('network'))).toBeUndefined();
    expect(isSecurityReviewLoginError(err)).toBe(true);
    expect(
      isSecurityReviewLoginError({ response: { data: { code: 'MFA_REQUIRED' } } })
    ).toBe(false);
  });
});
