import { StateCreator } from "zustand";
import type { ChannelDescription, MarketRoleDescription, EventDescription, DataFetchConfig } from "../types";
import { 
    fetchChannelDescriptions,
    fetchMarketRoleDescriptions,
    fetchEventDescriptions
} from "../utils/csvUtils";

// Dictionary item interfaces based on actual CSV data
export interface DictionaryItem {
    code: string;
    name: string;
    description?: string;
}

// Main dictionary collections interface
export interface DictionaryCollections {
    channels: ChannelDescription[];
    marketRoles: MarketRoleDescription[];
    events: EventDescription[];
}

// Store interface
export interface DictionaryStore {
    dictionaries: DictionaryCollections | null;
    loading: boolean;
    error: string | null;
    lastUpdate: Date | null;
    fetchDictionaries: (config?: DataFetchConfig) => Promise<void>;
    getDictionaryByType: <T extends keyof DictionaryCollections>(
        type: T
    ) => DictionaryCollections[T];
    findByCode: <T extends keyof DictionaryCollections>(
        type: T,
        code: string
    ) => DictionaryCollections[T][number] | undefined;
    getActiveItems: <T extends keyof DictionaryCollections>(type: T) => DictionaryCollections[T];
    
    // Helper functions for components
    getChannelDescription: (code: string) => string;
    getMarketRoleDescription: (code: string) => string;
    getChannelCodes: () => string[];
    getMarketRoleCodes: () => string[];
    getEventCodes: () => string[];
}

