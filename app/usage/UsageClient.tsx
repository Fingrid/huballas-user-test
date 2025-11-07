"use client";

import { useMemo, useRef } from "react";
import { useLocalization } from "@/lib/stores/localization.store";
import { useChartControls } from "@/lib/stores/chartControls.store";
import { usePerformanceMeasurement } from "@/lib/performance/monitoring";
import { 
  useUsageData, 
  useDateRangeCalculation, 
} from "@/lib/hooks/useDataAccess";
import {
  StatisticsSummary,
  UsageStatisticsGraphs,
  StickyChartControls,
} from "../statistics/components";
import { UsageHeader, UsageMainContent, ChartSection } from "./components";

export default function UsageClient() {
  const { t } = useLocalization();
  const { measureInteraction } = usePerformanceMeasurement("UsagePage");

  // Ref for the usage section
  const usageRef = useRef<HTMLDivElement>(null);

  // Use the chart controls store
  const {
    selectedRange,
    customDateRange,
    stackingType,
    selectedProcess,
    selectedChannel,
    selectedRole,
    setStackingType,
    setSelectedRange,
    setCustomDateRange,
    setSelectedProcess,
    setSelectedChannel,
    setSelectedRole,
    clearFilters,
  } = useChartControls();

  // Check if filters are active
  const hasActiveFilters = 
    stackingType !== "all" || 
    selectedProcess !== "all" || 
    selectedChannel !== "all" || 
    selectedRole !== "all";

  // Use the new data access hooks
  const usageData = useUsageData();

  const { calculateDateRange: calculateRange } = useDateRangeCalculation();
  
  // Get available date range from usage data
  const availableDataRange = usageData.availableDateRange;

  // Calculate date range based on selected option and available data
  const activeDateRange = useMemo(() => {
    if (availableDataRange) {
      return calculateRange(
        selectedRange, 
        selectedRange === "custom" ? customDateRange || undefined : undefined, 
        availableDataRange
      );
    }
    return calculateRange(selectedRange, undefined, undefined);
  }, [availableDataRange, calculateRange, selectedRange, customDateRange]);

  const handleUsageStackingChange = (type: "all" | "channel" | "process_group" | "marketRoleCode") => {
    measureInteraction("usage-stacking-change");
    setStackingType(type);
  };

  return (
    <>
      {/* Header block with gradient background */}
      <UsageHeader>
        <StatisticsSummary
          onSectionClick={() => {
            usageRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </UsageHeader>

      {/* Main content area */}
      <>
        
        <UsageMainContent contentRef={usageRef}>
          <div className="mb-8">
            <h2 className="text-[var(--color-text)] text-[1.75rem] font-bold leading-[1.3] mb-3">
              {t('usage.viewStatistics')}
            </h2>
            <p className="text-[var(--color-text)] text-base leading-[1.5] mb-2">
              {t('usage.selectDataDescription')}
            </p>
          </div>
        </UsageMainContent>
        {/* Controls for filtering and date selection */}
        <StickyChartControls
          activeSection="usage"
          onSectionChange={() => {}} // Not used on this page
          selectedRange={selectedRange}
          dateRange={activeDateRange}
          onRangeChange={setSelectedRange}
          onDateRangeChange={setCustomDateRange}
          availableDataRange={availableDataRange}
          displaySectionSelect={false}
          displayFilters={true}
          stackingType={stackingType}
          onStackingChange={setStackingType}
          selectedProcess={selectedProcess}
          selectedChannel={selectedChannel}
          selectedRole={selectedRole}
          onProcessChange={setSelectedProcess}
          onChannelChange={setSelectedChannel}
          onRoleChange={setSelectedRole}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <UsageMainContent contentRef={usageRef}>
          <ChartSection
            title={t('usage.eventCounts')}
            description={t('usage.eventCountsDescription')}
          >
            <UsageStatisticsGraphs
              stackingType={stackingType === 'all' ? 'channel' : stackingType}
              activeDateRange={activeDateRange}
              onStackingChange={handleUsageStackingChange}
            />
          </ChartSection>
        </UsageMainContent>
      </>
    </>
  );
}
