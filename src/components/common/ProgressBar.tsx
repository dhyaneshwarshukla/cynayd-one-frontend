import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  animated?: boolean;
  striped?: boolean;
  className?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  labelPosition = 'top',
  animated = true,
  striped = false,
  className = '',
  label,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600';
      case 'success':
        return 'bg-green-600';
      case 'warning':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getLabelPositionClasses = () => {
    switch (labelPosition) {
      case 'top':
        return 'mb-2';
      case 'bottom':
        return 'mt-2';
      case 'left':
        return 'mr-3';
      case 'right':
        return 'ml-3';
      default:
        return 'mb-2';
    }
  };

  const getLabelSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getProgressBarClasses = () => {
    let classes = `rounded-full transition-all duration-300 ${getVariantClasses()}`;
    
    if (animated) {
      classes += ' ease-out';
    }
    
    if (striped) {
      classes += ' bg-stripes bg-stripes-white bg-stripes-opacity-15';
    }
    
    return classes;
  };

  const renderLabel = () => {
    if (!showLabel && !label) return null;
    
    const displayLabel = label || `${Math.round(percentage)}%`;
    
    return (
      <div className={`${getLabelPositionClasses()} ${getLabelSizeClasses()} font-medium text-gray-700`}>
        {displayLabel}
      </div>
    );
  };

  const renderProgressBar = () => (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeClasses()}`}>
      <div
        className={getProgressBarClasses()}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
      />
    </div>
  );

  if (labelPosition === 'left' || labelPosition === 'right') {
    return (
      <div className={`flex items-center ${className}`}>
        {labelPosition === 'left' && renderLabel()}
        <div className="flex-1">
          {renderProgressBar()}
        </div>
        {labelPosition === 'right' && renderLabel()}
      </div>
    );
  }

  return (
    <div className={className}>
      {labelPosition === 'top' && renderLabel()}
      {renderProgressBar()}
      {labelPosition === 'bottom' && renderLabel()}
    </div>
  );
};

// Circular progress component
interface CircularProgressProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 'md',
  variant = 'default',
  showLabel = false,
  strokeWidth = 4,
  className = '',
  label,
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-16 h-16';
      case 'md':
        return 'w-20 h-20';
      case 'lg':
        return 'w-24 h-24';
      case 'xl':
        return 'w-32 h-32';
      default:
        return 'w-20 h-20';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLabelSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
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

  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className={`relative inline-flex items-center justify-center ${getSizeClasses()} ${className}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={`${getVariantClasses()} transition-all duration-300 ease-out`}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {showLabel && (
        <div className={`absolute inset-0 flex items-center justify-center ${getLabelSizeClasses()} font-medium text-gray-700`}>
          {displayLabel}
        </div>
      )}
    </div>
  );
};

// Multi-step progress component
interface Step {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface MultiStepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  showLabels?: boolean;
  variant?: 'default' | 'primary' | 'success';
}

export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({
  steps,
  currentStep,
  className = '',
  showLabels = true,
  variant = 'default',
}) => {
  const getStepStatusClasses = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 border-green-600 text-white';
      case 'current':
        return 'bg-blue-600 border-blue-600 text-white';
      case 'error':
        return 'bg-red-600 border-red-600 text-white';
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500';
    }
  };

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepStatusClasses(step.status)}`}
            >
              {getStepIcon(step.status) || (step.status === 'current' ? index + 1 : index + 1)}
            </div>
            {showLabels && (
              <span className="mt-2 text-xs text-gray-600 text-center max-w-20">
                {step.label}
              </span>
            )}
          </div>
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
