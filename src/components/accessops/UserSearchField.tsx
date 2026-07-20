'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { accessOpsClient, AccessOpsPerson } from '../../lib/accessops/client';

export interface UserSearchFieldProps {
  label: string;
  value: string;
  onChange: (userId: string, user?: AccessOpsPerson) => void;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  id?: string;
}

/** Server-side people search backed by AccessOps GET /people (not legacy /api/users). */
export function UserSearchField({
  label,
  value,
  onChange,
  required,
  disabled,
  helpText,
  id: idProp,
}: UserSearchFieldProps) {
  const autoId = useId();
  const inputId = idProp || autoId;
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<AccessOpsPerson[]>([]);
  const [selected, setSelected] = useState<AccessOpsPerson | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    let cancelled = false;
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      accessOpsClient
        .listPeople({ search: query.trim() || undefined, limit: 12 })
        .then((page) => {
          if (cancelled) return;
          setPeople(page.items);
          if (value) {
            const match = page.items.find((p) => p.id === value);
            if (match) setSelected(match);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setLoadError(e.message || 'Failed to search people');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value]);

  useEffect(() => {
    if (selected && selected.id === value) {
      setQuery(`${selected.name}${selected.email ? ` (${selected.email})` : ''}`);
    } else if (!value) {
      setQuery('');
      setSelected(null);
    }
  }, [selected, value]);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-required={required}
        disabled={disabled}
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
        placeholder={loading ? 'Searching…' : 'Search by name or email'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange('');
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
      />
      {helpText && (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
      {loadError && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {loadError}
        </p>
      )}
      {open && people.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {people.map((person) => (
            <li key={person.id} role="option" aria-selected={person.id === value}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(person.id, person);
                  setSelected(person);
                  setQuery(`${person.name}${person.email ? ` (${person.email})` : ''}`);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-gray-900">{person.name}</span>
                {person.email && (
                  <span className="block text-xs text-gray-500">{person.email}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <input type="hidden" name={`${inputId}-userId`} value={value} readOnly />
      )}
    </div>
  );
}
