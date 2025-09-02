import { StateCreator } from 'zustand';
import dayjs from 'dayjs';
import {
  fetchUsageStatistics,
  fetchChannelDescriptions,
  fetchMarketRoleDescriptions,
  fetchEventDescriptions,
  fetchResponseTimes,
  fetchErrorStatistics
} from '../csvUtils';
import { synthesizeErrorStatistics, synthesizeResponseTimes, synthesizeUsageData } from '../synthUtils';

// Types
export interface UsageDataRecord {
  event_timestamp: Date;
  channel: string;
  messagetype: string;
  eventID: string;
  process_group: string;
  marketRoleCode: string;
  event_count: number;
}

export interface MonthlyData {
  month: string;
  totalEvents: number;
  channelBreakdown: { [channel: string]: number };
}

export interface DailyData {
  date: Date;
  [channel: string]: number | Date;
}

export interface YearlyData {
  year: string;
  totalEvents: number;
  marketRoleBreakdown: { [marketRole: string]: number };
}

export interface ResponseTimeRecord {
  timestamp: Date;
  channel: string;
  process_group: string;
  marketRoleCode: string;
  mean_response_time_ms: number;
  std_deviation_ms: number;
  event_count: number;
}

export interface ErrorRecord {
  event_timestamp: Date;
  errortype: string;
  type: 'system_error' | 'validation_error';
  event_count: number;
}

export interface ChannelDescription {
  code: string;
  descriptionEN: string;
  descriptionFI: string;
}

export interface MarketRoleDescription {
  code: string;
  nameAndCode: string;
  name: string;
}

export interface EventDescription {
  eventID: string;
  description: string;
}

type DataFetchConfig = {
  synthesize: 'always' | 'on_missing_data' | 'never';
};

// Loading state enum for proper 3-value logic
export type LoadingState = 'uninitialized' | 'loading' | 'ready';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Base Data Store Slice
export interface BaseDataStore {
  // Usage Data State
  usageData: UsageDataRecord[];
  monthlyData: MonthlyData[];
  dailyData: DailyData[];
  yearlyData: YearlyData[];
  loadingState: LoadingState;
  error: string | null;
  lastFetched: number | null;

  // Response Times State
  responseTimesData: ResponseTimeRecord[];
  responseTimesLoadingState: LoadingState;
  responseTimesError: string | null;
  responseTimesLastFetched: number | null;

  // Error Statistics State
  errorStatsData: ErrorRecord[];
  errorStatsLoadingState: LoadingState;
  errorStatsError: string | null;
  errorStatsLastFetched: number | null;

  // Dictionary State
  channelDescriptions: ChannelDescription[];
  marketRoleDescriptions: MarketRoleDescription[];
  eventDescriptions: EventDescription[];
  dictionariesLoadingState: LoadingState;
  dictionariesError: string | null;
  dictionariesLastFetched: number | null;

  // Actions
  fetchUsageStatistics: (config: DataFetchConfig) => Promise<void>;
  fetchResponseTimes: (config: DataFetchConfig) => Promise<void>;
  fetchErrorStats: (config: DataFetchConfig) => Promise<void>;
  fetchDictionaries: () => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Computed getters
  getChannelDescription: (code: string) => string;
  getMarketRoleDescription: (code: string) => string;
  getEventDescription: (eventID: string) => string;
  getAvailableMonths: () => string[];
  getChannels: () => string[];
  getMarketRoles: () => string[];
  getProcessGroups: () => string[];
}

