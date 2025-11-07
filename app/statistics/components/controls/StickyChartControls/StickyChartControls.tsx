'use client';

import { cn } from '@/lib/utils/cn';
import { useLocalization } from '@/lib/stores/localization.store';
import { useEffect, useRef, useState } from 'react';
import DateRangeFilter from '../DateRangeFilter';
import FilterBar from '../FilterBar';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/utils/dataProcessing';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';
import styles from './StickyChartControls.module.css';

type SectionType = 'usage' | 'errors' | 'response_times';
type StackingType = 'all' | 'channel' | 'process_group' | 'marketRoleCode';

// Section selector component - extracted to prevent recreation on each render
interface SectionSelectorProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  t: (key: string) => string;
}

function SectionSelector({ activeSection, onSectionChange, t }: SectionSelectorProps) {
  return (
    <div className={cn(styles.sectionSelector)}>
      <div className={cn(styles.sectionButtons)}>
        <button
          onClick={() => onSectionChange('usage')}
          className={cn(
            styles.sectionButton,
            activeSection === 'usage'
              ? styles.sectionButtonActive
              : styles.sectionButtonInactive
          )}
        >
          {t('statistics.sections.usage')}
        </button>
        <button
          onClick={() => onSectionChange('errors')}
          className={cn(
            styles.sectionButton,
            styles.sectionButtonSeparator,
            activeSection === 'errors'
              ? styles.sectionButtonActive
              : styles.sectionButtonInactive
          )}
        >
          {t('statistics.sections.errors')}
        </button>
        <button
          onClick={() => onSectionChange('response_times')}
          className={cn(
            styles.sectionButton,
            styles.sectionButtonSeparator,
            activeSection === 'response_times'
              ? styles.sectionButtonActive
              : styles.sectionButtonInactive
          )}
        >
          {t('monthlyReports.responseTimes')}
        </button>
      </div>
    </div>
  );
}

interface StickyChartControlsProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  selectedRange: DateRangeOption;
  dateRange: DateRangeFilterType;
  onRangeChange: (range: DateRangeOption) => void;
  onDateRangeChange: (range: DateRangeFilterType) => void;
  availableDataRange?: DateRangeFilterType | null;
  inlineMode?: boolean; // When true, renders in 2 rows for header
  displaySectionSelect?: boolean; // Control section selector visibility
  displayDateSelect?: boolean; // Control date selector visibility
  
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

export default function StickyChartControls({
  activeSection,
  onSectionChange,
  selectedRange,
  dateRange,
  onRangeChange,
  onDateRangeChange,
  availableDataRange,
  inlineMode = false,
  displaySectionSelect = true,
  displayDateSelect = true,
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
}: StickyChartControlsProps) {
  const { t } = useLocalization();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!containerRef.current || inlineMode) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the element is stuck, it will be intersecting but at the top boundary
        setIsStuck(entry.intersectionRatio < 1);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [inlineMode]);

  // Inline mode: 2-row layout for header (section on top, date on bottom)
  if (inlineMode) {
    return (
      <div className={cn(styles.inlineContainer)}>
        {displaySectionSelect && (
          <div className={cn(styles.inlineSection)}>
            <SectionSelector activeSection={activeSection} onSectionChange={onSectionChange} t={t} />
          </div>
        )}
        {displayDateSelect && (
          <div className={cn(styles.inlineDate)}>
            <DateRangeFilter
              selectedRange={selectedRange}
              dateRange={dateRange}
              onRangeChange={onRangeChange}
              onDateRangeChange={onDateRangeChange}
              availableDataRange={availableDataRange}
            />
          </div>
        )}
      </div>
    );
  }

  // Sticky mode: both controls displayed on same row
  return (
    <div ref={containerRef} className={cn(styles.container, isStuck && styles.stuck)}>
      <div className={cn(styles.wrapper)}>
        <div className={cn(styles.content)}>
          {/* First row: Section Toggle and Date Range Filter */}
          <div className={cn(styles.mainRow)}>
            {/* Section Toggle */}
            {displaySectionSelect && (
              <div className={cn(styles.rowSection)}>
                <SectionSelector activeSection={activeSection} onSectionChange={onSectionChange} t={t} />
              </div>
            )}

            {/* Date Range Filter - Only show if not displaying filters (filters include date controls) */}
            {displayDateSelect && !displayFilters && (
              <div className={cn(styles.dateContainer)}>
                <DateRangeFilter
                  selectedRange={selectedRange}
                  dateRange={dateRange}
                  onRangeChange={onRangeChange}
                  onDateRangeChange={onDateRangeChange}
                  availableDataRange={availableDataRange}
                />
              </div>
            )}
          </div>

          {/* Filter Bar (Usage page only) - includes date controls */}
          {displayFilters && stackingType && onStackingChange && onClearFilters !== undefined && hasActiveFilters !== undefined && (
            <FilterBar
              stackingType={stackingType}
              onStackingChange={onStackingChange}
              selectedRange={selectedRange}
              dateRange={dateRange}
              onRangeChange={onRangeChange}
              onDateRangeChange={onDateRangeChange}
              availableDataRange={availableDataRange}
              selectedProcess={selectedProcess}
              selectedChannel={selectedChannel}
              selectedRole={selectedRole}
              onProcessChange={onProcessChange}
              onChannelChange={onChannelChange}
              onRoleChange={onRoleChange}
              onClearFilters={onClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          )}
        </div>
      </div>
    </div>
  );
}