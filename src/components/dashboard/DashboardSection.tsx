"use client";

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface DashboardSectionProps {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'plain';
}

export function DashboardSection({
  id,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  variant = 'default',
}: DashboardSectionProps) {
  return (
    <section id={id} className={cn('space-y-4', className)} aria-labelledby={id ? `${id}-heading` : undefined}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id={id ? `${id}-heading` : undefined}
            className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div
        className={cn(
          variant === 'default' &&
            'rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6',
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
