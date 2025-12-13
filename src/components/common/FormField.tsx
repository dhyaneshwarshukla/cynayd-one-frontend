"use client";

import React, { useState, useEffect } from 'react';
import { Alert } from './Alert';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  url?: boolean;
  numeric?: boolean;
  integer?: boolean;
  positive?: boolean;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  validation?: ValidationRule;
  error?: string;
  touched?: boolean;
  showError?: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  validation,
  error: externalError,
  touched = false,
  showError = true,
  helpText,
  options = [],
  rows = 3,
  autoComplete,
  autoFocus = false,
  size = 'md',
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const displayError = externalError || internalError;
  const shouldShowError = showError && (touched || isTouched) && displayError;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-base';
    }
  };

  const getInputClasses = () => {
    const baseClasses = `w-full border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getSizeClasses()}`;
    
    if (disabled) {
      return `${baseClasses} bg-gray-100 text-gray-500 cursor-not-allowed`;
    }
    
    if (shouldShowError) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500`;
    }
    
    if (isFocused) {
      return `${baseClasses} border-blue-300`;
    }
    
    return `${baseClasses} border-gray-300 hover:border-gray-400`;
  };

  const validateField = (value: any): string | null => {
    if (!validation) return null;

    // Required validation
    if (validation.required && (!value || value.toString().trim() === '')) {
      return `${label} is required`;
    }

    if (value && value.toString().trim() !== '') {
      const stringValue = value.toString();

      // Length validations
      if (validation.minLength && stringValue.length < validation.minLength) {
        return `${label} must be at least ${validation.minLength} characters`;
      }

      if (validation.maxLength && stringValue.length > validation.maxLength) {
        return `${label} must be no more than ${validation.maxLength} characters`;
      }

      // Pattern validation
      if (validation.pattern && !validation.pattern.test(stringValue)) {
        return `${label} format is invalid`;
      }

      // Email validation
      if (validation.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(stringValue)) {
          return `${label} must be a valid email address`;
        }
      }

      // URL validation
      if (validation.url) {
        try {
          new URL(stringValue);
        } catch {
          return `${label} must be a valid URL`;
        }
      }

      // Numeric validation
      if (validation.numeric && isNaN(Number(stringValue))) {
        return `${label} must be a valid number`;
      }

      // Integer validation
      if (validation.integer && !Number.isInteger(Number(stringValue))) {
        return `${label} must be a whole number`;
      }

      // Positive validation
      if (validation.positive && Number(stringValue) <= 0) {
        return `${label} must be positive`;
      }

      // Custom validation
      if (validation.custom) {
        const customError = validation.custom(value);
        if (customError) return customError;
      }
    }

    return null;
  };

  const handleChange = (newValue: string | number) => {
    onChange(newValue);
    
    // Clear error when user starts typing
    if (internalError) {
      setInternalError(null);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    
    // Validate on blur
    if (validation) {
      const validationError = validateField(value);
      setInternalError(validationError);
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Validate on mount if there's an initial value
  useEffect(() => {
    if (value && validation) {
      const validationError = validateField(value);
      setInternalError(validationError);
    }
  }, []);

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
        handleChange(newValue);
      },
      onBlur: handleBlur,
      onFocus: handleFocus,
      placeholder,
      disabled,
      autoComplete,
      autoFocus,
      className: getInputClasses(),
      'aria-invalid': shouldShowError ? true : undefined,
      'aria-describedby': shouldShowError
        ? `${name}-error`
        : helpText
        ? `${name}-helper`
        : undefined,
      'aria-required': required || undefined,
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            className={`${getInputClasses()} resize-vertical`}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {shouldShowError && (
        <Alert variant="error" className="text-sm" role="alert" aria-live="polite" id={`${name}-error`}>
          {displayError}
        </Alert>
      )}
      
      {helpText && !shouldShowError && (
        <p id={`${name}-helper`} className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Hook for form validation
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when value changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const setTouchedField = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateField = (name: keyof T, value: any): string | null => {
    const rule = validationRules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${String(name)} is required`;
    }

    if (value && value.toString().trim() !== '') {
      const stringValue = value.toString();

      // Length validations
      if (rule.minLength && stringValue.length < rule.minLength) {
        return `${String(name)} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && stringValue.length > rule.maxLength) {
        return `${String(name)} must be no more than ${rule.maxLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        return `${String(name)} format is invalid`;
      }

      // Email validation
      if (rule.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(stringValue)) {
          return `${String(name)} must be a valid email address`;
        }
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) return customError;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const value = values[fieldName];
      const error = validateField(fieldName, value);
      
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    try {
      if (validateForm()) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
  };
};
