'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/utils/cn';
import CallToActionLink from '@/app/_components/ui/CallToActionLink';
import Breadcrumb from '@/app/_components/ui/Breadcrumb';
import StickyChartControls from '../controls/StickyChartControls';
import type { DateRangeFilter } from '@/lib/utils/dataProcessing';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';

type SectionType = 'usage' | 'errors' | 'response_times';
type StackingType = 'all' | 'channel' | 'process_group' | 'marketRoleCode';

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
  alwaysShowStickyControls?: boolean; // Always show sticky controls, don't use intersection observer
  hideInlineDateControls?: boolean; // Hide date controls in header
  className?: string;
  
  // Filter bar props (optional - only for usage page)
  displayFilters?: boolean;
  stackingType?: StackingType;
  onStackingChange?: (type: StackingType) => void;
  selectedProcess?: string;
  selectedChannel?: string;
  selectedRole?: string;
  onProcessChange?: (value: string) => void;
  onChannelChange?: (value: string) => void;
  onRoleChange?: (value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
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
  alwaysShowStickyControls = false,
  hideInlineDateControls = false,
  className,
  displayFilters = false,
  stackingType,
  onStackingChange,
  selectedProcess,
  selectedChannel,
  selectedRole,
  onProcessChange,
  onChannelChange,
  onRoleChange,
  onClearFilters,
  hasActiveFilters,
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
    stickySection: 'stats-sticky-section',
    stickyContainer: 'stats-sticky-container',
  };

  return (
    <>
      {/* Header Section with Gradient */}
      <div ref={headerRef} className={cn(styles.headerGradient, className)}>
        <div className={cn(styles.headerContainer)}>
          {/* Page Title */}
          <div className={cn(styles.titleContainer)}>
            <Breadcrumb currentPage={t("statistics.pageTitle")} />
            <h1 className={cn(styles.title)}>
              {t("statistics.pageTitle")}
            </h1>
          </div>
          
          {/* Inline Date Controls - Hidden if hideInlineDateControls is true */}
          {!hideInlineDateControls && (
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
          )}
        </div>
      </div>

      {/* Description Section - Solid emerald background */}
      <div className={cn(styles.descriptionSection)}>
        <div className={cn(styles.descriptionContainer)}>
          <div className={cn(styles.descriptionContent)}>
            <p className={cn(styles.description)}>
              {t("statistics.pageDescription")}
            </p>
            <CallToActionLink href="#">
              {t("navigation.moreInfo")}
            </CallToActionLink>
          </div>
        </div>
      </div>

      {/* Sticky Controls - Always show if alwaysShowStickyControls is true, otherwise based on showStickyControls */}
      {alwaysShowStickyControls || showStickyControls ? (
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
          displaySectionSelect={!alwaysShowStickyControls} // Hide section select on usage page
          displayDateSelect={true}
          displayFilters={displayFilters}
          stackingType={stackingType}
          onStackingChange={onStackingChange}
          selectedProcess={selectedProcess}
          selectedChannel={selectedChannel}
          selectedRole={selectedRole}
          onProcessChange={onProcessChange}
          onChannelChange={onChannelChange}
          onRoleChange={onRoleChange}
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        /* Invisible placeholder to maintain height */
        <div className={cn('bg-[var(--color-background-level-4)] border-b border-[var(--color-separator)]')}>
          <div className={cn(styles.stickyContainer)}>
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
      )}
    </>
  );
}
