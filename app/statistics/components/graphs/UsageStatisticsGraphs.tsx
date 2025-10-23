'use client';

import { useMemo } from 'react';
import StackedChart from './StackedChart';
import BreakdownTables from '../tables/BreakdownTables';
import CalloutBox from '@/app/_components/ui/CalloutBox';
import { useUsageStore, useDictionaryStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';

type StackingType = 'channel' | 'process_group' | 'marketRoleCode';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UsageStatisticsGraphsProps {
  stackingType: StackingType;
  activeDateRange: DateRange;
  onStackingChange?: (type: StackingType) => void;
}

export default function UsageStatisticsGraphs({ stackingType, activeDateRange }: UsageStatisticsGraphsProps) {
  const { t } = useLocalization();
  
  const usageStore = useUsageStore();
  const dictionaryStore = useDictionaryStore();

  // Prepare usage data for the selected date range and apply filters from store
  const usageDataArray = useMemo(() => {
    // Get filtered data from store (applies process, channel, and market role filters)
    // When all filters are 'all', this returns all data
    const filteredByStore = usageStore.getFilteredData();

    // Apply date range filter
    const filteredData = filteredByStore.filter(record => {
      const recordDate = new Date(record.event_timestamp).toISOString().split('T')[0]; // Get YYYY-MM-DD part
      return recordDate >= activeDateRange.startDate && recordDate <= activeDateRange.endDate;
    });
    
    return filteredData;
  }, [usageStore, activeDateRange]);

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <div className="bg-[var(--color-background-level-1)] relative">        
        <StackedChart
          stackingType={stackingType}
          getChannelDescription={dictionaryStore.getChannelDescription}
          getMarketRoleDescription={dictionaryStore.getMarketRoleDescription}
          usageData={usageDataArray}
        />
      </div>

      {/* Callout Box - Timeline Info */}
      <CalloutBox
        variant="info"
        title={t('statistics.calloutBox.timelineTitle')}
        description={t('statistics.calloutBox.timelineDescription')}
      />

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