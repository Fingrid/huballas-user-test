"use client";

import React from 'react';
import type { AppError, ErrorWithRetry } from '../../../lib/errorTypes';
import { isAppError, isRetryableError, getErrorSeverity, ErrorSeverity } from '../../../lib/errorTypes';
import { cn } from '../../../lib/cn';

interface ErrorStateProps {
  error: string | AppError;
  onRetry?: () => void;
  onClear?: () => void;
  showDetails?: boolean;
}

// Style objects for consistent styling
const styles = {
  container: 'content-container pt-8 pb-8',
  card: 'data-card',
  sourceText: 'text-xs mt-2 opacity-70'
};

export default function ErrorState({ error, onRetry, onClear, showDetails = false }: ErrorStateProps) {
  // Handle both string errors (legacy) and structured AppError objects
  const errorObj: AppError = isAppError(error) 
    ? error 
    : {
        code: 'UNKNOWN_ERROR',
        message: error,
        timestamp: Date.now(),
      };

  const severity = getErrorSeverity(errorObj);
  const canRetry = isRetryableError(errorObj) || onRetry;

  const handleRetry = () => {
    if (isRetryableError(errorObj) && errorObj.retryAction) {
      errorObj.retryAction();
    } else if (onRetry) {
      onRetry();
    }
  };

  const getSeverityTitle = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'Information';
      case ErrorSeverity.WARNING:
        return 'Warning';
      case ErrorSeverity.ERROR:
        return 'Error loading data';
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      default:
        return 'Error';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={`error-container severity-${severity}`}>
          <div className="error-title">
            {getSeverityTitle(severity)}
          </div>
          
          <div className="error-message">
            {errorObj.message}
          </div>

          {showDetails && errorObj.details && (
            <div className="error-details">
              <strong>Details:</strong><br />
              {errorObj.details}
            </div>
          )}

          <div className="error-actions">
            {canRetry && (
              <button
                onClick={handleRetry}
                className="btn-error-retry"
              >
                Retry
              </button>
            )}
            
            {onClear && (
              <button
                onClick={onClear}
                className="btn-error-secondary"
              >
                Dismiss
              </button>
            )}
          </div>

          {errorObj.source && showDetails && (
            <div className={styles.sourceText}>
              Source: {errorObj.source}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
