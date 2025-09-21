/**
 * Utility functions for common chart data transformations
 */

import type { ResponseTimeRecord } from '../lib/types';

import dayjs from 'dayjs';

/**
 * Theme color palette utilities
 */
export function getThemeColors() {
  return ['#3e5660', '#4d9d88', '#6d838f', '#277158', '#ac3032', '#a15885', '#e5b2bb', '#e9eef2', '#00807d'];
}

/**
 * Filter data by month using Date objects
 */
export function filterDataByMonth<T extends { timestamp?: Date; event_timestamp?: Date }>(
  data: T[],
  selectedMonth: string
): T[] {
  if (!data || !selectedMonth) return [];
  
  return data.filter(record => {
    const timestamp = record.timestamp || record.event_timestamp;
    if (!timestamp) return false;
    
    const recordMonth = dayjs(timestamp).format('YYYY-MM');
    return recordMonth === selectedMonth;
  });
}

/**
 * Group data by a specific field
 */
export function groupBy<T>(
  data: T[],
  keySelector: (item: T) => string
): { [key: string]: T[] } {
  return data.reduce((groups, item) => {
    const key = keySelector(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as { [key: string]: T[] });
}

/**
 * Calculate statistics for grouped numeric data
 */
export interface Statistics {
  total: number;
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  variance: number;
}

export function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return { 
      total: 0, 
      count: 0, 
      average: 0, 
      median: 0, 
      min: 0, 
      max: 0, 
      standardDeviation: 0,
      variance: 0
    };
  }
  
  const total = values.reduce((sum, val) => sum + val, 0);
  const count = values.length;
  const average = total / count;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate median
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Calculate variance and standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / count;
  const standardDeviation = Math.sqrt(variance);
  
  return { 
    total, 
    count, 
    average, 
    median, 
    min, 
    max, 
    standardDeviation,
    variance
  };
}

/**
 * Calculate comprehensive dataset statistics for response time data
 */
export interface DatasetStatistics {
  wholeDataset: Statistics;
  filteredDataset: Statistics;
  standardDeviationStats: Statistics; // Stats about std deviations themselves
  eventCountStats: Statistics; // Stats about event counts
}

export function calculateDatasetStatistics(
  wholeData: ResponseTimeRecord[],
  filteredData: ResponseTimeRecord[]
): DatasetStatistics {
  // Extract response times from whole dataset
  const wholeResponseTimes = wholeData.map(r => r.mean_response_time_ms);
  const wholeStdDeviations = wholeData.map(r => r.std_deviation_ms);
  const wholeEventCounts = wholeData.map(r => r.event_count);
  
  // Extract response times from filtered dataset
  const filteredResponseTimes = filteredData.map(r => r.mean_response_time_ms);
  const filteredStdDeviations = filteredData.map(r => r.std_deviation_ms);
  const filteredEventCounts = filteredData.map(r => r.event_count);
  
  return {
    wholeDataset: calculateStatistics(wholeResponseTimes),
    filteredDataset: calculateStatistics(filteredResponseTimes),
    standardDeviationStats: calculateStatistics(filteredStdDeviations),
    eventCountStats: calculateStatistics(filteredEventCounts)
  };
}

/**
 * Calculate confidence interval statistics for response time data
 */
export interface ConfidenceStats {
  date: string;
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  count: number;
}

export function calculateConfidenceStatistics(
  responseTimeValues: number[], 
  date: string
): ConfidenceStats {
  if (responseTimeValues.length === 0) {
    return {
      date,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      count: 0
    };
  }

  // Calculate average
  const average = responseTimeValues.reduce((sum, val) => sum + val, 0) / responseTimeValues.length;
  
  // Calculate median
  const sorted = [...responseTimeValues].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Calculate min and max
  const min = Math.min(...responseTimeValues);
  const max = Math.max(...responseTimeValues);
  
  // Calculate standard deviation (keeping for tooltip info)
  const variance = responseTimeValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / responseTimeValues.length;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    date,
    average,
    median,
    min,
    max,
    standardDeviation,
    count: responseTimeValues.length
  };
}


