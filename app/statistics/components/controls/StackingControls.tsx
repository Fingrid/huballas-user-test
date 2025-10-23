"use client";

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { useLocalization } from '@/lib/stores/localization.store';
import DateRangeFilter from './DateRangeFilter';
import { DateRangeOption } from '@/lib/hooks/useDataAccess';

type StackingType = 'channel' | 'process_group' | 'marketRoleCode' | 'errortype' | 'type';
type SectionType = 'usage' | 'error';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface StackingControlsProps {
  stackingType: StackingType;
  setStackingType: (type: StackingType) => void;
  getChannels: () => string[];
  getProcessGroups: () => string[];
  getMarketRoles: () => string[];
  selectedRange: DateRangeOption;
  dateRange: DateRange;
  onRangeChange: (range: DateRangeOption) => void;
  onDateRangeChange: (dateRange: DateRange) => void;
  activeSection: SectionType;
}

// Style objects for consistent styling
const styles = {
  container: 'space-y-6',
  groupingSection: 'space-y-3',
  title: 'text-lg font-medium text-[var(--color-text)]',
  buttonContainer: 'flex gap-2 flex-wrap'
};

export default function StackingControls({ 
  stackingType, 
  setStackingType, 
  getChannels, 
  getProcessGroups, 
  getMarketRoles,
  selectedRange,
  dateRange,
  onRangeChange,
  onDateRangeChange,
  activeSection
}: StackingControlsProps) {
  const { t } = useLocalization();
  
  return (
    <div className={styles.container}>
      {/* Date Range Filter */}
      <DateRangeFilter
        selectedRange={selectedRange}
        dateRange={dateRange}
        onRangeChange={onRangeChange}
        onDateRangeChange={onDateRangeChange}
      />
      
      {/* Grouping Controls */}
      <div className={styles.groupingSection}>
        <h4 className={styles.title}>{t('statistics.grouping.label')}</h4>
        <div className={styles.buttonContainer}>
          {activeSection === 'usage' ? (
            <>
              <button
                onClick={() => setStackingType('channel')}
                className={cn(
                  'px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-[var(--border-radius-default)]',
                  stackingType === 'channel'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-[var(--color-background-level-1)] text-[var(--color-text)] border-[var(--color-separator)] hover:bg-[var(--color-background-level-2)]'
                )}
              >
                {t('statistics.grouping.channels')} ({getChannels().length})
              </button>
              
              <button
                onClick={() => setStackingType('process_group')}
                className={cn(
                  'px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-[var(--border-radius-default)]',
                  stackingType === 'process_group'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-[var(--color-background-level-1)] text-[var(--color-text)] border-[var(--color-separator)] hover:bg-[var(--color-background-level-2)]'
                )}
              >
                {t('statistics.grouping.processGroups')} ({getProcessGroups().length})
              </button>
              
              <button
                onClick={() => setStackingType('marketRoleCode')}
                className={cn(
                  'px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-[var(--border-radius-default)]',
                  stackingType === 'marketRoleCode'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-[var(--color-background-level-1)] text-[var(--color-text)] border-[var(--color-separator)] hover:bg-[var(--color-background-level-2)]'
                )}
              >
                {t('statistics.grouping.marketRoles')} ({getMarketRoles().length})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStackingType('errortype')}
                className={cn(
                  'px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-[var(--border-radius-default)]',
                  stackingType === 'errortype'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-[var(--color-background-level-1)] text-[var(--color-text)] border-[var(--color-separator)] hover:bg-[var(--color-background-level-2)]'
                )}
              >
                {t('statistics.grouping.errorTypes')}
              </button>
              
              <button
                onClick={() => setStackingType('type')}
                className={cn(
                  'px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-[var(--border-radius-default)]',
                  stackingType === 'type'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-[var(--color-background-level-1)] text-[var(--color-text)] border-[var(--color-separator)] hover:bg-[var(--color-background-level-2)]'
                )}
              >
                {t('statistics.grouping.systemTypes')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}