"use client";

import { Suspense } from "react";
import AdminAppsManagement from "@/components/admin/AdminAppsManagement";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

function AppsPageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function AdminAppsPage() {
  return (
    <Suspense fallback={<AppsPageFallback />}>
      <AdminAppsManagement />
    </Suspense>
  );
}
