"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';


interface SSOValidationResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
  };
  accessibleApps: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    access?: {
      assignedAt: string;
      expiresAt?: string;
      quota?: number;
      usedQuota: number;
    };
  }>;
}

function AppSSOContent() {
  const searchParams = useSearchParams();
  const ssoToken = searchParams.get('sso_token');
  const appSlug = searchParams.get('app');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ssoData, setSsoData] = useState<SSOValidationResult | null>(null);
  const [currentApp, setCurrentApp] = useState<any>(null);

  useEffect(() => {
    if (ssoToken && appSlug) {
      validateSSOToken();
    } else {
      setError('No SSO token or app slug provided');
      setIsLoading(false);
    }
  }, [ssoToken, appSlug]);

  const validateSSOToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Validating SSO token for app:', appSlug);
      
      // Validate the SSO token
      const result = await apiClient.validateSSOToken(ssoToken!, appSlug!);
      setSsoData(result);
      
      // Find the current app in the accessible apps
      const app = result.accessibleApps.find(app => app.slug === appSlug);
      if (app) {
        setCurrentApp(app);
        
        // Get the app details to check if it has a URL
        console.log(`Fetching app details for slug: ${appSlug}`);
        const appDetails = await apiClient.getAppBySlug(appSlug!);
        console.log('App details received:', appDetails);
        
        if (appDetails && appDetails.url) {
          // Redirect to the actual app URL with SSO token
          console.log(`Redirecting to app URL: ${appDetails.url}`);
          console.log(`SSO Token: ${ssoToken}`);
          const redirectUrl = `${appDetails.url}?sso_token=${ssoToken}`;
          console.log(`Full redirect URL: ${redirectUrl}`);
          
          // Add a small delay to ensure console logs are visible
          setTimeout(() => {
            console.log('Executing redirect now...');
            try {
              window.location.href = redirectUrl;
            } catch (error) {
              console.error('Redirect failed:', error);
              // Fallback: try using window.open
              window.open(redirectUrl, '_blank');
            }
          }, 1000);
          return;
        } else {
          // If no URL is set, show the demo interface
          console.log('No app URL configured, showing demo interface');
          console.log('App details:', appDetails);
        }
      } else {
        setError(`Access denied to ${appSlug} app`);
      }
      
    } catch (err: any) {
      console.error('SSO validation error:', err);
      setError(err.message || 'Failed to validate SSO token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/auth/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-900 mt-4">
              Validating Access...
            </h2>
            <p className="text-gray-600 mt-2">
              Please wait while we verify your access to {appSlug}.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Button 
              onClick={handleLogout}
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-2xl">❓</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              App Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The app "{appSlug}" was not found in your accessible apps.
            </p>
            <Button 
              onClick={handleLogout}
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render the app interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: currentApp.color || '#3B82F6' }}
              >
                {currentApp.icon || '📱'}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentApp.name}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome, {ssoData?.user.name || ssoData?.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Role: {ssoData?.user.role}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* App Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-green-600 text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Successfully Connected!
            </h2>
            <p className="text-gray-600 mb-6">
              You have successfully accessed the <strong>{currentApp.name}</strong> application.
            </p>
            
            {currentApp.description && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700">{currentApp.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Access Details</h3>
                <p className="text-sm text-blue-700">
                  Assigned: {new Date(currentApp.access.assignedAt).toLocaleDateString()}
                </p>
                {currentApp.access.expiresAt && (
                  <p className="text-sm text-blue-700">
                    Expires: {new Date(currentApp.access.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Usage</h3>
                <p className="text-sm text-green-700">
                  Used: {currentApp.access.usedQuota} / {currentApp.access.quota || 'Unlimited'}
                </p>
              </div>
            </div>

            <Alert variant="info" className="mb-6">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">ℹ️</span>
                <span>
                  This is a demo interface. In a real application, this would redirect you to the actual {currentApp.name} application.
                </span>
              </div>
            </Alert>

            <div className="flex space-x-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.href = '/products'}
              >
                View All Apps
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AppSSOPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-900 mt-4">
              Loading...
            </h2>
          </div>
        </Card>
      </div>
    }>
      <AppSSOContent />
    </Suspense>
  );
}
