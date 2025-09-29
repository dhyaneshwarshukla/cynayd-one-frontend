"use client";

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FormField } from '../common/FormField';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appData: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    url?: string;
    domain?: string;
  }) => Promise<void>;
  userRole: string;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userRole
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📱',
    color: '#3b82f6',
    url: '',
    domain: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '📱',
        color: '#3b82f6',
        url: '',
        domain: ''
      });
      onClose();
    } catch (error) {
      console.error('Failed to create app:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {userRole === 'SUPER_ADMIN' ? 'Add New Application' : 'Add Organization Application'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Application Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value as string)}
                placeholder="Enter application name"
                required
                error={errors.name}
                className={errors.name ? 'border-red-500' : ''}
              />

              <FormField
                label="Application Slug"
                name="slug"
                type="text"
                value={formData.slug}
                onChange={(value) => handleInputChange('slug', (value as string).toLowerCase())}
                placeholder="my-application"
                required
                error={errors.slug}
                helpText="Used in URLs (e.g., 'my-app' for /my-app)"
                className={errors.slug ? 'border-red-500' : ''}
              />
            </div>

            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value as string)}
              placeholder="Describe what this application does..."
              helpText="Brief description of the application"
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Icon"
                name="icon"
                type="text"
                value={formData.icon}
                onChange={(value) => handleInputChange('icon', value as string)}
                placeholder="📱"
                helpText="Emoji or icon for the application"
              />

              <div>
                <FormField
                  label="Color"
                  name="color"
                  type="text"
                  value={formData.color}
                  onChange={(value) => handleInputChange('color', value as string)}
                  placeholder="#3b82f6"
                  helpText="Hex color code for the application"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-gray-300 mt-2"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Application URL"
                name="url"
                type="url"
                value={formData.url}
                onChange={(value) => handleInputChange('url', value as string)}
                placeholder="https://myapp.example.com"
                error={errors.url}
                helpText="URL where the application is hosted"
                className={errors.url ? 'border-red-500' : ''}
              />

              <FormField
                label="Domain"
                name="domain"
                type="text"
                value={formData.domain}
                onChange={(value) => handleInputChange('domain', value as string)}
                placeholder="myapp.example.com"
                helpText="Domain for SSO integration (optional)"
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Application'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
