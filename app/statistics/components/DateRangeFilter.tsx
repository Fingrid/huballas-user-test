'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useLocalization } from '@/lib/stores/localization.store';
import type { DateRangeFilter as DateRangeFilterType } from '@/lib/dataProcessing';

export type DateRangeOption = '30days' | '60days' | '90days' | 'custom';

// Keep local DateRange interface for backward compatibility
interface DateRange {
  startDate: string;
  endDate: string;
}

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
      const daysMap = {
        '30days': 30,
        '60days': 60,
        '90days': 90
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
    const referenceEndDate = availableDataRange ? availableDataRange.endDate : new Date().toISOString().split('T')[0];
    
    let matchesPreset = false;
    
    // Check 30, 60, 90 day presets
    for (const [presetName, days] of Object.entries({ '30days': 30, '60days': 60, '90days': 90 })) {
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
    { value: '30days' as const, label: t('statistics.dateRange.last30Days') },
    { value: '60days' as const, label: t('statistics.dateRange.last60Days') },
    { value: '90days' as const, label: t('statistics.dateRange.last90Days') },
    { value: 'custom' as const, label: t('statistics.dateRange.customRange') }
  ];

  return (
    <div className="flex items-end gap-4">
      {/* Date Range Select */}
      <div className="space-y-1">
        <label htmlFor="date-range-select" className="form-label">
          Aikaväli:
        </label>
        <select
          id="date-range-select"
          value={selectedRange}
          onChange={(e) => handleRangeChange(e.target.value as DateRangeOption)}
          className="px-2 py-1.5 text-xs border border-[var(--color-separator)] bg-[var(--color-background-level-1)] text-[var(--color-text)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none"
        >
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div className="space-y-1">
        <label htmlFor="start-date" className="form-label">
          Alkaa:
        </label>
        <input
          type="date"
          id="start-date"
          value={dateRange.startDate}
          min={availableDataRange?.startDate}
          max={availableDataRange?.endDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          className="px-2 py-1.5 text-xs border border-[var(--color-separator)] bg-[var(--color-background-level-1)] text-[var(--color-text)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none"
        />
      </div>

      {/* End Date */}
      <div className="space-y-1">
        <label htmlFor="end-date" className="form-label">
          Päättyy:
        </label>
        <input
          type="date"
          id="end-date"
          value={dateRange.endDate}
          min={availableDataRange?.startDate}
          max={availableDataRange?.endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          className="px-2 py-1.5 text-xs border border-[var(--color-separator)] bg-[var(--color-background-level-1)] text-[var(--color-text)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none"
        />
      </div>
    </div>
  );
}