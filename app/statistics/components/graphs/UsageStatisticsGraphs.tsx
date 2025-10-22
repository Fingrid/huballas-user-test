'use client';

import { useMemo } from 'react';
import StackedChart from './StackedChart';
import BreakdownTables from '../tables/BreakdownTables';
import GroupingSelector from '../controls/GroupingSelector';
import { useUsageStore, useDictionaryStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import type { UsageDataRecord } from '@/lib/types';

type StackingType = 'channel' | 'process_group' | 'marketRoleCode';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UsageStatisticsGraphsProps {
  stackingType: StackingType;
  activeDateRange: DateRange;
  onStackingChange: (type: StackingType) => void;
}

export default function UsageStatisticsGraphs({ stackingType, activeDateRange, onStackingChange }: UsageStatisticsGraphsProps) {
  const { t } = useLocalization();
  
  const usageStore = useUsageStore();
  const dictionaryStore = useDictionaryStore();

  // Grouping options for usage statistics
  const groupingOptions = useMemo(() => [
    { value: 'channel', label: t('statistics.grouping.channels') },
    { value: 'process_group', label: t('statistics.grouping.processGroups') },
    { value: 'marketRoleCode', label: t('statistics.grouping.marketRoles') },
  ], [t]);

  // Prepare usage data for the selected date range
  const usageDataArray = useMemo(() => {
    const usageData = usageStore._rawdata || {};
    
    // Combine all available data
    const allData: UsageDataRecord[] = Object.values(usageData)
      .flat()
      .filter(record => record !== undefined);

    // Filter by date range
    const filteredData = allData.filter(record => {
      const recordDate = new Date(record.event_timestamp).toISOString().split('T')[0]; // Get YYYY-MM-DD part
      return recordDate >= activeDateRange.startDate && recordDate <= activeDateRange.endDate;
    });
    
    return filteredData;
  }, [usageStore._rawdata, activeDateRange]);

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <div className="bg-[var(--color-background-level-1)] relative">
        {/* Grouping Selector in top right corner */}
        <div className="absolute top-4 right-4 z-10">
          <GroupingSelector
            value={stackingType}
            onChange={(value) => onStackingChange(value as StackingType)}
            options={groupingOptions}
            label={t('statistics.controls.grouping')}
          />
        </div>
        
        <StackedChart
          stackingType={stackingType}
          getChannelDescription={dictionaryStore.getChannelDescription}
          getMarketRoleDescription={dictionaryStore.getMarketRoleDescription}
          usageData={usageDataArray}
        />
      </div>

      {/* Breakdown Tables */}
      <div className="bg-[var(--color-background-level-1)]">
        <BreakdownTables
          usageData={usageDataArray}
          getChannelDescription={dictionaryStore.getChannelDescription}
          getMarketRoleDescription={dictionaryStore.getMarketRoleDescription}
        />
      </div>
    </div>
  );
}