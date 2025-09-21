import { StateCreator } from "zustand";
import dayjs from "dayjs";
import type { ResponseTimeRecord, DataFetchConfig } from "../types";
import { fetchResponseTimes } from "../csvUtils";
import { synthesizeResponseTimes } from "../synthUtils";

export interface ConfidenceStats {
    date: string;
    average: number;
    median: number;
    min: number;
    max: number;
    standardDeviation: number;
    count: number;
}

export interface RefinedMonthlyData {
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
                        const dailyVariation = (Math.random() - 0.5) * 100;
                        const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1.0;
                        const meanResponseTime =
                            Math.max(50, baseMean + dailyVariation) * weekendFactor;
                        const stdDeviation = meanResponseTime * (0.2 + Math.random() * 0.2); // 20-40% std deviation
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

        // Calculate daily confidence stats
        const dailyResponseTimeStats: ConfidenceStats[] = Object.entries(dailyGroups)
            .map(([date, records]) => {
                const responseTimes = records.map((r) => r.mean_response_time_ms);
                const sortedTimes = [...responseTimes].sort((a, b) => a - b);

                const sum = responseTimes.reduce((acc, time) => acc + time, 0);
                const average = sum / responseTimes.length;
                const median =
                    sortedTimes.length % 2 === 0
                        ? (sortedTimes[sortedTimes.length / 2 - 1] +
                              sortedTimes[sortedTimes.length / 2]) /
                          2
                        : sortedTimes[Math.floor(sortedTimes.length / 2)];
                const min = Math.min(...responseTimes);
                const max = Math.max(...responseTimes);

                // Calculate standard deviation
                const squareDiffs = responseTimes.map((time) => Math.pow(time - average, 2));
                const avgSquareDiff =
                    squareDiffs.reduce((acc, diff) => acc + diff, 0) / squareDiffs.length;
                const standardDeviation = Math.sqrt(avgSquareDiff);

                return {
                    date,
                    average,
                    median,
                    min,
                    max,
                    standardDeviation,
                    count: records.length,
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

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

    lastUpdate: null,
});
