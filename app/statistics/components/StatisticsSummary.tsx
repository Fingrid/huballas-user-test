'use client';

import { useEffect, useState } from 'react';
import { useUsageStore, useErrorStore, useResponseTimeStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/hooks/useECharts';
import type { UsageDataRecord, ErrorRecord, ResponseTimeRecord } from '@/lib/types';

interface StatisticsSummaryProps {}

export default function StatisticsSummary({}: StatisticsSummaryProps) {
  const { t } = useLocalization();
  const usageStore = useUsageStore();
  const errorStore = useErrorStore();
  const responseStore = useResponseTimeStore();

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalErrors: 0,
    avgResponseTime: 0,
    eventsGrowth: 0
  });

  // Always use current year (2025)
  const currentYear = new Date().getFullYear();

  // Get raw data from stores
  const usageRawData = usageStore._rawdata || {};
  const errorRawData = errorStore._rawdata || {};
  const responseRawData = responseStore._rawdata || {};

  useEffect(() => {
    if (Object.keys(usageRawData).length > 0 && 
        Object.keys(errorRawData).length > 0 && 
        Object.keys(responseRawData).length > 0) {
      
      // Combine all months data for the current year
      const allUsageData: UsageDataRecord[] = [];
      const allErrorData: ErrorRecord[] = [];
      const allResponseData: ResponseTimeRecord[] = [];

      // Get data for current year
      Object.entries(usageRawData).forEach(([month, data]) => {
        const yearFromMonth = month.split('-')[0];
        if (yearFromMonth === currentYear.toString()) {
          allUsageData.push(...data);
        }
      });

      Object.entries(errorRawData).forEach(([month, data]) => {
        const yearFromMonth = month.split('-')[0];
        if (yearFromMonth === currentYear.toString()) {
          allErrorData.push(...data);
        }
      });

      Object.entries(responseRawData).forEach(([month, data]) => {
        const yearFromMonth = month.split('-')[0];
        if (yearFromMonth === currentYear.toString()) {
          allResponseData.push(...data);
        }
      });

      // Calculate statistics
      const totalEvents = allUsageData.reduce((sum: number, item: UsageDataRecord) => sum + item.event_count, 0);
      const totalErrors = allErrorData.reduce((sum: number, item: ErrorRecord) => sum + item.event_count, 0);
      const avgResponseTime = allResponseData.length > 0 
        ? allResponseData.reduce((sum: number, item: ResponseTimeRecord) => sum + item.mean_response_time_ms, 0) / allResponseData.length
        : 0;

      // Calculate year-over-year growth for events
      const prevYearData: UsageDataRecord[] = [];
      Object.entries(usageRawData).forEach(([month, data]) => {
        const yearFromMonth = month.split('-')[0];
        if (yearFromMonth === (currentYear - 1).toString()) {
          prevYearData.push(...data);
        }
      });

      const prevYearTotal = prevYearData.reduce((sum: number, item: UsageDataRecord) => sum + item.event_count, 0);
      const eventsGrowth = prevYearTotal > 0 
        ? ((totalEvents - prevYearTotal) / prevYearTotal) * 100 
        : 0;

      setStats({
        totalEvents,
        totalErrors,
        avgResponseTime,
        eventsGrowth
      });
    }
  }, [usageRawData, errorRawData, responseRawData, currentYear]);

  // Response time chart
  const responseChartRef = useECharts((chart) => {
    if (Object.keys(responseRawData).length === 0) return;

    // Get response data for current year, limited to last 30 entries
    const yearResponseData: ResponseTimeRecord[] = [];
    Object.entries(responseRawData).forEach(([month, data]) => {
      const yearFromMonth = month.split('-')[0];
      if (yearFromMonth === currentYear.toString()) {
        yearResponseData.push(...data);
      }
    });

    const chartData = yearResponseData
      .slice(-30)
      .map((item: ResponseTimeRecord) => [
        item.timestamp,
        item.mean_response_time_ms
      ]);

    chart.setOption({
      grid: {
        left: 0,
        right: 0,
        top: 5,
        bottom: 5,
        containLabel: false
      },
      xAxis: {
        type: 'time',
        show: false
      },
      yAxis: {
        type: 'value',
        show: false
      },
      series: [{
        type: 'line',
        data: chartData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#009A96',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(0, 154, 150, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(0, 154, 150, 0.05)'
            }]
          }
        }
      }]
    });
  }, { dependencies: [responseRawData, currentYear] });

  const isLoading = usageStore.loading || errorStore.loading || responseStore.loading;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Annual Events Box */}
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">{t('statistics.summaryAnnualEvents')}</h3>
          {stats.eventsGrowth !== 0 && (
            <div className={`flex items-center text-sm ${
              stats.eventsGrowth > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="mr-1">
                {stats.eventsGrowth > 0 ? '↗' : '↘'}
              </span>
              {Math.abs(stats.eventsGrowth).toFixed(1)}%
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-background-level-3)] rounded mb-2"></div>
            <div className="h-4 bg-[var(--color-background-level-3)] rounded w-24"></div>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {stats.totalEvents.toLocaleString('fi-FI')}
            </div>
            <div className="text-sm text-[var(--color-text-subtle)]">
              {t('statistics.summaryTotalEvents')}
            </div>
          </>
        )}
      </div>

      {/* Error Count Box */}
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">{t('statistics.summaryErrors')}</h3>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-background-level-3)] rounded mb-2"></div>
            <div className="h-4 bg-[var(--color-background-level-3)] rounded w-24"></div>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {stats.totalErrors.toLocaleString('fi-FI')}
            </div>
            <div className="text-sm text-[var(--color-text-subtle)]">
              {t('statistics.summaryTotalErrors')}
            </div>
          </>
        )}
      </div>

      {/* Response Times Graph Box */}
      <div className="bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)]">{t('statistics.summaryResponseTimes')}</h3>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-20 bg-[var(--color-background-level-3)] rounded mb-2"></div>
          </div>
        ) : (
          <>
            <div className="h-20 mb-2">
              <div ref={responseChartRef} className="w-full h-full" />
            </div>
            <div className="text-sm text-[var(--color-text-subtle)]">
              {t('statistics.average')}: {stats.avgResponseTime.toFixed(0)}ms
            </div>
          </>
        )}
      </div>
    </div>
  );
}