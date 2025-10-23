import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import translation files directly
import fiTranslations from '../../public/locales/fi.json';
import enTranslations from '../../public/locales/en.json';

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
  translations: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  setLocale: (locale: Locale) => void;
  getTranslation: (key: string) => string;
  t: (key: string) => string; // Alias for getTranslation
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj as unknown) as string || path;
}

// Get translations for a specific locale
function getTranslations(locale: Locale): Record<string, unknown> {
  switch (locale) {
    case 'fi':
      return fiTranslations as Record<string, unknown>;
    case 'en':
      return enTranslations as Record<string, unknown>;
    default:
      return fiTranslations; // Fallback to Finnish
  }
}

// Create the store
export const useLocalization = create<LocalizationStore>()(
  persist(
    (set, get) => ({
      locale: 'fi', // Default to Finnish
      translations: getTranslations('fi'), // Initialize with Finnish translations
      isLoading: false,
      error: null,

      setLocale: (locale: Locale) => {
        try {
          const translations = getTranslations(locale);
          set({ 
            locale, 
            translations, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          console.error(`Failed to load translations for ${locale}:`, error);
          set({ 
            error: `Failed to load translations for ${locale}`, 
            isLoading: false 
          });
        }
      },

      getTranslation: (key: string) => {
        const { translations } = get();
        return getNestedValue(translations, key) || key;
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