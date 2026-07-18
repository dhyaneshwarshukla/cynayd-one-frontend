'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, type SecurityReview } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/Alert';
import { Skeleton } from '@/components/common/LoadingSpinner';
import { StepUpModal } from '@/components/auth/StepUpModal';

function parseReasons(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function SecurityReviewQueue() {
  const [reviews, setReviews] = useState<SecurityReview[]>([]);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [singleAdminWarning, setSingleAdminWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: 'approve' | 'deny';
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPendingSecurityReviews();
      setReviews(data.reviews ?? []);
      setAdminCount(typeof data.adminCount === 'number' ? data.adminCount : null);
      setSingleAdminWarning(Boolean(data.singleAdminWarning));
    } catch {
      setReviews([]);
      setAdminCount(null);
      setSingleAdminWarning(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await apiClient.approveSecurityReview(id, 'allow_once');
      await load();
    } finally {
      setActing(null);
    }
  };

  const completePendingAction = async () => {
    const pending = pendingAction;
    if (!pending) return;
    setPendingAction(null);
    setActionError(null);
    try {
      if (pending.action === 'approve') {
        await approve(pending.id);
      } else {
        await deny(pending.id);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Security review action failed');
    }
  };

  const deny = async (id: string) => {
    setActing(id);
    try {
      await apiClient.denySecurityReview(id);
      await load();
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending security reviews</CardTitle>
        <CardDescription>
          Risk-based security reviews awaiting admin approval. Users resume with a token — sessions are
          not issued from this queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionError && (
          <Alert variant="error">
            <AlertTitle>Unable to update security review</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}
        {singleAdminWarning && (
          <Alert variant="warning">
            <AlertTitle>Single administrator organization</AlertTitle>
            <AlertDescription>
              Your organization has {adminCount ?? 1} admin
              {adminCount === 1 ? '' : 's'}. Reviews for regular users can still be handled, but an
              administrator cannot approve their own login unless self-approval is enabled. Add another
              active administrator to avoid administrator lockout.
            </AlertDescription>
          </Alert>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No pending reviews.</p>
        ) : (
          reviews.map((r) => {
            const reasons = parseReasons(r.riskReasons);
            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-900">User {r.userId}</p>
                  <p className="text-gray-700">
                    Review type: <span className="font-medium">Risk-based security review</span>
                  </p>
                  <p className="text-gray-600">
                    Risk {r.riskLevel} ({r.riskScore})
                    {reasons.length ? ` · ${reasons.join(', ')}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    Device: {r.deviceId ?? 'unknown'} · {r.ipAddress ?? 'unknown IP'} · expires{' '}
                    {new Date(r.expiresAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={acting === r.id}
                    disabled={acting !== null || r.canCurrentAdminReview === false}
                    onClick={() => setPendingAction({ id: r.id, action: 'deny' })}
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    loading={acting === r.id}
                    disabled={acting !== null || r.canCurrentAdminReview === false}
                    onClick={() => setPendingAction({ id: r.id, action: 'approve' })}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      <StepUpModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onSuccess={() => void completePendingAction()}
      />
    </Card>
  );
}
