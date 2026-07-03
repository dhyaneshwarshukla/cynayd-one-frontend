'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

const ACTION_OPTIONS = [
  { id: 'allow', label: 'Allow', description: 'Permit sign-in when conditions match' },
  { id: 'block', label: 'Block', description: 'Deny sign-in' },
  { id: 'require_mfa', label: 'Require MFA', description: 'Challenge enrolled users; grace period for others' },
  {
    id: 'require_mfa_enrollment',
    label: 'Require MFA enrollment',
    description: 'Hard block until MFA is configured',
  },
  {
    id: 'require_approval',
    label: 'Require mobile approval',
    description: 'Approve sign-in from the CYNAYD One Auth app',
  },
] as const;

export interface CreateAccessPolicyPayload {
  name: string;
  countries: string;
  matchUnknownCountry: boolean;
  blockIfVpn: boolean;
  blockIfProxy: boolean;
  useMinTrustScore: boolean;
  minTrustScore: number;
  blockAction: boolean;
  selectedActions: string[];
}

interface CreateAccessPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAccessPolicyPayload) => Promise<void>;
  saving?: boolean;
}

const DEFAULT_FORM: CreateAccessPolicyPayload = {
  name: '',
  countries: '',
  matchUnknownCountry: false,
  blockIfVpn: false,
  blockIfProxy: false,
  useMinTrustScore: false,
  minTrustScore: 50,
  blockAction: false,
  selectedActions: ['require_mfa'],
};

export function CreateAccessPolicyModal({
  isOpen,
  onClose,
  onSubmit,
  saving = false,
}: CreateAccessPolicyModalProps) {
  const [form, setForm] = useState<CreateAccessPolicyPayload>(DEFAULT_FORM);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(DEFAULT_FORM);
      setNameError(null);
    }
  }, [isOpen]);

  const update = <K extends keyof CreateAccessPolicyPayload>(
    key: K,
    value: CreateAccessPolicyPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'name' && nameError) setNameError(null);
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Policy name is required');
      return;
    }
    await onSubmit(form);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Create access policy
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      Define conditions and actions evaluated at sign-in. Higher priority rules run first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={saving}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <Input
                      label="Policy name"
                      required
                      placeholder="e.g. US & CA — require MFA"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      error={nameError ?? undefined}
                    />

                    <Input
                      label="Countries"
                      placeholder="US, CA, GB"
                      helperText="Comma-separated ISO country codes. Leave empty for all regions."
                      value={form.countries}
                      onChange={(e) => update('countries', e.target.value)}
                    />

                    {form.countries.trim().length > 0 && (
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.matchUnknownCountry}
                          onChange={(e) => update('matchUnknownCountry', e.target.checked)}
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-900">
                            Apply to unknown locations
                          </span>
                          <span className="block text-xs text-gray-500">
                            When enabled, sign-ins with an unresolved country also match this rule.
                          </span>
                        </span>
                      </label>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <ConditionToggle
                        label="Match VPN logins"
                        description="Apply when the session appears to use a VPN."
                        checked={form.blockIfVpn}
                        onChange={(checked) => update('blockIfVpn', checked)}
                      />
                      <ConditionToggle
                        label="Match proxy logins"
                        description="Apply when the session appears to use a proxy."
                        checked={form.blockIfProxy}
                        onChange={(checked) => update('blockIfProxy', checked)}
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={form.useMinTrustScore}
                        onChange={(e) => update('useMinTrustScore', e.target.checked)}
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-gray-900">
                          Require minimum device trust score
                        </span>
                        <span className="block text-xs text-gray-500">
                          Policy matches only when device trust score is at or above this value.
                        </span>
                        {form.useMinTrustScore && (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={form.minTrustScore}
                            onChange={(e) => update('minTrustScore', Number(e.target.value))}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            aria-label="Minimum device trust score"
                          />
                        )}
                      </span>
                    </label>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-gray-700">Actions when matched</legend>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          checked={form.blockAction}
                          onChange={(e) => update('blockAction', e.target.checked)}
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-900">Block sign-in</span>
                          <span className="block text-xs text-gray-500">
                            Overrides action checkboxes below.
                          </span>
                        </span>
                      </label>
                      {!form.blockAction && (
                        <div className="space-y-2">
                          {ACTION_OPTIONS.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={form.selectedActions.includes(opt.id)}
                                onChange={(e) => {
                                  update(
                                    'selectedActions',
                                    e.target.checked
                                      ? [...form.selectedActions, opt.id]
                                      : form.selectedActions.filter((x) => x !== opt.id)
                                  );
                                }}
                              />
                              <span>
                                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                                <span className="block text-xs text-gray-500">{opt.description}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </fieldset>
                  </div>

                  <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={saving} disabled={saving}>
                      Create policy
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ConditionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
      <input
        type="checkbox"
        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="block text-xs text-gray-500">{description}</span>
      </span>
    </label>
  );
}
