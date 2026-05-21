"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function AppsRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const role = user?.role?.toUpperCase();
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      router.replace("/admin/apps");
      return;
    }

    router.replace("/dashboard");
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
