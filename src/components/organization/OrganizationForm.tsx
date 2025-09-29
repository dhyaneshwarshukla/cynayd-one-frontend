"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logo: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  initialData?: OrganizationFormData;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  isLoading?: boolean;
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: OrganizationFormData) => {
    try {
      await onSubmit(data);
      setError(null);
      setSuccess('Organization updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
      setSuccess(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Organization Settings</h2>
      
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          type="text"
          label="Organization Name"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          type="text"
          label="Description"
          {...register('description')}
          error={errors.description?.message}
        />

        <Input
          type="url"
          label="Website"
          {...register('website')}
          error={errors.website?.message}
        />

        <Input
          type="text"
          label="Logo URL"
          {...register('logo')}
          error={errors.logo?.message}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Organization'}
        </Button>
      </form>
    </Card>
  );
}; 