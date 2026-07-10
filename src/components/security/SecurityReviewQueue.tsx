'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, type SecurityReview } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Skeleton } from '@/components/common/LoadingSpinner';

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
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPendingSecurityReviews();
      setReviews(data.reviews ?? []);
    } catch {
      setReviews([]);
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
          High-risk sign-ins awaiting admin approval. Users resume with a token — sessions are not issued directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No pending reviews.</p>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium text-gray-900">User {r.userId}</p>
                <p className="text-gray-600">
                  Risk {r.riskLevel} ({r.riskScore}) · {parseReasons(r.riskReasons).join(', ') || '—'}
                </p>
                <p className="text-xs text-gray-400">
                  {r.ipAddress ?? 'unknown IP'} · expires {new Date(r.expiresAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={acting === r.id}
                  onClick={() => void deny(r.id)}
                >
                  Deny
                </Button>
                <Button size="sm" loading={acting === r.id} onClick={() => void approve(r.id)}>
                  Approve
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
