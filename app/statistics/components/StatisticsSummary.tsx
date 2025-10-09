'use client';

import { useEffect, useState } from 'react';
import { useUsageStore, useErrorStore, useResponseTimeStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/hooks/useECharts';
import type { UsageDataRecord, ErrorRecord, ResponseTimeRecord } from '@/lib/types';

interface StatisticsSummaryProps {
  onSectionClick?: (section: 'usage' | 'errors' | 'response_times') => void;
}

export default function StatisticsSummary({ onSectionClick }: StatisticsSummaryProps) {
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

  const handleViewMore = (section: 'usage' | 'errors' | 'response_times') => {
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row justify-start items-stretch gap-6">
      {/* Events Box */}
      <div className="flex-1 h-96 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.10)] border border-zinc-100 p-6 flex flex-col ml-0">
        <h3 className="text-[var(--color-text)] text-2xl font-normal leading-normal mb-4">
          Tapahtumat
        </h3>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text)]">
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <div className="text-[var(--color-text)] text-3xl font-normal leading-normal mb-1">
              {stats.totalEvents.toLocaleString('fi-FI')}
            </div>
            <div className="text-[var(--color-text)] text-base font-normal leading-normal mb-4">
              kappaletta
            </div>
            
            <div className="text-[var(--color-text)] text-sm font-normal leading-none mb-2">
              Suhteessa edelliseen vuoteen
            </div>
            
            <div className="mb-4">
              <div className="inline-flex px-4 py-1 bg-[#E6F4F3] rounded-xl outline-1 outline-offset-[-1px] outline-[#009A96] items-center gap-1">
                <span className="text-[var(--color-text)] text-sm font-normal leading-none">
                  + {Math.abs(stats.eventsGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-[var(--color-separator)]">
              <p className="text-[var(--color-text)] text-sm font-normal leading-normal">
                Kuukauden keskiarvo <span className="font-bold">3500</span> tapahtumaa/kuukausi
              </p>
            </div>
            
            <button 
              onClick={() => handleViewMore('usage')}
              className="mt-4 pt-4 -mx-6 px-6 border-t border-[var(--color-separator)] text-[var(--color-text)] text-sm font-bold leading-normal hover:underline text-center w-[calc(100%+3rem)]"
            >
              Tarkastele tarkemmin <span className="text-[var(--color-primary-action)]">→</span>
            </button>
          </>
        )}
      </div>

      {/* Errors Box */}
      <div className="flex-1 h-96 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.10)] border border-zinc-100 p-6 flex flex-col">
        <h3 className="text-[var(--color-text)] text-2xl font-normal leading-normal mb-4">
          Virheiden osuus
        </h3>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text)]">
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <div className="text-[var(--color-text)] text-3xl font-normal leading-normal mb-1">
              1,3 %
            </div>
            <div className="text-[var(--color-text)] text-base font-normal leading-normal mb-4">
              kaikista tapahtumista
            </div>
            
            <div className="text-[var(--color-text)] text-sm font-normal leading-none mb-2">
              Suhteessa edelliseen vuoteen
            </div>
            
            <div className="mb-4">
              <div className="inline-flex px-4 py-1 bg-[#FEF3F2] rounded-xl outline-1 outline-offset-[-1px] outline-[#D5121E] items-center gap-1">
                <span className="text-[#D5121E] text-sm font-normal leading-none">
                  + 2%
                </span>
              </div>
            </div>
            
            <div className="mt-auto space-y-2">
              <div className="pt-2 border-t border-[var(--color-separator)]">
                <p className="text-[var(--color-text)] text-sm font-normal leading-normal">
                  Teknisiä virheitä <span className="font-bold">4000 kpl</span>
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-separator)]">
                <p className="text-[var(--color-text)] text-sm font-normal leading-normal">
                  Validointi virheitä <span className="font-bold">1200 kpl</span>
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => handleViewMore('errors')}
              className="mt-4 pt-4 -mx-6 px-6 border-t border-[var(--color-separator)] text-[var(--color-text)] text-sm font-bold leading-normal hover:underline text-center w-[calc(100%+3rem)]"
            >
              Tarkastele tarkemmin <span className="text-[var(--color-primary-action)]">→</span>
            </button>
          </>
        )}
      </div>

      {/* Response Times Box */}
      <div className="w-full lg:w-[501px] h-96 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.10)] border border-zinc-100 p-6 flex flex-col mr-0">
        <h3 className="text-[var(--color-text)] text-2xl font-normal leading-normal mb-4">
          Vasteajat vuoden alusta
        </h3>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text)]">
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center mb-4">
              <div className="w-full h-full border border-[var(--color-separator)] p-4">
                <div ref={responseChartRef} className="w-full h-full" />
              </div>
            </div>
            
            <button 
              onClick={() => handleViewMore('response_times')}
              className="mt-4 pt-4 -mx-6 px-6 border-t border-[var(--color-separator)] text-[var(--color-text)] text-sm font-bold leading-normal hover:underline text-center w-[calc(100%+3rem)]"
            >
              Tarkastele tarkemmin <span className="text-[var(--color-primary-action)]">→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}