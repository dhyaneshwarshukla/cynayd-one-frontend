import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  className?: string;
  text?: string;
  showText?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  text,
  showText = false,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-600';
      case 'secondary':
        return 'text-gray-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      case 'xl':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} suppressHydrationWarning>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${getSizeClasses()} ${getVariantClasses()}`} />
      {(showText || text) && (
        <div className={`mt-2 text-center ${getTextSizeClasses()} text-gray-600`}>
          {text || 'Loading...'}
        </div>
      )}
    </div>
  );
};

// Skeleton loading component for content placeholders
interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'avatar' | 'card' | 'button';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  lines = 1,
  variant = 'text',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'avatar':
        return 'w-10 h-10 rounded-full';
      case 'card':
        return 'w-full h-32 rounded-lg';
      case 'button':
        return 'w-20 h-8 rounded';
      default:
        return 'w-full h-4 rounded';
    }
  };

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`animate-pulse bg-gray-200 ${getVariantClasses()}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-gray-200 ${getVariantClasses()} ${className}`}
    />
  );
};

// Page loading component
interface PageLoadingProps {
  text?: string;
  showSpinner?: boolean;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  text = 'Loading page...',
  showSpinner = true,
  className = '',
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        {showSpinner && <LoadingSpinner size="xl" variant="primary" />}
        <p className="mt-4 text-lg text-gray-600">{text}</p>
      </div>
    </div>
  );
};

// Inline loading component
interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = 'Loading...',
  size = 'sm',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};
