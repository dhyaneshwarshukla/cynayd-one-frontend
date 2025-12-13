"use client";

import React from 'react';
import { Button } from './Button';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  filters: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }>;
  activeFiltersCount?: number;
  onClearAll?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeFiltersCount = 0,
  onClearAll,
  className = '',
}) => {
  const hasActiveFilters = activeFiltersCount > 0 || filters.some(f => f.value !== 'all' && f.value !== '');

  return (
    <div className={cn('flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <FunnelIcon className="h-5 w-5" aria-hidden="true" />
        <span>Filters:</span>
      </div>

      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">
            {filter.label}:
          </label>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            aria-label={`Filter by ${filter.label}`}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.count !== undefined ? ` (${option.count})` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasActiveFilters && onClearAll && (
        <Button
          onClick={onClearAll}
          variant="ghost"
          size="sm"
          className="ml-auto text-gray-600 hover:text-gray-900"
        >
          <XMarkIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          Clear All
        </Button>
      )}
    </div>
  );
};

