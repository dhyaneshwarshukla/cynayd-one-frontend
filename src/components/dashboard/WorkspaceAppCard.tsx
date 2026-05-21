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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }}
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
            <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-blue-700">
              {app.name}
            </h3>
            {app.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                {app.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              app.isActive
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {app.isActive ? 'Ready' : 'Unavailable'}
          </span>
          {app.access?.expiresAt && (
            <span className="text-xs text-gray-400">
              Expires {new Date(app.access.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
        <button
          type="button"
          onClick={() => onOpen(app)}
          disabled={!app.isActive || isLaunching}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          aria-label={`Open ${app.name}`}
        >
          {isLaunching ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              Open app
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    </article>
  );
}
