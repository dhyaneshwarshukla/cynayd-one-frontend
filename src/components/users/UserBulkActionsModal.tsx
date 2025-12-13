"use client";

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import { Role } from '@/lib/api-client';

interface UserBulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onAction: (action: 'delete' | 'activate' | 'deactivate' | 'changeRole', role?: string) => Promise<void>;
  availableRoles: Role[];
  isLoading?: boolean;
}

export const UserBulkActionsModal: React.FC<UserBulkActionsModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onAction,
  availableRoles,
  isLoading = false,
}) => {
  const [action, setAction] = useState<'delete' | 'activate' | 'deactivate' | 'changeRole'>('activate');
  const [role, setRole] = useState(availableRoles.length > 0 ? availableRoles[0].name.toLowerCase() : 'user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onAction(action, action === 'changeRole' ? role : undefined);
      onClose();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    Bulk Actions ({selectedCount} users)
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="bulk-action" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Action
                    </label>
                    <select
                      id="bulk-action"
                      value={action}
                      onChange={(e) => setAction(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activate">Activate Users</option>
                      <option value="deactivate">Deactivate Users</option>
                      <option value="changeRole">Change Role</option>
                      <option value="delete">Delete Users</option>
                    </select>
                  </div>

                  {action === 'changeRole' && (
                    <div>
                      <label htmlFor="bulk-role" className="block text-sm font-medium text-gray-700 mb-2">
                        New Role
                      </label>
                      <select
                        id="bulk-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableRoles.map((r) => (
                          <option key={r.id} value={r.name.toLowerCase()}>
                            {r.name} - {r.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {action === 'delete' && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">
                        <strong>Warning:</strong> This action cannot be undone. All selected users will be permanently deleted.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    variant={action === 'delete' ? 'outline' : 'default'}
                    className={`flex-1 ${action === 'delete' ? 'border-red-600 text-red-600 hover:bg-red-50' : ''}`}
                  >
                    {action === 'delete' ? 'Delete Users' : action === 'activate' ? 'Activate Users' : action === 'deactivate' ? 'Deactivate Users' : 'Change Role'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

