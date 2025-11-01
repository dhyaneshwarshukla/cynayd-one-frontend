"use client";

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UniversalHeader } from './UniversalHeader';
import { AdminNavigation } from '../navigation/AdminNavigation';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'landing' | 'dashboard';
  actions?: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  title,
  subtitle,
  variant = 'dashboard',
  actions
}) => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLanding = variant === 'landing';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'admin' || user?.role === 'super_admin';
  const shouldShowSidebar = !isLanding && isAdmin;

  // For landing page, show content immediately without waiting for auth
  if (isLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <UniversalHeader variant="landing" />
        {children}
      </div>
    );
  }

  // For dashboard pages, show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // For dashboard pages, show sidebar if user is admin
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">C</span>
                      </div>
                      <span className="text-xl font-semibold">CYNAYD</span>
                    </div>
                  </div>
                  <AdminNavigation variant="mobile" />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      {shouldShowSidebar && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-semibold">CYNAYD</span>
              </div>
            </div>
            <AdminNavigation variant="sidebar" />
          </div>
        </div>
      )}

      <div className={shouldShowSidebar ? "lg:pl-64" : ""}>
        <UniversalHeader 
          variant="dashboard" 
          showMenuButton={shouldShowSidebar}
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            {(title || subtitle || actions) && (
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    {title && (
                      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    )}
                    {subtitle && (
                      <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
                    )}
                  </div>
                  {actions && (
                    <div className="flex-shrink-0">
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
