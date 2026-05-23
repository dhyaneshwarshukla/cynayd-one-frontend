import React from 'react';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  loading?: boolean;
  className?: string;
  variant?: 'default' | 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
}

const variantStyles = {
  default: {
    card: 'border-slate-200/80 bg-white',
    icon: 'bg-slate-100 text-slate-600',
    accent: 'bg-slate-500',
  },
  blue: {
    card: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/50',
    icon: 'bg-blue-100 text-blue-700',
    accent: 'bg-blue-600',
  },
  emerald: {
    card: 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50',
    icon: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-600',
  },
  violet: {
    card: 'border-violet-100 bg-gradient-to-br from-white to-violet-50/50',
    icon: 'bg-violet-100 text-violet-700',
    accent: 'bg-violet-600',
  },
  amber: {
    card: 'border-amber-100 bg-gradient-to-br from-white to-amber-50/50',
    icon: 'bg-amber-100 text-amber-700',
    accent: 'bg-amber-600',
  },
  slate: {
    card: 'border-slate-200/80 bg-white',
    icon: 'bg-slate-100 text-slate-600',
    accent: 'bg-slate-600',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  description,
  loading = false,
  className = '',
  variant = 'default',
}) => {
  const styles = variantStyles[variant];

  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return 'text-emerald-600';
      case 'decrease':
        return 'text-red-600';
      case 'neutral':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  };

  const getChangeIcon = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      case 'neutral':
        return '→';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-5 shadow-sm',
          styles.card,
          className
        )}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-8 w-16 rounded bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md',
        styles.card,
        className
      )}
    >
      <div className={cn('absolute left-0 top-0 h-full w-1', styles.accent)} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
              {value}
            </p>
            {change && (
              <span className={cn('text-xs font-medium', getChangeColor())}>
                {getChangeIcon()} {Math.abs(change.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              styles.icon
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
};
