"use client";

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FormField } from '../common/FormField';
import { LoadingSpinner } from '../common/LoadingSpinner';
import apiClient from '../../lib/api-client';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface AppCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppCreated: () => void;
  isSystemApp?: boolean;
}

export const AppCreationModal: React.FC<AppCreationModalProps> = ({
  isOpen,
  onClose,
  onAppCreated,
  isSystemApp = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    url: '',
    domain: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'App name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'App slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    
    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsCreating(true);
    try {
      await apiClient.createApp({
        ...formData,
        systemApp: isSystemApp
      });
      
      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '#3b82f6',
        url: '',
        domain: ''
      });
      
      onAppCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create app:', error);
      setErrors({ submit: 'Failed to create app. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '#3b82f6',
        url: '',
        domain: ''
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isSystemApp ? 'Create System App' : 'Create New App'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isSystemApp 
                  ? 'System apps are managed by super admins and cannot be modified by organization admins.'
                  : 'Add a new application for your organization.'
                }
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isCreating}
              className="p-2"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="App Name" 
                name="name"
                type="text"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value as string)}
                placeholder="My Application"
                required
                error={errors.name}
                disabled={isCreating}
              />
              
              <FormField 
                label="App Slug" 
                name="slug"
                type="text"
                value={formData.slug}
                onChange={(value) => handleInputChange('slug', (value as string).toLowerCase())}
                placeholder="my-application"
                required
                error={errors.slug}
                disabled={isCreating}
              />
            </div>

            <FormField 
              label="Description" 
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value as string)}
              placeholder="Brief description of the application"
              rows={3}
              disabled={isCreating}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="Icon" 
                name="icon"
                type="text"
                value={formData.icon}
                onChange={(value) => handleInputChange('icon', value as string)}
                placeholder="📱 or icon name"
                disabled={isCreating}
              />
              
              <div>
                <FormField 
                  label="Color" 
                  name="color"
                  type="text"
                  value={formData.color}
                  onChange={(value) => handleInputChange('color', value as string)}
                  placeholder="#3b82f6"
                  disabled={isCreating}
                />
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer mt-2"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="App URL" 
                name="url"
                type="url"
                value={formData.url}
                onChange={(value) => handleInputChange('url', value as string)}
                placeholder="https://myapp.example.com"
                error={errors.url}
                disabled={isCreating}
              />
              
              <FormField 
                label="Domain" 
                name="domain"
                type="text"
                value={formData.domain}
                onChange={(value) => handleInputChange('domain', value as string)}
                placeholder="myapp.example.com"
                disabled={isCreating}
              />
            </div>

            {errors.submit && (
              <div className="text-red-600 text-sm">{errors.submit}</div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <PlusIcon className="w-4 h-4 mr-2" />
              )}
              {isCreating ? 'Creating...' : 'Create App'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
