import { RouteConfig, StoreData } from '../types/pageConfig';
import { lazy } from 'react';

// Lazy load components
const StatisticsClient = lazy(() => import('../../app/statistics/StatisticsClient'));
const UsageClient = lazy(() => import('../../app/usage/UsageClient'));

// Data validators
export const validateStatisticsData = (stores: StoreData): boolean => {
  // For statistics, we need usage data and dictionaries
  const hasUsageData = Boolean(stores.usage._rawdata && Object.keys(stores.usage._rawdata).length > 0);
  const hasDictionaries = stores.dictionary.dictionaries !== null;
  const noErrors = !stores.usage.error && !stores.dictionary.error;
  const notLoading = !stores.usage.loading && !stores.dictionary.loading;
  
  return hasUsageData && hasDictionaries && noErrors && notLoading;
};

export const validateUsageData = (stores: StoreData): boolean => {
  // For usage page, we only need usage data and dictionaries
  const hasUsageData = Boolean(stores.usage._rawdata && Object.keys(stores.usage._rawdata).length > 0);
  const hasDictionaries = stores.dictionary.dictionaries !== null;
  const noErrors = !stores.usage.error && !stores.dictionary.error;
  const notLoading = !stores.usage.loading && !stores.dictionary.loading;
  
  return hasUsageData && hasDictionaries && noErrors && notLoading;
};

export const validateMonthlyReportsData = (stores: StoreData): boolean => {
  // For monthly reports, we need at least one of usage, response time, or error data
  const hasUsageData = Boolean(stores.usage.monthlyData && Object.keys(stores.usage.monthlyData).length > 0);
  const hasResponseData = Boolean(stores.responseTime.monthlyData && Object.keys(stores.responseTime.monthlyData).length > 0);
  const hasErrorData = Boolean(stores.error.monthlyData && Object.keys(stores.error.monthlyData).length > 0);
  
  const hasAnyData = hasUsageData || hasResponseData || hasErrorData;
  const hasNoErrors = !stores.usage.error && !stores.responseTime.error && !stores.error.error;
  const notLoading = !stores.usage.loading && !stores.responseTime.loading && !stores.error.loading;
  
  return hasAnyData && hasNoErrors && notLoading;
};

// Route configurations
export const routeConfigs: RouteConfig[] = [
  {
    path: '/usage',
    component: UsageClient,
    requiredStores: ['usage', 'dictionary'],
    dataValidator: validateUsageData,
    loadingMessage: 'Loading usage data...',
  },
  {
    path: '/',
    component: UsageClient,
    requiredStores: ['usage', 'dictionary'],
    dataValidator: validateUsageData,
    loadingMessage: 'Loading usage data...',
  },
  {
    path: '/statistics',
    component: StatisticsClient,
    requiredStores: ['usage', 'dictionary', 'error', 'responseTime'],
    dataValidator: validateStatisticsData,
    loadingMessage: 'Loading statistics data...',
  }
];

// Helper function to get route config by path
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return routeConfigs.find(config => config.path === path);
};

// Helper function to get default route
export const getDefaultRoute = (): RouteConfig => {
  return routeConfigs[0]; // First route is default
};