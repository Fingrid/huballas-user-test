"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useLocalization } from "@/lib/stores/localization.store";
import { usePerformanceMeasurement } from "@/lib/performance/monitoring";
import { 
  useUsageData, 
  useDateRangeCalculation 
} from "@/lib/hooks/useDataAccess";
import type { DateRangeFilter } from "@/lib/dataProcessing";
import {
  StatisticsSummary,
  StatisticsHeader,
  UsageStatisticsGraphs,
  ErrorStatisticsGraphs,
  ResponseTimeStatisticsGraphs,
} from "./components";
import { cn } from "@/lib/cn";

import type { DateRangeOption } from "./components/controls/DateRangeFilter";

type UsageStackingType = "channel" | "process_group" | "marketRoleCode";
type ErrorStackingType = "errortype" | "type";
type SectionType = "usage" | "errors" | "response_times";

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

  // Use the new data access hooks first
  const usageData = useUsageData();

  const { calculateDateRange: calculateRange } = useDateRangeCalculation();
  
  // Get available date range from usage data
  const availableDataRange = usageData.availableDateRange;

  // Chart controls state
  const [activeSection, setActiveSection] = useState<SectionType>("usage");
  const [usageStackingType, setUsageStackingType] =
    useState<UsageStackingType>("channel");
  const [errorStackingType, setErrorStackingType] =
    useState<ErrorStackingType>("errortype");
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("90days");
  const [customDateRange, setCustomDateRange] = useState<DateRangeFilter>(() =>
    calculateRange("90days", undefined, undefined) // Will be updated when availableDataRange is calculated
  );
  
  // State to track if sticky controls should be visible
  const [showStickyControls, setShowStickyControls] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Update the ref whenever activeSection changes
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);


  // Update custom date range when available data range changes
  useEffect(() => {
    if (availableDataRange) {
      const newDateRange = calculateRange(selectedRange, selectedRange === "custom" ? customDateRange : undefined, availableDataRange || undefined);
      setCustomDateRange(newDateRange);
    }
  }, [availableDataRange, calculateRange]); // Don't include selectedRange and customDateRange to avoid infinite loop

  // Observe header to show/hide sticky controls
  useEffect(() => {
    if (typeof window === 'undefined' || !headerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky controls when header is out of view
        setShowStickyControls(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px', // Trigger just before header leaves viewport
      }
    );

    observer.observe(headerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Intersection Observer for automatic section switching
  useEffect(() => {
    // Check if IntersectionObserver is supported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      // Simplified rootMargin for better Edge compatibility
      rootMargin: '-100px 0px -50% 0px',
      threshold: [0.1, 0.3, 0.5] // Multiple thresholds for better accuracy
    };

    let pendingUpdate: NodeJS.Timeout | null = null;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Debug logging for Edge compatibility
      console.log('IntersectionObserver callback triggered with', entries.length, 'entries');
      
      // Clear any pending updates
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
      }

      // Find the section that is most visible
      const visibleSections = entries
        .filter(entry => {
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.1;
          console.log(`Section ${entry.target.getAttribute('data-section')}: intersecting=${entry.isIntersecting}, ratio=${entry.intersectionRatio}`);
          return isVisible;
        })
        .sort((a, b) => {
          // Sort by intersection ratio first, then by position on page
          if (Math.abs(b.intersectionRatio - a.intersectionRatio) > 0.1) {
            return b.intersectionRatio - a.intersectionRatio;
          }
          // If ratios are similar, prefer the one higher on the page when scrolling down
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

      console.log('Visible sections:', visibleSections.map(s => s.target.getAttribute('data-section')));

      if (visibleSections.length > 0) {
        const mostVisibleSection = visibleSections[0];
        const sectionId = mostVisibleSection.target.getAttribute('data-section') as SectionType;
        
        console.log(`Most visible section: ${sectionId}, current: ${activeSectionRef.current}`);
        
        if (sectionId && sectionId !== activeSectionRef.current) {
          // Debounce the update to prevent rapid flickering
          pendingUpdate = setTimeout(() => {
            console.log(`Updating active section to: ${sectionId}`);
            setActiveSection(sectionId);
          }, 150); // Slightly longer debounce for Edge
        }
      }
    };

    let observer: IntersectionObserver;
    
    try {
      observer = new IntersectionObserver(observerCallback, observerOptions);
    } catch (error) {
      console.warn('Failed to create IntersectionObserver:', error);
      return;
    }

    // Observe all section elements with error handling
    const elementsToObserve = [
      { ref: usageRef, name: 'usage' },
      { ref: errorRef, name: 'errors' },
      { ref: responseTimeRef, name: 'response_times' }
    ];

    elementsToObserve.forEach(({ ref, name }) => {
      if (ref.current) {
        try {
          observer.observe(ref.current);
        } catch (error) {
          console.warn(`Failed to observe ${name} section:`, error);
        }
      }
    });

    return () => {
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
      }
      if (observer) {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Failed to disconnect observer:', error);
        }
      }
    };
  }, []); // Remove activeSection from dependencies to prevent observer recreation

  // Fallback scroll-based section detection for better browser compatibility
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Only run fallback if IntersectionObserver might not be working properly
          const sections = [
            { ref: usageRef, id: 'usage' as SectionType },
            { ref: errorRef, id: 'errors' as SectionType },
            { ref: responseTimeRef, id: 'response_times' as SectionType }
          ];

          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const headerOffset = 120; // Account for sticky header

          let currentSection: SectionType = 'usage';
          
          for (const section of sections) {
            if (section.ref.current) {
              const rect = section.ref.current.getBoundingClientRect();
              const elementTop = rect.top + scrollTop;
              
              // Check if this section is in the main view area
              if (scrollTop + headerOffset >= elementTop - windowHeight * 0.3) {
                currentSection = section.id;
              }
            }
          }

          if (currentSection !== activeSectionRef.current) {
            setActiveSection(currentSection);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener as fallback
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    return calculateRange(
      selectedRange,
      selectedRange === "custom" ? customDateRange : undefined,
      availableDataRange || undefined
    );
  }, [selectedRange, customDateRange, availableDataRange, calculateRange]);

  const handleRangeChange = (range: DateRangeOption) => {
    setSelectedRange(range);
    if (range !== "custom") {
      setCustomDateRange(calculateRange(range, undefined, availableDataRange || undefined));
    }
  };

  const handleDateRangeChange = (dateRange: DateRangeFilter) => {
    setCustomDateRange(dateRange);
  };

  useEffect(() => {
    const endMeasurement = measureInteraction("page-load");
    console.log("Statistics page loaded");
    endMeasurement();
  }, [measureInteraction]);

  // Style objects for better maintainability
  const styles = {
    spacer: "w-8 h-8 bg-gray-50",
    sectionHeaderRow: 'section-header-row',
    filterToggleButton: 'filter-toggle-button',
    filterToggleIcon: 'filter-toggle-icon',
    placeholderSection: 'placeholder-section'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section with Gradient Background */}
      <StatisticsHeader
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        selectedRange={selectedRange}
        dateRange={customDateRange}
        onRangeChange={handleRangeChange}
        onDateRangeChange={handleDateRangeChange}
        availableDataRange={availableDataRange}
        headerRef={headerRef}
        showStickyControls={showStickyControls}
      />

      {/* Spacer divs as per concept */}
      <div className={styles.spacer}></div>
      <div className={styles.spacer}></div>

      {/* Statistics Summary Boxes */}
      <div className="content-area pb-4">
        <StatisticsSummary onSectionClick={handleSectionChange} />
      </div>

      {/* Page Extra Info */}
      <div className="content-area pt-4 pb-8 hidden">
        <div className="statistics__section">
          <h3 className="statistics__section-title">
            {t("statistics.pageExtraInfo.title")}
          </h3>
          <p className="statistics__section-description">
            {t("statistics.pageExtraInfo.content")}
          </p>
        </div>
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
          <p className="statistics__section-description">
            {t("statistics.usage.description")}
          </p>
          <UsageStatisticsGraphs
            stackingType={usageStackingType}
            activeDateRange={activeDateRange}
            onStackingChange={setUsageStackingType}
          />
        </div>
      </div>

      {/* Error Statistics Section */}
      <div
        ref={errorRef}
        data-section="errors"
        className="content-area pb-8"
      >
        <div className="statistics__section">
          <h2 className="statistics__section-title">
            {t("statistics.errors.title")}
          </h2>
          <p className="statistics__section-description">
            {t("statistics.errors.description")}
          </p>
          <ErrorStatisticsGraphs
            stackingType={errorStackingType}
            activeDateRange={activeDateRange}
            onStackingChange={setErrorStackingType}
          />
        </div>
      </div>

      {/* Validation Errors Section - Placeholder */}
      <div
        className="content-area pb-8"
      >
        <div className="statistics__section">
          <h2 className="statistics__section-title">
            {t("statistics.validationErrors.title")}
          </h2>
          <p className="statistics__section-description">
            {t("statistics.validationErrors.description")}
          </p>
          <div className={cn(styles.placeholderSection)}>
            <p>Placeholder for Validation Errors graphs</p>
          </div>
        </div>
      </div>

      {/* ResponseTime Statistics Graph Section */}
      <div 
        ref={responseTimeRef}
        data-section="response_times"
        className="content-area pb-8"
      >
        <div className="statistics__section">
          <h2 className="statistics__section-title">
            {t("statistics.responseTime.title")}
          </h2>
          <p className="statistics__section-description">
            {t("statistics.responseTime.noDataForRange")}
          </p>
          <ResponseTimeStatisticsGraphs activeDateRange={activeDateRange} />
        </div>
      </div>
    </div>
  );
}
