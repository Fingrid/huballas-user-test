'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useCombinedStore } from '../lib/stores';
import { useLoadingState, useError } from '../lib/contexts/LoadingContext';
import { getRouteConfig, getDefaultRoute } from '../lib/config/routeConfig';
import { StoreData } from '../lib/types/pageConfig';
import ErrorBoundary from '../lib/components/ErrorBoundary';

// Style objects for consistent styling
const styles = {
  loadingContainer: 'app-loading-container',
  mainContainer: 'app-main-container'
};

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className={styles.loadingContainer}>
      Loading component...
    </div>
  );
}

export default function AppClient() {
  const pathname = usePathname();
  const { state, setCurrentPage, setPageDataReady, setLoadingMessage, isReady } = useLoadingState();
  const error = useError();
  const combinedStore = useCombinedStore();

  // Get current route configuration
  const routeConfig = getRouteConfig(pathname) || getDefaultRoute();

  // Update current page when pathname changes
  useEffect(() => {
    setCurrentPage(pathname);
  }, [pathname, setCurrentPage]);

  // Check if page-specific data is ready
  useEffect(() => {
    if (!state.isInitialized) {
      setPageDataReady(false);
      return;
    }

    // Set custom loading message for the page
    if (routeConfig.loadingMessage) {
      setLoadingMessage(routeConfig.loadingMessage);
    }

    // Get current store states
    const storeStates = combinedStore.getAllLoadingStates();
    const storeErrors = combinedStore.getAllErrors();

    // Build store data object for validation
    const storeData: StoreData = {
      dictionary: {
        dictionaries: combinedStore.dictionary.dictionaries,
        loading: storeStates.dictionary,
        error: storeErrors.dictionary,
      },
      usage: {
        _rawdata: combinedStore.usage._rawdata,
        monthlyData: combinedStore.usage.monthlyData,
        loading: storeStates.usage,
        error: storeErrors.usage,
      },
      responseTime: {
        monthlyData: combinedStore.responseTime.monthlyData,
        loading: storeStates.responseTime,
        error: storeErrors.responseTime,
      },
      error: {
        monthlyData: combinedStore.error.monthlyData,
        loading: storeStates.error,
        error: storeErrors.error,
      },
    };

    // Use the route's data validator
    const dataReady = routeConfig.dataValidator(storeData);
    setPageDataReady(dataReady);

    if (dataReady) {
      console.log(`✅ AppClient: Data ready for ${pathname}`);
    } else {
      console.log(`⏳ AppClient: Waiting for data for ${pathname}`, {
        requiredStores: routeConfig.requiredStores,
        storeStates,
        storeErrors,
      });
    }
  }, [
    state.isInitialized,
    pathname,
    routeConfig,
    setPageDataReady,
    setLoadingMessage,
    combinedStore,
  ]);

  // Show loading state
  if (!isReady) {
    return (
      <div className={styles.loadingContainer}>
        {state.loadingMessage}
      </div>
    );
  }

  // Render the configured component
  const PageComponent = routeConfig.component;

  return (
    <div className={styles.mainContainer}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <PageComponent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}