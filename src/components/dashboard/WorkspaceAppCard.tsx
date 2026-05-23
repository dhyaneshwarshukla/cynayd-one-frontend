"use client";

import { AppIcon } from '@/components/common/AppIcon';
import { AppWithAccess } from '@/lib/api-client';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface WorkspaceAppCardProps {
  app: AppWithAccess;
  onOpen: (app: AppWithAccess) => void;
  isLaunching?: boolean;
}

export function WorkspaceAppCard({ app, onOpen, isLaunching }: WorkspaceAppCardProps) {
  const accent = app.color || '#2563eb';

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:ring-offset-2"
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-90 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <AppIcon
            name={app.name}
            icon={app.icon}
            iconUrl={app.iconUrl}
            color={app.color}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-800">
              {app.name}
            </h3>
            {app.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {app.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
              app.isActive
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/15'
                : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10'
            }`}
          >
            <span
              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                app.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              aria-hidden
            />
            {app.isActive ? 'Available' : 'Unavailable'}
          </span>
          {app.access?.expiresAt && (
            <span className="text-xs text-slate-400">
              Expires {new Date(app.access.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <button
          type="button"
          onClick={() => onOpen(app)}
          disabled={!app.isActive || isLaunching}
          className="enterprise-button flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          aria-label={`Launch ${app.name}`}
        >
          {isLaunching ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              Launch application
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    </article>
  );
}
