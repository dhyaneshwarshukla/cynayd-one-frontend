/**
 * Extract a user-facing message from API client errors (axios-like shape).
 */
export function formatApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const data = (error as Error & { response?: { data?: Record<string, unknown> } })
    .response?.data;

  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data?.error)) {
    const parts = (data.error as Array<{ message?: string; path?: (string | number)[] }>)
      .map((item) => {
        const field = item.path?.length ? `${item.path.join('.')}: ` : '';
        return item.message ? `${field}${item.message}` : '';
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join('; ');
  }

  if (typeof data?.error === 'string') {
    return data.error;
  }

  if (error.message && !error.message.startsWith('HTTP error!')) {
    return error.message;
  }

  return fallback;
}
