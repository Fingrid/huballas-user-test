import Papa from 'papaparse';
import dayjs from 'dayjs';
import type { ResponseTimeRecord, ErrorRecord, ChannelDescription, MarketRoleDescription, EventDescription, UsageDataRecord } from './stores';

// Result type for fetch operations
export type FetchResult<T> = 
  | { success: true; data: T }
  | { success: false; error: 'NO_DATA' };

const dataSets = {
  usageStatistics: 'data_usage_statistics.csv',
  responseTimes: 'data_response_times.csv',
  errorStats: 'data_error_statistics.csv',
  channelDescriptions: 'dict_channel_descriptions.csv',
  marketRoleDescriptions: 'dict_marketrolecode_descriptions.csv',
  eventDescriptions: 'dict_event_descriptions.csv'
}

type RAW_UsageStatisticsRecord = {
  event_timestamp: string;
  channel: string;
  messagetype: string;
  eventID: string;
  process_group: string;
  marketRoleCode: string;
  event_count: number;
}

type RAW_ResponseTimeRecord = {
  timestamp: string;
  channel: string;
  process_group: string;
  marketRoleCode: string;
  mean_response_time_ms: number;
  std_deviation_ms: number;
  event_count: number;
}

type RAW_ErrorRecord = {
  event_timestamp: string;
  errortype: string;
  type: string;
  event_count: number;
}

type RAW_ChannelDescription = {
  code: string;
  description_en: string;
  description_fi: string;
}

type RAW_MarketRoleDescription = {
  MarketRoleCode: string;
  MarketRoleNameAndCode: string;
  MarketRoleName: string;
}

type RAW_EventDescription = {
  eventID: string;
  description: string;
}

// Utility function to fetch CSV files from public directory
export async function fetchCSVFile(filename: string): Promise<FetchResult<string>> {
    console.log(`📥 Loading ${filename}`);

    try {
      const response = await fetch(`/data/${filename}`);
      if (!response.ok) {
        console.warn(`Failed to fetch ${filename}: ${response.statusText}`);
        return { success: false, error: 'NO_DATA' };
    }
    const content = await response.text();
    return { success: true, data: content };
  } catch (error) {
    console.warn(`Could not fetch ${filename}`, error);
    return { success: false, error: 'NO_DATA' };
  }
}

