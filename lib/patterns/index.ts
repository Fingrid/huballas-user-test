// Export page configuration types and utilities
export type { PageConfig, RouteConfig, StoreType, StoreData, AppLoadingState, ErrorState } from '../types/pageConfig';

// Export route configurations
export { routeConfigs, getRouteConfig, getDefaultRoute, validateMonthlyReportsData } from '../config/routeConfig';

// Export loading context and hooks
export { LoadingProvider, useLoadingState, useIsLoading, useError } from '../contexts/LoadingContext';

// Export error boundary and error classes
export { default as ErrorBoundary, useErrorHandler, DataLoadError, ConfigurationError, ValidationError } from '../components/ErrorBoundary';