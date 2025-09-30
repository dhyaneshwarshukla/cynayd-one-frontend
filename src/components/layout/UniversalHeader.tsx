"use client";

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Menu } from '@headlessui/react';
import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface UniversalHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  variant?: 'landing' | 'dashboard';
}

export const UniversalHeader: React.FC<UniversalHeaderProps> = ({
  onMenuClick,
  showMenuButton = false,
  variant = 'dashboard'
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLanding = variant === 'landing';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <header className={`sticky top-0 z-50 ${isLanding ? 'bg-white/80 backdrop-blur-md' : 'bg-white'} shadow-sm border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">CYNAYD One</h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Dashboard
                </a>
                <a href="/dashboard/profile" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Profile
                </a>
                <a href="/apps" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Apps
                </a>
                
              </>
            ) : (
              <>
                <a href="#apps" className="text-gray-600 hover:text-gray-900 transition-colors">Apps</a>
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Mobile menu button */}
                {showMenuButton && (
                  <button
                    type="button"
                    className="md:hidden -m-2.5 p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={onMenuClick}
                  >
                    <span className="sr-only">Open sidebar</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                  </button>
                )}

                {/* Notifications */}
                <button
                  type="button"
                  className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    <span className="sr-only">3 notifications</span>
                  </span>
                </button>

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white shadow-sm"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=3b82f6&color=ffffff&size=40`}
                          alt={`${user?.name || user?.email} profile`}
                          width={40}
                          height={40}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=6b7280&color=ffffff&size=40`;
                          }}
                        />
                        {/* Online status indicator */}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                      </div>
                      {/* Dropdown arrow */}
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </Menu.Button>

                  <Menu.Items className="absolute right-0 z-10 mt-3 w-64 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-900/5 focus:outline-none border border-gray-100">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center space-x-3">
                        <Image
                          className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=3b82f6&color=ffffff&size=48`}
                          alt={`${user?.name || user?.email} profile`}
                          width={48}
                          height={48}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=6b7280&color=ffffff&size=48`;
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                          <p className="text-xs text-green-600 font-medium">● Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="/dashboard/profile"
                            className={`flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                              active ? "bg-gray-50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Your Profile</p>
                                <p className="text-xs text-gray-500">View and edit profile</p>
                              </div>
                            </div>
                          </a>
                        )}
                      </Menu.Item>
                      
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="/dashboard/settings"
                            className={`flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                              active ? "bg-gray-50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Settings</p>
                                <p className="text-xs text-gray-500">Account preferences</p>
                              </div>
                            </div>
                          </a>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="/dashboard/help"
                            className={`flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                              active ? "bg-gray-50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Help & Support</p>
                                <p className="text-xs text-gray-500">Get help and support</p>
                              </div>
                            </div>
                          </a>
                        )}
                      </Menu.Item>
                    </div>

                    {/* Logout section */}
                    <div className="border-t border-gray-100 pt-2">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => logout()}
                            className={`flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors ${
                              active ? "bg-red-50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Sign out</p>
                                <p className="text-xs text-red-500">Logout from your account</p>
                              </div>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <a href="/auth/login">Login</a>
                </Button>
                <Button asChild>
                  <a href="/auth/register">Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
