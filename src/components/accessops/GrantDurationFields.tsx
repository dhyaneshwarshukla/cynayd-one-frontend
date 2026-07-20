'use client';

import React from 'react';
import type { GrantDurationUsage } from '../../lib/accessops/grant-form';

export function GrantDurationFields({
  value,
  onChange,
  disabled,
}: {
  value: GrantDurationUsage;
  onChange: (next: GrantDurationUsage) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <fieldset disabled={disabled} className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Access duration</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="duration-mode"
            checked={value.durationMode === 'none'}
            onChange={() => onChange({ ...value, durationMode: 'none' })}
          />
          No expiry
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="duration-mode"
            checked={value.durationMode === 'until'}
            onChange={() => onChange({ ...value, durationMode: 'until' })}
          />
          Until date
        </label>
        {value.durationMode === 'until' && (
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={value.expiresAt}
            onChange={(e) => onChange({ ...value, expiresAt: e.target.value })}
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="duration-mode"
            checked={value.durationMode === 'days'}
            onChange={() => onChange({ ...value, durationMode: 'days' })}
          />
          For N days
        </label>
        {value.durationMode === 'days' && (
          <input
            type="number"
            min={1}
            className="mt-1 w-full max-w-xs rounded-md border px-3 py-2 text-sm"
            value={value.durationDays}
            onChange={(e) => onChange({ ...value, durationDays: e.target.value })}
            placeholder="e.g. 30"
          />
        )}
      </fieldset>

      <fieldset disabled={disabled} className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">SSO launch usage</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="usage-mode"
            checked={value.usageMode === 'unlimited'}
            onChange={() => onChange({ ...value, usageMode: 'unlimited' })}
          />
          Unlimited launches
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="usage-mode"
            checked={value.usageMode === 'max'}
            onChange={() => onChange({ ...value, usageMode: 'max' })}
          />
          Max launches
        </label>
        {value.usageMode === 'max' && (
          <input
            type="number"
            min={0}
            className="mt-1 w-full max-w-xs rounded-md border px-3 py-2 text-sm"
            value={value.maxLaunches}
            onChange={(e) => onChange({ ...value, maxLaunches: e.target.value })}
            placeholder="e.g. 10"
          />
        )}
      </fieldset>
    </div>
  );
}
