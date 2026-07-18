'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SecurityEvent } from '@/lib/api-client';
import { Button } from '@/components/common/Button';
import {
  formatEventTypeLabel,
  normalizeSeverity,
  parseEventDetails,
  severityBadgeClass,
} from './security-event-utils';

interface SecurityEventDetailModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
  onWhitelistIp?: (ip: string) => void;
}

export function SecurityEventDetailModal({
  event,
  onClose,
  onWhitelistIp,
}: SecurityEventDetailModalProps) {
  const parsed = event ? parseEventDetails(event.details) : null;

  return (
    <Transition appear show={!!event} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl">
                {event && (
                  <>
                    <div className="flex items-start justify-between border-b px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {formatEventTypeLabel(event.eventType)}
                        </Dialog.Title>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${severityBadgeClass(event.severity)}`}
                        >
                          {normalizeSeverity(event.severity)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                        aria-label="Close"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4 px-6 py-4 text-sm">
                      <dl className="grid grid-cols-2 gap-3">
                        <div>
                          <dt className="text-gray-500">Time</dt>
                          <dd className="font-medium">
                            {new Date(event.timestamp).toLocaleString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">IP</dt>
                          <dd className="font-mono text-xs">{event.ipAddress || '—'}</dd>
                        </div>
                        {event.user && (
                          <div className="col-span-2">
                            <dt className="text-gray-500">User</dt>
                            <dd className="font-medium">
                              {event.user.name || event.user.email}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {parsed && Object.keys(parsed).length > 0 && (
                        <dl className="divide-y rounded-lg border">
                          {Object.entries(parsed).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-2 px-3 py-2">
                              <dt className="font-medium text-gray-600">{key}</dt>
                              <dd className="col-span-2 break-all font-mono text-xs">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/audit"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          View audit logs
                        </Link>
                        <Link
                          href="/admin/access-policies"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Access policies
                        </Link>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t px-6 py-3">
                      {event.ipAddress && onWhitelistIp && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            onWhitelistIp(event.ipAddress!);
                            onClose();
                          }}
                        >
                          Whitelist IP
                        </Button>
                      )}
                      <Button variant="outline" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
