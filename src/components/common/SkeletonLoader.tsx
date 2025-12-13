import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'avatar' | 'card' | 'button' | 'table' | 'list';
  lines?: number;
  className?: string;
  width?: string;
  height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  lines = 1,
  className = '',
  width,
  height,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'avatar':
        return 'w-10 h-10 rounded-full';
      case 'card':
        return 'w-full h-32 rounded-lg';
      case 'button':
        return 'w-20 h-8 rounded';
      case 'table':
        return 'w-full h-12 rounded';
      case 'list':
        return 'w-full h-16 rounded';
      default:
        return 'w-full h-4 rounded';
    }
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;
    return style;
  };

  if (variant === 'text' || variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'animate-pulse bg-gray-200',
              getVariantClasses()
            )}
            style={getStyle()}
            aria-label="Loading..."
            role="status"
          />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-4"
          >
            <div className="animate-pulse bg-gray-200 w-12 h-12 rounded" />
            <div className="flex-1 space-y-2">
              <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded" />
              <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        getVariantClasses(),
        className
      )}
      style={getStyle()}
      aria-label="Loading..."
      role="status"
    />
  );
};

// Pre-configured skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 border border-gray-200 rounded-lg', className)}>
    <SkeletonLoader variant="text" lines={3} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader
            key={colIndex}
            variant="text"
            className="flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

