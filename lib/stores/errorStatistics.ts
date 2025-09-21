import { StateCreator } from "zustand";
import dayjs from "dayjs";
import type { ErrorRecord, DataFetchConfig } from "../types";
import { fetchErrorStatistics } from "../csvUtils";

export interface ErrorStats {
    date: string;
    totalErrors: number;
    errorTypeBreakdown: { [errorType: string]: number };
    typeBreakdown: { [type: string]: number };
    uniqueErrorTypes: number;
    errorRate: number;
}

export interface RefinedErrorData {
    dailyErrorStats: ErrorStats[];
    datasetStatistics: {
        overallTotalErrors: number;
        totalErrorTypes: number;
        averageErrorRate: number;
        peakErrorRate: number;
        errorTypeBreakdown: { [errorType: string]: number };
        typeBreakdown: { [type: string]: number };
        criticalErrorCount: number;
    };
    totalDays: number;
    totalRecords: number;
    dateRange: {
        start: string;
        end: string;
    } | null;
    chartArrays: {
        dates: string[];
        totalErrorsData: number[];
        errorRateData: number[];
        errorTypeData: { [errorType: string]: number[] };
        typeData: { [type: string]: number[] };
        avgDailyErrors: number;
        peakDailyErrors: number;
        avgErrorRate: number;
        peakErrorRate: number;
    };
    displayNames: {
        segment: string;
        groupBy: string;
    };
    lastUpdate: Date | null;
}

export interface ErrorStatisticsStore {
    _rawdata: { [month: string]: ErrorRecord[] } | null;
    monthlyData: { [month: string]: RefinedErrorData } | null;
    loading: boolean;
    error: string | null;
    lastUpdate: Date | null;
    fetchErrorData: (month: string, config?: DataFetchConfig) => Promise<void>;
    processMonthlyData: (month: string) => void;
}

export const createErrorStatisticsStore: StateCreator<
    ErrorStatisticsStore,
    [],
    [],
    ErrorStatisticsStore
