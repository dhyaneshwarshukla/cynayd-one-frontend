'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/common/Button';
import {
  formatActionLabel,
  getActionTone,
  parseAuditDetails,
} from './audit-log-utils';

export interface AuditLogDetail {
  id: string;
  action: string;
  resource: string;
  details?: unknown;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string | Date;
  user?: { name?: string | null; email?: string | null; role?: string };
}

interface AuditLogDetailModalProps {
  log: AuditLogDetail | null;
  onClose: () => void;
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  const parsed = log ? parseAuditDetails(log.details) : null;
  const tone = log ? getActionTone(log.action) : null;

  return (
    <Transition appear show={!!log} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
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
                {log && tone && (
                  <>
                    <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                      <div className="flex gap-3">
                        <span className="text-2xl" aria-hidden>
                          {tone.icon}
                        </span>
                        <div>
                          <Dialog.Title className="text-lg font-semibold text-gray-900">
                            {formatActionLabel(log.action)}
                          </Dialog.Title>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.badge}`}
                          >
                            {log.resource}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4 px-6 py-4">
                      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-gray-500">User</dt>
                          <dd className="font-medium text-gray-900">
                            {log.user?.name || log.user?.email || 'System'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Time</dt>
                          <dd className="font-medium text-gray-900">
                            {new Date(log.timestamp).toLocaleString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">IP address</dt>
                          <dd className="font-mono text-xs text-gray-900">
                            {log.ipAddress || '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Log ID</dt>
                          <dd className="truncate font-mono text-xs text-gray-700">{log.id}</dd>
                        </div>
                      </dl>

                      {log.userAgent && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-500">User agent</p>
                          <p className="break-all rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                            {log.userAgent}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Event details
                        </p>
                        {parsed && Object.keys(parsed).length > 0 ? (
                          <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                            {Object.entries(parsed).map(([key, value]) => (
                              <div
                                key={key}
                                className="grid grid-cols-3 gap-2 px-3 py-2 text-sm even:bg-gray-50/80"
                              >
                                <dt className="col-span-1 font-medium text-gray-600">{key}</dt>
                                <dd className="col-span-2 break-all font-mono text-xs text-gray-900">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="text-sm text-gray-500">No structured details for this event.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-gray-100 px-6 py-3">
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
