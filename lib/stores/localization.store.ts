import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Supported locales
export type Locale = 'fi' | 'en';

// Translation interface - represents the structure of our translation files
interface Translations {
  navigation: {
    annualStatistics: string;
    monthlyReports: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    year: string;
    month: string;
    componentPlaceholder: string;
    noDataAvailable: string;
    loadingData: string;
  };
  annualStatistics: {
    title: string;
    datahubTitle: string;
    datahubDescription: string;
    hubAllasDescription: string;
    usageTrends: string;
    monthlyComparison: string;
    marketRoleDistribution: string;
    channelAnalysis: string;
    processGroupBreakdown: string;
    detailedBreakdown: string;
    peakUsageAnalysis: string;
    yearOverYearGrowth: string;
    performanceMetrics: string;
    errorLoadingData: string;
    noUsageData: string;
  };
  monthlyReports: {
    title: string;
    loadingMonthlyReports: string;
    errorLoadingReports: string;
    selectMonth: string;
    selectYear: string;
    events: string;
    responseTimes: string;
    errors: string;
    systemErrors: string;
    validationErrors: string;
  };
  charts: {
    noDataMessage: string;
    loadingChart: string;
    errorLoadingChart: string;
  };
}

// Store interface
interface LocalizationStore {
  locale: Locale;
  translations: Translations | null;
  isLoading: boolean;
  error: string | null;
  setLocale: (locale: Locale) => Promise<void>;
  getTranslation: (key: string) => string;
  t: (key: string) => string; // Alias for getTranslation
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Load translations from JSON file
async function loadTranslations(locale: Locale): Promise<Translations | null> {
  try {
    const response = await fetch(`/locales/${locale}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${locale}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}, using fallback:`, error);
    return null;
  }
}

// Create the store
export const useLocalization = create<LocalizationStore>()(
  persist(
    (set, get) => ({
      locale: 'fi', // Default to Finnish
      translations: null,
      isLoading: false,
      error: null,

      setLocale: async (locale: Locale) => {
        set({ isLoading: true, error: null });
        
        try {
          const translations = await loadTranslations(locale);
          set({ 
            locale, 
            translations, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ 
            isLoading: false, 
            error: errorMessage,
            translations: null 
          });
        }
      },

      getTranslation: (key: string) => {
        const { translations } = get();
        const currentTranslations = translations || null;
        return getNestedValue(currentTranslations, key) || key;
      },

      t: (key: string) => get().getTranslation(key),
    }),
    {
      name: 'huballas-localization', // localStorage key
      partialize: (state) => ({ locale: state.locale }), // Only persist locale
    }
  )
);

// Initialize translations on first load
if (typeof window !== 'undefined') {
  const store = useLocalization.getState();
  if (!store.translations) {
    store.setLocale(store.locale);
  }
}

// React hook for easier component usage
export function useTranslation() {
  const { getTranslation, t, locale, setLocale, isLoading, error } = useLocalization();
  
  return {
    t,
    getTranslation,
    locale,
    setLocale,
    isLoading,
    error,
  };
}