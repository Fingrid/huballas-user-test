"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useLocalization } from "@/lib/stores/localization.store";
import { usePerformanceMeasurement } from "@/lib/performance/monitoring";
import { cn } from "@/lib/cn";
import {
  StatisticsSummary,
  UsageStatisticsGraphs,
  ErrorStatisticsGraphs,
  ResponseTimeStatisticsGraphs,
  StackingControls,
  StickyChartControls,
} from "./components";
import { useUsageStore, useDictionaryStore, useErrorStore, useResponseTimeStore } from "@/lib/stores";
import type { DateRangeOption } from "./components/DateRangeFilter";

type UsageStackingType = "channel" | "process_group" | "marketRoleCode";
type ErrorStackingType = "errortype" | "type";
type SectionType = "usage" | "errors" | "response_times";

interface DateRange {
  startDate: string;
  endDate: string;
}

// Helper function to calculate date range based on available data or current date
const calculateDateRange = (
  option: DateRangeOption,
  customRange?: DateRange,
  availableDataRange?: DateRange
): DateRange => {
  // Use the last available data date as the end date, or fall back to current date
  const endDate = availableDataRange ? availableDataRange.endDate : new Date().toISOString().split("T")[0];

  if (option === "custom" && customRange) {
    return customRange;
  }

  const daysMap = {
    "30days": 30,
    "60days": 60,
    "90days": 90,
    custom: 90, // fallback
  };

  const days = daysMap[option];
  const endDateObj = new Date(endDate);
  const startDateObj = new Date(endDateObj.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Ensure we don't go before the earliest available data
  const calculatedStartDate = availableDataRange && startDateObj < new Date(availableDataRange.startDate)
    ? availableDataRange.startDate
    : startDateObj.toISOString().split("T")[0];

  return {
    startDate: calculatedStartDate,
    endDate,
  };
};

interface StatisticsClientProps {}

export default function StatisticsClient({}: StatisticsClientProps) {
  const { t } = useLocalization();
  const { measureInteraction } = usePerformanceMeasurement("StatisticsPage");

  // Refs for scrolling to sections
  const usageRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const responseTimeRef = useRef<HTMLDivElement>(null);
  
  // Ref to track current active section for intersection observer
  const activeSectionRef = useRef<SectionType>("usage");

  // Chart controls state
  const [activeSection, setActiveSection] = useState<SectionType>("usage");
  const [usageStackingType, setUsageStackingType] =
    useState<UsageStackingType>("channel");
  const [errorStackingType, setErrorStackingType] =
    useState<ErrorStackingType>("errortype");
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("90days");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(() =>
    calculateDateRange("90days", undefined, undefined) // Will be updated when availableDataRange is calculated
  );

  // Update the ref whenever activeSection changes
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const usageStore = useUsageStore();
  const errorStore = useErrorStore();
  const responseTimeStore = useResponseTimeStore();
  const dictionaryStore = useDictionaryStore();

  // Calculate available data range from all stores
  const availableDataRange = useMemo((): DateRange | undefined => {
    try {
      const allDates: string[] = [];
      
      // Get dates from usage data
      if (usageStore._rawdata) {
        Object.values(usageStore._rawdata).flat().forEach(record => {
          if (record && 'event_timestamp' in record && record.event_timestamp) {
            allDates.push(new Date(record.event_timestamp).toISOString().split('T')[0]);
          }
        });
      }
      
      // Get dates from error data
      if (errorStore._rawdata) {
        Object.values(errorStore._rawdata).flat().forEach(record => {
          if (record && 'event_timestamp' in record && record.event_timestamp) {
            allDates.push(new Date(record.event_timestamp).toISOString().split('T')[0]);
          }
        });
      }
      
      // Get dates from response time data
      if (responseTimeStore._rawdata) {
        Object.values(responseTimeStore._rawdata).flat().forEach(record => {
          if (record && 'timestamp' in record && record.timestamp) {
            allDates.push(new Date(record.timestamp).toISOString().split('T')[0]);
          }
        });
      }
      
      if (allDates.length === 0) {
        return undefined;
      }
      
      // Remove duplicates and sort
      const uniqueDates = Array.from(new Set(allDates)).sort();
      
      return {
        startDate: uniqueDates[0],
        endDate: uniqueDates[uniqueDates.length - 1]
      };
    } catch (error) {
      console.warn('Error calculating available data range:', error);
      return undefined;
    }
  }, [usageStore._rawdata, errorStore._rawdata, responseTimeStore._rawdata]);

  // Update custom date range when available data range changes
  useEffect(() => {
    if (availableDataRange) {
      const newDateRange = calculateDateRange(selectedRange, selectedRange === "custom" ? customDateRange : undefined, availableDataRange);
      setCustomDateRange(newDateRange);
    }
  }, [availableDataRange]); // Don't include selectedRange and customDateRange to avoid infinite loop

  // Intersection Observer for automatic section switching
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -60% 0px', // Account for sticky header and require section to be well into view
      threshold: 0.3 // Require more of the section to be visible before switching
    };

    let pendingUpdate: NodeJS.Timeout | null = null;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Clear any pending updates
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
      }

      // Find the section that is most visible
      const visibleSections = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio); // Sort by most visible

      if (visibleSections.length > 0) {
        const mostVisibleSection = visibleSections[0];
        const sectionId = mostVisibleSection.target.getAttribute('data-section') as SectionType;
        
        if (sectionId && sectionId !== activeSectionRef.current) {
          // Debounce the update to prevent rapid flickering
          pendingUpdate = setTimeout(() => {
            setActiveSection(sectionId);
          }, 100);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section elements
    if (usageRef.current) {
      observer.observe(usageRef.current);
    }
    if (errorRef.current) {
      observer.observe(errorRef.current);
    }
    if (responseTimeRef.current) {
      observer.observe(responseTimeRef.current);
    }

    return () => {
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
      }
      observer.disconnect();
    };
  }, []); // Remove activeSection from dependencies to prevent observer recreation

  // Function to scroll to selected section (manual navigation)
  const scrollToSection = (section: SectionType) => {
    let ref: React.RefObject<HTMLDivElement | null> | null = null;
    
    switch (section) {
      case "usage":
        ref = usageRef;
        break;
      case "errors":
        ref = errorRef;
        break;
      case "response_times":
        ref = responseTimeRef;
        break;
    }
    
    if (ref?.current) {
      const offsetTop = ref.current.offsetTop - 120; // Account for sticky header
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  // Handle section change with scrolling (manual navigation)
  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
    // Delay scroll to ensure state is updated
    setTimeout(() => scrollToSection(section), 100);
  };

  // Calculate the actual date range to filter by
  const activeDateRange = useMemo(() => {
    return calculateDateRange(
      selectedRange,
      selectedRange === "custom" ? customDateRange : undefined,
      availableDataRange
    );
  }, [selectedRange, customDateRange, availableDataRange]);

  const handleRangeChange = (range: DateRangeOption) => {
    setSelectedRange(range);
    if (range !== "custom") {
      setCustomDateRange(calculateDateRange(range, undefined, availableDataRange));
    }
  };

  const handleDateRangeChange = (dateRange: DateRange) => {
    setCustomDateRange(dateRange);
  };

  useEffect(() => {
    const endMeasurement = measureInteraction("page-load");
    console.log("Statistics page loaded");
    endMeasurement();
  }, [measureInteraction]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="page-header-gradient border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {t("statistics.pageTitle")}
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] max-w-3xl">
              {t("statistics.pageDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Summary Boxes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatisticsSummary />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
          <h3>{t("statistics.pageExtraInfo.title")}</h3>
          <p>{t("statistics.pageExtraInfo.content")}</p>
        </div>
      </div>

      {/* Sticky Chart Controls */}
      <StickyChartControls
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        selectedRange={selectedRange}
        dateRange={customDateRange}
        onRangeChange={handleRangeChange}
        onDateRangeChange={handleDateRangeChange}
        availableDataRange={availableDataRange}
      />



      {/* Usage Statistics Section */}
      <div
        ref={usageRef}
        data-section="usage"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        <div className="mb-4">
          <h2>{t("statistics.summaryTotalEvents")}</h2>
          <p className="mb-2">
            {t("statistics.summaryTotalEventsDescription")}
          </p>
        </div>
        <UsageStatisticsGraphs
          stackingType={usageStackingType}
          activeDateRange={activeDateRange}
          onStackingChange={setUsageStackingType}
        />
      </div>

      {/* Error Statistics Section */}
      <div
        ref={errorRef}
        data-section="errors"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {t("statistics.sections.errors")}
          </h2>
          <p className="text-[var(--color-text-muted)]">
            {t("statistics.errorDescription")}
          </p>
        </div>
        <ErrorStatisticsGraphs
          stackingType={errorStackingType}
          activeDateRange={activeDateRange}
          onStackingChange={setErrorStackingType}
        />
      </div>

      {/* ResponseTime Statistics Graph Section: Confidence chart with breakdown tables */}
      <div 
        ref={responseTimeRef}
        data-section="response_times"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {t("monthlyReports.responseTimes")}
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Vasteaikojen kehitys ja tilastot valitulta aikaväliltä. Luottamusvälit näyttävät vaihtelun keskihajonnan mukaan.
          </p>
        </div>
        <ResponseTimeStatisticsGraphs activeDateRange={activeDateRange} />
      </div>
    </div>
  );
}
