import { StateCreator } from "zustand";
import dayjs from "dayjs";
import type { UsageDataRecord, DataFetchConfig, LoadingState } from "../types";
import { fetchUsageStatistics } from "../utils/csvUtils";

export interface UsageStats {
    date: string;
    totalEvents: number;
    channelBreakdown: { [channel: string]: number };
    messageTypeBreakdown: { [messageType: string]: number };
    processGroupBreakdown: { [processGroup: string]: number };
    marketRoleBreakdown: { [marketRole: string]: number };
    eventIDBreakdown: { [eventID: string]: number };
    uniqueChannels: number;
    uniqueMessageTypes: number;
    uniqueProcessGroups: number;
    uniqueMarketRoles: number;
    uniqueEventIDs: number;
}

export interface RefinedUsageData {
    dailyUsageStats: UsageStats[];
    datasetStatistics: {
        overallTotalEvents: number;
        totalChannels: number;
        totalMessageTypes: number;
        totalProcessGroups: number;
        totalMarketRoles: number;
        totalEventIDs: number;
        channelBreakdown: { [channel: string]: number };
        messageTypeBreakdown: { [messageType: string]: number };
        processGroupBreakdown: { [processGroup: string]: number };
        marketRoleBreakdown: { [marketRole: string]: number };
        topEventIDs: { [eventID: string]: number };
    };
    totalDays: number;
    totalRecords: number;
    dateRange: {
        start: string;
        end: string;
    } | null;
    chartArrays: {
        dates: string[];
        totalEventsData: number[];
        channelData: { [channel: string]: number[] };
        messageTypeData: { [messageType: string]: number[] };
        processGroupData: { [processGroup: string]: number[] };
        marketRoleData: { [marketRole: string]: number[] };
        avgDailyEvents: number;
        peakDailyEvents: number;
    };
    displayNames: {
        segment: string;
        groupBy: string;
    };
    lastUpdate: Date | null;
}

export interface UsageStatisticsStore {
    _rawdata: { [month: string]: UsageDataRecord[] } | null;
    monthlyData: { [month: string]: RefinedUsageData } | null;
    loading: boolean;
    error: string | null;
    lastUpdate: Date | null;
    
    // Filters
    filters: {
        processGroup: string;
        channel: string;
        marketRole: string;
    };
    
    fetchUsageData: (month: string, config?: DataFetchConfig) => Promise<void>;
    fetchAnnualData: (year: string, config?: DataFetchConfig) => Promise<void>;
    processMonthlyData: (month: string) => void;
    processAnnualData: (year: string) => void;
    
    // Filter methods
    setFilter: (filterType: 'processGroup' | 'channel' | 'marketRole', value: string) => void;
    clearFilters: () => void;
    getFilteredData: () => UsageDataRecord[];
    
    // Helper functions for components
    getProcessGroups: () => string[];
    getChannels: () => string[];
    getMarketRoles: () => string[];
    
    // Date-aware helper functions that return options with disabled state
    getProcessGroupOptions: (dateRange?: { startDate: string; endDate: string }) => Array<{ value: string; disabled: boolean }>;
    getChannelOptions: (dateRange?: { startDate: string; endDate: string }) => Array<{ value: string; disabled: boolean }>;
    getMarketRoleOptions: (dateRange?: { startDate: string; endDate: string }) => Array<{ value: string; disabled: boolean }>;
}

export const createUsageStatisticsStore: StateCreator<
    UsageStatisticsStore,
    [],
    [],
    UsageStatisticsStore
