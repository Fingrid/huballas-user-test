'use client';

import { cn } from '@/lib/utils/cn';
import { useLocalization } from '@/lib/stores/localization.store';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/utils/dataProcessing';
import FieldGroup from './FieldGroup';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';

interface DateRangeFilterProps {
  selectedRange: DateRangeOption;
  dateRange: DateRangeFilterType;
  onRangeChange: (range: DateRangeOption) => void;
  onDateRangeChange: (dateRange: DateRangeFilterType) => void;
  availableDataRange?: DateRangeFilterType | null; // Allow null values
}

export default function DateRangeFilter({ 
  selectedRange, 
  dateRange, 
  onRangeChange, 
  onDateRangeChange,
  availableDataRange
}: DateRangeFilterProps) {
  const { t } = useLocalization();

  // Shared style objects matching FilterBar pattern
  const styles = {
    select: "self-stretch px-4 py-2 bg-white outline-1 outline-offset-[-1px] outline-slate-500 inline-flex justify-start items-center gap-2 text-slate-600 text-base font-normal leading-normal",
    dateInput: "self-stretch px-4 py-2 bg-white outline-1 outline-offset-[-1px] outline-slate-500 text-slate-600 text-base font-normal leading-normal",
  };

  const calculateDateRange = (days: number) => {
    // Use the last available data date as the end date, or fall back to current date
    const endDate = availableDataRange ? new Date(availableDataRange.endDate) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);
    
    // Ensure we don't go before the earliest available data
    const calculatedStartDate = availableDataRange && startDate < new Date(availableDataRange.startDate)
      ? availableDataRange.startDate
      : startDate.toISOString().split('T')[0];
    
    return {
      startDate: calculatedStartDate,
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const handleRangeChange = (range: DateRangeOption) => {
    onRangeChange(range);
    
    // Auto-populate dates for preset ranges
    if (range !== 'custom') {
      const daysMap: Record<Exclude<DateRangeOption, 'custom'>, number> = {
        '30days': 30,
        '60days': 60,
        '90days': 90,
        'year': 365
      };
      
      const newDateRange = calculateDateRange(daysMap[range]);
      onDateRangeChange(newDateRange);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newDateRange = {
      ...dateRange,
      [field]: value
    };
    
    onDateRangeChange(newDateRange);
    
    // Check if the new date range matches any preset, if not switch to custom
    let matchesPreset = false;
    
    // Check 30, 60, 90, 365 day presets
    for (const [presetName, days] of Object.entries({ '30days': 30, '60days': 60, '90days': 90, 'year': 365 })) {
      const presetRange = calculateDateRange(days);
      if (newDateRange.startDate === presetRange.startDate && newDateRange.endDate === presetRange.endDate) {
        if (selectedRange !== presetName as DateRangeOption) {
          onRangeChange(presetName as DateRangeOption);
        }
        matchesPreset = true;
        break;
      }
    }
    
    // If doesn't match any preset, switch to custom
    if (!matchesPreset && selectedRange !== 'custom') {
      onRangeChange('custom');
    }
  };

  const rangeOptions = [
    { value: '30days' as const, label: `30 ${t('common.days')}` },
    { value: '90days' as const, label: `90 ${t('common.days')}` },
    { value: 'year' as const, label: `1 ${t('common.year')}` },
    { value: 'custom' as const, label: t('statistics.controls.custom') }
  ];

  return (
    <div className="flex items-end gap-2">
      {/* Quick select dropdown */}
      <FieldGroup label={t('statistics.controls.quickSelect')} className="w-48">
        <select
          value={selectedRange}
          onChange={(e) => handleRangeChange(e.target.value as DateRangeOption)}
          className={cn(styles.select, "h-[34px] w-full")}
        >
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldGroup>

      {/* Start Date */}
      <FieldGroup label={t('statistics.controls.startDate')} className="w-36">
        <input
          type="date"
          value={dateRange.startDate}
          min={availableDataRange?.startDate}
          max={availableDataRange?.endDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          className={cn(styles.dateInput, "h-[34px] w-full")}
        />
      </FieldGroup>

      {/* Separator */}
      <div className="flex items-center pb-[1px] text-slate-600 text-2xl font-normal leading-normal">
        -
      </div>

      {/* End Date */}
      <FieldGroup label={t('statistics.controls.endDate')} className="w-36">
        <input
          type="date"
          value={dateRange.endDate}
          min={availableDataRange?.startDate}
          max={availableDataRange?.endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          className={cn(styles.dateInput, "h-[34px] w-full")}
        />
      </FieldGroup>
    </div>
  );
}