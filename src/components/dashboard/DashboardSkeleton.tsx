"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-hidden="true" aria-busy="true">
      <div className="h-28 animate-pulse rounded-xl bg-slate-200/80" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-14 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-11 w-full max-w-lg animate-pulse rounded-lg bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="mb-3 h-4 w-32 animate-pulse rounded bg-slate-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
