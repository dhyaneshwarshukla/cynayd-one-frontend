"use client";

import { BuildingOffice2Icon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

interface OrganizationBannerProps {
  organizationName: string;
  userEmail?: string;
  roleLabel?: string;
  className?: string;
}

export function OrganizationBanner({
  organizationName,
  userEmail,
  roleLabel,
  className,
}: OrganizationBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm',
        className
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <BuildingOffice2Icon className="h-6 w-6 text-white" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-300">
              Workspace
            </p>
            <h2 className="truncate text-lg font-semibold text-white sm:text-xl">
              {organizationName}
            </h2>
            {userEmail && (
              <p className="mt-0.5 truncate text-sm text-slate-300">{userEmail}</p>
            )}
          </div>
        </div>
        {roleLabel && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
            {roleLabel}
          </span>
        )}
      </div>
    </div>
  );
}
