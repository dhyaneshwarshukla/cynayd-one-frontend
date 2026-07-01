"use client";

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface SSOConnectState {
  status: 'loading' | 'success' | 'error' | 'redirecting';
  message: string;
  redirectUrl?: string;
  error?: string;
}

function appendSsoToken(baseUrl: string, token: string): string {
  const delimiter = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${delimiter}sso_token=${encodeURIComponent(token)}`;
}

function ConnectPageContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<SSOConnectState>({
    status: 'loading',
    message: 'Connecting to app...',
  });

  const exchangeCode = searchParams.get('code');
  const legacyToken = searchParams.get('sso_token');
  const appSlug = searchParams.get('app_slug');

  const handleCodeConnect = useCallback(async () => {
    if (!exchangeCode || !appSlug) {
      setState({
        status: 'error',
        message: 'Missing parameters',
        error: 'Both code and app_slug are required',
      });
      return;
    }

    try {
      setState({ status: 'loading', message: 'Redeeming exchange code...' });

      const result = await apiClient.redeemSsoCode(exchangeCode, appSlug);
      const appUrl = result.app.url?.trim();

      if (appUrl) {
        const redirectUrl = appendSsoToken(appUrl, result.ssoToken);
        setState({
          status: 'redirecting',
          message: 'Redirecting to app...',
          redirectUrl,
        });
        window.location.href = redirectUrl;
        return;
      }

      setState({
        status: 'success',
        message: 'Successfully connected',
        redirectUrl: `/app-sso?app=${encodeURIComponent(appSlug)}`,
      });
    } catch (error) {
      console.error('SSO code redeem error:', error);
      setState({
        status: 'error',
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [exchangeCode, appSlug]);

  const handleLegacyConnect = useCallback(async () => {
    if (!legacyToken) return;

    try {
      setState({ status: 'loading', message: 'Validating SSO token...' });

      const result = await apiClient.validateSSOToken(legacyToken, appSlug ?? undefined);
      const app = appSlug
        ? result.accessibleApps.find((a) => a.slug === appSlug)
        : result.accessibleApps[0];

      const appDetails = appSlug ? await apiClient.getAppBySlug(appSlug) : null;
      const appUrl = appDetails?.url?.trim() || app?.url?.trim();

      if (appUrl) {
        const redirectUrl = appendSsoToken(appUrl, legacyToken);
        setState({
          status: 'redirecting',
          message: 'Redirecting to app...',
          redirectUrl,
        });
        window.location.href = redirectUrl;
        return;
      }

      setState({
        status: 'success',
        message: 'Token validated',
        redirectUrl: appSlug ? `/app-sso?app=${encodeURIComponent(appSlug)}` : '/products',
      });
    } catch (error) {
      console.error('Legacy SSO connect error:', error);
      setState({
        status: 'error',
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [legacyToken, appSlug]);

  useEffect(() => {
    if (exchangeCode && appSlug) {
      void handleCodeConnect();
    } else if (legacyToken) {
      void handleLegacyConnect();
    } else {
      setState({
        status: 'error',
        message: 'No SSO credentials provided',
        error: 'Missing code or SSO token in URL parameters',
      });
    }
  }, [exchangeCode, legacyToken, appSlug, handleCodeConnect, handleLegacyConnect]);

  const handleRetry = () => {
    if (exchangeCode && appSlug) {
      void handleCodeConnect();
    } else if (legacyToken) {
      void handleLegacyConnect();
    }
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
            <div className="flex items-center justify-center">{getStatusIcon()}</div>

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
            </div>

            {state.status === 'error' && state.error && (
              <Alert variant="error" className="text-left">
                <div className="space-y-2">
                  <p className="font-medium">Error Details:</p>
                  <p className="text-sm">{state.error}</p>
                </div>
              </Alert>
            )}

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
                  Continue
                </Button>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left text-xs">
                <p className="font-medium mb-2">Debug Information:</p>
                <p><strong>App Slug:</strong> {appSlug || 'undefined'}</p>
                <p><strong>Code Present:</strong> {exchangeCode ? 'Yes' : 'No'}</p>
                <p><strong>Legacy Token:</strong> {legacyToken ? 'Yes' : 'No'}</p>
                <p><strong>Status:</strong> {state.status}</p>
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
    <Suspense
      fallback={
        <UnifiedLayout title="SSO Connect" subtitle="Loading...">
          <div className="max-w-md mx-auto">
            <Card className="p-8 text-center">
              <LoadingSpinner size="lg" />
            </Card>
          </div>
        </UnifiedLayout>
      }
    >
      <ConnectPageContent />
    </Suspense>
  );
}
