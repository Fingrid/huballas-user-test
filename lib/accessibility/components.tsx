'use client';

import React, { memo } from 'react';
import ChartSkeleton from '@/app/_components/charts/ChartSkeleton';
import TableSkeleton from '@/app/_components/charts/TableSkeleton';

// Re-export skeleton components from their new location
export { ChartSkeleton, TableSkeleton };

// Keep remaining components here

export const CardSkeleton = memo(() => (
  <div className="animate-pulse bg-white border border-gray-200 p-6" role="status" aria-label="Loading card">
    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <span className="sr-only">Loading card content...</span>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Progress indicator component
interface ProgressIndicatorProps {
  progress: number;
  message: string;
  className?: string;
}

export const ProgressIndicator = memo<ProgressIndicatorProps>(({ 
  progress, 
  message, 
  className = '' 
}) => (
  <div className={`text-center ${className}`} role="status" aria-live="polite">
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loading progress"
      ></div>
    </div>
    <p className="text-sm text-gray-600" aria-live="polite">
      {message} ({Math.round(progress)}%)
    </p>
  </div>
));

ProgressIndicator.displayName = 'ProgressIndicator';

// Accessible loading states
interface LoadingStateProps {
  type: 'skeleton' | 'spinner' | 'progress';
  message?: string;
  progress?: number;
  className?: string;
}

export const LoadingState = memo<LoadingStateProps>(({ 
  type, 
  message = 'Loading...', 
  progress = 0,
  className = '' 
}) => {
  if (type === 'progress') {
    return (
      <ProgressIndicator 
        progress={progress} 
        message={message} 
        className={className}
      />
    );
  }

  if (type === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${className}`} role="status" aria-live="polite">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          aria-hidden="true"
        ></div>
        <span className="ml-3 text-gray-600">{message}</span>
        <span className="sr-only">Loading, please wait...</span>
      </div>
    );
  }

  // Default to skeleton
  return <ChartSkeleton />;
});

LoadingState.displayName = 'LoadingState';

// Accessible form controls
interface AccessibleSelectProps {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  className?: string;
}

export const AccessibleSelect = memo<AccessibleSelectProps>(({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  description,
  className = ''
}) => {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={className}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-500 mb-2">
          {description}
        </p>
      )}
      
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-describedby={descriptionId}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          sm:text-sm
        `}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

AccessibleSelect.displayName = 'AccessibleSelect';

// Accessible button component
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const AccessibleButton = memo<AccessibleButtonProps>(({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ariaLabel,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-current';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      {loading && (
        <div 
          className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

// Screen reader announcements
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowUp, onArrowDown]);
};

// Focus management utilities
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const focusFirstElement = React.useCallback(() => {
    if (containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [containerRef]);

  const focusLastElement = React.useCallback(() => {
    if (containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      lastElement?.focus();
    }
  }, [containerRef]);

  return { focusFirstElement, focusLastElement };
};