/**
 * Simple data processing utilities
 * Functions for transforming and aggregating data without complex abstractions
 */

import type { UsageDataRecord, ErrorRecord, ResponseTimeRecord } from '../types';

// Date range interface
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

// Simple aggregation functions
export function aggregateUsageByField(
  data: UsageDataRecord[],
  field: keyof Pick<UsageDataRecord, 'channel' | 'process_group' | 'marketRoleCode'>
): Record<string, number> {
  return data.reduce((acc, record) => {
    const key = record[field];
    acc[key] = (acc[key] || 0) + record.event_count;
    return acc;
  }, {} as Record<string, number>);
}

export function aggregateUsageByDate(data: UsageDataRecord[]): Record<string, number> {
  return data.reduce((acc, record) => {
    const dateKey = new Date(record.event_timestamp).toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + record.event_count;
    return acc;
  }, {} as Record<string, number>);
}

export function aggregateErrorsByField(
  data: ErrorRecord[],
  field: keyof Pick<ErrorRecord, 'errortype' | 'type'>
): Record<string, number> {
  return data.reduce((acc, record) => {
    const key = record[field];
    acc[key] = (acc[key] || 0) + record.event_count;
    return acc;
  }, {} as Record<string, number>);
}

export function aggregateErrorsByDate(data: ErrorRecord[]): Record<string, number> {
  return data.reduce((acc, record) => {
    const dateKey = new Date(record.event_timestamp).toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + record.event_count;
    return acc;
  }, {} as Record<string, number>);
}

// Date filtering utilities
export function isWithinDateRange(date: Date | string, dateRange?: DateRangeFilter): boolean {
  if (!dateRange) return true;
  
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);
  
  return targetDate >= startDate && targetDate <= endDate;
}

export function filterUsageByDateRange(data: UsageDataRecord[], dateRange?: DateRangeFilter): UsageDataRecord[] {
  if (!dateRange) return data;
  return data.filter(record => isWithinDateRange(record.event_timestamp, dateRange));
}

export function filterErrorsByDateRange(data: ErrorRecord[], dateRange?: DateRangeFilter): ErrorRecord[] {
  if (!dateRange) return data;
  return data.filter(record => isWithinDateRange(record.event_timestamp, dateRange));
}

export function filterResponseTimesByDateRange(data: ResponseTimeRecord[], dateRange?: DateRangeFilter): ResponseTimeRecord[] {
  if (!dateRange) return data;
  return data.filter(record => isWithinDateRange(record.timestamp, dateRange));
}

// Data range calculation
export function getDataDateRange(data: (UsageDataRecord | ErrorRecord)[]): DateRangeFilter | null {
  if (data.length === 0) return null;

  const dates = data.map(record => {
    // Both types have event_timestamp
    const date = record.event_timestamp;
    return typeof date === 'string' ? new Date(date) : date;
  }).sort((a, b) => a.getTime() - b.getTime());

  return {
    startDate: dates[0].toISOString().split('T')[0],
    endDate: dates[dates.length - 1].toISOString().split('T')[0]
  };
}

// Response time statistics
export function calculateResponseTimeStats(data: ResponseTimeRecord[]): {
  mean: number;
  stdDev: number;
  count: number;
} {
  if (data.length === 0) return { mean: 0, stdDev: 0, count: 0 };

  const count = data.length;
  const mean = data.reduce((sum, record) => sum + record.mean_response_time_ms, 0) / count;
  
  // Calculate weighted standard deviation based on existing std_deviation values
  const totalEvents = data.reduce((sum, record) => sum + record.event_count, 0);
  const weightedVariance = data.reduce((sum, record) => {
    const weight = record.event_count / totalEvents;
    return sum + weight * Math.pow(record.std_deviation_ms, 2);
  }, 0);
  
  const stdDev = Math.sqrt(weightedVariance);

  return { mean, stdDev, count };
}

// Simple memoization utility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMemoizedFunction<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    
    // Keep cache size reasonable
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, result);
    return result;
  }) as T;
}