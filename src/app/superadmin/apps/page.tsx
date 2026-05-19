"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

function AppsPageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/** Client-only: avoids static export timeout (auth/API + usePathname bailout). */
const AdminAppsManagement = dynamic(
  () => import("@/components/admin/AdminAppsManagement"),
  { ssr: false, loading: () => <AppsPageFallback /> }
);

export default function SuperAdminAppsPage() {
  return (
    <Suspense fallback={<AppsPageFallback />}>
      <AdminAppsManagement superAdminScope />
    </Suspense>
  );
}