// Fetch and parse usage statistics using PapaParse
export async function fetchUsageStatistics(): Promise<FetchResult<UsageDataRecord[]>> {

  const csvResult = await fetchCSVFile(dataSets.usageStatistics);
  if (!csvResult.success) {
    return { success: false, error: 'NO_DATA' };
  }

  try {
    const results = Papa.parse<RAW_UsageStatisticsRecord>(csvResult.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (results.errors.length > 0) {
      console.warn('Error parsing usage statistics CSV:', results.errors);
    }

    const data = results.data.map(row => ({
      event_timestamp: dayjs(String(row.event_timestamp || "").trim()).toDate(),
      channel: String(row.channel || "").trim(),
      messagetype: String(row.messagetype || "").trim(),
      eventID: String(row.eventID || "").trim(),
      process_group: String(row.process_group || "").trim(),
      marketRoleCode: String(row.marketRoleCode || "").trim(),
      event_count: Number(row.event_count) || 0
    })).filter(row => !isNaN(row.event_timestamp.getTime()) && row.channel && !isNaN(row.event_count));

    return { success: true, data };
  } catch (error) {
    console.warn('Error parsing usage statistics:', error);
    return { success: false, error: 'NO_DATA' };
  }
}

// Fetch and parse channel descriptions using PapaParse
export async function fetchChannelDescriptions(): Promise<FetchResult<ChannelDescription[]>> {
  const csvResult = await fetchCSVFile(dataSets.channelDescriptions);
  if (!csvResult.success) {
    return { success: false, error: 'NO_DATA' };
  }

  try {
    const results = Papa.parse<RAW_ChannelDescription>(csvResult.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (results.errors.length > 0) {
      console.warn('Error parsing channel descriptions CSV:', results.errors);
    }

    const data = results.data.map(row => ({
      code: String(row.code || "").trim(),
      descriptionEN: String(row.description_en || "").trim(),
      descriptionFI: String(row.description_fi || "").trim()
    })).filter(row => row.code);

    return { success: true, data };
  } catch (error) {
    console.warn('Error parsing channel descriptions:', error);
    return { success: false, error: 'NO_DATA' };
  }
}

// Fetch and parse market role descriptions using PapaParse
export async function fetchMarketRoleDescriptions(): Promise<FetchResult<MarketRoleDescription[]>> {
  const csvResult = await fetchCSVFile(dataSets.marketRoleDescriptions);
  if (!csvResult.success) {
    return { success: false, error: 'NO_DATA' };
  }

  try {
    const results = Papa.parse<RAW_MarketRoleDescription>(csvResult.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (results.errors.length > 0) {
      console.warn('Error parsing market role descriptions CSV:', results.errors);
    }

    const data = results.data.map(row => ({
      code: String(row.MarketRoleCode || "").trim(),
      nameAndCode: String(row.MarketRoleNameAndCode || "").trim(),
      name: String(row.MarketRoleName || "").trim()
    })).filter(row => row.code);

    return { success: true, data };
  } catch (error) {
    console.warn('Error parsing market role descriptions:', error);
    return { success: false, error: 'NO_DATA' };
  }
}

// Fetch and parse event descriptions using PapaParse
export async function fetchEventDescriptions(): Promise<FetchResult<EventDescription[]>> {
  const csvResult = await fetchCSVFile(dataSets.eventDescriptions);
  if (!csvResult.success) {
    return { success: false, error: 'NO_DATA' };
  }

  try {
    const results = Papa.parse<RAW_EventDescription>(csvResult.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (results.errors.length > 0) {
      console.warn('Error parsing event descriptions CSV:', results.errors);
    }

    const data = results.data.map(row => ({
      eventID: String(row.eventID || "").trim(),
      description: String(row.description || "").trim()
    })).filter(row => row.eventID);

    return { success: true, data };
  } catch (error) {
    console.warn('Error parsing event descriptions:', error);
    return { success: false, error: 'NO_DATA' };
  }
}

// Fetch and parse response times (with fallback to generation from usage data)
export async function fetchResponseTimes(): Promise<FetchResult<ResponseTimeRecord[]>> {
  const csvResult = await fetchCSVFile(dataSets.responseTimes);
  if (!csvResult.success) {
    console.error('Response times CSV not found');
    return { success: false, error: 'NO_DATA' };
  }

  try {
    const results = Papa.parse<RAW_ResponseTimeRecord>(csvResult.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (results.errors.length > 0) {
      console.warn('Error parsing response times CSV:', results.errors);
    }

    const data = results.data.map(row => ({
      timestamp: dayjs(String(row.timestamp || "").trim()).toDate(),
      channel: String(row.channel || "").trim(),
      mean_response_time_ms: Number(row.mean_response_time_ms) || 0,
      std_deviation_ms: Number(row.std_deviation_ms) || 0,
      event_count: Number(row.event_count) || 0,
      process_group: String(row.process_group || "").trim(),
      marketRoleCode: String(row.marketRoleCode || "").trim()
    })).filter(row => row.timestamp && row.channel && !isNaN(row.mean_response_time_ms));

    return { success: true, data };
  } catch (error) {
    console.warn('Error parsing response times CSV:', error);
    return { success: false, error: 'NO_DATA' };
  }
}

// Fetch and parse error statistics using PapaParse (with fallback to generation from usage data)
export async function fetchErrorStatistics(): Promise<FetchResult<ErrorRecord[]>> {
  const csvResult = await fetchCSVFile(dataSets.errorStats);
  if (!csvResult.success) {
    console.error('Error statistics CSV not found');
    return { success: false, error: 'NO_DATA' };
  }

  try {
    const results = Papa.parse<RAW_ErrorRecord>(csvResult.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (results.errors.length > 0) {
      console.warn('Error parsing error statistics CSV:', results.errors);
    }

    const data = results.data.map(row => ({
      event_timestamp: dayjs(String(row.event_timestamp || "").trim()).toDate(),
      errortype: String(row.errortype || "").trim(),
      type: String(row.type || "").trim() as 'system_error' | 'validation_error',
      event_count: Number(row.event_count) || 0
    })).filter(row => !isNaN(row.event_timestamp.getTime()) && row.errortype && !isNaN(row.event_count));

    return { success: true, data };
  } catch (error) {
    console.warn('Error parsing error statistics CSV:', error);
    return { success: false, error: 'NO_DATA' };
  }
}
