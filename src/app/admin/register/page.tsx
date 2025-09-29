"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/common/Alert';
import { apiClient } from '@/lib/api-client';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function AdminRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableApps, setAvailableApps] = useState<App[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationSlug: ''
  });

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Register the admin user
      const response = await apiClient.register({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        organizationName: adminData.organizationName,
        organizationSlug: adminData.organizationSlug
      });

      // Fetch available apps
      const apps = await apiClient.getApps();
      setAvailableApps(apps);
      
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedApps.length === 0) {
      setError('Please select at least one app for your organization');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Here you would typically save the selected apps to the organization
      // For now, we'll just redirect to the admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to configure organization');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAppSelection = (appId: string) => {
    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  return (
    <ResponsiveContainer className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Company Admin Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? 'Create your admin account and organization' : 'Select apps for your organization'}
          </p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {step === 1 && (
          <Card className="p-6">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  required
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                />
              </div>

              <div>
                <Input
                  label="Organization Name"
                  type="text"
                  required
                  value={adminData.organizationName}
                  onChange={(e) => setAdminData({ ...adminData, organizationName: e.target.value })}
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <Input
                  label="Organization Slug"
                  type="text"
                  required
                  value={adminData.organizationSlug}
                  onChange={(e) => setAdminData({ ...adminData, organizationSlug: e.target.value })}
                  placeholder="Enter organization slug (e.g., my-company)"
                />
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Admin Account'}
              </Button>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select Apps for Your Organization
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which applications your organization will have access to. 
                  You can assign these apps to your users later.
                </p>
                
                <div className="space-y-3">
                  {availableApps.map((app) => (
                    <div
                      key={app.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedApps.includes(app.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleAppSelection(app.id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedApps.includes(app.id)}
                            onChange={() => toggleAppSelection(app.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            {app.icon && (
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm mr-3"
                                style={{ backgroundColor: app.color || '#3b82f6' }}
                              >
                                {app.icon}
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {app.name}
                              </h4>
                              {app.description && (
                                <p className="text-sm text-gray-500">
                                  {app.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="flex-1"
                  disabled={isLoading || selectedApps.length === 0}
                >
                  {isLoading ? 'Configuring...' : 'Complete Setup'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </ResponsiveContainer>
  );
}
