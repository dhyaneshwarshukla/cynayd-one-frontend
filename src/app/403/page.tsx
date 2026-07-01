'use client';

import Link from 'next/link';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export default function ForbiddenPage() {
  return (
    <UnifiedLayout title="Access Denied" subtitle="You do not have permission to view this page">
      <Card className="p-12 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">403 — Forbidden</h2>
        <p className="text-gray-600 mb-6">
          Your account is signed in, but it does not have the required role for this area.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Switch Account</Button>
          </Link>
        </div>
      </Card>
    </UnifiedLayout>
  );
}
