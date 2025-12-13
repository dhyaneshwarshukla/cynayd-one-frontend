import React from 'react';
import { Button } from './Button';
import { Card } from './Card';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card className={`p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      {icon && (
        <div className="mb-4 flex justify-center">
          {typeof icon === 'string' ? (
            <div className="text-6xl">{icon}</div>
          ) : (
            <div className="w-16 h-16 text-gray-400">{icon}</div>
          )}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
};

