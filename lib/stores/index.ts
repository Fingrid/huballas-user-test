import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Import individual store types and creators
import { DictionaryStore, createDictionaryStore } from "./dictionary.store";
import {
    ResponseTimeStatisticsStore,
    createMonthlyReportsStore,
} from "./responseTimeStatistics.store";
import { UsageStatisticsStore, createUsageStatisticsStore } from "./usageStatistics.store";
import { ErrorStatisticsStore, createErrorStatisticsStore } from "./errorStatistics";

// Export localization store
export { useLocalization, useTranslation, type Locale } from './localization.store';

// Combined store interface with namespaced stores to avoid property conflicts
export interface CombinedHuballasStore {
    // Namespaced stores to avoid property conflicts
    dictionary: DictionaryStore;
    responseTime: ResponseTimeStatisticsStore;
    usage: UsageStatisticsStore;
    error: ErrorStatisticsStore;

    // Additional combined store methods
    initializeAllStores: () => Promise<void>;
    resetAllStores: () => void;
    getLastUpdateTimes: () => {
        dictionary: Date | null;
        responseTime: Date | null;
        usage: Date | null;
        error: Date | null;
    };
    getAllLoadingStates: () => {
        dictionary: boolean;
        responseTime: boolean;
        usage: boolean;
        error: boolean;
    };
    getAllErrors: () => {
        dictionary: string | null;
        responseTime: string | null;
        usage: string | null;
        error: string | null;
    };
}

// Create individual store instances
const dictionaryStore = create<DictionaryStore>()(
    devtools(immer(createDictionaryStore), { name: "dictionary-store" })
);

const responseTimeStore = create<ResponseTimeStatisticsStore>()(
    devtools(immer(createMonthlyReportsStore), { name: "response-time-store" })
);

const usageStore = create<UsageStatisticsStore>()(
    devtools(immer(createUsageStatisticsStore), { name: "usage-store" })
);

const errorStore = create<ErrorStatisticsStore>()(
    devtools(immer(createErrorStatisticsStore), { name: "error-store" })
);

// Combined store that provides access to all stores
export const useCombinedStore = create<CombinedHuballasStore>()(
    devtools(
        immer(() => ({
            // Provide access to individual store states and actions
            get dictionary() {
                return dictionaryStore.getState();
            },
            get responseTime() {
                return responseTimeStore.getState();
            },
            get usage() {
                return usageStore.getState();
            },
            get error() {
                return errorStore.getState();
            },

            // Combined store methods
            initializeAllStores: async () => {
                try {
                    console.log('🔄 Initializing all stores...');
                    
                    // Initialize dictionaries first as other stores might depend on them
                    await dictionaryStore.getState().fetchDictionaries();

                    // Define all months that have data based on the CSV
                    const monthsToLoad = [
                        '2024-12',
                        '2025-01', '2025-02', '2025-03', '2025-04',
                        '2025-05', '2025-06', '2025-07', '2025-08'
                    ];

                    console.log('📊 Loading data for months:', monthsToLoad);

                    // Initialize all statistics stores for all available months
                    const loadPromises = monthsToLoad.flatMap(month => [
                        responseTimeStore.getState().fetchResponseTimeData(month),
                        usageStore.getState().fetchUsageData(month),
                        errorStore.getState().fetchErrorData(month),
                    ]);

                    await Promise.all(loadPromises);
                    console.log('✅ All stores initialized successfully');
                } catch (error) {
                    console.error("Failed to initialize all stores:", error);
                }
            },

            resetAllStores: () => {
                // Reset all individual stores by calling their reset methods or reinitializing
                dictionaryStore.setState({
                    dictionaries: null,
                    loading: false,
                    error: null,
                    lastUpdate: null,
                });

                responseTimeStore.setState({
                    _rawdata: null,
                    monthlyData: null,
                    loading: false,
                    error: null,
                    lastUpdate: null,
                });

                usageStore.setState({
                    _rawdata: null,
                    monthlyData: null,
                    loading: false,
                    error: null,
                    lastUpdate: null,
                });

                errorStore.setState({
                    _rawdata: null,
                    monthlyData: null,
                    loading: false,
                    error: null,
                    lastUpdate: null,
                });
            },

            getLastUpdateTimes: () => {
                const dictState = dictionaryStore.getState();
                const responseState = responseTimeStore.getState();
                const usageState = usageStore.getState();
                const errorState = errorStore.getState();

                return {
                    dictionary: dictState.lastUpdate,
                    responseTime: responseState.monthlyData
                        ? Object.values(responseState.monthlyData)[0]?.lastUpdate || null
                        : null,
                    usage: usageState.monthlyData
                        ? Object.values(usageState.monthlyData)[0]?.lastUpdate || null
                        : null,
                    error: errorState.monthlyData
                        ? Object.values(errorState.monthlyData)[0]?.lastUpdate || null
                        : null,
                };
            },

            getAllLoadingStates: () => ({
                dictionary: dictionaryStore.getState().loading,
                responseTime: responseTimeStore.getState().loading,
                usage: usageStore.getState().loading,
                error: errorStore.getState().loading,
            }),

            getAllErrors: () => ({
                dictionary: dictionaryStore.getState().error,
                responseTime: responseTimeStore.getState().error,
                usage: usageStore.getState().error,
                error: errorStore.getState().error,
            }),
        })),
        {
            name: "huballas-combined-store",
        }
    )
);

// Export individual store hooks for direct access when needed
export const useDictionaryStore = () => dictionaryStore();
export const useResponseTimeStore = () => responseTimeStore();
export const useUsageStore = () => usageStore();
export const useErrorStore = () => errorStore();

// Also export the store instances for .getState() and .subscribe() usage
export const dictionaryStoreInstance = dictionaryStore;
export const responseTimeStoreInstance = responseTimeStore;
export const usageStoreInstance = usageStore;
export const errorStoreInstance = errorStore;

// Re-export specific interfaces that components might need
export type {
    DictionaryCollections,
} from "./dictionary.store";

export type {
    ChannelDescription,
    MarketRoleDescription,
    EventDescription,
} from "../types";

export type { ConfidenceStats, RefinedMonthlyData } from "./responseTimeStatistics.store";

export type { UsageStats, RefinedUsageData } from "./usageStatistics.store";

export type { ErrorStats, RefinedErrorData } from "./errorStatistics";
