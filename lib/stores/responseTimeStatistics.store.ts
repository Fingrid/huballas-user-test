import { StateCreator } from "zustand";
import dayjs from "dayjs";
import type { ResponseTimeRecord, DataFetchConfig } from "../types";
import { fetchResponseTimes } from "../csvUtils";

export interface ConfidenceStats {
    date: string;
    average: number;
    median: number;
    min: number;
    max: number;
    standardDeviation: number;
    count: number; // Total events, not just record count
}

export interface SummaryStatistics {
    totalDataPoints: number;
    avgResponseTime: number;
    avgStdDev: number;
    medianResponseTime: number;
    maxUpperStd: number;
    minLowerStd: number;
    totalDays: number;
}

export interface ChannelBreakdownData {
    channel: string;
    avgResponseTime: number;
    medianResponseTime: number;
    stdDeviation: number;
    eventCount: number;
}

export interface RefinedMonthlyData {
    dailyResponseTimeStats: ConfidenceStats[];
    summaryStatistics: SummaryStatistics;
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
    lastUpdate: Date | null;
}

export interface ResponseTimeStatisticsStore {
    _rawdata: { [month: string]: ResponseTimeRecord[] } | null;
    monthlyData: { [month: string]: RefinedMonthlyData } | null;
    loading: boolean;
    error: string | null;
    lastUpdate: Date | null;
    fetchResponseTimeData: (month: string, config?: DataFetchConfig) => Promise<void>;
    processMonthlyData: (month: string) => void;
    getAvailableChannels: () => string[];
    getProcessedDataForRange: (startDate: string, endDate: string, selectedChannels?: string[]) => {
        dailyStats: ConfidenceStats[];
        summaryStats: SummaryStatistics;
        channelBreakdown: ChannelBreakdownData[];
        chartData: {
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
    } | null;
}

export const createMonthlyReportsStore: StateCreator<
    ResponseTimeStatisticsStore,
    [],
    [],
    ResponseTimeStatisticsStore
> = (set, get) => ({
    // Initial State
    _rawdata: null,
    monthlyData: null,
    loading: false,
    error: null,

    fetchResponseTimeData: async (month: string, config: DataFetchConfig = { synthesize: 'on_missing_data' }) => {
        set({ loading: true, error: null });

        try {
            console.log(`🔄 ResponseTimeStatisticsStore.fetchResponseTimeData started for ${month} - synthesize: ${config.synthesize}`);
            
            let responseTimeData: ResponseTimeRecord[] = [];

            // Try to fetch from CSV first (unless synthesize is 'always')
            if (config.synthesize === 'never' || config.synthesize === 'on_missing_data') {
                try {
                    const csvFetchResponse = await fetchResponseTimes();
                    if (csvFetchResponse.success && csvFetchResponse.data) {
                        // Filter data for the specific month
                        responseTimeData = csvFetchResponse.data.filter(record => {
                            const recordMonth = dayjs(record.timestamp).format('YYYY-MM');
                            return recordMonth === month;
                        });
                        console.log(`📊 Loaded ${responseTimeData.length} response time records from CSV for ${month}`);
                    } else if (config.synthesize === 'never') {
                        throw new Error('Failed to fetch response times from CSV');
                    }
                } catch (csvError) {
                    console.warn(`CSV fetch failed for response time data: ${csvError}`);
                    if (config.synthesize === 'never') {
                        throw csvError;
                    }
                }
            }

            // If no data from CSV and synthesize is allowed, generate synthetic data
            if (responseTimeData.length === 0 && config.synthesize !== 'never') {
                console.log(`📊 Generating synthetic response time data for ${month}`);
                const [year, monthNum] = month.split("-").map(Number);
                const daysInMonth = new Date(year, monthNum, 0).getDate();

                const channels = ["REST_API", "SOAP_API", "EDI", "FILE_UPLOAD"];
                const processGroups = ["BILLING", "METERING", "MARKET", "CUSTOMER"];
                const marketRoleCodes = ["DSO", "THP", "DDQ", "CAP"];

                // Generate data for each day of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, monthNum - 1, day);

                    // Generate multiple records per day for different channels
                    channels.forEach((channel) => {
                        // Base response time varies by channel
                        let baseMean = 150;

                        if (channel === "REST_API") {
                            baseMean = 120;
                        } else if (channel === "SOAP_API") {
                            baseMean = 200;
                        } else if (channel === "EDI") {
                            baseMean = 500;
                        } else if (channel === "FILE_UPLOAD") {
                            baseMean = 2000;
                        }

                        // Add daily variation and some trend
                        const dailyVariation = (Math.random() - 0.5) * 50; // Reduced variation
                        const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1.0;
                        const meanResponseTime =
                            Math.max(50, baseMean + dailyVariation) * weekendFactor;
                        
                        // Generate more realistic standard deviations (5-15% of mean, capped at reasonable values)
                        const stdDevPercentage = 0.05 + Math.random() * 0.10; // 5-15% std deviation
                        let stdDeviation = meanResponseTime * stdDevPercentage;
                        
                        // Cap standard deviation to realistic values based on channel
                        if (channel === "REST_API" || channel === "SOAP_API") {
                            stdDeviation = Math.min(stdDeviation, 50 + Math.random() * 50); // 50-100ms max
                        } else if (channel === "EDI") {
                            stdDeviation = Math.min(stdDeviation, 80 + Math.random() * 70); // 80-150ms max
                        } else if (channel === "FILE_UPLOAD") {
                            stdDeviation = Math.min(stdDeviation, 150 + Math.random() * 100); // 150-250ms max
                        }
                        
                        // Occasionally add spikes for realism (10% chance of higher std dev)
                        if (Math.random() < 0.1) {
                            stdDeviation *= 2; // Double the std dev for occasional spikes
                        }
                        
                        const eventCount = Math.floor((50 + Math.random() * 200) * weekendFactor);

                        responseTimeData.push({
                            timestamp: date,
                            channel,
                            process_group:
                                processGroups[Math.floor(Math.random() * processGroups.length)],
                            marketRoleCode:
                                marketRoleCodes[Math.floor(Math.random() * marketRoleCodes.length)],
                            mean_response_time_ms: meanResponseTime,
                            std_deviation_ms: stdDeviation,
                            event_count: eventCount,
                        });
                    });
                }
            }

            // Update state with new raw data
            set((state) => ({
                _rawdata: {
                    ...state._rawdata,
                    [month]: responseTimeData,
                },
                loading: false,
                lastUpdate: new Date(),
            }));

            // Process the monthly data after fetching
            get().processMonthlyData(month);
            
            console.log(`✅ ResponseTimeStatisticsStore.fetchResponseTimeData completed for ${month} with ${responseTimeData.length} records`);
        } catch (error) {
            console.error(`❌ ResponseTimeStatisticsStore.fetchResponseTimeData failed for ${month}:`, error);
            set({
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            });
        }
    },

    processMonthlyData: (month: string) => {
        const state = get();
        const rawData = state._rawdata?.[month];

        if (!rawData || rawData.length === 0) {
            console.warn(`No raw data available for month: ${month}`);

            return;
        }

        // Check if processing is needed (data doesn't exist or raw data has changed)
        const existingProcessedData = state.monthlyData?.[month];
        const currentDataLength = rawData.length;
        const hasDataChanged =
            !existingProcessedData || existingProcessedData.totalRecords !== currentDataLength;

        if (!hasDataChanged) {
            console.log(`Processed data for ${month} is up to date`);

            return;
        }

        console.log(`Processing monthly data for ${month}`);

        // Group data by date for daily statistics
        const dailyGroups: { [date: string]: ResponseTimeRecord[] } = {};

        rawData.forEach((record) => {
            const dateKey = record.timestamp.toISOString().split("T")[0];

            if (!dailyGroups[dateKey]) {
                dailyGroups[dateKey] = [];
            }
            dailyGroups[dateKey].push(record);
        });

        // Calculate daily confidence stats using proper weighted statistics
        const dailyResponseTimeStats: ConfidenceStats[] = Object.entries(dailyGroups)
            .map(([date, records]) => {
                if (records.length === 0) {
                    return null;
                }

                // Calculate weighted statistics using the store's std_deviation_ms values
                const totalEvents = records.reduce((sum, record) => sum + record.event_count, 0);
                
                // Weighted average of response times
                const weightedSum = records.reduce((sum, record) => 
                    sum + (record.mean_response_time_ms * record.event_count), 0);
                const average = weightedSum / totalEvents;

                // For median, use weighted median of the means (simpler and more accurate than expanding all events)
                const sortedRecords = [...records].sort((a, b) => a.mean_response_time_ms - b.mean_response_time_ms);
                let cumulativeCount = 0;
                let median = average; // fallback to average
                
                for (const record of sortedRecords) {
                    cumulativeCount += record.event_count;
                    if (cumulativeCount >= totalEvents / 2) {
                        median = record.mean_response_time_ms;
                        break;
                    }
                }

                // Min and max should consider the actual distribution (mean ± std_deviation)
                // Calculate the likely min/max based on each channel's distribution
                const distributionBounds = records.map(r => ({
                    lower: Math.max(0, r.mean_response_time_ms - r.std_deviation_ms),
                    upper: r.mean_response_time_ms + r.std_deviation_ms,
                    mean: r.mean_response_time_ms
                }));
                
                const min = Math.min(...distributionBounds.map(b => b.lower));
                const max = Math.max(...distributionBounds.map(b => b.upper));
                
                // Combined standard deviation using the store's std_deviation_ms values
                let combinedVariance = 0;
                records.forEach(record => {
                    const weight = record.event_count / totalEvents;
                    const meanDiff = record.mean_response_time_ms - average;
                    // Combine both internal variance and variance due to different means
                    combinedVariance += weight * (Math.pow(record.std_deviation_ms, 2) + Math.pow(meanDiff, 2));
                });
                const standardDeviation = Math.sqrt(combinedVariance);

                return {
                    date,
                    average,
                    median,
                    min,
                    max,
                    standardDeviation,
                    count: totalEvents // Total events, not just record count
                };
            })
            .filter(stat => stat !== null)
            .sort((a, b) => a!.date.localeCompare(b!.date)) as ConfidenceStats[];

        // Prepare chart arrays
        const dates = dailyResponseTimeStats.map((stat) => stat.date);
        const averageData = dailyResponseTimeStats.map((stat) => stat.average);
        const medianData = dailyResponseTimeStats.map((stat) => stat.median);
        const maxData = dailyResponseTimeStats.map((stat) => stat.max);
        const minData = dailyResponseTimeStats.map((stat) => stat.min);
        const stdDevData = dailyResponseTimeStats.map((stat) => stat.standardDeviation);

        const avgStdDev = stdDevData.reduce((sum, std) => sum + std, 0) / stdDevData.length;
        const stdDevThreshold = avgStdDev * 1.5; // Threshold for anomaly detection

        const upperStdData = averageData.map((avg, i) => avg + stdDevData[i]);
        const lowerStdData = averageData.map((avg, i) => Math.max(0, avg - stdDevData[i]));

        // Calculate summary statistics
        const summaryStatistics: SummaryStatistics = {
            totalDataPoints: dailyResponseTimeStats.reduce((sum, stat) => sum + stat.count, 0),
            avgResponseTime: averageData.reduce((sum, val) => sum + val, 0) / averageData.length,
            avgStdDev: avgStdDev,
            medianResponseTime: medianData.reduce((sum, val) => sum + val, 0) / medianData.length,
            maxUpperStd: Math.max(...upperStdData),
            minLowerStd: Math.min(...lowerStdData),
            totalDays: dailyResponseTimeStats.length
        };

        // Calculate overall statistics
        const totalRecords = rawData.length;
        const totalDays = dailyResponseTimeStats.length;
        const allResponseTimes = rawData.map((r) => r.mean_response_time_ms);
        const overallAverage =
            allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;

        // Group by channel for additional statistics
        const channelGroups: { [channel: string]: ResponseTimeRecord[] } = {};

        rawData.forEach((record) => {
            if (!channelGroups[record.channel]) {
                channelGroups[record.channel] = [];
            }
            channelGroups[record.channel].push(record);
        });

        const averageResponseTimes: { [channel: string]: number } = {};
        const standardDeviations: { [channel: string]: number } = {};

        Object.entries(channelGroups).forEach(([channel, records]) => {
            const times = records.map((r) => r.mean_response_time_ms);
            const avg = times.reduce((sum, time) => sum + time, 0) / times.length;

            averageResponseTimes[channel] = avg;

            const squareDiffs = times.map((time) => Math.pow(time - avg, 2));
            const variance = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;

            standardDeviations[channel] = Math.sqrt(variance);
        });

        // Create refined monthly data
        const refinedData: RefinedMonthlyData = {
            dailyResponseTimeStats,
            summaryStatistics,
            datasetStatistics: {
                overallAverage,
                totalChannels: Object.keys(channelGroups).length,
                channelBreakdown: Object.fromEntries(
                    Object.entries(channelGroups).map(([channel, records]) => [
                        channel,
                        records.length,
                    ])
                ),
            },
            responseTimeStatistics: {
                averageResponseTimes,
                standardDeviations,
            },
            totalDays,
            totalRecords,
            dateRange:
                dailyResponseTimeStats.length > 0
                    ? {
                          start: dailyResponseTimeStats[0].date,
                          end: dailyResponseTimeStats[dailyResponseTimeStats.length - 1].date,
                      }
                    : null,
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
                segment: "Response Time Analysis",
                groupBy: "Daily Statistics",
            },
            lastUpdate: new Date(),
        };

        // Update state with processed data
        set((state) => ({
            monthlyData: {
                ...state.monthlyData,
                [month]: refinedData,
            },
        }));

        console.log(`Successfully processed ${totalRecords} records for ${month}`);
    },