export const createBaseDataStore: StateCreator<BaseDataStore> = (set, get) => ({
  // Initial State
  usageData: [],
  monthlyData: [],
  dailyData: [],
  yearlyData: [],
  loadingState: 'uninitialized',
  error: null,
  lastFetched: null,

  responseTimesData: [],
  responseTimesLoadingState: 'uninitialized',
  responseTimesError: null,
  responseTimesLastFetched: null,

  errorStatsData: [],
  errorStatsLoadingState: 'uninitialized',
  errorStatsError: null,
  errorStatsLastFetched: null,

  channelDescriptions: [],
  marketRoleDescriptions: [],
  eventDescriptions: [],
  dictionariesLoadingState: 'uninitialized',
  dictionariesError: null,
  dictionariesLastFetched: null,

  // Actions
  fetchUsageStatistics: async ({ synthesize }) => {
    const state = get();

    if (state.loadingState === 'loading') {
      return;
    }

    // Check if we have cached data that's still fresh
    if (state.usageData.length > 0 && state.lastFetched) {
      const timeSinceLastFetch = Date.now() - state.lastFetched;
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('Using cached usage statistics data');
        return;
      }
    }

    const overallStart = performance.now();
    console.log(`🔄 BaseDataStore.fetchUsageStatistics started - synthesize: ${synthesize}`);
    
    set({ loadingState: 'loading', error: null });

    try {
      let csvFetchResponse = undefined;
      if (synthesize === 'never' || synthesize === 'on_missing_data') {
        const fetchStart = performance.now();
        csvFetchResponse = await fetchUsageStatistics();
        const fetchEnd = performance.now();
        console.log(`📊 CSV fetch took ${(fetchEnd - fetchStart).toFixed(2)}ms - success: ${csvFetchResponse?.success}`);

        if (synthesize === 'never' && !csvFetchResponse.success) {
          throw new Error('Failed to fetch usage statistics');
        }
      }

      const dataStart = performance.now();
      const rawUsageStatistics = csvFetchResponse?.success ? csvFetchResponse.data || synthesizeUsageData() : [];
      const dataEnd = performance.now();
      console.log(`📊 Data preparation took ${(dataEnd - dataStart).toFixed(2)}ms - ${rawUsageStatistics.length} records`);

      // Process monthly data
      const monthlyStart = performance.now();
      const monthlyAggregation: { [month: string]: { total: number; channels: { [channel: string]: number } } } = {};

      rawUsageStatistics.forEach((row) => {
        const date = dayjs(row.event_timestamp);
        const monthKey = date.format('YYYY-MM');

        if (!monthlyAggregation[monthKey]) {
          monthlyAggregation[monthKey] = { total: 0, channels: {} };
        }

        monthlyAggregation[monthKey].total += row.event_count;
        monthlyAggregation[monthKey].channels[row.channel] =
          (monthlyAggregation[monthKey].channels[row.channel] || 0) + row.event_count;
      });

      const monthlyData: MonthlyData[] = Object.entries(monthlyAggregation)
        .map(([month, data]) => ({
          month,
          totalEvents: data.total,
          channelBreakdown: data.channels,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      const monthlyEnd = performance.now();
      console.log(`📊 Monthly aggregation took ${(monthlyEnd - monthlyStart).toFixed(2)}ms - ${monthlyData.length} months`);

      // Process daily data
      const dailyStart = performance.now();
      const dailyAggregation: { [date: string]: { [channel: string]: number } } = {};

      rawUsageStatistics.forEach((row) => {
        const dateKey = dayjs(row.event_timestamp).format('YYYY-MM-DD');

        if (!dailyAggregation[dateKey]) {
          dailyAggregation[dateKey] = {};
        }

        dailyAggregation[dateKey][row.channel] =
          (dailyAggregation[dateKey][row.channel] || 0) + row.event_count;
      });

      const dailyData: DailyData[] = Object.entries(dailyAggregation)
        .map(([dateString, channels]) => ({
          date: dayjs(dateString).toDate(),
          ...channels,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      const dailyEnd = performance.now();
      console.log(`📊 Daily aggregation took ${(dailyEnd - dailyStart).toFixed(2)}ms - ${dailyData.length} days`);

      // Process yearly data
      const yearlyStart = performance.now();
      const yearlyAggregation: { [year: string]: { total: number; marketRoles: { [marketRole: string]: number } } } = {};

      rawUsageStatistics.forEach((row) => {
        const yearKey = dayjs(row.event_timestamp).format('YYYY');

        if (!yearlyAggregation[yearKey]) {
          yearlyAggregation[yearKey] = { total: 0, marketRoles: {} };
        }

        yearlyAggregation[yearKey].total += row.event_count;
        yearlyAggregation[yearKey].marketRoles[row.marketRoleCode] =
          (yearlyAggregation[yearKey].marketRoles[row.marketRoleCode] || 0) + row.event_count;
      });

      const yearlyData: YearlyData[] = Object.entries(yearlyAggregation)
        .map(([year, data]) => ({
          year,
          totalEvents: data.total,
          marketRoleBreakdown: data.marketRoles,
        }))
        .sort((a, b) => a.year.localeCompare(b.year));
      const yearlyEnd = performance.now();
      console.log(`📊 Yearly aggregation took ${(yearlyEnd - yearlyStart).toFixed(2)}ms - ${yearlyData.length} years`);

      const stateUpdateStart = performance.now();
      set({
        usageData: rawUsageStatistics,
        monthlyData,
        dailyData,
        yearlyData,
        loadingState: 'ready',
        error: null,
        lastFetched: Date.now(),
      });
      const stateUpdateEnd = performance.now();
      console.log(`📊 State update took ${(stateUpdateEnd - stateUpdateStart).toFixed(2)}ms`);

      const overallEnd = performance.now();
      console.log(`✅ BaseDataStore.fetchUsageStatistics completed in ${(overallEnd - overallStart).toFixed(2)}ms`);

    } catch (error) {
      const errorTime = performance.now();
      console.log(`❌ BaseDataStore.fetchUsageStatistics failed after ${(errorTime - overallStart).toFixed(2)}ms`);
      set({
        loadingState: 'uninitialized',
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  },

  fetchResponseTimes: async ({ synthesize }) => {
    const state = get();

    if (state.responseTimesLoadingState === 'loading' || state.loadingState !== 'ready') {
      return;
    }

    // Check if we have cached data that's still fresh
    if (state.responseTimesData.length > 0 && state.responseTimesLastFetched) {
      const timeSinceLastFetch = Date.now() - state.responseTimesLastFetched;
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('Using cached response times data');
        return;
      }
    }

    set({ responseTimesLoadingState: 'loading', responseTimesError: null });

    try {
      let csvFetchResponse = undefined;
      if (synthesize === 'never' || synthesize === 'on_missing_data') {
        csvFetchResponse = await fetchResponseTimes();

        if (synthesize === 'never' && !csvFetchResponse.success) {
          throw new Error('Failed to fetch response times');
        }
      }

      const responseTimesData = csvFetchResponse?.success && csvFetchResponse.data 
        ? csvFetchResponse.data 
        : synthesizeResponseTimes(state.usageData);

      set({
        responseTimesData,
        responseTimesLoadingState: 'ready',
        responseTimesError: null,
        responseTimesLastFetched: Date.now(),
      });

    } catch (error) {
      set({
        responseTimesLoadingState: 'uninitialized',
        responseTimesError: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  },

  fetchErrorStats: async ({ synthesize }) => {
    const state = get();

    if (state.errorStatsLoadingState === 'loading') {
      return;
    }

    // Check if we have cached data that's still fresh
    if (state.errorStatsData.length > 0 && state.errorStatsLastFetched) {
      const timeSinceLastFetch = Date.now() - state.errorStatsLastFetched;
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('Using cached error stats data');
        return;
      }
    }

    set({ errorStatsLoadingState: 'loading', errorStatsError: null });

    try {
      let csvFetchResponse = undefined;
      if (synthesize === 'never' || synthesize === 'on_missing_data') {
        csvFetchResponse = await fetchErrorStatistics();

        if (synthesize === 'never' && !csvFetchResponse.success) {
          throw new Error('Failed to fetch error statistics');
        }
      }

      const errorStatsData = csvFetchResponse?.success && csvFetchResponse.data 
        ? csvFetchResponse.data 
        : synthesizeErrorStatistics(state.usageData);

      set({
        errorStatsData,
        errorStatsLoadingState: 'ready',
        errorStatsError: null,
        errorStatsLastFetched: Date.now(),
      });

    } catch (error) {
      set({
        errorStatsLoadingState: 'uninitialized',
        errorStatsError: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  },

  fetchDictionaries: async () => {
    const state = get();

    if (state.dictionariesLoadingState === 'loading') {
      return;
    }

    // Check if we have cached data that's still fresh
    if (state.channelDescriptions.length > 0 && state.dictionariesLastFetched) {
      const timeSinceLastFetch = Date.now() - state.dictionariesLastFetched;
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('Using cached dictionaries data');
        return;
      }
    }

    set({ dictionariesLoadingState: 'loading', dictionariesError: null });

    try {
      const [channelResponse, marketRoleResponse, eventResponse] = await Promise.all([
        fetchChannelDescriptions(),
        fetchMarketRoleDescriptions(),
        fetchEventDescriptions(),
      ]);

      const channelDescriptions = channelResponse.success ? channelResponse.data : [];
      const marketRoleDescriptions = marketRoleResponse.success ? marketRoleResponse.data : [];
      const eventDescriptions = eventResponse.success ? eventResponse.data : [];

      set({
        channelDescriptions,
        marketRoleDescriptions,
        eventDescriptions,
        dictionariesLoadingState: 'ready',
        dictionariesError: null,
        dictionariesLastFetched: Date.now(),
      });

    } catch (error) {
      set({
        dictionariesLoadingState: 'uninitialized',
        dictionariesError: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  },

  clearError: () => set((state) => ({
    error: null,
    responseTimesError: null,
    errorStatsError: null,
    dictionariesError: null,
  })),

  reset: () => set({
    usageData: [],
    monthlyData: [],
    dailyData: [],
    yearlyData: [],
    loadingState: 'uninitialized',
    error: null,
    lastFetched: null,
    responseTimesData: [],
    responseTimesLoadingState: 'uninitialized',
    responseTimesError: null,
    responseTimesLastFetched: null,
    errorStatsData: [],
    errorStatsLoadingState: 'uninitialized',
    errorStatsError: null,
    errorStatsLastFetched: null,
    channelDescriptions: [],
    marketRoleDescriptions: [],
    eventDescriptions: [],
    dictionariesLoadingState: 'uninitialized',
    dictionariesError: null,
    dictionariesLastFetched: null,
  }),

  // Computed getters
  getChannelDescription: (code: string) => {
    const description = get().channelDescriptions.find(desc => desc.code === code);
    return description ? description.descriptionEN : code;
  },

  getMarketRoleDescription: (code: string) => {
    const description = get().marketRoleDescriptions.find(desc => desc.code === code);
    return description ? description.nameAndCode : code;
  },

  getEventDescription: (eventID: string) => {
    const description = get().eventDescriptions.find(desc => desc.eventID === eventID);
    return description ? description.description : eventID;
  },

  getAvailableMonths: () => {
    return get().monthlyData.map(month => month.month).sort();
  },

  getChannels: () => {
    const channels = new Set<string>();
    get().usageData.forEach(record => channels.add(record.channel));
    return Array.from(channels).sort();
  },

  getMarketRoles: () => {
    const marketRoles = new Set<string>();
    get().usageData.forEach(record => marketRoles.add(record.marketRoleCode));
    return Array.from(marketRoles).sort();
  },

  getProcessGroups: () => {
    const processGroups = new Set<string>();
    get().usageData.forEach(record => processGroups.add(record.process_group));
    return Array.from(processGroups).sort();
  },
});
