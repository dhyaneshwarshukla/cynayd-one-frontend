"use client";

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { BrandLink } from '@/components/common/BrandLink';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <BrandLink variant="compact" name="CYNAYD" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
