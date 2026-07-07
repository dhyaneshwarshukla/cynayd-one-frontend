'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  apiClient,
  CreateOrgLocationInput,
  OrgLocation,
  WorkingHoursDay,
} from '@/lib/api-client';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const DEFAULT_WORKING_HOURS: WorkingHoursDay[] = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isClosed: true },
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isClosed: false },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isClosed: false },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isClosed: false },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isClosed: false },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isClosed: false },
  { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isClosed: true },
];

type LocationFormState = {
  name: string;
  timezone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  workingHours: WorkingHoursDay[];
};

const EMPTY_FORM: LocationFormState = {
  name: '',
  timezone: 'UTC',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  phoneNumber: '',
  workingHours: DEFAULT_WORKING_HOURS,
};

function locationToForm(location: OrgLocation): LocationFormState {
  return {
    name: location.name,
    timezone: location.timezone,
    address: location.address || '',
    city: location.city || '',
    state: location.state || '',
    country: location.country || '',
    postalCode: location.postalCode || '',
    phoneNumber: location.phoneNumber || '',
    workingHours:
      location.workingHours.length === 7
        ? [...location.workingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        : DEFAULT_WORKING_HOURS,
  };
}

interface LocationsSettingsProps {
  onMessage: (message: string, isError?: boolean) => void;
}

export function LocationsSettings({ onMessage }: LocationsSettingsProps) {
  const [locations, setLocations] = useState<OrgLocation[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);
  const [defaultTimezone, setDefaultTimezone] = useState('UTC');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LocationFormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await apiClient.getOrgLocations();
      setLocations(snapshot.locations);
      setDefaultLocationId(snapshot.defaultLocationId);
      setDefaultTimezone(snapshot.defaultTimezone);
    } catch (err) {
      onMessage(err instanceof Error ? err.message : 'Failed to load locations', true);
    } finally {
      setIsLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (location: OrgLocation) => {
    setEditingId(location.id);
    setForm(locationToForm(location));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const updateWorkingHour = (dayOfWeek: number, patch: Partial<WorkingHoursDay>) => {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      onMessage('Location name is required', true);
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        await apiClient.updateOrgLocation(editingId, {
          name: form.name.trim(),
          timezone: form.timezone,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          country: form.country || null,
          postalCode: form.postalCode || null,
          phoneNumber: form.phoneNumber || null,
        });
        await apiClient.updateOrgLocationWorkingHours(editingId, form.workingHours);
        onMessage('Location updated');
      } else {
        const payload: CreateOrgLocationInput = {
          name: form.name.trim(),
          timezone: form.timezone,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          country: form.country || undefined,
          postalCode: form.postalCode || undefined,
          phoneNumber: form.phoneNumber || undefined,
          workingHours: form.workingHours,
          isDefault: locations.length === 0,
        };
        await apiClient.createOrgLocation(payload);
        onMessage('Location created');
      }
      closeForm();
      await load();
    } catch (err) {
      onMessage(err instanceof Error ? err.message : 'Failed to save location', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (locationId: string) => {
    try {
      await apiClient.setDefaultOrgLocation(locationId);
      onMessage('Default location updated');
      await load();
    } catch (err) {
      onMessage(err instanceof Error ? err.message : 'Failed to set default location', true);
    }
  };

  const handleDelete = async (location: OrgLocation) => {
    if (
      !window.confirm(
        `Delete "${location.name}"? Users assigned to this location will have their primary office cleared.`,
      )
    ) {
      return;
    }
    try {
      await apiClient.deleteOrgLocation(location.id);
      onMessage('Location deleted');
      if (editingId === location.id) closeForm();
      await load();
    } catch (err) {
      onMessage(err instanceof Error ? err.message : 'Failed to delete location', true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Office locations & working hours</h3>
          <p className="mt-1 text-sm text-gray-600">
            Configure multiple offices, each with its own timezone and daily schedule. Default org
            timezone: <span className="font-mono">{defaultTimezone}</span>
          </p>
        </div>
        <Button onClick={openCreate}>Add location</Button>
      </div>

      {locations.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          No office locations yet. Add your first location to set timezone and working hours.
        </p>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{location.name}</h4>
                    {location.isDefault && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {location.timezone}
                    {location.city || location.country
                      ? ` · ${[location.city, location.country].filter(Boolean).join(', ')}`
                      : ''}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {location.workingHours
                      .filter((d) => !d.isClosed)
                      .map((d) => `${DAY_LABELS[d.dayOfWeek].slice(0, 3)} ${d.startTime}–${d.endTime}`)
                      .join(' · ') || 'All days closed'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!location.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => void handleSetDefault(location.id)}>
                      Set default
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(location)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDelete(location)}
                    disabled={locations.length <= 1}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-4 font-medium text-gray-900">
            {editingId ? 'Edit location' : 'New location'}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Head Office"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State / Region</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Postal code</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6">
            <h5 className="mb-3 text-sm font-medium text-gray-900">Working hours</h5>
            <div className="space-y-2">
              {form.workingHours
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className="grid grid-cols-[120px_80px_1fr_1fr] items-center gap-2 text-sm"
                  >
                    <span className="text-gray-700">{DAY_LABELS[day.dayOfWeek]}</span>
                    <label className="flex items-center gap-1 text-gray-600">
                      <input
                        type="checkbox"
                        checked={day.isClosed}
                        onChange={(e) =>
                          updateWorkingHour(day.dayOfWeek, { isClosed: e.target.checked })
                        }
                      />
                      Closed
                    </label>
                    <input
                      type="time"
                      value={day.startTime}
                      disabled={day.isClosed}
                      onChange={(e) =>
                        updateWorkingHour(day.dayOfWeek, { startTime: e.target.value })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 disabled:bg-gray-100"
                    />
                    <input
                      type="time"
                      value={day.endTime}
                      disabled={day.isClosed}
                      onChange={(e) =>
                        updateWorkingHour(day.dayOfWeek, { endTime: e.target.value })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 disabled:bg-gray-100"
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? 'Saving…' : editingId ? 'Update location' : 'Create location'}
            </Button>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {defaultLocationId && (
        <p className="text-xs text-gray-500">
          Default location ID: <span className="font-mono">{defaultLocationId}</span>
        </p>
      )}
    </div>
  );
}