> = (set, get) => ({
    // Initial State
    _rawdata: null,
    monthlyData: null,
    loading: false,
    error: null,
    lastUpdate: null,

    fetchErrorData: async (month: string, config: DataFetchConfig = { synthesize: 'on_missing_data' }) => {
        set({ loading: true, error: null });

        try {
            console.log(`🔄 ErrorStatisticsStore.fetchErrorData started for ${month} - synthesize: ${config.synthesize}`);
            
            let errorData: ErrorRecord[] = [];

            // Try to fetch from CSV first (unless synthesize is 'always')
            if (config.synthesize === 'never' || config.synthesize === 'on_missing_data') {
                try {
                    const csvFetchResponse = await fetchErrorStatistics();
                    if (csvFetchResponse.success && csvFetchResponse.data) {
                        // Filter data for the specific month
                        errorData = csvFetchResponse.data.filter(record => {
                            const recordMonth = dayjs(record.event_timestamp).format('YYYY-MM');
                            return recordMonth === month;
                        });
                        console.log(`📊 Loaded ${errorData.length} error records from CSV for ${month}`);
                    } else if (config.synthesize === 'never') {
                        throw new Error('Failed to fetch error statistics from CSV');
                    }
                } catch (csvError) {
                    console.warn(`CSV fetch failed for error data: ${csvError}`);
                    if (config.synthesize === 'never') {
                        throw csvError;
                    }
                }
            }

            // If no data from CSV and synthesize is allowed, generate synthetic data
            if (errorData.length === 0 && config.synthesize !== 'never') {
                console.log(`📊 Generating synthetic error data for ${month}`);
                const [year, monthNum] = month.split("-").map(Number);
                const daysInMonth = new Date(year, monthNum, 0).getDate();

                const errorTypes = [
                    "VALIDATION_ERROR",
                    "TIMEOUT_ERROR",
                    "AUTHENTICATION_ERROR",
                    "AUTHORIZATION_ERROR",
                    "DATA_FORMAT_ERROR",
                    "SYSTEM_ERROR",
                    "NETWORK_ERROR",
                    "DATABASE_ERROR",
                ];

                // Generate data for each day of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, monthNum - 1, day);

                    // Generate errors for each error type (not all types occur every day)
                    errorTypes.forEach((errorType) => {
                        // Not every error type occurs every day
                        if (Math.random() > 0.4) {
                            return;
                        }

                        // Generate realistic error counts based on error type
                        let baseCount = 5;

                        if (errorType === "VALIDATION_ERROR") {
                            baseCount = 15;
                        } else if (errorType === "TIMEOUT_ERROR") {
                            baseCount = 8;
                        } else if (errorType === "AUTHENTICATION_ERROR") {
                            baseCount = 3;
                        } else if (errorType === "AUTHORIZATION_ERROR") {
                            baseCount = 4;
                        } else if (errorType === "DATA_FORMAT_ERROR") {
                            baseCount = 12;
                        } else if (errorType === "SYSTEM_ERROR") {
                            baseCount = 2;
                        } else if (errorType === "NETWORK_ERROR") {
                            baseCount = 6;
                        } else if (errorType === "DATABASE_ERROR") {
                            baseCount = 1;
                        }

                        // Add daily variation and weekend factor
                        const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1.0;
                        const dailyVariation = (Math.random() - 0.5) * baseCount * 0.8;
                        const errorCount = Math.max(
                            0,
                            Math.floor((baseCount + dailyVariation) * weekendFactor)
                        );

                        if (errorCount > 0) {
                            // Determine error type classification
                            let type: "system_error" | "validation_error" = "system_error";

                            if (
                                errorType.includes("VALIDATION") ||
                                errorType.includes("DATA_FORMAT") ||
                                errorType.includes("AUTHORIZATION")
                            ) {
                                type = "validation_error";
                            }

                            errorData.push({
                                event_timestamp: date,
                                errortype: errorType,
                                type,
                                event_count: errorCount,
                            });
                        }
                    });
                }
            }

            // Update state with new raw data
            set((state) => ({
                _rawdata: {
                    ...state._rawdata,
                    [month]: errorData,
                },
                loading: false,
                lastUpdate: new Date(),
            }));

            // Process the monthly data after fetching
            get().processMonthlyData(month);
            
            console.log(`✅ ErrorStatisticsStore.fetchErrorData completed for ${month} with ${errorData.length} records`);
        } catch (error) {
            console.error(`❌ ErrorStatisticsStore.fetchErrorData failed for ${month}:`, error);
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
            console.warn(`No raw error data available for month: ${month}`);

            return;
        }

        // Check if processing is needed
        const existingProcessedData = state.monthlyData?.[month];
        const currentDataLength = rawData.length;
        const hasDataChanged =
            !existingProcessedData || existingProcessedData.totalRecords !== currentDataLength;

        if (!hasDataChanged) {
            console.log(`Processed error data for ${month} is up to date`);

            return;
        }

        console.log(`Processing monthly error data for ${month}`);

        // Group data by date for daily statistics
        const dailyGroups: { [date: string]: ErrorRecord[] } = {};

        rawData.forEach((record) => {
            const dateKey = record.event_timestamp.toISOString().split("T")[0];

            if (!dailyGroups[dateKey]) {
                dailyGroups[dateKey] = [];
            }
            dailyGroups[dateKey].push(record);
        });

        // Calculate daily error stats
        const dailyErrorStats: ErrorStats[] = Object.entries(dailyGroups)
            .map(([date, records]) => {
                const totalErrors = records.reduce((sum, r) => sum + r.event_count, 0);

                // Calculate breakdowns
                const errorTypeBreakdown: { [errorType: string]: number } = {};
                const typeBreakdown: { [type: string]: number } = {};

                records.forEach((record) => {
                    errorTypeBreakdown[record.errortype] =
                        (errorTypeBreakdown[record.errortype] || 0) + record.event_count;
                    typeBreakdown[record.type] =
                        (typeBreakdown[record.type] || 0) + record.event_count;
                });

                // Calculate error rate (assuming a baseline of events)
                // For demonstration, we'll assume 10000 baseline events per day
                const baselineEvents = 10000;
                const errorRate = (totalErrors / baselineEvents) * 100;

                return {
                    date,
                    totalErrors,
                    errorTypeBreakdown,
                    typeBreakdown,
                    uniqueErrorTypes: Object.keys(errorTypeBreakdown).length,
                    errorRate,
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate overall statistics
        const overallTotalErrors = rawData.reduce((sum, r) => sum + r.event_count, 0);
        const allErrorTypes = new Set(rawData.map((r) => r.errortype));
        const allTypes = new Set(rawData.map((r) => r.type));

        // Overall breakdowns
        const overallErrorTypeBreakdown: { [errorType: string]: number } = {};
        const overallTypeBreakdown: { [type: string]: number } = {};

        rawData.forEach((record) => {
            overallErrorTypeBreakdown[record.errortype] =
                (overallErrorTypeBreakdown[record.errortype] || 0) + record.event_count;
            overallTypeBreakdown[record.type] =
                (overallTypeBreakdown[record.type] || 0) + record.event_count;
        });

        // Calculate critical error count (system errors are considered critical)
        const criticalErrorCount = overallTypeBreakdown.system_error || 0;

        // Calculate average error rates
        const errorRates = dailyErrorStats.map((stat) => stat.errorRate);
        const averageErrorRate =
            errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
        const peakErrorRate = Math.max(...errorRates);

        // Prepare chart arrays
        const dates = dailyErrorStats.map((stat) => stat.date);
        const totalErrorsData = dailyErrorStats.map((stat) => stat.totalErrors);
        const errorRateData = dailyErrorStats.map((stat) => stat.errorRate);

        // Prepare data arrays for each dimension
        const errorTypeData: { [errorType: string]: number[] } = {};
        const typeData: { [type: string]: number[] } = {};

        [...allErrorTypes].forEach((errorType) => {
            errorTypeData[errorType] = dailyErrorStats.map(
                (stat) => stat.errorTypeBreakdown[errorType] || 0
            );
        });

        [...allTypes].forEach((type) => {
            typeData[type] = dailyErrorStats.map((stat) => stat.typeBreakdown[type] || 0);
        });

        const avgDailyErrors =
            totalErrorsData.reduce((sum, errors) => sum + errors, 0) / totalErrorsData.length;
        const peakDailyErrors = Math.max(...totalErrorsData);

        // Create refined error data
        const refinedData: RefinedErrorData = {
            dailyErrorStats,
            datasetStatistics: {
                overallTotalErrors,
                totalErrorTypes: allErrorTypes.size,
                averageErrorRate,
                peakErrorRate,
                errorTypeBreakdown: overallErrorTypeBreakdown,
                typeBreakdown: overallTypeBreakdown,
                criticalErrorCount,
            },
            totalDays: dailyErrorStats.length,
            totalRecords: rawData.length,
            dateRange:
                dailyErrorStats.length > 0
                    ? {
                          start: dailyErrorStats[0].date,
                          end: dailyErrorStats[dailyErrorStats.length - 1].date,
                      }
                    : null,
            chartArrays: {
                dates,
                totalErrorsData,
                errorRateData,
                errorTypeData,
                typeData,
                avgDailyErrors,
                peakDailyErrors,
                avgErrorRate: averageErrorRate,
                peakErrorRate,
            },
            displayNames: {
                segment: "Error Statistics Analysis",
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

        console.log(`Successfully processed ${rawData.length} error records for ${month}`);
    },
});
