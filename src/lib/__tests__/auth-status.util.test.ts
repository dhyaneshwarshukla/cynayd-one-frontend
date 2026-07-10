import { handleAuthStatusCode, authStatusUserMessage } from '../auth-status.util';

describe('auth-status.util', () => {
  it('maps SECURITY_REVIEW_REQUIRED to challenge handling', () => {
    const h = handleAuthStatusCode('SECURITY_REVIEW_REQUIRED', {
      message: 'Needs review',
    });
    expect(h.kind).toBe('challenge');
    if (h.kind === 'challenge') {
      expect(authStatusUserMessage(h)).toContain('review');
    }
  });

  it('maps TEMPORARILY_LOCKED with retry hint', () => {
    const h = handleAuthStatusCode('TEMPORARILY_LOCKED', {
      retryAfterSeconds: 120,
    });
    expect(h.kind).toBe('blocked');
    if (h.kind === 'blocked') {
      expect(authStatusUserMessage(h)).toMatch(/2 minutes|Try again/i);
    }
  });

  it('unknown status uses safe fallback message', () => {
    const h = handleAuthStatusCode('BRAND_NEW_CODE');
    expect(h.kind).toBe('unknown');
    expect(authStatusUserMessage(h)).toMatch(/could not be completed/i);
  });

  it('MFA_REQUIRED continues as challenge', () => {
    expect(handleAuthStatusCode('MFA_REQUIRED').kind).toBe('challenge');
  });
});