    getProcessedDataForRange: (startDate: string, endDate: string, selectedChannels?: string[]) => {
        const state = get();
        
        if (!state._rawdata) return null;

        // Collect all data within the date range from all months
        const allData: ResponseTimeRecord[] = [];
        
        Object.values(state._rawdata).forEach(monthData => {
            if (monthData) {
                const filteredData = monthData.filter(record => {
                    const recordDate = record.timestamp.toISOString().split('T')[0];
                    const isInDateRange = recordDate >= startDate && recordDate <= endDate;
                    
                    // If selectedChannels is provided, filter by channels
                    const isInSelectedChannels = !selectedChannels || selectedChannels.length === 0 || selectedChannels.includes(record.channel);
                    
                    return isInDateRange && isInSelectedChannels;
                });
                allData.push(...filteredData);
            }
        });

        if (allData.length === 0) return null;

        // Group by date
        const groupedByDate: { [date: string]: ResponseTimeRecord[] } = {};
        
        allData.forEach(record => {
            const date = record.timestamp.toISOString().split('T')[0];
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(record);
        });

        // Calculate daily statistics (same logic as processMonthlyData)
        const dailyStats: ConfidenceStats[] = Object.entries(groupedByDate)
            .map(([date, records]) => {
                if (records.length === 0) return null;

                const totalEvents = records.reduce((sum, record) => sum + record.event_count, 0);
                
                const weightedSum = records.reduce((sum, record) => 
                    sum + (record.mean_response_time_ms * record.event_count), 0);
                const average = weightedSum / totalEvents;

                // For median, use weighted median of the means (simpler and more accurate than expanding all events)
                const sortedRecords = [...records].sort((a, b) => a.mean_response_time_ms - b.mean_response_time_ms);
                let cumulativeCount = 0;
                let median = average; // fallback to average
                
                for (const record of sortedRecords) {
                    cumulativeCount += record.event_count;
                    if (cumulativeCount >= totalEvents / 2) {
                        median = record.mean_response_time_ms;
                        break;
                    }
                }

                // Min and max should consider the actual distribution (mean ± std_deviation)
                const distributionBounds = records.map(r => ({
                    lower: Math.max(0, r.mean_response_time_ms - r.std_deviation_ms),
                    upper: r.mean_response_time_ms + r.std_deviation_ms,
                    mean: r.mean_response_time_ms
                }));
                
                const min = Math.min(...distributionBounds.map(b => b.lower));
                const max = Math.max(...distributionBounds.map(b => b.upper));
                
                let combinedVariance = 0;
                records.forEach(record => {
                    const weight = record.event_count / totalEvents;
                    const meanDiff = record.mean_response_time_ms - average;
                    combinedVariance += weight * (Math.pow(record.std_deviation_ms, 2) + Math.pow(meanDiff, 2));
                });
                const standardDeviation = Math.sqrt(combinedVariance);

                return {
                    date,
                    average,
                    median,
                    min,
                    max,
                    standardDeviation,
                    count: totalEvents
                };
            })
            .filter(stat => stat !== null)
            .sort((a, b) => a!.date.localeCompare(b!.date)) as ConfidenceStats[];

        // Calculate summary statistics
        const summaryStats: SummaryStatistics = {
            totalDataPoints: dailyStats.reduce((sum, stat) => sum + stat.count, 0),
            avgResponseTime: dailyStats.reduce((sum, stat) => sum + stat.average, 0) / dailyStats.length,
            avgStdDev: dailyStats.reduce((sum, stat) => sum + stat.standardDeviation, 0) / dailyStats.length,
            medianResponseTime: dailyStats.reduce((sum, stat) => sum + stat.median, 0) / dailyStats.length,
            maxUpperStd: Math.max(...dailyStats.map(stat => stat.average + stat.standardDeviation)),
            minLowerStd: Math.min(...dailyStats.map(stat => Math.max(0, stat.average - stat.standardDeviation))),
            totalDays: dailyStats.length
        };

        // Calculate channel breakdown data for ALL channels (not filtered by selection)
        const allChannelData: ResponseTimeRecord[] = [];
        
        Object.values(state._rawdata).forEach(monthData => {
            if (monthData) {
                const filteredData = monthData.filter(record => {
                    const recordDate = record.timestamp.toISOString().split('T')[0];
                    return recordDate >= startDate && recordDate <= endDate;
                    // Note: No channel filtering here - we want all channels for breakdown
                });
                allChannelData.push(...filteredData);
            }
        });
        
        const channelGroups: { [channel: string]: ResponseTimeRecord[] } = {};
        allChannelData.forEach(record => {
            if (!channelGroups[record.channel]) {
                channelGroups[record.channel] = [];
            }
            channelGroups[record.channel].push(record);
        });

        const channelBreakdown: ChannelBreakdownData[] = Object.entries(channelGroups)
            .map(([channel, records]) => {
                const totalEvents = records.reduce((sum, record) => sum + record.event_count, 0);
                
                // Weighted average
                const weightedSum = records.reduce((sum, record) => 
                    sum + (record.mean_response_time_ms * record.event_count), 0);
                const avgResponseTime = weightedSum / totalEvents;

                // Median calculation using weighted median
                const sortedRecords = [...records].sort((a, b) => a.mean_response_time_ms - b.mean_response_time_ms);
                let cumulativeCount = 0;
                let medianResponseTime = avgResponseTime; // fallback to average
                
                for (const record of sortedRecords) {
                    cumulativeCount += record.event_count;
                    if (cumulativeCount >= totalEvents / 2) {
                        medianResponseTime = record.mean_response_time_ms;
                        break;
                    }
                }

                // Combined standard deviation
                let combinedVariance = 0;
                records.forEach(record => {
                    const weight = record.event_count / totalEvents;
                    const meanDiff = record.mean_response_time_ms - avgResponseTime;
                    combinedVariance += weight * (Math.pow(record.std_deviation_ms, 2) + Math.pow(meanDiff, 2));
                });
                const stdDeviation = Math.sqrt(combinedVariance);

                return {
                    channel,
                    avgResponseTime,
                    medianResponseTime,
                    stdDeviation,
                    eventCount: totalEvents
                };
            })
            .sort((a, b) => a.channel.localeCompare(b.channel));

        // Calculate chart data
        const avgStdDev = summaryStats.avgStdDev;
        const stdDevThreshold = avgStdDev * 1.1;

        const chartData = {
            dates: dailyStats.map(stat => stat.date),
            averageData: dailyStats.map(stat => Math.round(stat.average)),
            medianData: dailyStats.map(stat => Math.round(stat.median)),
            maxData: dailyStats.map(stat => Math.round(stat.max)),
            minData: dailyStats.map(stat => Math.round(stat.min)),
            upperStdData: dailyStats.map(stat => Math.round(stat.average + stat.standardDeviation)),
            lowerStdData: dailyStats.map(stat => Math.round(Math.max(0, stat.average - stat.standardDeviation))),
            stdDevData: dailyStats.map(stat => stat.standardDeviation),
            avgStdDev,
            stdDevThreshold
        };

        return {
            dailyStats,
            summaryStats,
            channelBreakdown,
            chartData
        };
    },

    getAvailableChannels: () => {
        const state = get();
        
        if (!state._rawdata) return [];

        // Collect all unique channels from raw data
        const channels = new Set<string>();
        
        Object.values(state._rawdata).forEach(monthData => {
            if (monthData) {
                monthData.forEach(record => {
                    channels.add(record.channel);
                });
            }
        });

        return Array.from(channels).sort();
    },

    lastUpdate: null,
});
