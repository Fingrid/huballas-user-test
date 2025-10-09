'use client';

import { useEffect, useState } from 'react';
import { useUsageStore, useErrorStore, useResponseTimeStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/hooks/useECharts';
import { cn } from '@/lib/cn';
import type { UsageDataRecord, ErrorRecord, ResponseTimeRecord } from '@/lib/types';

interface StatisticsSummaryProps {
  onSectionClick?: (section: 'usage' | 'errors' | 'response_times') => void;
  className?: string;
}

// Style objects for consistent styling and customization
const styles = {
  container: 'stats-summary-container',
  box: 'stats-summary-box',
  boxResponseTime: 'stats-summary-box-response-time',
  title: 'stats-summary-title',
  loading: 'stats-summary-loading',
  value: 'stats-summary-value',
  unit: 'stats-summary-unit',
  label: 'stats-summary-label',
  badge: 'stats-summary-badge',
  badgeSuccess: 'stats-summary-badge-success',
  badgeError: 'stats-summary-badge-error',
  dividerSection: 'stats-summary-divider-section',
  multiSection: 'stats-summary-multi-section',
  viewMore: 'stats-summary-view-more',
  chartContainer: 'stats-summary-chart-container',
  chartWrapper: 'stats-summary-chart-wrapper',
  chart: 'stats-summary-chart',
};

export default function StatisticsSummary({ onSectionClick, className }: StatisticsSummaryProps) {
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
    <div className={cn(styles.container, className)}>
      {/* Events Box */}
      <div className={cn(styles.box)}>
        <h3 className={cn(styles.title)}>
          Tapahtumat
        </h3>
        
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <div className={cn(styles.value)}>
              {stats.totalEvents.toLocaleString('fi-FI')}
            </div>
            <div className={cn(styles.unit)}>
              kappaletta
            </div>
            
            <div className={cn(styles.label)}>
              Suhteessa edelliseen vuoteen
            </div>
            
            <div className="mb-4">
              <div className={cn(styles.badge, styles.badgeSuccess)}>
                <span>
                  + {Math.abs(stats.eventsGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className={cn(styles.dividerSection)}>
              <p>
                Kuukauden keskiarvo <span>3500</span> tapahtumaa/kuukausi
              </p>
            </div>
            
            <button 
              onClick={() => handleViewMore('usage')}
              className={cn(styles.viewMore)}
            >
              Tarkastele tarkemmin <span>→</span>
            </button>
          </>
        )}
      </div>

      {/* Errors Box */}
      <div className={cn(styles.box)}>
        <h3 className={cn(styles.title)}>
          Virheiden osuus
        </h3>
        
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <div className={cn(styles.value)}>
              1,3 %
            </div>
            <div className={cn(styles.unit)}>
              kaikista tapahtumista
            </div>
            
            <div className={cn(styles.label)}>
              Suhteessa edelliseen vuoteen
            </div>
            
            <div className="mb-4">
              <div className={cn(styles.badge, styles.badgeError)}>
                <span>
                  + 2%
                </span>
              </div>
            </div>
            
            <div className={cn(styles.multiSection)}>
              <div>
                <p>
                  Teknisiä virheitä <span>4000 kpl</span>
                </p>
              </div>
              <div>
                <p>
                  Validointi virheitä <span>1200 kpl</span>
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => handleViewMore('errors')}
              className={cn(styles.viewMore)}
            >
              Tarkastele tarkemmin <span>→</span>
            </button>
          </>
        )}
      </div>

      {/* Response Times Box */}
      <div className={cn(styles.box, styles.boxResponseTime)}>
        <h3 className={cn(styles.title)}>
          Vasteajat vuoden alusta
        </h3>
        
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <div className={cn(styles.chartContainer)}>
              <div className={cn(styles.chartWrapper)}>
                <div ref={responseChartRef} className={cn(styles.chart)} />
              </div>
            </div>
            
            <button 
              onClick={() => handleViewMore('response_times')}
              className={cn(styles.viewMore)}
            >
              Tarkastele tarkemmin <span>→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}