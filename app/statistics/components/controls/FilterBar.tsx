'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/cn';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/dataProcessing';
import FieldGroup from './FieldGroup';
import DateRangeFilter from './DateRangeFilter';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';

type StackingType = 'all' | 'channel' | 'process_group' | 'marketRoleCode';

interface FilterBarProps {
  // Grouping controls
  stackingType: StackingType;
  onStackingChange: (type: StackingType) => void;
  
  // Date range controls
  selectedRange: DateRangeOption;
  dateRange: DateRangeFilterType;
  onRangeChange: (range: DateRangeOption) => void;
  onDateRangeChange: (range: DateRangeFilterType) => void;
  availableDataRange?: DateRangeFilterType | null;
  
  // Dropdown selections
  selectedProcess?: string;
  selectedChannel?: string;
  selectedRole?: string;
  onProcessChange?: (value: string) => void;
  onChannelChange?: (value: string) => void;
  onRoleChange?: (value: string) => void;
  
  // Clear filters
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function FilterBar({
  stackingType,
  onStackingChange,
  selectedRange,
  dateRange,
  onRangeChange,
  onDateRangeChange,
  availableDataRange,
  selectedProcess = 'all',
  selectedChannel = 'all',
  selectedRole = 'all',
  onProcessChange,
  onChannelChange,
  onRoleChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const { t } = useLocalization();

  // Shared style objects matching StickyChartControls pattern
  const styles = {
    inputGroup: "inline-flex flex-col justify-start items-start gap-1",
    label: "control-label",
    select: "self-stretch px-4 py-2 bg-white outline-1 outline-offset-[-1px] outline-slate-500 inline-flex justify-start items-center gap-2 text-slate-600 text-base font-normal leading-normal",
    dateInput: "self-stretch px-4 py-2 bg-white outline-1 outline-offset-[-1px] outline-slate-500 text-slate-600 text-base font-normal leading-normal",
    dateSeparator: "justify-center text-slate-600 text-2xl font-normal leading-normal self-end pb-2",
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Title row */}
      <div className="flex justify-start items-center">
        <h3 className="text-[var(--color-text)] text-base font-medium leading-normal">
          {t('statistics.controls.filters')}
        </h3>
      </div>

      {/* Grouping and Date controls row */}
      <div className="flex justify-between items-end gap-8">
        {/* Grouping controls - Left aligned */}
        <FieldGroup label={t('statistics.controls.groupBy')}>
          <div className="flex outline-1 outline-offset-[-1px] outline-slate-500 overflow-hidden h-[34px]">
            <button
              onClick={() => onStackingChange('all')}
              className={cn(
                "px-3 text-xs font-medium transition-colors h-full",
                stackingType === 'all'
                  ? "bg-[var(--color-text)] text-white font-semibold"
                  : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
              )}
            >
              {t('statistics.filters.showAll')}
            </button>
            <button
              onClick={() => onStackingChange('channel')}
              className={cn(
                "px-3 text-xs font-medium transition-colors border-l border-[var(--color-separator)] h-full",
                stackingType === 'channel'
                  ? "bg-[var(--color-text)] text-white font-semibold"
                  : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
              )}
            >
              {t('statistics.grouping.channels')}
            </button>
            <button
              onClick={() => onStackingChange('process_group')}
              className={cn(
                "px-3 text-xs font-medium transition-colors border-l border-[var(--color-separator)] h-full",
                stackingType === 'process_group'
                  ? "bg-[var(--color-text)] text-white font-semibold"
                  : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
              )}
            >
              {t('statistics.grouping.processGroups')}
            </button>
            <button
              onClick={() => onStackingChange('marketRoleCode')}
              className={cn(
                "px-3 text-xs font-medium transition-colors border-l border-[var(--color-separator)] h-full",
                stackingType === 'marketRoleCode'
                  ? "bg-[var(--color-text)] text-white font-semibold"
                  : "bg-[var(--color-background-level-1)] text-[var(--color-text)] hover:bg-[var(--color-background-level-2)]"
              )}
            >
              {t('statistics.grouping.marketRoles')}
            </button>
          </div>
        </FieldGroup>

        {/* Date Range Controls - Right aligned */}
        <DateRangeFilter
          selectedRange={selectedRange}
          dateRange={dateRange}
          onRangeChange={onRangeChange}
          onDateRangeChange={onDateRangeChange}
          availableDataRange={availableDataRange}
        />
      </div>

      {/* Dropdown filters */}
      <div className="flex items-end gap-8 overflow-x-auto">
        {/* Process dropdown */}
        <FieldGroup label={t('statistics.filters.mainProcess')} className="flex-1 min-w-[12rem]">
          <select
            value={selectedProcess}
            onChange={(e) => onProcessChange?.(e.target.value)}
            className={cn(styles.select, "h-[34px] w-full")}
          >
            <option value="all">{t('common.all')}</option>
            {/* Add more options as needed */}
          </select>
        </FieldGroup>

        {/* Channel dropdown */}
        <FieldGroup label={t('statistics.filters.channel')} className="flex-1 min-w-[12rem]">
          <select
            value={selectedChannel}
            onChange={(e) => onChannelChange?.(e.target.value)}
            className={cn(styles.select, "h-[34px] w-full")}
          >
            <option value="all">{t('common.all')}</option>
            {/* Add more options as needed */}
          </select>
        </FieldGroup>

        {/* Role dropdown */}
        <FieldGroup label={t('statistics.filters.marketRole')} className="flex-1 min-w-[12rem]">
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange?.(e.target.value)}
            className={cn(styles.select, "h-[34px] w-full")}
          >
            <option value="all">{t('common.all')}</option>
            {/* Add more options as needed */}
          </select>
        </FieldGroup>

        {/* Clear filters button */}
        <button
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className={cn(
            "px-4 bg-white outline-2 outline-offset-[-2px] transition-colors text-sm font-medium leading-none h-[34px] flex-shrink-0",
            hasActiveFilters
              ? "outline outline-slate-500 text-[var(--color-text)] cursor-pointer hover:bg-[var(--color-background-level-2)]"
              : "outline outline-slate-300 text-slate-300 cursor-not-allowed"
          )}
        >
          {t('statistics.filters.clearFilters')}
        </button>
      </div>
    </div>
  );
}

