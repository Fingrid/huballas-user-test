"use client";

import React, { useEffect, useState } from "react";
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useBaseData, useMonthlyReports } from '../../lib/stores';
import { MonthlyEventsChart, MonthlyResponseTimesChart, MonthlyReportsFilter, MonthlySummaryCards, LoadingState, ErrorState } from './components';
import echartsTheme from '../echarts.theme.json';
import { cn } from '../../lib/cn';

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer
]);

// Register the custom theme
echarts.registerTheme('huballas', echartsTheme);

// Style objects for consistent styling
const styles = {
  container: 'content-container pt-8 pb-8'
};

export default function MonthlyReportsClient() {
  const [isDataReady, setIsDataReady] = useState(false);
  
  const { 
    fetchUsageStatistics, 
    clearError,
    monthlyData,
    fetchResponseTimes,
    fetchErrorStats,
  } = useBaseData();
  
  // Use the new monthly reports store
  const {
    selectedMonth,
    selectedGroupBy,
    monthlyStats,
    trendData,
    setSelectedMonth,
    setSelectedGroupBy,
    getDisplayName,
    getTrendIcon,
    getAvailableMonths,
    loadingState,
    error,
    responseTimesLoadingState, 
    computeMonthlyData
  } = useMonthlyReports();

  // Get available months from the new hook
  const availableMonths = getAvailableMonths();

  useEffect(() => {
    const loadData = async () => {
      // Load usage statistics first
      await fetchUsageStatistics({ synthesize: "never" });
      // Then load dependent data (these will use cached usage data)
      await Promise.all([
        fetchResponseTimes({ synthesize: "always" }),
        //fetchErrorStats({ synthesize: "always" })
      ]);
    };
    
    loadData();
  }, [fetchUsageStatistics, fetchResponseTimes, fetchErrorStats]);

  // Track when both loading states are ready to trigger render
  useEffect(() => {
    if (loadingState === 'ready' && responseTimesLoadingState === 'ready') {
      // Only compute monthly data when both data sources are truly ready
      computeMonthlyData();
      
      // Set selected month to the latest month when both data sources are ready
      if (monthlyData.length > 0 && !selectedMonth) {
        setSelectedMonth(monthlyData[monthlyData.length - 1].month);
      }
      
      setIsDataReady(true);
    }
  }, [loadingState, responseTimesLoadingState, computeMonthlyData, monthlyData, selectedMonth, setSelectedMonth]);

  // Remove the separate useEffect for setSelectedMonth since it's now handled above

  if (!isDataReady) return <LoadingState />;
  
  if (error) return (
    <ErrorState 
      error={error}
      onRetry={() => {
        clearError();
        fetchUsageStatistics({ synthesize: "on_missing_data" });
        fetchResponseTimes({ synthesize: "on_missing_data" });
      }}
      onClear={clearError}
      showDetails={false}
    />
  );

  // Safe access to trend data
  const trendIconData = trendData ? getTrendIcon(trendData.trend, trendData.percentage) : getTrendIcon('neutral', 0);

  return (
    <div className={styles.container}>      
      {/* Month Selector and Grouping Controls */}
      <MonthlyReportsFilter
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        groupBy={selectedGroupBy}
        setGroupBy={setSelectedGroupBy}
        availableMonths={availableMonths}
      />
      
      {/* Summary Cards */}
      <MonthlySummaryCards
        monthlyStats={monthlyStats || { totalEvents: 0, activeGroups: 0, dailyAverage: 0 }}
        groupBy={selectedGroupBy}
        trendIconData={trendIconData}
      />

      {/* Charts */}
      <MonthlyEventsChart
        selectedMonth={selectedMonth}
        groupBy={selectedGroupBy}
        getDisplayName={getDisplayName}
      />

      <MonthlyResponseTimesChart
          selectedMonth={selectedMonth}
          groupBy={selectedGroupBy}
          selectedSegment={undefined}
        />
    </div>
  );
}
