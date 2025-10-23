'use client';

import { cn } from '@/lib/utils/cn';
import { useLocalization } from '@/lib/stores/localization.store';
import DateRangeFilter from './DateRangeFilter';
import FilterBar from './FilterBar';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/utils/dataProcessing';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';

type SectionType = 'usage' | 'errors' | 'response_times';
type StackingType = 'all' | 'channel' | 'process_group' | 'marketRoleCode';

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

  // Section selector component
  const SectionSelector = () => (
    <div className="section-selector-container">
      <label className="form-label">
        {t('statistics.controls.statistics')}
      </label>
      <div className="section-selector-buttons">
        <button
          onClick={() => onSectionChange('usage')}
          className={cn(
            "section-selector-button",
            activeSection === 'usage'
              ? "section-selector-button-active"
              : "section-selector-button-inactive"
          )}
        >
          {t('statistics.sections.usage')}
        </button>
        <button
          onClick={() => onSectionChange('errors')}
          className={cn(
            "section-selector-button section-selector-button-separator",
            activeSection === 'errors'
              ? "section-selector-button-active"
              : "section-selector-button-inactive"
          )}
        >
          {t('statistics.sections.errors')}
        </button>
        <button
          onClick={() => onSectionChange('response_times')}
          className={cn(
            "section-selector-button section-selector-button-separator",
            activeSection === 'response_times'
              ? "section-selector-button-active"
              : "section-selector-button-inactive"
          )}
        >
          {t('monthlyReports.responseTimes')}
        </button>
      </div>
    </div>
  );

  // Inline mode: 2-row layout for header (section on top, date on bottom)
  if (inlineMode) {
    return (
      <div className="sticky-controls-inline-container">
        {displaySectionSelect && (
          <div className="sticky-controls-inline-section">
            <SectionSelector />
          </div>
        )}
        {displayDateSelect && (
          <div className="sticky-controls-inline-date">
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
    <div className="sticky-controls-container">
      <div className="sticky-controls-wrapper">
        <div className="sticky-controls-content">
          {/* First row: Section Toggle and Date Range Filter */}
          <div className="sticky-controls-main-row">
            {/* Section Toggle */}
            {displaySectionSelect && (
              <div className="sticky-controls-row-section">
                <SectionSelector />
              </div>
            )}

            {/* Date Range Filter - Only show if not displaying filters (filters include date controls) */}
            {displayDateSelect && !displayFilters && (
              <div className="sticky-controls-date-container">
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