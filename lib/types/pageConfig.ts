import { ComponentType } from 'react';
import type { DictionaryCollections } from '../stores/dictionary.store';

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
    dictionaries: DictionaryCollections | null;
    loading: boolean;
    error: string | null;
  };
  usage: {
    _rawdata: Record<string, unknown[]> | null;
    monthlyData: Record<string, unknown> | null;
    loading: boolean;
    error: string | null;
  };
  responseTime: {
    monthlyData: Record<string, unknown> | null;
    loading: boolean;
    error: string | null;
  };
  error: {
    monthlyData: Record<string, unknown> | null;
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
  prepareData?: (stores: StoreData) => unknown;
}

// Route configuration
export interface RouteConfig extends PageConfig {
  path: string;
  component: ComponentType;
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
  details?: Record<string, unknown>;
}