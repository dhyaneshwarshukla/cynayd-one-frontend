"use client";

import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export type RegisterResultModalVariant = 'success' | 'error';

export interface RegisterResultModalProps {
  isOpen: boolean;
  variant: RegisterResultModalVariant;
  title: string;
  message: string;
  email?: string;
  requiresVerification?: boolean;
  onClose: () => void;
  onRegisterAnother?: () => void;
}

export const RegisterResultModal: React.FC<RegisterResultModalProps> = ({
  isOpen,
  variant,
  title,
  message,
  email,
  requiresVerification = false,
  onClose,
  onRegisterAnother,
}) => {
  const isSuccess = variant === 'success';
  const { resendVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!email) return;
    setIsResending(true);
    setResendMessage(null);
    try {
      await resendVerification(email);
      setResendMessage('Verification email sent. Please check your inbox.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to resend verification email';
      setResendMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                  <div
                    className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 ${
                      isSuccess ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircleIcon className="h-8 w-8 text-green-600" aria-hidden />
                    ) : (
                      <XCircleIcon className="h-8 w-8 text-red-600" aria-hidden />
                    )}
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex-1">
                    <Dialog.Title
                      as="h3"
                      className={`text-xl font-semibold ${
                        isSuccess ? 'text-gray-900' : 'text-red-900'
                      }`}
                    >
                      {title}
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-600">{message}</p>

                    {isSuccess && requiresVerification && email && (
                      <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-800">
                        <EnvelopeIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="break-all font-medium">{email}</span>
                      </div>
                    )}

                    {isSuccess && requiresVerification && (
                      <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 p-4 text-left">
                        <p className="text-sm font-medium text-gray-900 mb-2">Next steps</p>
                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                          <li>Check your inbox (and spam folder)</li>
                          <li>Click the verification link in the email</li>
                          <li>Sign in to access your workspace</li>
                        </ol>
                        {email && (
                          <div className="mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleResendVerification}
                              disabled={isResending}
                              className="w-full sm:w-auto text-sm"
                            >
                              {isResending ? 'Sending...' : 'Resend verification email'}
                            </Button>
                            {resendMessage && (
                              <p className="mt-2 text-sm text-gray-600">{resendMessage}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {isSuccess ? (
                    <>
                      {onRegisterAnother && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onRegisterAnother}
                          className="w-full sm:w-auto"
                        >
                          Register another
                        </Button>
                      )}
                      <Link
                        href="/auth/login"
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        Go to login
                      </Link>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Try again
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
