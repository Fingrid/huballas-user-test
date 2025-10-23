'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import GroupingSelector from '../controls/GroupingSelector';
import { useErrorStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/lib/hooks/useECharts';
import type { ErrorRecord } from '@/lib/types';


type StackingType = 'errortype' | 'type';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ErrorStatisticsGraphsProps {
  stackingType: StackingType;
  activeDateRange: DateRange;
  onStackingChange: (type: StackingType) => void;
}

export default function ErrorStatisticsGraphs({ stackingType, activeDateRange, onStackingChange }: ErrorStatisticsGraphsProps) {
  const { t } = useLocalization();
  const errorStore = useErrorStore();

  // Grouping options for error statistics
  const groupingOptions = useMemo(() => [
    { value: 'errortype', label: t('statistics.grouping.errorTypes') },
    { value: 'type', label: t('statistics.grouping.systemTypes') },
  ], [t]);

  // Prepare error data for the selected date range
  const errorDataArray = useMemo(() => {
    const errorData = errorStore._rawdata || {};
    
    // Combine all available data
    const allData: ErrorRecord[] = Object.values(errorData)
      .flat()
      .filter(record => record !== undefined);

    // Filter by date range
    const filteredData = allData.filter(record => {
      const recordDate = new Date(record.event_timestamp).toISOString().split('T')[0];
      return recordDate >= activeDateRange.startDate && recordDate <= activeDateRange.endDate;
    });
    
    return filteredData;
  }, [errorStore._rawdata, activeDateRange]);

  // Process data for stacked chart
  const chartData = useMemo(() => {
    if (!errorDataArray.length) return { categories: [], series: [] };

    // Group by date and stacking type
    const groupedData: { [date: string]: { [stackKey: string]: number } } = {};
    
    errorDataArray.forEach(record => {
      const date = new Date(record.event_timestamp).toISOString().split('T')[0];
      const stackKey = stackingType === 'errortype' ? record.errortype : record.type;
      
      if (!groupedData[date]) {
        groupedData[date] = {};
      }
      
      if (!groupedData[date][stackKey]) {
        groupedData[date][stackKey] = 0;
      }
      
      groupedData[date][stackKey] += record.event_count;
    });

    // Sort dates
    const sortedDates = Object.keys(groupedData).sort();
    
    // Get all unique stack keys
    const allStackKeys = Array.from(
      new Set(errorDataArray.map(record => 
        stackingType === 'errortype' ? record.errortype : record.type
      ))
    ).sort();

    // Create series data
    const series = allStackKeys.map(stackKey => ({
      name: stackKey,
      data: sortedDates.map(date => groupedData[date][stackKey] || 0),
      type: 'bar' as const,
      stack: 'error-stack',
      emphasis: {
        focus: 'series'
      }
    }));

    return {
      categories: sortedDates.map(date => dayjs(date).format('MMM DD')),
      rawDates: sortedDates, // Keep raw dates for data mapping
      series
    };
  }, [errorDataArray, stackingType]);

  const chartRef = useECharts((chart) => {
    if (!chartData.categories.length) return;

    chart.setOption({
      title: {
        text: t('statistics.errors.chartTitle'),
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: Array<{axisValue: string; marker: string; seriesName: string; value: number}>) {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          let total = 0;
          params.forEach((param: {marker: string; seriesName: string; value: number}) => {
            result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
            total += param.value;
          });
          result += `<strong>Total: ${total}</strong>`;
          return result;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        icon: 'rect'
      },
      grid: {
        left: '3%',
        right: '25%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.categories,
        axisLabel: {
          rotate: 45,
          interval: Math.ceil(chartData.categories.length / 30) // Show every 30th date for readability
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}'
        },
      },
      series: chartData.series
    });
  }, { dependencies: [chartData] });

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!errorDataArray.length) {
      return {
        totalErrors: 0,
        uniqueErrorTypes: 0,
        avgDailyErrors: 0,
        peakDailyErrors: 0
      };
    }

    const totalErrors = errorDataArray.reduce((sum, record) => sum + record.event_count, 0);
    const uniqueErrorTypes = new Set(errorDataArray.map(record => record.errortype)).size;
    
    // Calculate daily totals for avg/peak
    const dailyTotals: { [date: string]: number } = {};
    errorDataArray.forEach(record => {
      const date = new Date(record.event_timestamp).toISOString().split('T')[0];
      if (!dailyTotals[date]) dailyTotals[date] = 0;
      dailyTotals[date] += record.event_count;
    });

    const dailyValues = Object.values(dailyTotals);
    const avgDailyErrors = dailyValues.length > 0 ? Math.round(dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length) : 0;
    const peakDailyErrors = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;

    return {
      totalErrors,
      uniqueErrorTypes,
      avgDailyErrors,
      peakDailyErrors
    };
  }, [errorDataArray]);

  // Calculate breakdown data for tables
  const breakdownData = useMemo(() => {
    const errorTypeTotals = errorDataArray.reduce((acc, row) => {
      acc[row.errortype] = (acc[row.errortype] || 0) + row.event_count;
      return acc;
    }, {} as { [key: string]: number });

    const systemTypeTotals = errorDataArray.reduce((acc, row) => {
      acc[row.type] = (acc[row.type] || 0) + row.event_count;
      return acc;
    }, {} as { [key: string]: number });

    return {
      errorTypeTotals,
      systemTypeTotals
    };
  }, [errorDataArray]);

  if (errorStore.loading) {
    return (
      <div className="space-y-6">
        <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--color-background-level-3)] rounded w-64 mb-4"></div>
            <div className="h-80 bg-[var(--color-background-level-3)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)] relative">
        {/* Grouping Selector in top right corner */}
        <div className="absolute top-4 right-4 z-10">
          <GroupingSelector
            value={stackingType}
            onChange={(value) => onStackingChange(value as StackingType)}
            options={groupingOptions}
            label={t('statistics.controls.grouping')}
          />
        </div>
        
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">{t('statistics.errors.title')}</h2>
        <p className="text-[var(--color-text-muted)] mb-6">{t('statistics.errors.description')}</p>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{summaryStats.totalErrors.toLocaleString('fi-FI')}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('statistics.errors.totalErrors')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{summaryStats.uniqueErrorTypes}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('statistics.errors.uniqueTypes')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{summaryStats.avgDailyErrors}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('statistics.errors.avgDaily')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{summaryStats.peakDailyErrors}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{t('statistics.errors.peakDaily')}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-96">
          <div ref={chartRef} className="w-full h-full" />
        </div>
      </div>

      {/* Error Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Types Breakdown */}
        <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-4 border-b-2 border-[var(--color-separator)] pb-2">
            {t('statistics.grouping.errorTypes')}
          </h3>
          <div className="overflow-y-auto max-h-[300px]">
            {Object.entries(breakdownData.errorTypeTotals)
              .sort(([,a], [,b]) => b - a)
              .map(([errortype, count], index) => (
                <div key={errortype} className={`flex justify-between items-center py-3 ${index < Object.keys(breakdownData.errorTypeTotals).length - 1 ? 'border-b border-[var(--color-separator)]' : ''}`}>
                  <div>
                    <div className="font-medium text-[var(--color-text)] text-sm">
                      {errortype}
                    </div>
                  </div>
                  <div className="font-bold text-[var(--color-text)] text-base">
                    {count.toLocaleString('fi-FI')}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* System Types Breakdown */}
        <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-4 border-b-2 border-[var(--color-separator)] pb-2">
            {t('statistics.grouping.systemTypes')}
          </h3>
          <div className="overflow-y-auto max-h-[300px]">
            {Object.entries(breakdownData.systemTypeTotals)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count], index) => (
                <div key={type} className={`flex justify-between items-center py-3 ${index < Object.keys(breakdownData.systemTypeTotals).length - 1 ? 'border-b border-[var(--color-separator)]' : ''}`}>
                  <div>
                    <div className="font-medium text-[var(--color-text)] text-sm">
                      {type === 'system_error' ? 'System Error' : 'Validation Error'}
                    </div>
                  </div>
                  <div className="font-bold text-[var(--color-text)] text-base">
                    {count.toLocaleString('fi-FI')}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}