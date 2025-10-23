'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/utils/cn';
import { useUsageStore, useDictionaryStore } from '@/lib/stores';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/utils/dataProcessing';
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
  // selectedProcess, selectedChannel, selectedRole - reserved for future use
  onProcessChange,
  onChannelChange,
  onRoleChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const { t } = useLocalization();
  
  // Get data from stores
  const usageStore = useUsageStore();
  const dictionaryStore = useDictionaryStore();
  
  // Get filter state from store
  const filters = usageStore.filters;
  
  // Handle filter changes - update both store and notify parent
  const handleProcessChange = (value: string) => {
    usageStore.setFilter('processGroup', value);
    onProcessChange?.(value);
  };
  
  const handleChannelChange = (value: string) => {
    usageStore.setFilter('channel', value);
    onChannelChange?.(value);
  };
  
  const handleRoleChange = (value: string) => {
    usageStore.setFilter('marketRole', value);
    onRoleChange?.(value);
  };
  
  const handleClearFilters = () => {
    usageStore.clearFilters();
    onClearFilters();
  };
  
  // Check if there are active filters in the store
  const hasStoreFilters = filters.processGroup !== 'all' || filters.channel !== 'all' || filters.marketRole !== 'all';
  
  // Get available options for filters with date range awareness
  // These return objects with { value, disabled } properties
  const processGroupOptions = usageStore.getProcessGroupOptions(dateRange).sort((a, b) => {
    // Extract numeric part from DH-NNN format
    const isDH_A = a.value.startsWith('DH-');
    const isDH_B = b.value.startsWith('DH-');
    
    // DH processes should come before others
    if (isDH_A && !isDH_B) return -1;
    if (!isDH_A && isDH_B) return 1;
    
    // If both are DH processes, sort by numeric part
    if (isDH_A && isDH_B) {
      const getNumericPart = (str: string) => {
        const match = str.match(/DH-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNumericPart(a.value) - getNumericPart(b.value);
    }
    
    // Otherwise sort alphabetically
    return a.value.localeCompare(b.value);
  });
  
  const channelOptions = usageStore.getChannelOptions(dateRange).sort((a, b) => {
    const descA = dictionaryStore.getChannelDescription(a.value);
    const descB = dictionaryStore.getChannelDescription(b.value);
    return descA.localeCompare(descB);
  });
  
  const marketRoleOptions = usageStore.getMarketRoleOptions(dateRange).sort((a, b) => {
    const nameA = dictionaryStore.getMarketRoleDescription(a.value);
    const nameB = dictionaryStore.getMarketRoleDescription(b.value);
    return nameA.localeCompare(nameB);
  });

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
        <h4 className="text-[var(--color-text)] text-base font-medium leading-normal">
          {t('statistics.controls.filters')}
        </h4>
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
            value={filters.processGroup}
            onChange={(e) => handleProcessChange(e.target.value)}
            className={cn(styles.select, "h-[34px] w-full")}
          >
            <option value="all">{t('common.all')}</option>
            {processGroupOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className={option.disabled ? "text-slate-400" : ""}
              >
                {option.value}
              </option>
            ))}
          </select>
        </FieldGroup>

        {/* Channel dropdown */}
        <FieldGroup label={t('statistics.filters.channel')} className="flex-1 min-w-[12rem]">
          <select
            value={filters.channel}
            onChange={(e) => handleChannelChange(e.target.value)}
            className={cn(styles.select, "h-[34px] w-full")}
          >
            <option value="all">{t('common.all')}</option>
            {channelOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className={option.disabled ? "text-slate-400" : ""}
              >
                {dictionaryStore.getChannelDescription(option.value)} ({option.value})
              </option>
            ))}
          </select>
        </FieldGroup>

        {/* Role dropdown */}
        <FieldGroup label={t('statistics.filters.marketRole')} className="flex-1 min-w-[12rem]">
          <select
            value={filters.marketRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className={cn(styles.select, "h-[34px] w-full")}
          >
            <option value="all">{t('common.all')}</option>
            {marketRoleOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className={option.disabled ? "text-slate-400" : ""}
              >
                {dictionaryStore.getMarketRoleDescription(option.value)} ({option.value})
              </option>
            ))}
          </select>
        </FieldGroup>

        {/* Clear filters button */}
        <button
          onClick={handleClearFilters}
          disabled={!hasStoreFilters && !hasActiveFilters}
          className={cn(
            "px-4 bg-white outline-2 outline-offset-[-2px] transition-colors text-sm font-medium leading-none h-[34px] flex-shrink-0",
            hasStoreFilters || hasActiveFilters
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

