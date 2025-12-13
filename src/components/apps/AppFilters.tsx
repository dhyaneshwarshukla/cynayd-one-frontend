"use client";

import React from 'react';
import { SearchBar } from '../common/SearchBar';
import { FilterBar } from '../common/FilterBar';
import { Button } from '../common/Button';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface AppFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: 'all' | 'active' | 'expiring';
  onFilterChange: (status: 'all' | 'active' | 'expiring') => void;
  onClearFilters?: () => void;
}

export const AppFilters: React.FC<AppFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all';

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search apps by name or description..."
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onFilterChange('all')}
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filterStatus === 'all'}
          >
            All Apps
          </Button>
          <Button
            onClick={() => onFilterChange('active')}
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filterStatus === 'active'}
          >
            Active
          </Button>
          <Button
            onClick={() => onFilterChange('expiring')}
            variant={filterStatus === 'expiring' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filterStatus === 'expiring'}
          >
            Expiring Soon
          </Button>
        </div>
      </div>

      {hasActiveFilters && onClearFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <FunnelIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Filters active</span>
          </div>
          <Button onClick={onClearFilters} variant="ghost" size="sm">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