> = (set, get) => ({
    // Initial State
    _rawdata: null,
    monthlyData: null,
    loading: false,
    error: null,
    lastUpdate: null,
    
    // Filter state
    filters: {
        processGroup: 'all',
        channel: 'all',
        marketRole: 'all',
    },

    fetchUsageData: async (month: string, config: DataFetchConfig = { synthesize: 'on_missing_data' }) => {
        set({ loading: true, error: null });

        try {
            console.log(`🔄 UsageStatisticsStore.fetchUsageData started for ${month} - synthesize: ${config.synthesize}`);
            
            let usageData: UsageDataRecord[] = [];

            // Try to fetch from CSV first (unless synthesize is 'always')
            if (config.synthesize === 'never' || config.synthesize === 'on_missing_data') {
                try {
                    const csvFetchResponse = await fetchUsageStatistics();
                    if (csvFetchResponse.success && csvFetchResponse.data) {
                        // Filter data for the specific month
                        usageData = csvFetchResponse.data.filter((record: UsageDataRecord) => {
                            const recordMonth = dayjs(record.event_timestamp).format('YYYY-MM');
                            return recordMonth === month;
                        });
                        console.log(`📊 Loaded ${usageData.length} usage records from CSV for ${month}`);
                    } else if (config.synthesize === 'never') {
                        throw new Error('Failed to fetch usage statistics from CSV');
                    }
                } catch (csvError) {
                    console.warn(`CSV fetch failed for usage data: ${csvError}`);
                    if (config.synthesize === 'never') {
                        throw csvError;
                    }
                }
            }

            // If no data from CSV and synthesize is allowed, generate synthetic data
            if (usageData.length === 0 && config.synthesize !== 'never') {
                console.log(`📊 Generating synthetic usage data for ${month}`);
                const [year, monthNum] = month.split("-").map(Number);
                const daysInMonth = new Date(year, monthNum, 0).getDate();

                const channels = ["B2B", "DIF", "GUI", "CAP"];
                const messageTypes = ["F01", "F02", "F03", "F04", "F06", "F12", "E58", "MSG.PRC"];
                const eventIDs = [
                    "DH-111-1",
                    "DH-131-1",
                    "DH-132-1",
                    "DH-311-1",
                    "DH-321-1",
                    "DH-331-1",
                    "DH-721-1",
                    "DH-122-1",
                ];
                const processGroups = ["DH-100", "DH-300", "DH-700", "Other B2B events"];
                const marketRoleCodes = ["DDQ", "DSO", "THP", "CAP"];

                // Generate data for each day of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, monthNum - 1, day);

                    // Generate multiple records per day for different combinations
                    channels.forEach((channel) => {
                        messageTypes.forEach((messageType) => {
                            // Not every combination occurs every day
                            if (Math.random() > 0.3) {
                                return;
                            }

                            const eventID = eventIDs[Math.floor(Math.random() * eventIDs.length)];
                            const processGroup =
                                processGroups[Math.floor(Math.random() * processGroups.length)];
                            const marketRoleCode =
                                marketRoleCodes[Math.floor(Math.random() * marketRoleCodes.length)];

                            // Generate realistic event counts
                            let baseCount = 100;

                            if (channel === "B2B") {
                                baseCount = 1000;
                            } else if (channel === "DIF") {
                                baseCount = 500;
                            } else if (channel === "GUI") {
                                baseCount = 200;
                            } else if (channel === "CAP") {
                                baseCount = 300;
                            }

                            // Add daily variation and weekend factor
                            const weekendFactor =
                                date.getDay() === 0 || date.getDay() === 6 ? 0.5 : 1.0;
                            const eventCount = Math.floor(
                                (baseCount + (Math.random() - 0.5) * baseCount * 0.5) * weekendFactor
                            );

                            if (eventCount > 0) {
                                usageData.push({
                                    event_timestamp: date,
                                    channel,
                                    messagetype: messageType,
                                    eventID,
                                    process_group: processGroup,
                                    marketRoleCode,
                                    event_count: eventCount,
                                });
                            }
                        });
                    });
                }
            }

            // Update state with new raw data
            set((state) => ({
                _rawdata: {
                    ...state._rawdata,
                    [month]: usageData,
                },
                loading: false,
                lastUpdate: new Date(),
            }));

            // Process the monthly data after fetching
            get().processMonthlyData(month);
            
            console.log(`✅ UsageStatisticsStore.fetchUsageData completed for ${month} with ${usageData.length} records`);
        } catch (error) {
            console.error(`❌ UsageStatisticsStore.fetchUsageData failed for ${month}:`, error);
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

        // Check if processing is needed
        const existingProcessedData = state.monthlyData?.[month];
        const currentDataLength = rawData.length;
        const hasDataChanged =
            !existingProcessedData || existingProcessedData.totalRecords !== currentDataLength;

        if (!hasDataChanged) {
            console.log(`Processed data for ${month} is up to date`);

            return;
        }

        console.log(`Processing monthly usage data for ${month}`);

        // Group data by date for daily statistics
        const dailyGroups: { [date: string]: UsageDataRecord[] } = {};

        rawData.forEach((record) => {
            const dateKey = dayjs(record.event_timestamp).format("YYYY-MM-DD");

            if (!dailyGroups[dateKey]) {
                dailyGroups[dateKey] = [];
            }
            dailyGroups[dateKey].push(record);
        });

        // Calculate daily usage stats
        const dailyUsageStats: UsageStats[] = Object.entries(dailyGroups)
            .map(([date, records]) => {
                const totalEvents = records.reduce((sum, r) => sum + r.event_count, 0);

                // Calculate breakdowns
                const channelBreakdown: { [channel: string]: number } = {};
                const messageTypeBreakdown: { [messageType: string]: number } = {};
                const processGroupBreakdown: { [processGroup: string]: number } = {};
                const marketRoleBreakdown: { [marketRole: string]: number } = {};
                const eventIDBreakdown: { [eventID: string]: number } = {};

                records.forEach((record) => {
                    channelBreakdown[record.channel] =
                        (channelBreakdown[record.channel] || 0) + record.event_count;
                    messageTypeBreakdown[record.messagetype] =
                        (messageTypeBreakdown[record.messagetype] || 0) + record.event_count;
                    processGroupBreakdown[record.process_group] =
                        (processGroupBreakdown[record.process_group] || 0) + record.event_count;
                    marketRoleBreakdown[record.marketRoleCode] =
                        (marketRoleBreakdown[record.marketRoleCode] || 0) + record.event_count;
                    eventIDBreakdown[record.eventID] =
                        (eventIDBreakdown[record.eventID] || 0) + record.event_count;
                });

                return {
                    date,
                    totalEvents,
                    channelBreakdown,
                    messageTypeBreakdown,
                    processGroupBreakdown,
                    marketRoleBreakdown,
                    eventIDBreakdown,
                    uniqueChannels: Object.keys(channelBreakdown).length,
                    uniqueMessageTypes: Object.keys(messageTypeBreakdown).length,
                    uniqueProcessGroups: Object.keys(processGroupBreakdown).length,
                    uniqueMarketRoles: Object.keys(marketRoleBreakdown).length,
                    uniqueEventIDs: Object.keys(eventIDBreakdown).length,
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate overall statistics
        const overallTotalEvents = rawData.reduce((sum, r) => sum + r.event_count, 0);
        const allChannels = new Set(rawData.map((r) => r.channel));
        const allMessageTypes = new Set(rawData.map((r) => r.messagetype));
        const allProcessGroups = new Set(rawData.map((r) => r.process_group));
        const allMarketRoles = new Set(rawData.map((r) => r.marketRoleCode));
        const allEventIDs = new Set(rawData.map((r) => r.eventID));

        // Overall breakdowns
        const overallChannelBreakdown: { [channel: string]: number } = {};
        const overallMessageTypeBreakdown: { [messageType: string]: number } = {};
        const overallProcessGroupBreakdown: { [processGroup: string]: number } = {};
        const overallMarketRoleBreakdown: { [marketRole: string]: number } = {};
        const overallEventIDBreakdown: { [eventID: string]: number } = {};

        rawData.forEach((record) => {
            overallChannelBreakdown[record.channel] =
                (overallChannelBreakdown[record.channel] || 0) + record.event_count;
            overallMessageTypeBreakdown[record.messagetype] =
                (overallMessageTypeBreakdown[record.messagetype] || 0) + record.event_count;
            overallProcessGroupBreakdown[record.process_group] =
                (overallProcessGroupBreakdown[record.process_group] || 0) + record.event_count;
            overallMarketRoleBreakdown[record.marketRoleCode] =
                (overallMarketRoleBreakdown[record.marketRoleCode] || 0) + record.event_count;
            overallEventIDBreakdown[record.eventID] =
                (overallEventIDBreakdown[record.eventID] || 0) + record.event_count;
        });

        // Get top 10 event IDs
        const topEventIDs = Object.fromEntries(
            Object.entries(overallEventIDBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
        );

        // Prepare chart arrays
        const dates = dailyUsageStats.map((stat) => stat.date);
        const totalEventsData = dailyUsageStats.map((stat) => stat.totalEvents);

        // Prepare data arrays for each dimension
        const channelData: { [channel: string]: number[] } = {};
        const messageTypeData: { [messageType: string]: number[] } = {};
        const processGroupData: { [processGroup: string]: number[] } = {};
        const marketRoleData: { [marketRole: string]: number[] } = {};

        [...allChannels].forEach((channel) => {
            channelData[channel] = dailyUsageStats.map(
                (stat) => stat.channelBreakdown[channel] || 0
            );
        });

        [...allMessageTypes].forEach((messageType) => {
            messageTypeData[messageType] = dailyUsageStats.map(
                (stat) => stat.messageTypeBreakdown[messageType] || 0
            );
        });

        [...allProcessGroups].forEach((processGroup) => {
            processGroupData[processGroup] = dailyUsageStats.map(
                (stat) => stat.processGroupBreakdown[processGroup] || 0
            );
        });

        [...allMarketRoles].forEach((marketRole) => {
            marketRoleData[marketRole] = dailyUsageStats.map(
                (stat) => stat.marketRoleBreakdown[marketRole] || 0
            );
        });

        const avgDailyEvents =
            totalEventsData.reduce((sum, events) => sum + events, 0) / totalEventsData.length;
        const peakDailyEvents = Math.max(...totalEventsData);

        // Create refined usage data
        const refinedData: RefinedUsageData = {
            dailyUsageStats,
            datasetStatistics: {
                overallTotalEvents,
                totalChannels: allChannels.size,
                totalMessageTypes: allMessageTypes.size,
                totalProcessGroups: allProcessGroups.size,
                totalMarketRoles: allMarketRoles.size,
                totalEventIDs: allEventIDs.size,
                channelBreakdown: overallChannelBreakdown,
                messageTypeBreakdown: overallMessageTypeBreakdown,
                processGroupBreakdown: overallProcessGroupBreakdown,
                marketRoleBreakdown: overallMarketRoleBreakdown,
                topEventIDs,
            },
            totalDays: dailyUsageStats.length,
            totalRecords: rawData.length,
            dateRange:
                dailyUsageStats.length > 0
                    ? {
                          start: dailyUsageStats[0].date,
                          end: dailyUsageStats[dailyUsageStats.length - 1].date,
                      }
                    : null,
            chartArrays: {
                dates,
                totalEventsData,
                channelData,
                messageTypeData,
                processGroupData,
                marketRoleData,
                avgDailyEvents,
                peakDailyEvents,
            },
            displayNames: {
                segment: "Usage Statistics Analysis",
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

        console.log(`Successfully processed ${rawData.length} usage records for ${month}`);
    },

    fetchAnnualData: async (year: string, config: DataFetchConfig = { synthesize: 'on_missing_data' }) => {
        set({ loading: true, error: null });

        try {
            console.log(`🔄 UsageStatisticsStore.fetchAnnualData started for ${year} - synthesize: ${config.synthesize}`);
            
            let allYearData: UsageDataRecord[] = [];

            // Try to fetch from CSV first (unless synthesize is 'always')
            if (config.synthesize === 'never' || config.synthesize === 'on_missing_data') {
                try {
                    const csvFetchResponse = await fetchUsageStatistics();
                    if (csvFetchResponse.success && csvFetchResponse.data) {
                        // Filter data for the specific year
                        allYearData = csvFetchResponse.data.filter((record: UsageDataRecord) => {
                            const recordYear = dayjs(record.event_timestamp).format('YYYY');
                            return recordYear === year;
                        });
                        console.log(`📊 Loaded ${allYearData.length} usage records from CSV for ${year}`);
                    } else if (config.synthesize === 'never') {
                        throw new Error('Failed to fetch usage statistics from CSV');
                    }
                } catch (csvError) {
                    console.warn(`CSV fetch failed for usage data: ${csvError}`);
                    if (config.synthesize === 'never') {
                        throw csvError;
                    }
                }
            }

            // If no data from CSV and synthesize is allowed, generate synthetic data
            if (allYearData.length === 0 && config.synthesize !== 'never') {
                console.log(`📊 Generating synthetic usage data for ${year}`);
                
                // Generate data for all 12 months of the year
                const allRawData: { [month: string]: UsageDataRecord[] } = {};
                
                for (let month = 1; month <= 12; month++) {
                    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
                    const yearNum = parseInt(year);
                    const daysInMonth = new Date(yearNum, month, 0).getDate();

                    const channels = ["B2B", "DIF", "GUI", "CAP"];
                    const messageTypes = ["F01", "F02", "F03", "F04", "F06", "F12", "E58", "MSG.PRC"];
                    const eventIDs = [
                        "DH-111-1",
                        "DH-131-1", 
                        "DH-132-1",
                        "DH-311-1",
                        "DH-321-1",
                        "DH-331-1",
                        "DH-721-1",
                        "DH-122-1",
                    ];
                    const processGroups = ["DH-100", "DH-300", "DH-700", "Other B2B events"];
                    const marketRoles = ["DDQ", "DSO", "THP", "CAP"];

                    const syntheticData: UsageDataRecord[] = [];

                    for (let day = 1; day <= daysInMonth; day++) {
                        for (let recordCount = 0; recordCount < 10; recordCount++) {
                            const randomChannel = channels[Math.floor(Math.random() * channels.length)];
                            const randomMessageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
                            const randomEventID = eventIDs[Math.floor(Math.random() * eventIDs.length)];
                            const randomProcessGroup = processGroups[Math.floor(Math.random() * processGroups.length)];
                            const randomMarketRole = marketRoles[Math.floor(Math.random() * marketRoles.length)];

                            syntheticData.push({
                                event_timestamp: new Date(yearNum, month - 1, day),
                                channel: randomChannel,
                                messagetype: randomMessageType,
                                eventID: randomEventID,
                                process_group: randomProcessGroup,
                                marketRoleCode: randomMarketRole,
                                event_count: Math.floor(Math.random() * 5) + 1, // 1-5 events per record
                            });
                        }
                    }

                    allRawData[monthKey] = syntheticData;
                    allYearData.push(...syntheticData);
                }

                // Store all raw data
                set((state) => ({
                    _rawdata: {
                        ...state._rawdata,
                        ...allRawData,
                    }
                }));
            } else if (allYearData.length > 0) {
                // Group CSV data by month
                const allRawData: { [month: string]: UsageDataRecord[] } = {};
                allYearData.forEach(record => {
                    const monthKey = dayjs(record.event_timestamp).format('YYYY-MM');
                    if (!allRawData[monthKey]) {
                        allRawData[monthKey] = [];
                    }
                    allRawData[monthKey].push(record);
                });

                // Store all raw data
                set((state) => ({
                    _rawdata: {
                        ...state._rawdata,
                        ...allRawData,
                    }
                }));
            }

            set({ loading: false, lastUpdate: new Date() });

            // Process the annual data after fetching
            get().processAnnualData(year);
            
            console.log(`✅ UsageStatisticsStore.fetchAnnualData completed for ${year} with ${allYearData.length} records`);
        } catch (error) {
            console.error(`❌ UsageStatisticsStore.fetchAnnualData failed for ${year}:`, error);
            set({
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            });
        }
    },

    processAnnualData: (year: string) => {
        const state = get();

        // Get all months for the year
        const months: string[] = [];
        for (let month = 1; month <= 12; month++) {
            const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
            months.push(monthKey);
        }

        // Collect all raw data for the year
        const allYearData: UsageDataRecord[] = [];
        for (const monthKey of months) {
            const monthData = state._rawdata?.[monthKey];

            if (monthData) {
                allYearData.push(...monthData);
            }
        }

        if (allYearData.length === 0) {
            console.warn(`No raw data available for year: ${year}`);

            return;
        }

        // Aggregate data by month for chart display
        const monthlyAggregations: { [month: string]: UsageStats } = {};

        // Process each month's data
        for (const monthKey of months) {
            const monthData = state._rawdata?.[monthKey] || [];

            const monthStats: UsageStats = {
                date: monthKey,
                totalEvents: 0,
                channelBreakdown: {},
                messageTypeBreakdown: {},
                processGroupBreakdown: {},
                marketRoleBreakdown: {},
                eventIDBreakdown: {},
                uniqueChannels: 0,
                uniqueMessageTypes: 0,
                uniqueProcessGroups: 0,
                uniqueMarketRoles: 0,
                uniqueEventIDs: 0,
            };

            // Aggregate monthly data
            for (const record of monthData) {
                monthStats.totalEvents += record.event_count;

                // Update breakdowns
                monthStats.channelBreakdown[record.channel] =
                    (monthStats.channelBreakdown[record.channel] || 0) + record.event_count;
                monthStats.messageTypeBreakdown[record.messagetype] =
                    (monthStats.messageTypeBreakdown[record.messagetype] || 0) + record.event_count;
                monthStats.processGroupBreakdown[record.process_group] =
                    (monthStats.processGroupBreakdown[record.process_group] || 0) +
                    record.event_count;
                monthStats.marketRoleBreakdown[record.marketRoleCode] =
                    (monthStats.marketRoleBreakdown[record.marketRoleCode] || 0) +
                    record.event_count;
                monthStats.eventIDBreakdown[record.eventID] =
                    (monthStats.eventIDBreakdown[record.eventID] || 0) + record.event_count;
            }

            // Calculate unique counts
            monthStats.uniqueChannels = Object.keys(monthStats.channelBreakdown).length;
            monthStats.uniqueMessageTypes = Object.keys(monthStats.messageTypeBreakdown).length;
            monthStats.uniqueProcessGroups = Object.keys(monthStats.processGroupBreakdown).length;
            monthStats.uniqueMarketRoles = Object.keys(monthStats.marketRoleBreakdown).length;
            monthStats.uniqueEventIDs = Object.keys(monthStats.eventIDBreakdown).length;

            monthlyAggregations[monthKey] = monthStats;
        }

        // Create annual aggregated statistics
        const datasetStatistics = {
            overallTotalEvents: 0,
            totalChannels: 0,
            totalMessageTypes: 0,
            totalProcessGroups: 0,
            totalMarketRoles: 0,
            totalEventIDs: 0,
            channelBreakdown: {} as { [channel: string]: number },
            messageTypeBreakdown: {} as { [messageType: string]: number },
            processGroupBreakdown: {} as { [processGroup: string]: number },
            marketRoleBreakdown: {} as { [marketRole: string]: number },
            topEventIDs: {} as { [eventID: string]: number },
        };

        // Aggregate all year data
        for (const record of allYearData) {
            datasetStatistics.overallTotalEvents += record.event_count;

            datasetStatistics.channelBreakdown[record.channel] =
                (datasetStatistics.channelBreakdown[record.channel] || 0) + record.event_count;
            datasetStatistics.messageTypeBreakdown[record.messagetype] =
                (datasetStatistics.messageTypeBreakdown[record.messagetype] || 0) +
                record.event_count;
            datasetStatistics.processGroupBreakdown[record.process_group] =
                (datasetStatistics.processGroupBreakdown[record.process_group] || 0) +
                record.event_count;
            datasetStatistics.marketRoleBreakdown[record.marketRoleCode] =
                (datasetStatistics.marketRoleBreakdown[record.marketRoleCode] || 0) +
                record.event_count;
            datasetStatistics.topEventIDs[record.eventID] =
                (datasetStatistics.topEventIDs[record.eventID] || 0) + record.event_count;
        }

        // Calculate totals
        datasetStatistics.totalChannels = Object.keys(datasetStatistics.channelBreakdown).length;
        datasetStatistics.totalMessageTypes = Object.keys(
            datasetStatistics.messageTypeBreakdown
        ).length;
        datasetStatistics.totalProcessGroups = Object.keys(
            datasetStatistics.processGroupBreakdown
        ).length;
        datasetStatistics.totalMarketRoles = Object.keys(
            datasetStatistics.marketRoleBreakdown
        ).length;
        datasetStatistics.totalEventIDs = Object.keys(datasetStatistics.topEventIDs).length;

        // Create chart arrays with monthly data points
        const dates = months;
        const totalEventsData = months.map((month) => monthlyAggregations[month]?.totalEvents || 0);

        // Create data series for charts
        const channelData: { [channel: string]: number[] } = {};
        const messageTypeData: { [messageType: string]: number[] } = {};
        const processGroupData: { [processGroup: string]: number[] } = {};
        const marketRoleData: { [marketRole: string]: number[] } = {};

        // Fill chart data for each category
        Object.keys(datasetStatistics.channelBreakdown).forEach((channel) => {
            channelData[channel] = months.map(
                (month) => monthlyAggregations[month]?.channelBreakdown[channel] || 0
            );
        });

        Object.keys(datasetStatistics.messageTypeBreakdown).forEach((messageType) => {
            messageTypeData[messageType] = months.map(
                (month) => monthlyAggregations[month]?.messageTypeBreakdown[messageType] || 0
            );
        });

        Object.keys(datasetStatistics.processGroupBreakdown).forEach((processGroup) => {
            processGroupData[processGroup] = months.map(
                (month) => monthlyAggregations[month]?.processGroupBreakdown[processGroup] || 0
            );
        });

        Object.keys(datasetStatistics.marketRoleBreakdown).forEach((marketRole) => {
            marketRoleData[marketRole] = months.map(
                (month) => monthlyAggregations[month]?.marketRoleBreakdown[marketRole] || 0
            );
        });

        // Calculate stats
        const avgDailyEvents = Math.round(datasetStatistics.overallTotalEvents / 365);
        const peakDailyEvents = Math.max(...totalEventsData);

        const chartArrays = {
            dates,
            totalEventsData,
            channelData,
            messageTypeData,
            processGroupData,
            marketRoleData,
            avgDailyEvents,
            peakDailyEvents,
        };

        // Create refined annual data
        const refinedData: RefinedUsageData = {
            dailyUsageStats: Object.values(monthlyAggregations), // Monthly stats for annual view
            datasetStatistics,
            totalDays: 365,
            totalRecords: allYearData.length,
            dateRange: {
                start: `${year}-01-01`,
                end: `${year}-12-31`,
            },
            chartArrays,
            displayNames: {
                segment: "Annual",
                groupBy: "Month",
            },
            lastUpdate: new Date(),
        };

        // Update state with annual processed data
        set((state) => ({
            monthlyData: {
                ...state.monthlyData,
                [year]: refinedData,
            },
        }));

        console.log(`Successfully processed annual data for ${year}`);
    },

    // Filter methods
    setFilter: (filterType: 'processGroup' | 'channel' | 'marketRole', value: string) => {
        set((state) => ({
            filters: {
                ...state.filters,
                [filterType]: value,
            },
        }));
    },

    clearFilters: () => {
        set({
            filters: {
                processGroup: 'all',
                channel: 'all',
                marketRole: 'all',
            },
        });
    },

    getFilteredData: (): UsageDataRecord[] => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply filters
        return allRecords.filter((record: UsageDataRecord) => {
            if (filters.processGroup !== 'all' && record.process_group !== filters.processGroup) {
                return false;
            }
            if (filters.channel !== 'all' && record.channel !== filters.channel) {
                return false;
            }
            if (filters.marketRole !== 'all' && record.marketRoleCode !== filters.marketRole) {
                return false;
            }
            return true;
        });
    },

    // Helper functions for components
    getProcessGroups: (): string[] => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply only channel and marketRole filters (not processGroup)
        // This allows the dropdown to show available process groups for the current channel/role selection
        const filteredRecords = allRecords.filter((record: UsageDataRecord) => {
            if (filters.channel !== 'all' && record.channel !== filters.channel) {
                return false;
            }
            if (filters.marketRole !== 'all' && record.marketRoleCode !== filters.marketRole) {
                return false;
            }
            return true;
        });
        
        const groups = new Set<string>();
        filteredRecords.forEach(record => {
            if (record.process_group) {
                groups.add(record.process_group);
            }
        });
        
        return Array.from(groups);
    },

    getChannels: (): string[] => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply only processGroup and marketRole filters (not channel)
        // This allows the dropdown to show available channels for the current process/role selection
        const filteredRecords = allRecords.filter((record: UsageDataRecord) => {
            if (filters.processGroup !== 'all' && record.process_group !== filters.processGroup) {
                return false;
            }
            if (filters.marketRole !== 'all' && record.marketRoleCode !== filters.marketRole) {
                return false;
            }
            return true;
        });
        
        const channels = new Set<string>();
        filteredRecords.forEach(record => {
            if (record.channel) {
                channels.add(record.channel);
            }
        });
        
        return Array.from(channels);
    },

    getMarketRoles: (): string[] => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply only processGroup and channel filters (not marketRole)
        // This allows the dropdown to show available market roles for the current process/channel selection
        const filteredRecords = allRecords.filter((record: UsageDataRecord) => {
            if (filters.processGroup !== 'all' && record.process_group !== filters.processGroup) {
                return false;
            }
            if (filters.channel !== 'all' && record.channel !== filters.channel) {
                return false;
            }
            return true;
        });
        
        const roles = new Set<string>();
        filteredRecords.forEach(record => {
            if (record.marketRoleCode) {
                roles.add(record.marketRoleCode);
            }
        });
        
        return Array.from(roles);
    },

    // Date-aware helper functions that return options with disabled state
    getProcessGroupOptions: (dateRange?: { startDate: string; endDate: string }) => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply only channel and marketRole filters (not processGroup)
        const filteredRecords = allRecords.filter((record: UsageDataRecord) => {
            if (filters.channel !== 'all' && record.channel !== filters.channel) {
                return false;
            }
            if (filters.marketRole !== 'all' && record.marketRoleCode !== filters.marketRole) {
                return false;
            }
            return true;
        });
        
        // Get all unique process groups
        const allGroups = new Set<string>();
        filteredRecords.forEach(record => {
            if (record.process_group) {
                allGroups.add(record.process_group);
            }
        });
        
        // If no date range provided, all options are enabled
        if (!dateRange) {
            return Array.from(allGroups).map(value => ({ value, disabled: false }));
        }
        
        // Filter by date range to find which groups are available
        const availableGroups = new Set<string>();
        filteredRecords.forEach(record => {
            const recordDate = new Date(record.event_timestamp).toISOString().split('T')[0];
            if (recordDate >= dateRange.startDate && recordDate <= dateRange.endDate) {
                if (record.process_group) {
                    availableGroups.add(record.process_group);
                }
            }
        });
        
        // Return all groups with disabled state
        return Array.from(allGroups).map(value => ({
            value,
            disabled: !availableGroups.has(value)
        }));
    },

    getChannelOptions: (dateRange?: { startDate: string; endDate: string }) => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply only processGroup and marketRole filters (not channel)
        const filteredRecords = allRecords.filter((record: UsageDataRecord) => {
            if (filters.processGroup !== 'all' && record.process_group !== filters.processGroup) {
                return false;
            }
            if (filters.marketRole !== 'all' && record.marketRoleCode !== filters.marketRole) {
                return false;
            }
            return true;
        });
        
        // Get all unique channels
        const allChannels = new Set<string>();
        filteredRecords.forEach(record => {
            if (record.channel) {
                allChannels.add(record.channel);
            }
        });
        
        // If no date range provided, all options are enabled
        if (!dateRange) {
            return Array.from(allChannels).map(value => ({ value, disabled: false }));
        }
        
        // Filter by date range to find which channels are available
        const availableChannels = new Set<string>();
        filteredRecords.forEach(record => {
            const recordDate = new Date(record.event_timestamp).toISOString().split('T')[0];
            if (recordDate >= dateRange.startDate && recordDate <= dateRange.endDate) {
                if (record.channel) {
                    availableChannels.add(record.channel);
                }
            }
        });
        
        // Return all channels with disabled state
        return Array.from(allChannels).map(value => ({
            value,
            disabled: !availableChannels.has(value)
        }));
    },

    getMarketRoleOptions: (dateRange?: { startDate: string; endDate: string }) => {
        const rawData = get()._rawdata;
        const filters = get().filters;
        
        if (!rawData) return [];
        
        // Combine all months into a single array
        let allRecords: UsageDataRecord[] = [];
        Object.values(rawData).forEach(monthData => {
            if (Array.isArray(monthData)) {
                allRecords = allRecords.concat(monthData);
            }
        });
        
        // Apply only processGroup and channel filters (not marketRole)
        const filteredRecords = allRecords.filter((record: UsageDataRecord) => {
            if (filters.processGroup !== 'all' && record.process_group !== filters.processGroup) {
                return false;
            }
            if (filters.channel !== 'all' && record.channel !== filters.channel) {
                return false;
            }
            return true;
        });
        
        // Get all unique market roles
        const allRoles = new Set<string>();
        filteredRecords.forEach(record => {
            if (record.marketRoleCode) {
                allRoles.add(record.marketRoleCode);
            }
        });
        
        // If no date range provided, all options are enabled
        if (!dateRange) {
            return Array.from(allRoles).map(value => ({ value, disabled: false }));
        }
        
        // Filter by date range to find which roles are available
        const availableRoles = new Set<string>();
        filteredRecords.forEach(record => {
            const recordDate = new Date(record.event_timestamp).toISOString().split('T')[0];
            if (recordDate >= dateRange.startDate && recordDate <= dateRange.endDate) {
                if (record.marketRoleCode) {
                    availableRoles.add(record.marketRoleCode);
                }
            }
        });
        
        // Return all roles with disabled state
        return Array.from(allRoles).map(value => ({
            value,
            disabled: !availableRoles.has(value)
        }));
    },
});