'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import StickyChartControls from './StickyChartControls';
import type { DateRangeFilter } from '@/lib/dataProcessing';
import type { DateRangeOption } from './DateRangeFilter';

type SectionType = 'usage' | 'errors' | 'response_times';

interface StatisticsHeaderProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  selectedRange: DateRangeOption;
  dateRange: DateRangeFilter;
  onRangeChange: (range: DateRangeOption) => void;
  onDateRangeChange: (range: DateRangeFilter) => void;
  availableDataRange?: DateRangeFilter | null;
  headerRef?: React.RefObject<HTMLDivElement | null>;
  showStickyControls?: boolean;
}

export default function StatisticsHeader({
  activeSection,
  onSectionChange,
  selectedRange,
  dateRange,
  onRangeChange,
  onDateRangeChange,
  availableDataRange,
  headerRef,
  showStickyControls = false,
}: StatisticsHeaderProps) {
  const { t } = useLocalization();

  // Style objects for better maintainability
  const styles = {
    // Header with gradient background
    headerGradient: "w-full h-36 bg-gradient-to-b from-white/50 to-emerald-100/50",
    headerContainer: "w-full max-w-[1440px] mx-auto px-10 lg:px-8 md:px-6 sm:px-4 h-full flex flex-col lg:flex-row justify-start items-start lg:items-center gap-4 lg:gap-8 py-4 lg:py-0",
    titleContainer: "w-full lg:w-[707px] justify-center",
    title: "text-[var(--color-text)] text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight lg:leading-10",
    controlsContainer: "w-full lg:w-[651px] flex justify-start lg:justify-end items-center",
    
    // Description section with solid background
    descriptionSection: "w-full bg-emerald-100/50",
    descriptionContainer: "w-full max-w-[1440px] mx-auto px-10 lg:px-8 md:px-6 sm:px-4",
    descriptionContent: "inline-flex flex-col justify-center items-start gap-2.5 py-4",
    description: "w-full lg:w-[900px] justify-center text-[var(--color-text)] text-base sm:text-lg font-medium leading-normal",
    infoLink: "pr-6 py-3 inline-flex justify-center items-center gap-2 text-[var(--color-secondary-action)] text-sm sm:text-base font-medium leading-normal hover:text-[var(--color-primary)] transition-colors",
    
    // Sticky controls placeholder
    stickySection: "w-full bg-emerald-100/50",
    stickyContainer: "w-full max-w-[1440px] mx-auto px-10 lg:px-8 md:px-6 sm:px-4",
  };

  return (
    <>
      {/* Header Section with Gradient */}
      <div ref={headerRef} className={styles.headerGradient}>
        <div className={styles.headerContainer}>
          {/* Page Title */}
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>
              {t("statistics.pageTitle")}
            </h1>
          </div>
          
          {/* Inline Date Controls */}
          <div className={styles.controlsContainer}>
            <StickyChartControls
              activeSection={activeSection}
              onSectionChange={onSectionChange}
              selectedRange={selectedRange}
              dateRange={dateRange}
              onRangeChange={onRangeChange}
              onDateRangeChange={onDateRangeChange}
              availableDataRange={availableDataRange}
              inlineMode={true}
              displaySectionSelect={false}
              displayDateSelect={true}
            />
          </div>
        </div>
      </div>

      {/* Description Section - Solid emerald background */}
      <div className={styles.descriptionSection}>
        <div className={styles.descriptionContainer}>
          <div className={styles.descriptionContent}>
            <p className={styles.description}>
              {t("statistics.pageDescription")}
            </p>
            <a 
              href="#" 
              className={styles.infoLink}
            >
              {t("navigation.moreInfo")}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Sticky Controls Placeholder */}
      {!showStickyControls ? (
        <div className="bg-emerald-50 border-b border-[var(--color-separator)]">
          <div className="w-full max-w-[1440px] mx-auto px-10 lg:px-8 md:px-6 sm:px-4">
            {/* Invisible placeholder to maintain height */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 opacity-0 pointer-events-none py-2">
              <div className="sticky-controls-row-section">
                <div className="space-y-1">
                  <label className="form-label">Placeholder</label>
                  <div className="flex outline-1 outline-offset-[-1px] outline-slate-500">
                    <button className="px-3 py-1.5 text-xs font-medium">Placeholder</button>
                  </div>
                </div>
              </div>
              <div className="sticky-controls-row-date">
                <div className="h-16">Placeholder</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Actual Sticky Controls */
        <StickyChartControls
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          selectedRange={selectedRange}
          dateRange={dateRange}
          onRangeChange={onRangeChange}
          onDateRangeChange={onDateRangeChange}
          availableDataRange={availableDataRange}
          inlineMode={false}
          displaySectionSelect={true}
          displayDateSelect={true}
        />
      )}
    </>
  );
}
