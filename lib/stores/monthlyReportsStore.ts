import { StateCreator } from 'zustand';
import dayjs from 'dayjs';
import type { BaseDataStore, ResponseTimeRecord } from './baseDataStore';
import { 
  filterDataByMonth, 
  groupBy, 
  calculateDatasetStatistics,
  calculateConfidenceStatistics,
  calculateStatistics,
  ConfidenceStats,
} from '../../utils/chartUtils';

// Types for Monthly Reports
export interface MonthlyStats {
  totalEvents: number;
  activeGroups: number;
  dailyAverage: number;
}

export interface TrendData {
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
}

export interface ChartData {
  dates: string[];
  categories: string[];
  dailyGroupedData: { [date: string]: { [key: string]: number } };
  totalEvents: number;
}

// Types for Response Time Confidence Chart (moved from confidenceChartStore)
export interface ResponseTimeConfidenceChartData {
  dailyResponseTimeStats: ConfidenceStats[];
  datasetStatistics: any;
  responseTimeStatistics: {
    averageResponseTimes: any;
    standardDeviations: any;
  };
  totalDays: number;
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  } | null;
  chartArrays: {
    dates: string[];
    averageData: number[];
    medianData: number[];
    maxData: number[];
    minData: number[];
    upperStdData: number[];
    lowerStdData: number[];
    stdDevData: number[];
    avgStdDev: number;
    stdDevThreshold: number;
  };
  displayNames: {
    segment: string;
    groupBy: string;
  };
}

export interface TrendIconData {
  icon: string;
  text: string;
  color: string;
}

type GroupByType = 'channel' | 'process_group' | 'marketRoleCode';

// Monthly Reports Store Slice
export interface MonthlyReportsStore {
  // Current selections (unified for both charts)
  selectedMonth: string;
  selectedGroupBy: GroupByType;
  selectedSegment?: string; // Added for confidence chart filtering
  
  // Monthly reports computed data (cached)
  monthlyStats: MonthlyStats | null;
  trendData: TrendData | null;
  chartData: ChartData | null;
  
  // Response time confidence chart computed data (cached)
  responseTimeChartData: ResponseTimeConfidenceChartData | null;
  
  // Cache management - Monthly reports
  lastComputedMonth: string;
  lastComputedGroupBy: GroupByType;
  computedAt: number;
  
  // Cache management - Response time confidence chart
  lastComputedResponseTimeMonth: string;
  lastComputedResponseTimeGroupBy: GroupByType;
  lastComputedResponseTimeSegment: string;
  responseTimeComputedAt: number;
  
  // Loading states
  responseTimeProcessing: boolean;
  
  // Actions (unified)
  setSelectedMonth: (month: string) => void;
  setSelectedGroupBy: (groupBy: GroupByType) => void;
  setSelectedSegment: (segment?: string) => void;
  computeMonthlyData: () => void;
  clearMonthlyCache: () => void;
  
  // Response time confidence chart actions
  computeResponseTimeData: () => void;
  clearResponseTimeCache: () => void;
  
  // Getters
  getDisplayName: (key: string) => string;
  getTrendIcon: (trend: 'up' | 'down' | 'neutral', percentage: number) => TrendIconData;
  getAvailableMonths: () => string[];
}

export const createMonthlyReportsStore: StateCreator<
  MonthlyReportsStore & BaseDataStore,
  [],
  [],
  MonthlyReportsStore
