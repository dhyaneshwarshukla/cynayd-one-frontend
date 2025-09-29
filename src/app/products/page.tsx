"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
  url?: string;
  domain?: string;
  access?: {
    assignedAt: string;
    expiresAt?: string;
    quota?: number;
    usedQuota: number;
  };
}

export default function ProductsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userApps = await apiClient.getUserApps();
      setApps(userApps);
    } catch (err) {
      setError('Failed to load apps');
      console.error('Apps fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppAccess = async (appSlug: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Generate SSO token for the app
      const response = await fetch(`/api/apps/${appSlug}/sso-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate SSO token');
      }

      const { ssoToken } = await response.json();

      // Find the app to get its actual URL
      const app = apps.find(app => app.slug === appSlug);
      if (!app) {
        throw new Error('App not found');
      }

      // Use the new SSO connect endpoint for proper redirection
      const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
      const connectUrl = `${baseUrl}/connect?sso_token=${ssoToken}&app_slug=${appSlug}`;
      
      console.log('Redirecting to app via SSO connect:', connectUrl);
      console.log('App details:', { name: app.name, url: app.url, slug: app.slug });
      window.open(connectUrl, '_blank');
    } catch (err) {
      setError('Failed to access app');
      console.error('App access error:', err);
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Apps
          </h1>
          <p className="text-gray-600">
            Access your authorized applications and services
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {apps.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Apps Available
            </h3>
            <p className="text-gray-500">
              You don't have access to any apps yet. Contact your administrator.
            </p>
          </Card>
        ) : (
          <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap="lg">
            {apps.map((app) => (
              <Card key={app.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {app.icon && (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl mr-3"
                        style={{ backgroundColor: app.color || '#3b82f6' }}
                      >
                        {app.icon}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.name}
                      </h3>
                      {app.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {app.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {app.access && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Access Level:</span>
                        <span className="font-medium">Active</span>
                      </div>
                      {app.access.quota && (
                        <div className="flex justify-between mt-1">
                          <span>Usage:</span>
                          <span className="font-medium">
                            {app.access.usedQuota} / {app.access.quota}
                          </span>
                        </div>
                      )}
                      {app.access.expiresAt && (
                        <div className="flex justify-between mt-1">
                          <span>Expires:</span>
                          <span className="font-medium">
                            {new Date(app.access.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleAppAccess(app.slug)}
                  className="w-full"
                  variant="default"
                >
                  Access {app.name}
                </Button>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </div>
    </ResponsiveContainer>
  );
}
