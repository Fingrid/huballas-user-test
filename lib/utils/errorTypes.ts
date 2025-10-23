// Structured error types for better error handling and debugging

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: number;
  source?: string;
}

export type ErrorCode = 
  | 'FETCH_FAILED'
  | 'DATA_PARSE_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'CACHE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorWithRetry extends AppError {
  retryable: boolean;
  retryAction?: () => Promise<void>;
}

// Error creation helpers
export function createAppError(
  code: ErrorCode,
  message: string,
  details?: string,
  source?: string
): AppError {
  return {
    code,
    message,
    details,
    timestamp: Date.now(),
    source,
  };
}

export function createRetryableError(
  code: ErrorCode,
  message: string,
  retryAction: () => Promise<void>,
  details?: string,
  source?: string
): ErrorWithRetry {
  return {
    ...createAppError(code, message, details, source),
    retryable: true,
    retryAction,
  };
}

// Error type guards
export function isAppError(error: unknown): error is AppError {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'message' in error);
}

export function isRetryableError(error: unknown): error is ErrorWithRetry {
  return isAppError(error) && 'retryable' in error && error.retryable === true;
}

// Convert standard Error to AppError
export function fromStandardError(
  error: Error,
  code: ErrorCode = 'UNKNOWN_ERROR',
  source?: string
): AppError {
  return createAppError(
    code,
    error.message,
    error.stack,
    source
  );
}

// Error severity levels for UI styling
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export function getErrorSeverity(error: AppError): ErrorSeverity {
  switch (error.code) {
    case 'NETWORK_ERROR':
    case 'FETCH_FAILED':
      return ErrorSeverity.WARNING;
    case 'DATA_PARSE_ERROR':
    case 'VALIDATION_ERROR':
      return ErrorSeverity.ERROR;
    case 'CACHE_ERROR':
      return ErrorSeverity.INFO;
    default:
      return ErrorSeverity.ERROR;
  }
}
