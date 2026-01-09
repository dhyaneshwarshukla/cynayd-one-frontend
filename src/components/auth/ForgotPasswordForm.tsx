"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { apiClient } from '../../lib/api-client';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);
      
      // Normalize email: trim and convert to lowercase for case-insensitive lookup
      const normalizedEmail = data.email.trim().toLowerCase();
      
      const response = await apiClient.resetPassword(normalizedEmail);
      setSuccess(response.message || 'Password reset email sent! Check your inbox for further instructions.');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
      
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

      {!success ? (
        <>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                type="email"
                label="Email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            We've sent a password reset link to your email address.
          </p>
          <Button
            onClick={() => {
              setSuccess(null);
              setError(null);
            }}
            variant="outline"
            className="w-full"
          >
            Send Another Email
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <a
            href="/auth/login"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </Card>
  );
};
