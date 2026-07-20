import { parseAccessOpsError } from '../client';

function apiError(code: string, error: string): Error {
  const err = new Error('Request failed') as Error & {
    response?: { data?: { error?: string; code?: string } };
  };
  err.response = { data: { code, error } };
  return err;
}

describe('parseAccessOpsError', () => {
  it('maps known codes to safe user-facing messages', () => {
    expect(parseAccessOpsError(apiError('PERMISSION_DENIED', 'PERMISSION_DENIED raw')).message).toBe(
      'You do not have permission to perform this action.'
    );
  });

  it('does not expose environment variable names from backend errors', () => {
    const message = parseAccessOpsError(
      apiError('CONFIGURATION_REQUIRED', 'Missing ACCESSOPS_SECRET_KEY in process.env')
    ).message;
    expect(message).toBe('Additional configuration is required before this action can run.');
    expect(message).not.toMatch(/process\.env/i);
    expect(message).not.toMatch(/ACCESSOPS_SECRET_KEY/);
  });

  it('maps network failures to a generic connection message', () => {
    expect(parseAccessOpsError(new Error('Failed to fetch')).message).toContain('Network error');
  });
});
