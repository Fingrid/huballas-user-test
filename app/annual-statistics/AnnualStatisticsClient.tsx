'use client';

import React, { useEffect, useState } from 'react';
import { useBaseData } from '../../lib/stores';
import SummaryOverview from './components/SummaryOverview';
import StackingControls from './components/StackingControls';
import StackedChart from './components/StackedChart';
import BreakdownTables from './components/BreakdownTables';
import { ErrorState } from '../monthly-reports/components';
import { cn } from '../../lib/cn';

type StackingType = 'channel' | 'process_group' | 'marketRoleCode';

// Style objects for consistent styling
const styles = {
  loadingContainer: 'flex justify-center items-center h-64 text-lg text-gray-600',
  noDataContainer: 'p-8 text-center bg-gray-50 border border-gray-200 my-4',
  noDataTitle: 'text-gray-500 mb-4 text-lg font-medium',
  noDataText: 'text-gray-500',
  mainContainer: 'p-8 max-w-7xl mx-auto',
  title: 'text-4xl font-bold text-center mb-8 text-[var(--color-text)]'
};

export default function AnnualStatisticsClient() {
  // Chart state
  const [stackingType, setStackingType] = useState<StackingType>('marketRoleCode');

  // Store data
  const {
    usageData,
    loadingState,
    error,
    fetchUsageStatistics,
    fetchDictionaries,
    getChannels,
    getMarketRoles,
    getProcessGroups,
    getChannelDescription,
    getMarketRoleDescription,
  } = useBaseData();

  // Load data on mount
  useEffect(() => {
    fetchUsageStatistics({ synthesize: "on_missing_data" });
    fetchDictionaries();
  }, [fetchUsageStatistics, fetchDictionaries]);

  if (loadingState === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        Loading data...
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        error={error}
        onRetry={() => {
          fetchUsageStatistics({ synthesize: "on_missing_data" });
        }}
        showDetails={false}
      />
    );
  }

  if (!usageData || usageData.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <h3 className={styles.noDataTitle}>No Data Available</h3>
        <p className={styles.noDataText}>No usage statistics data could be loaded.</p>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.title}>
        Annual Usage Statistics
      </h1>

      {/* Summary Overview */}
      <SummaryOverview
        usageData={usageData}
      />

      {/* Controls */}
      <StackingControls 
        stackingType={stackingType}
        setStackingType={setStackingType}
        getChannels={getChannels}
        getProcessGroups={getProcessGroups}
        getMarketRoles={getMarketRoles}
      />

      {/* Main Chart */}
      <StackedChart
        stackingType={stackingType}
        getChannelDescription={getChannelDescription}
        getMarketRoleDescription={getMarketRoleDescription}
        usageData={usageData}
      />

      {/* Breakdown Tables */}
      <BreakdownTables 
        usageData={usageData}
        getChannelDescription={getChannelDescription}
        getMarketRoleDescription={getMarketRoleDescription}
      />
    </div>
  );
}