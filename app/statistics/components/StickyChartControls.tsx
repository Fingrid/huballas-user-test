'use client';

import { cn } from '@/lib/cn';
import { useLocalization } from '@/lib/stores/localization.store';
import DateRangeFilter, { type DateRangeOption } from './DateRangeFilter';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/dataProcessing';

type SectionType = 'usage' | 'errors' | 'response_times';

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
}: StickyChartControlsProps) {
  const { t } = useLocalization();

  // Style objects matching concept design
  const styles = {
    inputGroup: "inline-flex flex-col justify-start items-start gap-1",
    label: "self-stretch justify-center text-slate-600 text-base font-normal leading-none",
    select: "self-stretch px-4 py-2 bg-white outline-1 outline-offset-[-1px] outline-slate-500 inline-flex justify-start items-center gap-2 text-slate-600 text-base font-normal leading-normal",
    dateInput: "self-stretch px-4 py-2 bg-white outline-1 outline-offset-[-1px] outline-slate-500 text-slate-600 text-base font-normal leading-normal",
    dateSeparator: "justify-center text-slate-600 text-2xl font-normal leading-normal self-end pb-2",
  };

  // Section selector component
  const SectionSelector = () => (
    <div className="space-y-1">
      <label className="form-label">
        {t('statistics.controls.statistics')}
      </label>
      <div className="flex outline-1 outline-offset-[-1px] outline-slate-500 overflow-hidden">
        <button
          onClick={() => onSectionChange('usage')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            activeSection === 'usage'
              ? "bg-[var(--color-text)] text-white font-semibold"
              : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
          )}
        >
          {t('statistics.sections.usage')}
        </button>
        <button
          onClick={() => onSectionChange('errors')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--color-separator)]",
            activeSection === 'errors'
              ? "bg-[var(--color-text)] text-white font-semibold"
              : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
          )}
        >
          {t('statistics.sections.errors')}
        </button>
        <button
          onClick={() => onSectionChange('response_times')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--color-separator)]",
            activeSection === 'response_times'
              ? "bg-[var(--color-text)] text-white font-semibold"
              : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
          )}
        >
          {t('monthlyReports.responseTimes')}
        </button>
      </div>
    </div>
  );

  // Date controls component
  const DateControls = () => (
    <>
      {/* Quick select dropdown */}
      <div className={cn(styles.inputGroup, "w-48")}>
        <label className={styles.label}>
          {t('statistics.controls.quickSelect')}
        </label>
        <select
          value={selectedRange}
          onChange={(e) => onRangeChange(e.target.value as DateRangeOption)}
          className={styles.select}
        >
          <option value="30days">30 {t('common.days')}</option>
          <option value="90days">90 {t('common.days')}</option>
          <option value="year">1 {t('common.year')}</option>
          <option value="custom">{t('statistics.controls.custom')}</option>
        </select>
      </div>
      
      {/* Start date */}
      <div className={cn(styles.inputGroup, "w-36")}>
        <label className={styles.label}>
          {t('statistics.controls.startDate')}
        </label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
          className={styles.dateInput}
        />
      </div>
      
      {/* Separator */}
      <div className={styles.dateSeparator}>
        -
      </div>
      
      {/* End date */}
      <div className={cn(styles.inputGroup, "w-36")}>
        <label className={styles.label}>
          {t('statistics.controls.endDate')}
        </label>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
          className={styles.dateInput}
        />
      </div>
    </>
  );

  // Inline mode: 2-row layout for header (section on top, date on bottom)
  if (inlineMode) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {displaySectionSelect && (
          <div className="flex justify-end">
            <SectionSelector />
          </div>
        )}
        {displayDateSelect && (
          <div className="flex justify-end items-center gap-2 overflow-x-auto">
            <DateControls />
          </div>
        )}
      </div>
    );
  }

  // Sticky mode: both controls displayed on same row
  return (
    <div className="sticky top-0 z-50 bg-emerald-50 border-b border-[var(--color-separator)]">
      <div className="w-full max-w-[1440px] mx-auto px-10 lg:px-8 md:px-6 sm:px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          {/* Section Toggle */}
          {displaySectionSelect && (
            <div className="sticky-controls-row-section">
              <SectionSelector />
            </div>
          )}

          {/* Date Range Filter */}
          {displayDateSelect && (
            <div className="sticky-controls-row-date overflow-x-auto w-full sm:w-auto">
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
      </div>
    </div>
  );
}