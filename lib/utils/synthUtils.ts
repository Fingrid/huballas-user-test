import dayjs from 'dayjs';
import type { ErrorRecord, ResponseTimeRecord, UsageDataRecord } from "../types";

export function synthesizeUsageData(): UsageDataRecord[] {
  console.log("Synthesizing usage data...");
  const channels = ['REST_API', 'SOAP_API', 'EDI', 'FILE_UPLOAD'];
  const messageTypes = ['QUERY', 'RESPONSE', 'NOTIFICATION', 'ERROR'];
  const eventIDs = ['EVENT_001', 'EVENT_002', 'EVENT_003', 'EVENT_004'];
  const processGroups = ['BILLING', 'METERING', 'MARKET', 'CUSTOMER'];
  const marketRoleCodes = ['DSO', 'THP', 'DDQ', 'CAP'];
  
  const data: UsageDataRecord[] = [];
  const now = new Date();
  
  for (let i = 0; i < 1000; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    data.push({
      event_timestamp: date,
      channel: channels[Math.floor(Math.random() * channels.length)],
      messagetype: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      eventID: eventIDs[Math.floor(Math.random() * eventIDs.length)],
      process_group: processGroups[Math.floor(Math.random() * processGroups.length)],
      marketRoleCode: marketRoleCodes[Math.floor(Math.random() * marketRoleCodes.length)],
      event_count: Math.floor(Math.random() * 100) + 1
    });
  }
  
  return data;
}

// Generate response times from usage data
export function synthesizeResponseTimes(usageData: UsageDataRecord[]): ResponseTimeRecord[] {
  console.log("Synthesizing response times from usage data:", usageData.length, "records");
  const channelDateGroups: { [key: string]: UsageDataRecord[] } = {};
  
  // Group by channel and date (not full timestamp)
  usageData.forEach(row => {
    const dateKey = dayjs(row.event_timestamp).format('YYYY-MM-DD');
    const key = `${row.channel}|${dateKey}`;
    if (!channelDateGroups[key]) {
      channelDateGroups[key] = [];
    }
    channelDateGroups[key].push(row);
  });
  
  return Object.entries(channelDateGroups).map(([key, rows]) => {
    const [channel, dateString] = key.split('|');
    const totalCount = rows.reduce((sum, row) => sum + row.event_count, 0);
    
    // Generate realistic response times based on channel type
    let baseMean = 150; // Default base response time in ms
    if (channel === 'REST_API') baseMean = 120;
    else if (channel === 'SOAP_API') baseMean = 200;
    else if (channel === 'EDI') baseMean = 500;
    else if (channel === 'FILE_UPLOAD') baseMean = 2000;
    
    // Add some variability
    const meanResponseTime = baseMean + (Math.random() * 50 - 25); // Reduced variation
    
    // Generate more realistic standard deviations (5-12% of mean, capped at reasonable values)
    const stdDevPercentage = 0.05 + Math.random() * 0.07; // 5-12% std deviation
    let stdDeviation = meanResponseTime * stdDevPercentage;
    
    // Cap standard deviation to realistic values based on channel
    if (channel === 'REST_API' || channel === 'SOAP_API') {
      stdDeviation = Math.min(stdDeviation, 40 + Math.random() * 40); // 40-80ms max
    } else if (channel === 'EDI') {
      stdDeviation = Math.min(stdDeviation, 60 + Math.random() * 60); // 60-120ms max
    } else if (channel === 'FILE_UPLOAD') {
      stdDeviation = Math.min(stdDeviation, 100 + Math.random() * 80); // 100-180ms max
    }
    
    // Occasionally add spikes for realism (8% chance of higher std dev)
    if (Math.random() < 0.08) {
      stdDeviation *= 1.8; // Increase std dev for occasional spikes
    }
    
    return {
      timestamp: dayjs(dateString).toDate(),
      channel,
      process_group: rows[0]?.process_group || '',
      marketRoleCode: rows[0]?.marketRoleCode || '',
      mean_response_time_ms: meanResponseTime,
      std_deviation_ms: stdDeviation,
      event_count: totalCount
    };
  });
}

export function synthesizeErrorStatistics(usageData: UsageDataRecord[]): ErrorRecord[] {
  console.log("Synthesizing error statistics from usage data:", usageData.length, "records");
  const errors: ErrorRecord[] = [];
  const errorTypes = [
    'VALIDATION_ERROR', 'TIMEOUT_ERROR', 'AUTHENTICATION_ERROR', 
    'AUTHORIZATION_ERROR', 'DATA_FORMAT_ERROR', 'SYSTEM_ERROR'
  ];
  
  // Generate errors for each day in usage data
  const dates = [...new Set(usageData.map(row => row.event_timestamp))];
  
  dates.forEach(date => {
    const dayUsage = usageData.filter(row => row.event_timestamp === date);
    const totalEvents = dayUsage.reduce((sum, row) => sum + row.event_count, 0);
    
    // Generate 1-5% error rate
    const errorRate = 0.01 + (Math.random() * 0.04);
    const totalErrors = Math.floor(totalEvents * errorRate);
    
    // Distribute errors across types
    errorTypes.forEach(errorType => {
      const errorCount = Math.floor(totalErrors / errorTypes.length * (0.5 + Math.random()));
      if (errorCount > 0) {
        errors.push({
          event_timestamp: date,
          errortype: errorType,
          type: errorType.includes('VALIDATION') ? 'validation_error' : 'system_error',
          event_count: errorCount
        });
      }
    });
  });
  
  return errors;
}

