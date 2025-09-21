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
}

export default function StickyChartControls({
  activeSection,
  onSectionChange,
  selectedRange,
  dateRange,
  onRangeChange,
  onDateRangeChange,
  availableDataRange,
}: StickyChartControlsProps) {
  const { t } = useLocalization();

  return (
    <div className="border-b border-[var(--color-separator)] sticky top-0 z-50" style={{ backgroundColor: 'rgb(233, 247, 247)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-end gap-4">
        {/* Section Toggle Buttons */}
        <div className="space-y-1">
          <label className="form-label">
            {t('statistics.controls.statistics')}
          </label>
          <div className="flex border border-[var(--color-separator)] rounded-[var(--border-radius-default)] overflow-hidden">
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

        <div className="h-6 w-px bg-[var(--color-separator)] mb-1"></div>

        {/* Date Range Filter Component */}
        <DateRangeFilter
          selectedRange={selectedRange}
          dateRange={dateRange}
          onRangeChange={onRangeChange}
          onDateRangeChange={onDateRangeChange}
          availableDataRange={availableDataRange}
        />
        </div>
      </div>
    </div>
  );
}