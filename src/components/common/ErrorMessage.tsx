"use client";

import React from 'react';
import { Alert } from './Alert';
import { Button } from './Button';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface ErrorMessageProps {
  error: string | Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showIcon = true,
}) => {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Alert
      variant="error"
      className={className}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        {showIcon && (
          <ExclamationCircleIcon
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5 mr-3"
            aria-hidden="true"
          />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800"
            aria-label="Dismiss error"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </Alert>
  );
};

