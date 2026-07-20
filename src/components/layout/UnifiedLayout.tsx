"use client";

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UniversalHeader } from './UniversalHeader';
import { AdminNavigation } from '../navigation/AdminNavigation';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BrandLink } from '../common/BrandLink';
import { ConsentBanner } from '../consent/ConsentBanner';
import { MFASetupModal } from '../auth/MFASetupModal';
import { useAccessOpsNavVisible } from '../accessops/PermissionGuard';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'landing' | 'dashboard';
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  title,
  subtitle,
  variant = 'dashboard',
  actions,
  breadcrumb,
}) => {
  const { user, isLoading, mustEnrollMfa, clearMustEnrollMfa } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLanding = variant === 'landing';
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const { visible: accessOpsVisible } = useAccessOpsNavVisible();
  const shouldShowSidebar = !isLanding && (isAdmin || accessOpsVisible);

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
    <div className="dashboard-workspace min-h-screen bg-slate-50/90">
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
                    <BrandLink name="CYNAYD" />
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
              <BrandLink name="CYNAYD" />
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
        
        <main className="py-6 sm:py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {(title || subtitle || actions || breadcrumb?.length) && (
              <header className="mb-6 border-b border-slate-200/80 pb-6 sm:mb-8">
                {breadcrumb && breadcrumb.length > 0 && (
                  <nav aria-label="Breadcrumb" className="mb-3">
                    <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      {breadcrumb.map((item, index) => (
                        <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                          {index > 0 && (
                            <span className="text-slate-300" aria-hidden>
                              /
                            </span>
                          )}
                          {item.href ? (
                            <a
                              href={item.href}
                              className="font-medium transition-colors hover:text-slate-800"
                            >
                              {item.label}
                            </a>
                          ) : (
                            <span className="font-medium text-slate-700">{item.label}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {title && (
                      <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
                </div>
              </header>
            )}
            {children}
          </div>
        </main>
      </div>
      {!isLanding && user && <ConsentBanner />}
      {!isLanding && user && mustEnrollMfa && (
        <MFASetupModal
          isOpen
          requiredEnrollment
          onClose={() => {}}
          onSuccess={() => {
            clearMustEnrollMfa();
          }}
        />
      )}
    </div>
  );
};
