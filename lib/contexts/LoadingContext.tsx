'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppLoadingState, ErrorState as ErrorStateType } from '../types/pageConfig';
import { useCombinedStore } from '../stores';

// Action types for the loading state reducer
type LoadingAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_PAGE_DATA_READY'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_LOADING_MESSAGE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppLoadingState = {
  isInitialized: false,
  isPageDataReady: false,
  currentPage: '',
  loadingMessage: 'Initializing application...',
  error: null,
};

// Reducer function
function loadingReducer(state: AppLoadingState, action: LoadingAction): AppLoadingState {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
        loadingMessage: action.payload ? 'Preparing page data...' : 'Initializing application...',
      };
    case 'SET_PAGE_DATA_READY':
      return {
        ...state,
        isPageDataReady: action.payload,
      };
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
        isPageDataReady: false, // Reset page data ready when changing pages
      };
    case 'SET_LOADING_MESSAGE':
      return {
        ...state,
        loadingMessage: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET_STATE':
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

// Context interface
interface LoadingContextType {
  state: AppLoadingState;
  setInitialized: (initialized: boolean) => void;
  setPageDataReady: (ready: boolean) => void;
  setCurrentPage: (page: string) => void;
  setLoadingMessage: (message: string) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  isReady: boolean;
}

// Create context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Provider component
interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [state, dispatch] = useReducer(loadingReducer, initialState);
  const combinedStore = useCombinedStore();

  // Memoized action creators
  const setInitialized = useCallback((initialized: boolean) => {
    dispatch({ type: 'SET_INITIALIZED', payload: initialized });
  }, []);

  const setPageDataReady = useCallback((ready: boolean) => {
    dispatch({ type: 'SET_PAGE_DATA_READY', payload: ready });
  }, []);

  const setCurrentPage = useCallback((page: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    dispatch({ type: 'SET_LOADING_MESSAGE', payload: message });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    combinedStore.resetAllStores();
  }, [combinedStore]);

  // Computed property for overall readiness
  const isReady = state.isInitialized && state.isPageDataReady && !state.error;

  // Initialize stores on mount
  useEffect(() => {
    const initializeStores = async () => {
      try {
        console.log('🔄 LoadingProvider: Initializing all stores...');
        await combinedStore.initializeAllStores();
        setInitialized(true);
        console.log('✅ LoadingProvider: All stores initialized successfully');
      } catch (error) {
        console.error('❌ LoadingProvider: Store initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown initialization error');
        setInitialized(true); // Still set to true to allow error state to show
      }
    };

    initializeStores();
  }, [combinedStore, setInitialized, setError]);

  const contextValue: LoadingContextType = {
    state,
    setInitialized,
    setPageDataReady,
    setCurrentPage,
    setLoadingMessage,
    setError,
    resetState,
    isReady,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

// Hook to use the loading context
export function useLoadingState() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingState must be used within a LoadingProvider');
  }
  return context;
}

// Hook for simple loading checks
export function useIsLoading() {
  const { state } = useLoadingState();
  return !state.isInitialized || !state.isPageDataReady;
}

// Hook for error state
export function useError(): ErrorStateType | null {
  const { state, resetState } = useLoadingState();
  
  if (!state.error) return null;
  
  return {
    message: state.error,
    recoverable: true,
    retryAction: resetState,
  };
}