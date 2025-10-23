'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/utils/cn';
import { useUsageStore, useDictionaryStore } from '@/lib/stores';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/utils/dataProcessing';
import FieldGroup from './FieldGroup';
import DateRangeFilter from './DateRangeFilter';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';
import Select from '@/app/_components/ui/Select';

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
  const handleProcessChange = (value: string | string[]) => {
    const arrayValue = Array.isArray(value) ? value : [value];
    usageStore.setFilter('processGroup', arrayValue);
    // For backward compatibility with parent, send first value or 'all'
    onProcessChange?.(arrayValue.length > 0 ? arrayValue[0] : 'all');
  };
  
  const handleChannelChange = (value: string | string[]) => {
    const arrayValue = Array.isArray(value) ? value : [value];
    usageStore.setFilter('channel', arrayValue);
    onChannelChange?.(arrayValue.length > 0 ? arrayValue[0] : 'all');
  };
  
  const handleRoleChange = (value: string | string[]) => {
    const arrayValue = Array.isArray(value) ? value : [value];
    usageStore.setFilter('marketRole', arrayValue);
    onRoleChange?.(arrayValue.length > 0 ? arrayValue[0] : 'all');
  };
  
  const handleClearFilters = () => {
    usageStore.clearFilters();
    onClearFilters();
  };
  
  // Check if there are active filters in the store
  const hasStoreFilters = filters.processGroup.length > 0 || filters.channel.length > 0 || filters.marketRole.length > 0;
  
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
  }).map(option => ({
    value: option.value,
    label: option.value,
    disabled: option.disabled
  }));
  
  const channelOptions = usageStore.getChannelOptions(dateRange).sort((a, b) => {
    const descA = dictionaryStore.getChannelDescription(a.value);
    const descB = dictionaryStore.getChannelDescription(b.value);
    return descA.localeCompare(descB);
  }).map(option => ({
    value: option.value,
    label: `${dictionaryStore.getChannelDescription(option.value)} (${option.value})`,
    disabled: option.disabled
  }));
  
  const marketRoleOptions = usageStore.getMarketRoleOptions(dateRange).sort((a, b) => {
    const nameA = dictionaryStore.getMarketRoleDescription(a.value);
    const nameB = dictionaryStore.getMarketRoleDescription(b.value);
    return nameA.localeCompare(nameB);
  }).map(option => ({
    value: option.value,
    label: `${dictionaryStore.getMarketRoleDescription(option.value)} (${option.value})`,
    disabled: option.disabled
  }));

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
        <div className="flex-1 min-w-[12rem]">
          <Select
            label={t('statistics.filters.mainProcess')}
            options={processGroupOptions}
            value={filters.processGroup}
            onValueChange={handleProcessChange}
            placeholder={t('common.all')}
            wrapperClassName="w-full"
            selectClassName="h-[34px] w-full"
            selectionMode="multiple"
          />
        </div>

        {/* Channel dropdown */}
        <div className="flex-1 min-w-[12rem]">
          <Select
            label={t('statistics.filters.channel')}
            options={channelOptions}
            value={filters.channel}
            onValueChange={handleChannelChange}
            placeholder={t('common.all')}
            wrapperClassName="w-full"
            selectClassName="h-[34px] w-full"
            selectionMode="multiple"
            displayValuesInMultiSelect={true}
          />
        </div>

        {/* Role dropdown */}
        <div className="flex-1 min-w-[12rem]">
          <Select
            label={t('statistics.filters.marketRole')}
            options={marketRoleOptions}
            value={filters.marketRole}
            onValueChange={handleRoleChange}
            placeholder={t('common.all')}
            wrapperClassName="w-full"
            selectClassName="h-[34px] w-full"
            selectionMode="multiple"
            displayValuesInMultiSelect={true}
          />
        </div>

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

