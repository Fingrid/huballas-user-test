// Enhanced type safety for store interactions

// Discriminated union types for loading states
export type LoadingState<T = unknown> = 
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

// Discriminated union for page states
export type PageState<T = unknown> =
  | { type: 'initializing'; message: string }
  | { type: 'loading'; message: string; progress?: number }
  | { type: 'ready'; data: T }
  | { type: 'error'; error: ErrorDetails; recoverable: boolean };

// Enhanced error details
export interface ErrorDetails {
  code: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

// Strict store interfaces
export interface StoreBase<T> {
  readonly state: LoadingState<T>;
  readonly lastUpdate: Date | null;
  
  // Actions
  setLoading(): void;
  setSuccess(data: T): void;
  setError(error: string): void;
  reset(): void;
}

export interface UsageStoreInterface extends StoreBase<UsageData> {
  readonly _rawdata: Record<string, UsageDataRecord[]> | null;
  readonly monthlyData: Record<string, RefinedUsageData> | null;
  
  // Typed actions
  fetchUsageData(month: string, config?: DataFetchConfig): Promise<void>;
  fetchAnnualData(year: string, config?: DataFetchConfig): Promise<void>;
  getProcessGroups(): string[];
}

export interface DictionaryStoreInterface extends StoreBase<DictionaryCollections> {
  readonly dictionaries: DictionaryCollections | null;
  
  // Typed actions
  fetchDictionaries(): Promise<void>;
  getChannelCodes(): string[];
  getMarketRoleCodes(): string[];
  getChannelDescription(code: string): string;
  getMarketRoleDescription(code: string): string;
}

// Data validation types
export interface UsageData {
  records: UsageDataRecord[];
  totalCount: number;
  dateRange: DateRange;
}

export interface UsageDataRecord {
  event_timestamp: string;
  channel: string;
  message_type: string;
  process_group: string;
  market_role_code: string;
  event_id: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface RefinedUsageData {
  dailyUsageStats: UsageStats[];
  datasetStatistics: DatasetStatistics;
  totalDays: number;
  totalRecords: number;
  dateRange: DateRange | null;
  chartArrays: ChartArrays;
  displayNames: DisplayNames;
  lastUpdate: Date | null;
}

export interface UsageStats {
  date: string;
  totalEvents: number;
  channelBreakdown: Record<string, number>;
  messageTypeBreakdown: Record<string, number>;
  processGroupBreakdown: Record<string, number>;
  marketRoleBreakdown: Record<string, number>;
  eventIDBreakdown: Record<string, number>;
  uniqueChannels: number;
  uniqueMessageTypes: number;
  uniqueProcessGroups: number;
  uniqueMarketRoles: number;
  uniqueEventIDs: number;
}

export interface DatasetStatistics {
  overallTotalEvents: number;
  totalChannels: number;
  totalMessageTypes: number;
  totalProcessGroups: number;
  totalMarketRoles: number;
  totalEventIDs: number;
  channelBreakdown: Record<string, number>;
  messageTypeBreakdown: Record<string, number>;
  processGroupBreakdown: Record<string, number>;
  marketRoleBreakdown: Record<string, number>;
  topEventIDs: Record<string, number>;
}

export interface ChartArrays {
  dates: string[];
  totalEventsData: number[];
  channelData: Record<string, number[]>;
  messageTypeData: Record<string, number[]>;
  processGroupData: Record<string, number[]>;
  marketRoleData: Record<string, number[]>;
  avgDailyEvents: number;
  peakDailyEvents: number;
}

export interface DisplayNames {
  segment: string;
  groupBy: string;
}

export interface DictionaryCollections {
  channels: ChannelDescription[];
  marketRoles: MarketRoleDescription[];
  events: EventDescription[];
}

export interface ChannelDescription {
  code: string;
  description: string;
}

export interface MarketRoleDescription {
  code: string;
  description: string;
}

export interface EventDescription {
  id: string;
  description: string;
}

export interface DataFetchConfig {
  synthesize: 'always' | 'on_missing_data' | 'never';
}

// Type guards
export function isLoadingState(state: unknown): state is LoadingState {
  return Boolean(state && 
    typeof state === 'object' && 
    'status' in state &&
    ['idle', 'loading', 'success', 'error'].includes((state as {status: string}).status));
}

export function isPageStateReady<T>(state: PageState<T>): state is Extract<PageState<T>, { type: 'ready' }> {
  return state.type === 'ready';
}

export function isPageStateError<T>(state: PageState<T>): state is Extract<PageState<T>, { type: 'error' }> {
  return state.type === 'error';
}

export function isPageStateLoading<T>(state: PageState<T>): state is Extract<PageState<T>, { type: 'loading' }> {
  return state.type === 'loading';
}

export function isUsageDataRecord(data: unknown): data is UsageDataRecord {
  return Boolean(data &&
    typeof data === 'object' &&
    'event_timestamp' in data &&
    typeof data.event_timestamp === 'string' &&
    'channel' in data &&
    typeof data.channel === 'string' &&
    'message_type' in data &&
    typeof data.message_type === 'string' &&
    'process_group' in data &&
    typeof data.process_group === 'string' &&
    'market_role_code' in data &&
    typeof data.market_role_code === 'string' &&
    'event_id' in data &&
    typeof data.event_id === 'string');
}

export function isValidDateRange(range: unknown): range is DateRange {
  return Boolean(range &&
    typeof range === 'object' &&
    'start' in range &&
    typeof range.start === 'string' &&
    'end' in range &&
    typeof range.end === 'string' &&
    new Date(range.start).getTime() <= new Date(range.end).getTime());
}

// Data validation utilities
export function validateUsageData(data: unknown): data is UsageData {
  return Boolean(data &&
    typeof data === 'object' &&
    'records' in data &&
    Array.isArray(data.records) &&
    data.records.every(isUsageDataRecord) &&
    'totalCount' in data &&
    typeof data.totalCount === 'number' &&
    'dateRange' in data &&
    isValidDateRange(data.dateRange));
}

export function validateDictionaryCollections(data: unknown): data is DictionaryCollections {
  return Boolean(data &&
    typeof data === 'object' &&
    'channels' in data &&
    Array.isArray(data.channels) &&
    'marketRoles' in data &&
    Array.isArray(data.marketRoles) &&
    'events' in data &&
    Array.isArray(data.events));
}