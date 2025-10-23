"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useLocalization } from "@/lib/stores/localization.store";
import { usePerformanceMeasurement } from "@/lib/performance/monitoring";
import { 
  useUsageData, 
  useDateRangeCalculation, 
  DateRangeOption
} from "@/lib/hooks/useDataAccess";
import type { DateRangeFilter } from "@/lib/utils/dataProcessing";
import {
  StatisticsSummary,
  UsageStatisticsGraphs,
  StatisticsHeader,
} from "../statistics/components";

type StackingType = 'all' | "channel" | "process_group" | "marketRoleCode";
type GraphStackingType = "channel" | "process_group" | "marketRoleCode";

// Empty props interface - no props needed for this component
type UsageClientProps = Record<string, never>;

export default function UsageClient(_props: UsageClientProps) {
  const { t } = useLocalization();
  const { measureInteraction } = usePerformanceMeasurement("UsagePage");

  // Ref for the usage section
  const usageRef = useRef<HTMLDivElement>(null);

  // Use the new data access hooks
  const usageData = useUsageData();

  const { calculateDateRange: calculateRange } = useDateRangeCalculation();
  
  // Get available date range from usage data
  const availableDataRange = usageData.availableDateRange;

  // Chart controls state
  const [usageStackingType, setUsageStackingType] = useState<StackingType>("all");
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("30days");
  const [userCustomDateRange, setUserCustomDateRange] = useState<DateRangeFilter | null>(null);
  
  // Filter controls state
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  // Header ref
  const headerRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on selected option and available data
  const customDateRange = useMemo(() => {
    if (availableDataRange) {
      return calculateRange(
        selectedRange, 
        selectedRange === "custom" ? userCustomDateRange || undefined : undefined, 
        availableDataRange
      );
    }
    return calculateRange(selectedRange, undefined, undefined);
  }, [availableDataRange, calculateRange, selectedRange, userCustomDateRange]);

  const handleRangeChange = (range: DateRangeOption) => {
    measureInteraction("date-range-change");
    setSelectedRange(range);
    
    // Reset user custom date range when switching away from custom
    if (range === 'custom') {
      setUserCustomDateRange(null);
    }
  };

  const handleDateRangeChange = (dateRange: DateRangeFilter) => {
    measureInteraction("custom-date-change");
    setUserCustomDateRange(dateRange);
  };

  const handleUsageStackingChange = (type: StackingType) => {
    measureInteraction("usage-stacking-change");
    setUsageStackingType(type);
  };

  const handleClearFilters = () => {
    measureInteraction("clear-filters");
    setUsageStackingType('all');
    setSelectedProcess('all');
    setSelectedChannel('all');
    setSelectedRole('all');
  };

  const hasActiveFilters = useMemo(() => {
    return usageStackingType !== 'all' || 
           selectedProcess !== 'all' || 
           selectedChannel !== 'all' || 
           selectedRole !== 'all';
  }, [usageStackingType, selectedProcess, selectedChannel, selectedRole]);

  // Calculate the active date range based on selected option and custom range
  const activeDateRange = useMemo(() => {
    return customDateRange;
  }, [customDateRange]);

  // Style objects for consistent styling
  const styles = {
    spacer: "w-8 h-8",
    sectionHeaderRow: 'section-header-row',
    filterToggleButton: 'filter-toggle-button'
  };

  return (
    <>
      {/* Statistics Header - With integrated filter bar in sticky controls */}
      <StatisticsHeader
        activeSection="usage"
        onSectionChange={() => {}} // Not needed for single section page
        selectedRange={selectedRange}
        dateRange={activeDateRange}
        onRangeChange={handleRangeChange}
        onDateRangeChange={handleDateRangeChange}
        availableDataRange={availableDataRange}
        headerRef={headerRef}
        alwaysShowStickyControls={true}
        hideInlineDateControls={true}
        displayFilters={true}
        stackingType={usageStackingType}
        onStackingChange={handleUsageStackingChange}
        selectedProcess={selectedProcess}
        selectedChannel={selectedChannel}
        selectedRole={selectedRole}
        onProcessChange={setSelectedProcess}
        onChannelChange={setSelectedChannel}
        onRoleChange={setSelectedRole}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Spacer divs as per concept */}
      <div className={styles.spacer}></div>
      <div className={styles.spacer}></div>

      {/* Statistics Summary Boxes */}
      <div className="content-area pb-4">
        <StatisticsSummary onSectionClick={() => {}} />
      </div>

      {/* Usage Statistics Section */}
      <div
        ref={usageRef}
        data-section="usage"
        className="content-area pb-8"
      >
        <div className="statistics__section">
          <h2 className="statistics__section-title">
            {t("statistics.usage.dailyEventsTitle")}
          </h2>

          <UsageStatisticsGraphs
            stackingType={usageStackingType === 'all' ? 'channel' : usageStackingType as GraphStackingType}
            activeDateRange={activeDateRange}
            onStackingChange={handleUsageStackingChange}
          />
        </div>
      </div>
    </>
  );
}
