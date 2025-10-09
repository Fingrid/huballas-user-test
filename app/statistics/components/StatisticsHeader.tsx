'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/cn';
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
  className?: string;
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
  className,
}: StatisticsHeaderProps) {
  const { t } = useLocalization();

  // Style objects for better maintainability and customization
  const styles = {
    headerGradient: 'stats-header-gradient',
    headerContainer: 'stats-header-container',
    titleContainer: 'stats-header-title-container',
    title: 'stats-header-title',
    controlsContainer: 'stats-header-controls-container',
    descriptionSection: 'stats-description-section',
    descriptionContainer: 'stats-description-container',
    descriptionContent: 'stats-description-content',
    description: 'stats-description-text',
    infoLink: 'stats-info-link',
    stickySection: 'stats-sticky-section',
    stickyContainer: 'stats-sticky-container',
    infoIcon: 'w-6 h-6',
  };

  return (
    <>
      {/* Header Section with Gradient */}
      <div ref={headerRef} className={cn(styles.headerGradient, className)}>
        <div className={cn(styles.headerContainer)}>
          {/* Page Title */}
          <div className={cn(styles.titleContainer)}>
            <h1 className={cn(styles.title)}>
              {t("statistics.pageTitle")}
            </h1>
          </div>
          
          {/* Inline Date Controls */}
          <div className={cn(styles.controlsContainer)}>
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
      <div className={cn(styles.descriptionSection)}>
        <div className={cn(styles.descriptionContainer)}>
          <div className={cn(styles.descriptionContent)}>
            <p className={cn(styles.description)}>
              {t("statistics.pageDescription")}
            </p>
            <a 
              href="#" 
              className={cn(styles.infoLink)}
            >
              {t("navigation.moreInfo")}
              <svg className={cn(styles.infoIcon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Sticky Controls Placeholder */}
      {!showStickyControls ? (
        <div className={cn('bg-emerald-50 border-b border-[var(--color-separator)]')}>
          <div className={cn(styles.stickyContainer)}>
            {/* Invisible placeholder to maintain height */}
            <div className={cn('flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 opacity-0 pointer-events-none py-2')}>
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
