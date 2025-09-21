'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { UsageDataRecord, ChartArrays } from '../types/enhanced';

// Performance-optimized chart data computation
export const useChartDataComputation = (
  usageData: UsageDataRecord[],
  selectedYear: string,
  stackingType: 'channel' | 'process_group' | 'marketRoleCode'
) => {
  return useMemo(() => {
    console.log('🔄 Computing chart data for:', { selectedYear, stackingType, recordCount: usageData.length });
    
    if (!usageData.length) {
      return {
        chartArrays: null,
        summary: { totalEvents: 0, dateRange: null, avgDaily: 0 }
      };
    }

    // Filter data for selected year
    const yearData = usageData.filter(record => 
      record.event_timestamp.startsWith(selectedYear)
    );

    if (!yearData.length) {
      return {
        chartArrays: null,
        summary: { totalEvents: 0, dateRange: null, avgDaily: 0 }
      };
    }

    // Group by date
    const dateGroups = yearData.reduce((acc, record) => {
      const date = record.event_timestamp.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {} as Record<string, UsageDataRecord[]>);

    const dates = Object.keys(dateGroups).sort();
    const totalEventsData: number[] = [];
    const breakdownData: Record<string, Record<string, number[]>> = {
      channel: {},
      process_group: {},
      marketRoleCode: {}
    };

    // Process each date
    dates.forEach(date => {
      const dayRecords = dateGroups[date];
      totalEventsData.push(dayRecords.length);

      // Count breakdowns for each type
      ['channel', 'process_group', 'market_role_code'].forEach(field => {
        const breakdown = dayRecords.reduce((acc, record) => {
          const key = record[field] || 'Unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        Object.entries(breakdown).forEach(([key, count]) => {
          const fieldKey = field === 'market_role_code' ? 'marketRoleCode' : field;
          if (!breakdownData[fieldKey][key]) {
            breakdownData[fieldKey][key] = new Array(dates.length).fill(0);
          }
          breakdownData[fieldKey][key][dates.length - 1] = count;
        });
      });
    });

    const chartArrays: ChartArrays = {
      dates,
      totalEventsData,
      channelData: breakdownData.channel,
      messageTypeData: {}, // Could be computed similarly
      processGroupData: breakdownData.process_group,
      marketRoleData: breakdownData.marketRoleCode,
      avgDailyEvents: totalEventsData.reduce((a, b) => a + b, 0) / totalEventsData.length,
      peakDailyEvents: Math.max(...totalEventsData)
    };

    const summary = {
      totalEvents: yearData.length,
      dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
      avgDaily: chartArrays.avgDailyEvents
    };

    return { chartArrays, summary };
  }, [usageData, selectedYear, stackingType]);
};

// Memoized year options computation
export const useAvailableYears = (usageData: UsageDataRecord[]) => {
  return useMemo(() => {
    const years = new Set<string>();
    usageData.forEach(record => {
      const year = record.event_timestamp.split('-')[0];
      if (year && year.match(/^\d{4}$/)) {
        years.add(year);
      }
    });
    const sortedYears = Array.from(years).sort();
    return sortedYears.length > 0 ? sortedYears : ['2022', '2023', '2024'];
  }, [usageData]);
};

// Memoized filter options
export const useFilterOptions = (usageData: UsageDataRecord[]) => {
  return useMemo(() => {
    const channels = new Set<string>();
    const processGroups = new Set<string>();
    const marketRoles = new Set<string>();

    usageData.forEach(record => {
      if (record.channel) channels.add(record.channel);
      if (record.process_group) processGroups.add(record.process_group);
      if (record.market_role_code) marketRoles.add(record.market_role_code);
    });

    return {
      channels: Array.from(channels).sort(),
      processGroups: Array.from(processGroups).sort(),
      marketRoles: Array.from(marketRoles).sort()
    };
  }, [usageData]);
};

// Performance-optimized event handlers
export const useStableHandlers = () => {
  const createYearChangeHandler = useCallback((setYear: (year: string) => void) => {
    return (event: React.ChangeEvent<HTMLSelectElement>) => {
      setYear(event.target.value);
    };
  }, []);

  const createStackingChangeHandler = useCallback((
    setStackingType: (type: 'channel' | 'process_group' | 'marketRoleCode') => void
  ) => {
    return (type: 'channel' | 'process_group' | 'marketRoleCode') => {
      setStackingType(type);
    };
  }, []);

  return {
    createYearChangeHandler,
    createStackingChangeHandler
  };
};

// Memoized component props
export interface OptimizedComponentProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

// High-performance wrapper component
export const OptimizedWrapper = memo<OptimizedComponentProps>(({ 
  children, 
  className = '',
  'data-testid': testId 
}) => {
  return (
    <div className={className} data-testid={testId}>
      {children}
    </div>
  );
});

OptimizedWrapper.displayName = 'OptimizedWrapper';

// Memoized list renderer for large datasets
export interface VirtualizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}

export const VirtualizedList = memo<VirtualizedListProps>(({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className = ''
}) => {
  const visibleItems = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = 5; // Extra items for smooth scrolling
    return items.slice(0, visibleCount + buffer);
  }, [items, itemHeight, containerHeight]);

  return (
    <div className={className} style={{ height: containerHeight, overflow: 'auto' }}>
      {visibleItems.map((item, index) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Performance metrics hook
export const usePerformanceMetrics = (componentName: string) => {
  const startTime = useMemo(() => performance.now(), []);
  
  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  });

  const measureAsync = useCallback(<T,>(name: string, asyncFn: () => Promise<T>): Promise<T> => {
    return new Promise(async (resolve, reject) => {
      try {
        const start = performance.now();
        const result = await asyncFn();
        const end = performance.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${componentName}.${name}: ${(end - start).toFixed(2)}ms`);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }, [componentName]);

  return {
    measureAsync
  };
};