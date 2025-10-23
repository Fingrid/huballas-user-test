/**
 * Simple data access hooks for components
 * Provides clean interfaces without exposing store internals
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useUsageStore, useDictionaryStore, useErrorStore } from '../stores';
import type { DateRangeFilter } from '../dataProcessing';
import type { DataFetchConfig } from '../types';
import { 
  aggregateUsageByField, 
  aggregateUsageByDate, 
  filterUsageByDateRange, 
  getDataDateRange 
} from '../dataProcessing';

export type DateRangeOption = '30days' | '60days' | '90days' | 'year' | 'custom';

// Usage data hook with computed properties
export function useUsageData(dateRange?: DateRangeFilter) {
  const usageStore = useUsageStore();
  
  // Fetch data on mount if not already loaded
  useEffect(() => {
    if (!usageStore.monthlyData && !usageStore.loading) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      usageStore.fetchUsageData(currentMonth);
    }
  }, [usageStore]);

  // Get all raw data from store
  const allRawData = useMemo(() => {
    if (!usageStore._rawdata) return [];
    return Object.values(usageStore._rawdata).flat();
  }, [usageStore._rawdata]);

  // Apply date filtering
  const filteredData = useMemo(() => {
    return filterUsageByDateRange(allRawData, dateRange);
  }, [allRawData, dateRange]);

  // Computed values based on filtered data
  const computedData = useMemo(() => {
    return {
      totalEvents: filteredData.reduce((sum, record) => sum + record.event_count, 0),
      channelBreakdown: aggregateUsageByField(filteredData, 'channel'),
      marketRoleBreakdown: aggregateUsageByField(filteredData, 'marketRoleCode'),
      processGroupBreakdown: aggregateUsageByField(filteredData, 'process_group'),
      dailyBreakdown: aggregateUsageByDate(filteredData),
      availableDateRange: getDataDateRange(allRawData),
      rawData: filteredData
    };
  }, [filteredData, allRawData]);

  const refreshData = useCallback(async (config?: DataFetchConfig) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    await usageStore.fetchUsageData(currentMonth, config);
  }, [usageStore]);

  return {
    // State
    isLoading: usageStore.loading,
    error: usageStore.error,
    lastUpdate: usageStore.lastUpdate,
    
    // Computed data
    ...computedData,
    
    // Actions
    refresh: refreshData
  };
}

// Error data hook (simplified)
export function useErrorData(dateRange?: DateRangeFilter) {
  const errorStore = useErrorStore();
  
  useEffect(() => {
    if (!errorStore.monthlyData && !errorStore.loading) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      errorStore.fetchErrorData(currentMonth);
    }
  }, [errorStore]);

  // For now, return the existing store data
  // This could be enhanced with filtering similar to usage data
  return {
    isLoading: errorStore.loading,
    error: errorStore.error,
    lastUpdate: errorStore.lastUpdate,
    monthlyData: errorStore.monthlyData,
    rawData: errorStore._rawdata || {}
  };
}

// Dictionary data hook
export function useDictionaryData() {
  const dictionaryStore = useDictionaryStore();
  
  useEffect(() => {
    if (!dictionaryStore.dictionaries && !dictionaryStore.loading) {
      dictionaryStore.fetchDictionaries();
    }
  }, [dictionaryStore]);

  return {
    isLoading: dictionaryStore.loading,
    error: dictionaryStore.error,
    
    // Helper functions
    getChannelDescription: dictionaryStore.getChannelDescription,
    getMarketRoleDescription: dictionaryStore.getMarketRoleDescription,
    
    // Raw data access
    dictionaries: dictionaryStore.dictionaries
  };
}

// Combined loading state hook
export function useLoadingState() {
  const usageStore = useUsageStore();
  const errorStore = useErrorStore();
  const dictionaryStore = useDictionaryStore();

  const isAnyLoading = useMemo(() => {
    return usageStore.loading || errorStore.loading || dictionaryStore.loading;
  }, [usageStore.loading, errorStore.loading, dictionaryStore.loading]);

  const hasAnyError = useMemo(() => {
    return !!(usageStore.error || errorStore.error || dictionaryStore.error);
  }, [usageStore.error, errorStore.error, dictionaryStore.error]);

  const errors = useMemo(() => {
    const errorList = [];
    if (usageStore.error) errorList.push({ type: 'usage', message: usageStore.error });
    if (errorStore.error) errorList.push({ type: 'error', message: errorStore.error });
    if (dictionaryStore.error) errorList.push({ type: 'dictionary', message: dictionaryStore.error });
    return errorList;
  }, [usageStore.error, errorStore.error, dictionaryStore.error]);

  return {
    isAnyLoading,
    hasAnyError,
    errors,
    individual: {
      usage: { loading: usageStore.loading, error: usageStore.error },
      errors: { loading: errorStore.loading, error: errorStore.error },
      dictionary: { loading: dictionaryStore.loading, error: dictionaryStore.error }
    }
  };
}

// Date range calculation hook
export function useDateRangeCalculation() {
  const calculateDateRange = useCallback((
    option: DateRangeOption,
    customRange?: DateRangeFilter,
    availableDataRange?: DateRangeFilter
  ): DateRangeFilter => {
    // Use the last available data date as the end date, or fall back to current date
    const endDate = availableDataRange ? availableDataRange.endDate : new Date().toISOString().split("T")[0];

    if (option === "custom" && customRange) {
      return customRange;
    }

    const daysMap = {
      "30days": 30,
      "60days": 60,
      "90days": 90,
      "year": 365,
      custom: 90, // fallback
    };

    const days = daysMap[option] || 90;
    const endDateObj = new Date(endDate);
    const startDateObj = new Date(endDateObj.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Ensure we don't go before the earliest available data
    const calculatedStartDate = availableDataRange && startDateObj < new Date(availableDataRange.startDate)
      ? availableDataRange.startDate
      : startDateObj.toISOString().split("T")[0];

    return {
      startDate: calculatedStartDate,
      endDate,
    };
  }, []);

  return { calculateDateRange };
}

// Simple data aggregation hook for charts
export function useChartData(
  stackingType: 'channel' | 'process_group' | 'marketRoleCode',
  dateRange?: DateRangeFilter
) {
  const { rawData, channelBreakdown, marketRoleBreakdown, processGroupBreakdown } = useUsageData(dateRange);

  const chartData = useMemo(() => {
    let data: Record<string, number>;
    
    switch (stackingType) {
      case 'channel':
        data = channelBreakdown;
        break;
      case 'marketRoleCode':
        data = marketRoleBreakdown;
        break;
      case 'process_group':
        data = processGroupBreakdown;
        break;
      default:
        data = {};
    }

    return {
      stackingData: data,
      rawRecords: rawData,
      isEmpty: Object.keys(data).length === 0
    };
  }, [stackingType, channelBreakdown, marketRoleBreakdown, processGroupBreakdown, rawData]);

  return chartData;
}