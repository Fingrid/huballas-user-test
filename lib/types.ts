// Core data record interfaces
export interface UsageDataRecord {
  event_timestamp: Date;
  channel: string;
  messagetype: string;
  eventID: string;
  process_group: string;
  marketRoleCode: string;
  event_count: number;
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

// Dictionary interfaces
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

// Data fetch configuration
export type DataFetchConfig = {
  synthesize: 'always' | 'on_missing_data' | 'never';
};

// Loading state enum for proper 3-value logic
export type LoadingState = 'uninitialized' | 'loading' | 'ready';

// Result type for fetch operations
export type FetchResult<T> = 
  | { success: true; data: T }
  | { success: false; error: 'NO_DATA' };