export const createDictionaryStore: StateCreator<DictionaryStore, [], [], DictionaryStore> = (
    set,
    get
) => ({
    // Initial State
    dictionaries: null,
    loading: false,
    error: null,
    lastUpdate: null,

    fetchDictionaries: async (config: DataFetchConfig = { synthesize: 'on_missing_data' }) => {
        set({ loading: true, error: null });

        try {
            console.log(`🔄 DictionaryStore.fetchDictionaries started - synthesize: ${config.synthesize}`);
            
            let channels: ChannelDescription[] = [];
            let marketRoles: MarketRoleDescription[] = [];
            let events: EventDescription[] = [];

            // Try to fetch from CSV first (unless synthesize is 'always')
            if (config.synthesize === 'never' || config.synthesize === 'on_missing_data') {
                try {
                    const [channelResponse, marketRoleResponse, eventResponse] = await Promise.all([
                        fetchChannelDescriptions(),
                        fetchMarketRoleDescriptions(),
                        fetchEventDescriptions(),
                    ]);

                    if (channelResponse.success && channelResponse.data) {
                        channels = channelResponse.data;
                        console.log(`📊 Loaded ${channels.length} channel descriptions from CSV`);
                    }

                    if (marketRoleResponse.success && marketRoleResponse.data) {
                        marketRoles = marketRoleResponse.data;
                        console.log(`📊 Loaded ${marketRoles.length} market role descriptions from CSV`);
                    }

                    if (eventResponse.success && eventResponse.data) {
                        events = eventResponse.data;
                        console.log(`📊 Loaded ${events.length} event descriptions from CSV`);
                    }

                    if (config.synthesize === 'never' && (!channelResponse.success || !marketRoleResponse.success || !eventResponse.success)) {
                        throw new Error('Failed to fetch dictionary data from CSV');
                    }
                } catch (csvError) {
                    console.warn(`CSV fetch failed for dictionary data: ${csvError}`);
                    if (config.synthesize === 'never') {
                        throw csvError;
                    }
                }
            }

            // If some data is missing from CSV and synthesize is allowed, generate fallback data
            if (config.synthesize !== 'never') {
                if (channels.length === 0) {
                    console.log(`📊 Generating synthetic channel descriptions`);
                    channels = [
                        { code: "B2B", descriptionEN: "Business-to-Business", descriptionFI: "Yritys-yritys" },
                        { code: "DIF", descriptionEN: "Data Integration Framework", descriptionFI: "Tietojen integraatio" },
                        { code: "GUI", descriptionEN: "Graphical User Interface", descriptionFI: "Graafinen käyttöliittymä" },
                        { code: "CAP", descriptionEN: "Capacity Allocation Platform", descriptionFI: "Kapasiteetin allokointialusta" },
                    ];
                }

                if (marketRoles.length === 0) {
                    console.log(`📊 Generating synthetic market role descriptions`);
                    marketRoles = [
                        { code: "DDQ", nameAndCode: "DDQ - Data Distribution Operator", name: "Data Distribution Operator" },
                        { code: "DSO", nameAndCode: "DSO - Distribution System Operator", name: "Distribution System Operator" },
                        { code: "THP", nameAndCode: "THP - Third Party", name: "Third Party" },
                        { code: "CAP", nameAndCode: "CAP - Capacity Provider", name: "Capacity Provider" },
                    ];
                }

                if (events.length === 0) {
                    console.log(`📊 Generating synthetic event descriptions`);
                    events = [
                        { eventID: "DH-111-1", description: "Datahub Standard Event 111-1" },
                        { eventID: "DH-131-1", description: "Datahub Standard Event 131-1" },
                        { eventID: "DH-132-1", description: "Datahub Standard Event 132-1" },
                        { eventID: "DH-311-1", description: "Datahub Standard Event 311-1" },
                        { eventID: "DH-321-1", description: "Datahub Standard Event 321-1" },
                        { eventID: "DH-331-1", description: "Datahub Standard Event 331-1" },
                        { eventID: "DH-721-1", description: "Datahub Standard Event 721-1" },
                        { eventID: "DH-122-1", description: "Datahub Standard Event 122-1" },
                    ];
                }
            }

            const dictionaries: DictionaryCollections = {
                channels,
                marketRoles,
                events,
            };

            set({
                dictionaries,
                loading: false,
                lastUpdate: new Date(),
            });

            console.log(`✅ DictionaryStore.fetchDictionaries completed with:`, {
                channels: channels.length,
                marketRoles: marketRoles.length,
                events: events.length,
            });
        } catch (error) {
            console.error(`❌ DictionaryStore.fetchDictionaries failed:`, error);
            set({
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            });
        }
    },

    getDictionaryByType: <T extends keyof DictionaryCollections>(type: T) => {
        const { dictionaries } = get();

        if (!dictionaries) {
            return [] as DictionaryCollections[T];
        }

        return dictionaries[type] || ([] as DictionaryCollections[T]);
    },

    findByCode: <T extends keyof DictionaryCollections>(
        type: T,
        code: string
    ): DictionaryCollections[T][number] | undefined => {
        const items = get().getDictionaryByType(type) as DictionaryCollections[T];

        // Ensure items is an array before calling find
        if (!Array.isArray(items) || items.length === 0) {
            return undefined;
        }

        // Use type guards with explicit casting to resolve union type issues
        if (type === "channels") {
            return (items as ChannelDescription[]).find((item) => item.code === code) as
                | DictionaryCollections[T][number]
                | undefined;
        } else if (type === "marketRoles") {
            return (items as MarketRoleDescription[]).find(
                (item) => item.code === code
            ) as DictionaryCollections[T][number] | undefined;
        } else if (type === "events") {
            return (items as EventDescription[]).find((item) => item.eventID === code) as
                | DictionaryCollections[T][number]
                | undefined;
        }

        return undefined;
    },

    getActiveItems: <T extends keyof DictionaryCollections>(type: T) => {
        const items = get().getDictionaryByType(type);

        // Ensure items is an array before calling filter
        if (!Array.isArray(items) || items.length === 0) {
            return [] as DictionaryCollections[T];
        }

        return items as DictionaryCollections[T];
    },

    // Helper functions for components
    getChannelDescription: (code: string) => {
        const dictionaries = get().dictionaries;
        if (!dictionaries?.channels) return code;
        const channel = dictionaries.channels.find((c) => c.code === code);
        return channel?.descriptionEN || code;
    },

    getMarketRoleDescription: (code: string) => {
        const dictionaries = get().dictionaries;
        if (!dictionaries?.marketRoles) return code;
        const role = dictionaries.marketRoles.find((r) => r.code === code);
        return role?.name || code;
    },

    getChannelCodes: () => {
        const dictionaries = get().dictionaries;
        if (!dictionaries?.channels) return [];
        return dictionaries.channels.map((c) => c.code);
    },

    getMarketRoleCodes: () => {
        const dictionaries = get().dictionaries;
        if (!dictionaries?.marketRoles) return [];
        return dictionaries.marketRoles.map((r) => r.code);
    },

    getEventCodes: () => {
        const dictionaries = get().dictionaries;
        if (!dictionaries?.events) return [];
        return dictionaries.events.map((e) => e.eventID);
    },
});
