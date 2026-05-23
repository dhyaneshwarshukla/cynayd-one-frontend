"use client";

import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/utils/cn';

interface QuickLinkCardProps {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
}

export function QuickLinkCard({
  href,
  label,
  description,
  icon: Icon,
  className,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm transition-all',
        'hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
        className
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <ChevronRightIcon
        className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
        aria-hidden
      />
    </Link>
  );
}
