"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import { Role } from '@/lib/api-client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    name: string;
    role: string;
    organizationId?: string;
    password?: string;
    image?: string;
    generatePassword: boolean;
    sendWelcomeEmail: boolean;
  }) => Promise<void>;
  availableRoles: Role[];
  availableOrganizations?: Organization[];
  isSuperAdmin?: boolean;
  defaultOrganizationId?: string;
  isLoading?: boolean;
}

export const UserInviteModal: React.FC<UserInviteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableRoles,
  availableOrganizations = [],
  isSuperAdmin = false,
  defaultOrganizationId,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId || '');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState('');
  const [generatePassword, setGeneratePassword] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setEmail('');
      setName('');
      setRole(availableRoles.length > 0 ? availableRoles[0].name.toLowerCase() : 'user');
      setOrganizationId(defaultOrganizationId || '');
      setPassword('');
      setImage('');
      setGeneratePassword(true);
      setSendWelcomeEmail(true);
      setErrors({});
    }
  }, [isOpen, availableRoles, defaultOrganizationId]);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const validateName = (value: string): string => {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!generatePassword && !value.trim()) return 'Password is required';
    if (!generatePassword && value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateOrganization = (value: string): string => {
    if (isSuperAdmin && !value.trim()) return 'Organization selection is required';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    newErrors.email = validateEmail(email);
    newErrors.name = validateName(name);
    newErrors.password = validatePassword(password);
    newErrors.organization = validateOrganization(organizationId);
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        email: email.trim(),
        name: name.trim(),
        role,
        organizationId: isSuperAdmin ? organizationId : defaultOrganizationId,
        password: generatePassword ? undefined : password,
        image: image.trim() || undefined,
        generatePassword,
        sendWelcomeEmail,
      });
      
      // Reset form on success
      setEmail('');
      setName('');
      setPassword('');
      setImage('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setName('');
      setPassword('');
      setImage('');
      setErrors({});
      onClose();
    }
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                    Add New User
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* User Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                        User Information
                      </h4>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) {
                              setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                            }
                          }}
                          onBlur={() => setErrors(prev => ({ ...prev, email: validateEmail(email) }))}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="user@company.com"
                          required
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) {
                              setErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                            }
                          }}
                          onBlur={() => setErrors(prev => ({ ...prev, name: validateName(name) }))}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="John Doe"
                          required
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                        {errors.name && (
                          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {isSuperAdmin && (
                        <div>
                          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                            Organization <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="organization"
                            value={organizationId}
                            onChange={(e) => {
                              setOrganizationId(e.target.value);
                              if (errors.organization) {
                                setErrors(prev => ({ ...prev, organization: validateOrganization(e.target.value) }));
                              }
                            }}
                            onBlur={() => setErrors(prev => ({ ...prev, organization: validateOrganization(organizationId) }))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.organization ? 'border-red-300' : 'border-gray-300'
                            }`}
                            required
                            aria-invalid={!!errors.organization}
                            aria-describedby={errors.organization ? 'organization-error' : undefined}
                          >
                            <option value="">Select an organization...</option>
                            {availableOrganizations.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.name} {org.description && `- ${org.description}`}
                              </option>
                            ))}
                          </select>
                          {errors.organization && (
                            <p id="organization-error" className="mt-1 text-sm text-red-600" role="alert">
                              {errors.organization}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          id="role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {availableRoles
                            .filter((r) => {
                              if (r.name.toUpperCase() === 'SUPER_ADMIN' && !isSuperAdmin) {
                                return false;
                              }
                              return true;
                            })
                            .map((r) => (
                              <option key={r.id} value={r.name.toLowerCase()}>
                                {r.name} - {r.description}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                          Profile Image URL (Optional)
                        </label>
                        <input
                          id="image"
                          type="url"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com/profile.jpg"
                        />
                      </div>
                    </div>

                    {/* Account Setup */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                        Account Setup
                      </h4>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          id="generatePassword"
                          type="checkbox"
                          checked={generatePassword}
                          onChange={(e) => setGeneratePassword(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="generatePassword" className="text-sm font-medium text-gray-700">
                          Generate secure password automatically
                        </label>
                      </div>

                      {!generatePassword && (
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) {
                                setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                              }
                            }}
                            onBlur={() => setErrors(prev => ({ ...prev, password: validatePassword(password) }))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter secure password"
                            minLength={8}
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                          />
                          {errors.password && (
                            <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                              {errors.password}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <input
                          id="sendWelcomeEmail"
                          type="checkbox"
                          checked={sendWelcomeEmail}
                          onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700">
                          Send welcome email with login instructions
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !email.trim() || !name.trim() || (isSuperAdmin && !organizationId.trim())}
                      loading={isSubmitting}
                      className="flex-1"
                    >
                      Create User
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
};