> = (set, get) => ({
  // Initial State - Monthly reports
  selectedMonth: '',
  selectedGroupBy: 'channel',
  selectedSegment: undefined,
  monthlyStats: null,
  trendData: null,
  chartData: null,
  lastComputedMonth: '',
  lastComputedGroupBy: 'channel',
  computedAt: 0,
  
  // Initial State - Response time confidence chart
  responseTimeChartData: null,
  lastComputedResponseTimeMonth: '',
  lastComputedResponseTimeGroupBy: 'channel',
  lastComputedResponseTimeSegment: '',
  responseTimeComputedAt: 0,
  responseTimeProcessing: false,

  // Actions
  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
    get().computeMonthlyData();
    get().computeResponseTimeData(); // Also recompute response time data
  },

  setSelectedGroupBy: (groupBy: GroupByType) => {
    set({ selectedGroupBy: groupBy });
    get().computeMonthlyData();
    get().computeResponseTimeData(); // Also recompute response time data
  },

  setSelectedSegment: (segment?: string) => {
    set({ selectedSegment: segment });
    get().computeResponseTimeData(); // Only response time data needs segment filtering
  },

  computeMonthlyData: () => {
    const state = get();
    const { selectedMonth, selectedGroupBy, usageData, monthlyData } = state;

    // Check if we need to recompute
    const needsComputation = 
      !selectedMonth ||
      selectedMonth !== state.lastComputedMonth ||
      selectedGroupBy !== state.lastComputedGroupBy ||
      !state.monthlyStats ||
      !state.chartData;

    if (!needsComputation) {
      console.log('✅ Using cached monthly reports data');
      return;
    }

    const overallStart = performance.now();
    console.log(`🔄 MonthlyReportsStore.computeMonthlyData started - Month: ${selectedMonth}, GroupBy: ${selectedGroupBy}`);

    if (!selectedMonth || usageData.length === 0) {
      console.log(`⚠️ MonthlyReportsStore: No month selected or no usage data`);
      set({
        monthlyStats: { totalEvents: 0, activeGroups: 0, dailyAverage: 0 },
        trendData: { trend: 'neutral', percentage: 0 },
        chartData: null,
        lastComputedMonth: selectedMonth,
        lastComputedGroupBy: selectedGroupBy,
        computedAt: Date.now(),
      });
      return;
    }

    // Compute Monthly Stats
    const statsStart = performance.now();
    const monthlyUsageStatistics = usageData.filter(row => {
      if (!row.event_timestamp) return false;
      const rowMonth = dayjs(row.event_timestamp).format('YYYY-MM');
      return rowMonth === selectedMonth;
    });

    const totalEvents = monthlyUsageStatistics.reduce((sum, row) => sum + row.event_count, 0);
    
    const uniqueGroups = new Set<string>();
    monthlyUsageStatistics.forEach(row => {
      if (selectedGroupBy === 'channel') {
        uniqueGroups.add(row.channel);
      } else if (selectedGroupBy === 'process_group') {
        uniqueGroups.add(row.process_group);
      } else if (selectedGroupBy === 'marketRoleCode') {
        uniqueGroups.add(row.marketRoleCode);
      }
    });

    const monthlyStats: MonthlyStats = {
      totalEvents,
      activeGroups: uniqueGroups.size,
      dailyAverage: Math.round(totalEvents / 30)
    };
    const statsEnd = performance.now();
    console.log(`📊 Monthly stats computation took ${(statsEnd - statsStart).toFixed(2)}ms`);

    // Compute Trend Data
    const trendStart = performance.now();
    let trendData: TrendData = { trend: 'neutral', percentage: 0 };
    
    if (monthlyData.length > 0) {
      const currentIndex = monthlyData.findIndex(m => m.month === selectedMonth);
      if (currentIndex > 0) {
        const current = monthlyData[currentIndex].totalEvents;
        const previous = monthlyData[currentIndex - 1].totalEvents;
        
        if (previous > 0) {
          const percentage = ((current - previous) / previous) * 100;
          trendData = {
            trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
            percentage: Math.abs(percentage)
          };
        }
      }
    }
    const trendEnd = performance.now();
    console.log(`📊 Trend data computation took ${(trendEnd - trendStart).toFixed(2)}ms`);

    // Compute Chart Data
    const chartStart = performance.now();
    const dailyGroupedData: { [date: string]: { [key: string]: number } } = {};
    
    monthlyUsageStatistics.forEach(row => {
      const date = dayjs(row.event_timestamp).format('YYYY-MM-DD');
      if (!dailyGroupedData[date]) {
        dailyGroupedData[date] = {};
      }
      
      let groupKey: string;
      if (selectedGroupBy === 'channel') {
        groupKey = row.channel;
      } else if (selectedGroupBy === 'process_group') {
        groupKey = row.process_group;
      } else {
        groupKey = row.marketRoleCode;
      }
      
      dailyGroupedData[date][groupKey] = (dailyGroupedData[date][groupKey] || 0) + row.event_count;
    });

    const dates = Object.keys(dailyGroupedData).sort();
    
    const allCategories = new Set<string>();
    Object.values(dailyGroupedData).forEach(dayData => {
      Object.keys(dayData).forEach(category => allCategories.add(category));
    });
    const categories = Array.from(allCategories);

    const chartData: ChartData = {
      dates,
      categories,
      dailyGroupedData,
      totalEvents
    };
    const chartEnd = performance.now();
    console.log(`📊 Chart data computation took ${(chartEnd - chartStart).toFixed(2)}ms`);

    // Update state
    const updateStart = performance.now();
    set({
      monthlyStats,
      trendData,
      chartData,
      lastComputedMonth: selectedMonth,
      lastComputedGroupBy: selectedGroupBy,
      computedAt: Date.now(),
    });
    const updateEnd = performance.now();
    console.log(`📊 State update took ${(updateEnd - updateStart).toFixed(2)}ms`);

    const overallEnd = performance.now();
    console.log(`✅ MonthlyReportsStore.computeMonthlyData completed in ${(overallEnd - overallStart).toFixed(2)}ms`);
  },

  clearMonthlyCache: () => {
    set({
      monthlyStats: null,
      trendData: null,
      chartData: null,
      lastComputedMonth: '',
      lastComputedGroupBy: 'channel',
      computedAt: 0,
    });
  },

  // Response Time Confidence Chart Functions
  computeResponseTimeData: () => {
    const state = get();
    const { selectedMonth, selectedGroupBy, selectedSegment, responseTimesData } = state;

    // Check if base data is ready before proceeding
    const baseState = get() as any; // Access base store state
    if (baseState.loadingState !== 'ready' || baseState.responseTimesLoadingState !== 'ready') {
      console.log(`⚠️ MonthlyReportsStore: Base data not ready yet (loadingState: ${baseState.loadingState}, responseTimesLoadingState: ${baseState.responseTimesLoadingState})`);
      return;
    }

    // If no month is selected, clear the data and return
    if (!selectedMonth) {
      console.log(`⚠️ MonthlyReportsStore: No month selected for response time chart`);
      set({
        responseTimeChartData: null,
        lastComputedResponseTimeMonth: '',
        lastComputedResponseTimeGroupBy: selectedGroupBy,
        lastComputedResponseTimeSegment: selectedSegment || '',
        responseTimeComputedAt: Date.now(),
        responseTimeProcessing: false,
      });
      return;
    }

    // Check if we need to recompute
    const needsComputation = 
      selectedMonth !== state.lastComputedResponseTimeMonth ||
      selectedGroupBy !== state.lastComputedResponseTimeGroupBy ||
      (selectedSegment || '') !== state.lastComputedResponseTimeSegment ||
      !state.responseTimeChartData;

    if (!needsComputation) {
      console.log('✅ Using cached response time chart data');
      return;
    }

    if (state.responseTimeProcessing) {
      console.log('⚠️ Response time data computation already in progress');
      return;
    }

    const overallStart = performance.now();
    console.log(`🔄 MonthlyReportsStore.computeResponseTimeData started - Month: ${selectedMonth}, GroupBy: ${selectedGroupBy}, Segment: ${selectedSegment || 'all'}`);
    
    set({ responseTimeProcessing: true });

    try {
      if (!responseTimesData || responseTimesData.length === 0) {
        console.log(`⚠️ MonthlyReportsStore: No response times data available`);
        set({
          responseTimeChartData: null,
          lastComputedResponseTimeMonth: selectedMonth,
          lastComputedResponseTimeGroupBy: selectedGroupBy,
          lastComputedResponseTimeSegment: selectedSegment || '',
          responseTimeComputedAt: Date.now(),
          responseTimeProcessing: false,
        });
        return;
      }

      // Filter by month
      const filterStart = performance.now();
      const filteredData = filterDataByMonth(responseTimesData, selectedMonth);
      const filterEnd = performance.now();
      console.log(`📊 Month filtering took ${(filterEnd - filterStart).toFixed(2)}ms - ${filteredData.length} records`);

      if (filteredData.length === 0) {
        console.log(`⚠️ MonthlyReportsStore: No data for month ${selectedMonth}`);
        set({
          responseTimeChartData: null,
          lastComputedResponseTimeMonth: selectedMonth,
          lastComputedResponseTimeGroupBy: selectedGroupBy,
          lastComputedResponseTimeSegment: selectedSegment || '',
          responseTimeComputedAt: Date.now(),
          responseTimeProcessing: false,
        });
        return;
      }

      // Filter by selected segment if provided
      const segmentFilterStart = performance.now();
      let segmentFilteredData = filteredData;
      if (selectedSegment) {
        segmentFilteredData = filteredData.filter((record: ResponseTimeRecord) => {
          switch (selectedGroupBy) {
            case 'channel':
              return record.channel === selectedSegment;
            case 'process_group':
              return record.process_group === selectedSegment;
            case 'marketRoleCode':
              return record.marketRoleCode === selectedSegment;
            default:
              return true;
          }
        });
      }
      const segmentFilterEnd = performance.now();
      console.log(`📊 Segment filtering took ${(segmentFilterEnd - segmentFilterStart).toFixed(2)}ms - ${segmentFilteredData.length} records`);

      // Calculate comprehensive dataset statistics
      const datasetStatsStart = performance.now();
      const datasetStats = calculateDatasetStatistics(responseTimesData, segmentFilteredData);
      const datasetStatsEnd = performance.now();
      console.log(`📊 Dataset statistics calculation took ${(datasetStatsEnd - datasetStatsStart).toFixed(2)}ms`);

      // Group by date
      const dateGroupingStart = performance.now();
      const dateGroups = groupBy(segmentFilteredData, (item: ResponseTimeRecord) => dayjs(item.timestamp).format('YYYY-MM-DD'));
      const dateGroupingEnd = performance.now();
      console.log(`📊 Date grouping took ${(dateGroupingEnd - dateGroupingStart).toFixed(2)}ms - ${Object.keys(dateGroups).length} groups`);
      
      // Calculate confidence statistics for each date
      const confidenceCalcStart = performance.now();
      const dailyResponseTimeStats: ConfidenceStats[] = Object.entries(dateGroups)
        .map(([date, records]) => {
          const responseTimes = (records as ResponseTimeRecord[]).map(r => r.mean_response_time_ms);
          return calculateConfidenceStatistics(responseTimes, date);
        })
        .sort((a, b) => a.date.localeCompare(b.date));
      const confidenceCalcEnd = performance.now();
      console.log(`📊 Response time statistics calculations took ${(confidenceCalcEnd - confidenceCalcStart).toFixed(2)}ms`);

      // Calculate statistics for the daily response time data itself
      const finalStatsStart = performance.now();
      const responseTimeAverages = dailyResponseTimeStats.map(d => d.average);
      const responseTimeStdDeviations = dailyResponseTimeStats.map(d => d.standardDeviation);
      
      const responseTimeStatistics = {
        averageResponseTimes: calculateStatistics(responseTimeAverages),
        standardDeviations: calculateStatistics(responseTimeStdDeviations)
      };
      const finalStatsEnd = performance.now();
      console.log(`📊 Final statistics calculation took ${(finalStatsEnd - finalStatsStart).toFixed(2)}ms`);

      // Prepare chart data arrays
      const chartArraysStart = performance.now();
      const dates = dailyResponseTimeStats.map(item => item.date);
      const averageData = dailyResponseTimeStats.map(item => Math.round(item.average));
      const medianData = dailyResponseTimeStats.map(item => Math.round(item.median));
      const maxData = dailyResponseTimeStats.map(item => Math.round(item.max));
      const minData = dailyResponseTimeStats.map(item => Math.round(item.min));
      const stdDevData = dailyResponseTimeStats.map(item => item.standardDeviation);
      
      // Calculate ±1 standard deviation bounds
      const upperStdData = dailyResponseTimeStats.map(item => Math.round(item.average + item.standardDeviation));
      const lowerStdData = dailyResponseTimeStats.map(item => Math.round(Math.max(0, item.average - item.standardDeviation)));

      // Calculate average of all standard deviations and threshold
      const avgStdDev = stdDevData.reduce((sum, std) => sum + std, 0) / stdDevData.length;
      const stdDevThreshold = avgStdDev * 1.1; // 10% more than average

      // Prepare display names
      const segmentDisplayName = selectedSegment || 'All';
      const groupDisplayName = selectedGroupBy === 'marketRoleCode' ? 'Market Role' : 
                             selectedGroupBy === 'process_group' ? 'Process Group' : 'Channel';
      
      const chartArraysEnd = performance.now();
      console.log(`📊 Chart arrays preparation took ${(chartArraysEnd - chartArraysStart).toFixed(2)}ms`);

      const responseTimeChartData: ResponseTimeConfidenceChartData = {
        dailyResponseTimeStats,
        datasetStatistics: datasetStats,
        responseTimeStatistics: responseTimeStatistics,
        totalDays: dailyResponseTimeStats.length,
        totalRecords: segmentFilteredData.length,
        dateRange: dailyResponseTimeStats.length > 0 ? {
          start: dailyResponseTimeStats[0].date,
          end: dailyResponseTimeStats[dailyResponseTimeStats.length - 1].date
        } : null,
        chartArrays: {
          dates,
          averageData,
          medianData,
          maxData,
          minData,
          upperStdData,
          lowerStdData,
          stdDevData,
          avgStdDev,
          stdDevThreshold,
        },
        displayNames: {
          segment: segmentDisplayName,
          groupBy: groupDisplayName,
        },
      };

      // Update state
      const updateStart = performance.now();
      set({
        responseTimeChartData,
        lastComputedResponseTimeMonth: selectedMonth,
        lastComputedResponseTimeGroupBy: selectedGroupBy,
        lastComputedResponseTimeSegment: selectedSegment || '',
        responseTimeComputedAt: Date.now(),
        responseTimeProcessing: false,
      });
      const updateEnd = performance.now();
      console.log(`📊 Response time chart state update took ${(updateEnd - updateStart).toFixed(2)}ms`);

      const overallEnd = performance.now();
      console.log(`✅ MonthlyReportsStore.computeResponseTimeData completed in ${(overallEnd - overallStart).toFixed(2)}ms`);

    } catch (error) {
      console.error(`❌ MonthlyReportsStore.computeResponseTimeData failed:`, error);
      set({ 
        responseTimeProcessing: false,
        responseTimeChartData: null 
      });
    }
  },

  clearResponseTimeCache: () => {
    set({
      responseTimeChartData: null,
      lastComputedResponseTimeMonth: '',
      lastComputedResponseTimeGroupBy: 'channel',
      lastComputedResponseTimeSegment: '',
      responseTimeComputedAt: 0,
      responseTimeProcessing: false,
    });
  },

  // Getters
  getDisplayName: (key: string) => {
    const state = get();
    const { selectedGroupBy } = state;
    
    if (selectedGroupBy === 'channel') {
      return state.getChannelDescription(key);
    } else if (selectedGroupBy === 'marketRoleCode') {
      return state.getMarketRoleDescription(key);
    } else {
      return key; // process_group uses the raw name
    }
  },

  getTrendIcon: (trend: 'up' | 'down' | 'neutral', percentage: number): TrendIconData => {
    if (trend === 'neutral') {
      return {
        icon: '→',
        text: 'No change',
        color: 'var(--color-text)'
      };
    }
    
    const color = trend === 'up' ? '#10b981' : 'var(--color-primary-action)';
    const icon = trend === 'up' ? '↗' : '↘';
    
    return {
      icon,
      text: `${percentage.toFixed(1)}% vs last month`,
      color
    };
  },

  getAvailableMonths: () => {
    return get().monthlyData.map(month => month.month).sort();
  },
});
