"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface SSOConnectState {
  status: 'loading' | 'success' | 'error' | 'redirecting';
  message: string;
  redirectUrl?: string;
  error?: string;
}

function ConnectPageContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<SSOConnectState>({
    status: 'loading',
    message: 'Validating SSO token...'
  });

  const ssoToken = searchParams.get('sso_token');
  const appSlug = searchParams.get('app_slug');

  useEffect(() => {
    if (!ssoToken) {
      setState({
        status: 'error',
        message: 'No SSO token provided',
        error: 'Missing SSO token in URL parameters'
      });
      return;
    }

    handleSSOConnect();
  }, [ssoToken, appSlug]);

  const handleSSOConnect = async () => {
    try {
      setState({
        status: 'loading',
        message: 'Connecting to app...'
      });

      // Build the API URL with proper parameters - call the backend API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const apiUrl = new URL('/api/sso/connect', apiBaseUrl);
      apiUrl.searchParams.set('sso_token', ssoToken!);
      
      // Only add app_slug if it exists
      if (appSlug) {
        apiUrl.searchParams.set('app_slug', appSlug);
      }

      console.log('Calling SSO connect API:', apiUrl.toString());

      // Call the SSO connect API endpoint
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        redirect: 'manual', // Handle redirects manually
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('SSO connect response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 302) {
        // Get the redirect URL from the Location header
        const redirectUrl = response.headers.get('Location');
        console.log('Got redirect URL from API:', redirectUrl);
        
        if (redirectUrl) {
          setState({
            status: 'redirecting',
            message: 'Redirecting to app...',
            redirectUrl
          });
          
          // Redirect immediately to the app URL
          window.location.href = redirectUrl;
        } else {
          throw new Error('No redirect URL provided');
        }
      } else if (response.ok) {
        // Handle successful response
        const data = await response.json();
        setState({
          status: 'success',
          message: 'Successfully connected to app',
          redirectUrl: data.redirectUrl
        });
      } else {
        // Handle error response
        const errorData = await response.json();
        setState({
          status: 'error',
          message: 'Failed to connect to app',
          error: errorData.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('SSO connect error:', error);
      setState({
        status: 'error',
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleRetry = () => {
    handleSSOConnect();
  };

  const handleManualRedirect = () => {
    if (state.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircleIcon className="w-8 h-8 text-green-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />;
      case 'redirecting':
        return <GlobeAltIcon className="w-8 h-8 text-blue-600 animate-pulse" />;
      default:
        return <ArrowPathIcon className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'redirecting':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <UnifiedLayout
      title="SSO Connect"
      subtitle={`Connecting to ${appSlug || 'application'}`}
    >
      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            {/* Status Icon */}
            <div className="flex items-center justify-center">
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
                {state.message}
              </h3>
              
              {state.status === 'loading' && (
                <p className="text-sm text-gray-600">
                  Please wait while we validate your access...
                </p>
              )}
              
              {state.status === 'redirecting' && (
                <p className="text-sm text-gray-600">
                  You will be redirected automatically
                </p>
              )}
              
              {state.status === 'success' && (
                <p className="text-sm text-gray-600">
                  You can now access the application
                </p>
              )}
            </div>

            {/* Error Details */}
            {state.status === 'error' && state.error && (
              <Alert variant="error" className="text-left">
                <div className="space-y-2">
                  <p className="font-medium">Error Details:</p>
                  <p className="text-sm">{state.error}</p>
                </div>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 w-full">
              {state.status === 'error' && (
                <Button
                  onClick={handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {state.status === 'success' && state.redirectUrl && (
                <Button
                  onClick={handleManualRedirect}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <GlobeAltIcon className="w-4 h-4 mr-2" />
                  Go to App
                </Button>
              )}
              
              {state.status === 'redirecting' && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              )}
            </div>

            {/* Debug Information (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left text-xs">
                <p className="font-medium mb-2">Debug Information:</p>
                <p><strong>App Slug:</strong> {appSlug || 'undefined'}</p>
                <p><strong>Token Present:</strong> {ssoToken ? 'Yes' : 'No'}</p>
                <p><strong>Status:</strong> {state.status}</p>
                {state.redirectUrl && (
                  <p><strong>Redirect URL:</strong> {state.redirectUrl}</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </UnifiedLayout>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <UnifiedLayout title="SSO Connect" subtitle="Loading...">
        <div className="max-w-md mx-auto">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-6">
              <LoadingSpinner size="lg" />
              <h3 className="text-lg font-semibold text-blue-600">
                Loading connection...
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we prepare your connection...
              </p>
            </div>
          </Card>
        </div>
      </UnifiedLayout>
    }>
      <ConnectPageContent />
    </Suspense>
  );
}
