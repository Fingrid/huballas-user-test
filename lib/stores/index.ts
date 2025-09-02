import { create } from 'zustand';
import type { BaseDataStore } from './baseDataStore';
import { createBaseDataStore } from './baseDataStore';
import type { MonthlyReportsStore } from './monthlyReportsStore';
import { createMonthlyReportsStore } from './monthlyReportsStore';

// Combined store type
export type CombinedStore = BaseDataStore & MonthlyReportsStore;

// Create the combined store
export const useCombinedStore = create<CombinedStore>()((...a) => ({
  ...createBaseDataStore(...a),
  ...createMonthlyReportsStore(...a),
}));

// Export store types and interfaces
export type { BaseDataStore } from './baseDataStore';
export type { MonthlyReportsStore } from './monthlyReportsStore';

// Export data types
export type {
  UsageDataRecord,
  MonthlyData,
  DailyData,
  YearlyData,
  ResponseTimeRecord,
  ErrorRecord,
  ChannelDescription,
  MarketRoleDescription,
  EventDescription,
  LoadingState,
} from './baseDataStore';

export type {
  MonthlyStats,
  TrendData,
  ChartData,
  TrendIconData,
  ResponseTimeConfidenceChartData,
} from './monthlyReportsStore';

// Store hooks
export const useBaseData = () => {
  const store = useCombinedStore();
  
  return {
    // Base data
    usageData: store.usageData,
    monthlyData: store.monthlyData,
    dailyData: store.dailyData,
    yearlyData: store.yearlyData,
    loadingState: store.loadingState,
    error: store.error,
    lastFetched: store.lastFetched,
    
    // Response times
    responseTimesData: store.responseTimesData,
    responseTimesLoadingState: store.responseTimesLoadingState,
    responseTimesError: store.responseTimesError,
    responseTimesLastFetched: store.responseTimesLastFetched,
    
    // Error stats
    errorStatsData: store.errorStatsData,
    errorStatsLoadingState: store.errorStatsLoadingState,
    errorStatsError: store.errorStatsError,
    errorStatsLastFetched: store.errorStatsLastFetched,
    
    // Dictionaries
    channelDescriptions: store.channelDescriptions,
    marketRoleDescriptions: store.marketRoleDescriptions,
    eventDescriptions: store.eventDescriptions,
    dictionariesLoadingState: store.dictionariesLoadingState,
    dictionariesError: store.dictionariesError,
    dictionariesLastFetched: store.dictionariesLastFetched,
    
    // Actions
    fetchUsageStatistics: store.fetchUsageStatistics,
    fetchResponseTimes: store.fetchResponseTimes,
    fetchErrorStats: store.fetchErrorStats,
    fetchDictionaries: store.fetchDictionaries,
    clearError: store.clearError,
    reset: store.reset,
    
    // Getters
    getChannelDescription: store.getChannelDescription,
    getMarketRoleDescription: store.getMarketRoleDescription,
    getEventDescription: store.getEventDescription,
    getAvailableMonths: store.getAvailableMonths,
    getChannels: store.getChannels,
    getMarketRoles: store.getMarketRoles,
    getProcessGroups: store.getProcessGroups,
  };
};
// New hooks for enhanced functionality
export const useMonthlyReports = () => {
  const store = useCombinedStore();
  
  return {
    // Selections
    selectedMonth: store.selectedMonth,
    selectedGroupBy: store.selectedGroupBy,
    selectedSegment: store.selectedSegment,
    
    // Computed data
    monthlyStats: store.monthlyStats,
    trendData: store.trendData,
    chartData: store.chartData,
    responseTimeChartData: store.responseTimeChartData,
    
    // Loading states
    responseTimeProcessing: store.responseTimeProcessing,
    
    // Actions
    setSelectedMonth: store.setSelectedMonth,
    setSelectedGroupBy: store.setSelectedGroupBy,
    setSelectedSegment: store.setSelectedSegment,
    computeMonthlyData: store.computeMonthlyData,
    clearMonthlyCache: store.clearMonthlyCache,
    computeResponseTimeData: store.computeResponseTimeData,
    clearResponseTimeCache: store.clearResponseTimeCache,
    
    // Getters
    getDisplayName: store.getDisplayName,
    getTrendIcon: store.getTrendIcon,
    getAvailableMonths: store.getAvailableMonths,
    
    // Loading states (using new 3-value loading states)
    loadingState: store.loadingState,
    error: store.error,
    responseTimesLoadingState: store.responseTimesLoadingState,
    responseTimesError: store.responseTimesError,
  };
};
