import { ComponentType } from 'react';

// Store types for configuration
export type StoreType = 'dictionary' | 'usage' | 'responseTime' | 'error';

// Loading state interface
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
}

// Store data interface for validation
export interface StoreData {
  dictionary: {
    dictionaries: any;
    loading: boolean;
    error: string | null;
  };
  usage: {
    _rawdata: any;
    monthlyData: any;
    loading: boolean;
    error: string | null;
  };
  responseTime: {
    monthlyData: any;
    loading: boolean;
    error: string | null;
  };
  error: {
    monthlyData: any;
    loading: boolean;
    error: string | null;
  };
}

// Page configuration interface
export interface PageConfig {
  // Required stores for this page to function
  requiredStores: StoreType[];
  // Function to validate if the required data is available
  dataValidator: (stores: StoreData) => boolean;
  // Optional custom loading message
  loadingMessage?: string;
  // Optional data preparation function
  prepareData?: (stores: StoreData) => any;
}

// Route configuration
export interface RouteConfig extends PageConfig {
  path: string;
  component: ComponentType<any>;
}

// App loading state
export interface AppLoadingState {
  isInitialized: boolean;
  isPageDataReady: boolean;
  currentPage: string;
  loadingMessage: string;
  error: string | null;
}

// Error state interface
export interface ErrorState {
  code?: string;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
  details?: any;
}