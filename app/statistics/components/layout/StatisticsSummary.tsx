'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUsageStore, useErrorStore, useResponseTimeStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useECharts } from '@/lib/hooks/useECharts';
import { cn } from '@/lib/utils/cn';
import CallToActionLink from '@/app/_components/ui/CallToActionLink';
import type { UsageDataRecord, ErrorRecord, ResponseTimeRecord } from '@/lib/types';

interface StatisticsSummaryProps {
  onSectionClick?: (section: 'usage' | 'errors' | 'response_times') => void;
  className?: string;
}

// Style objects for consistent styling and customization
const styles = {
  container: 'stats-summary-container',
  box: 'stats-summary-box',
  boxHeader: 'stats-summary-box-header',
  boxContent: 'stats-summary-box-content',
  boxSpacer: 'stats-summary-box-spacer',
  boxResponseTime: 'stats-summary-box-response-time',
  title: 'stats-summary-title',
  loading: 'stats-summary-loading',
  value: 'stats-summary-value',
  unit: 'stats-summary-unit',
  label: 'stats-summary-label',
  labelBadgeRow: 'stats-summary-label-badge-row',
  badge: 'stats-summary-badge',
  badgeSuccess: 'stats-summary-badge-success',
  badgeError: 'stats-summary-badge-error',
  dividerSection: 'stats-summary-divider-section',
  multiSection: 'stats-summary-multi-section',
  chartContainer: 'stats-summary-chart-container',
  chartWrapper: 'stats-summary-chart-wrapper',
  chart: 'stats-summary-chart',
};

// Internal component for badge with label
interface LabelWithBadgeProps {
  label: string;
  badgeValue: string;
  badgeType: 'success' | 'error';
}

function LabelWithBadge({ label, badgeValue, badgeType }: LabelWithBadgeProps) {
  return (
    <div className={cn(styles.labelBadgeRow)}>
      <div className={cn(styles.label)}>{label}</div>
      <div className={cn(styles.badge, badgeType === 'success' ? styles.badgeSuccess : styles.badgeError)}>
        <span>{badgeValue}</span>
      </div>
    </div>
  );
}

// Internal component for divider section with text
interface DividerSectionProps {
  children: React.ReactNode;
}

function DividerSection({ children }: DividerSectionProps) {
  return (
    <div className={cn(styles.dividerSection)}>
      <p>{children}</p>
    </div>
  );
}

// Internal component for multi-section content
interface MultiSectionProps {
  items: Array<{ label: string; value: string }>;
}

function MultiSection({ items }: MultiSectionProps) {
  return (
    <div className={cn(styles.multiSection)}>
      {items.map((item, index) => (
        <div key={index}>
          <p>
            {item.label} <span>{item.value}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

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

  // Calculate statistics using useMemo to avoid setState in effect
  const calculatedStats = useMemo(() => {
    // Get raw data from stores
    const usageRawData = usageStore._rawdata || {};
    const errorRawData = errorStore._rawdata || {};
    const responseRawData = responseStore._rawdata || {};
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

      return {
        totalEvents,
        totalErrors,
        avgResponseTime,
        eventsGrowth
      };
    }
    return {
      totalEvents: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      eventsGrowth: 0
    };
  }, [usageStore._rawdata, errorStore._rawdata, responseStore._rawdata, currentYear]);

  // Update stats when calculation changes
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  // Response time chart
  const responseChartRef = useECharts((chart) => {
    const responseRawData = responseStore._rawdata || {};
    if (Object.keys(responseRawData).length === 0) return;

    // Get response data for current year, limited to last 30 entries
    const yearResponseData: ResponseTimeRecord[] = [];
    Object.entries(responseRawData).forEach(([month, data]) => {
      const yearFromMonth = month.split('-')[0];
      if (yearFromMonth === currentYear.toString()) {
        yearResponseData.push(...(data as ResponseTimeRecord[]));
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
  }, { dependencies: [responseStore._rawdata, currentYear] });

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
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={cn(styles.boxHeader)}>
              <h3 className={cn(styles.title)}>
                {t('statistics.summary.events.title')}
              </h3>
              <div className={cn(styles.value)}>
                {stats.totalEvents.toLocaleString('fi-FI')}
              </div>
              <h3 className={cn(styles.unit)}>
                {t('statistics.summary.events.unit')}
              </h3>
            </div>
            
            {/* Content */}
            <div className={cn(styles.boxContent)}>
              <LabelWithBadge
                label={t('statistics.summary.events.comparedToPreviousYear')}
                badgeValue={`+ ${Math.abs(stats.eventsGrowth).toFixed(1)}%`}
                badgeType="success"
              />
              
              <DividerSection>
                {t('statistics.summary.events.monthlyAverage')} <span>3500</span> {t('statistics.summary.events.eventsPerMonth')}
              </DividerSection>
            </div>
            
            {/* Spacer */}
            <div className={cn(styles.boxSpacer)} />
            
            {/* Call to Action */}
            <CallToActionLink
              as="button"
              onClick={() => handleViewMore('usage')}
              className="stats-summary-view-more"
            >
              {t('statistics.summary.events.viewMore')}
            </CallToActionLink>
          </>
        )}
      </div>

      {/* Errors Box */}
      <div className={cn(styles.box)}>
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={cn(styles.boxHeader)}>
              <h3 className={cn(styles.title)}>
                {t('statistics.summary.errorRate.title')}
              </h3>
              <div className={cn(styles.value)}>
                1,3 %
              </div>
              <h3 className={cn(styles.unit)}>
                {t('statistics.summary.errorRate.unit')}
              </h3>
            </div>
            
            {/* Content */}
            <div className={cn(styles.boxContent)}>
              <LabelWithBadge
                label={t('statistics.summary.errorRate.comparedToPreviousYear')}
                badgeValue="+ 2%"
                badgeType="error"
              />
              
              <MultiSection
                items={[
                  { 
                    label: t('statistics.summary.errorRate.technicalErrors'), 
                    value: `4000 ${t('statistics.summary.errorRate.pieces')}` 
                  },
                  { 
                    label: t('statistics.summary.errorRate.validationErrors'), 
                    value: `1200 ${t('statistics.summary.errorRate.pieces')}` 
                  },
                ]}
              />
            </div>
            
            {/* Spacer */}
            <div className={cn(styles.boxSpacer)} />
            
            {/* Call to Action */}
            <CallToActionLink
              as="button"
              onClick={() => handleViewMore('errors')}
              className="stats-summary-view-more"
            >
              {t('statistics.summary.errorRate.viewMore')}
            </CallToActionLink>
          </>
        )}
      </div>

      {/* Response Times Box */}
      <div className={cn(styles.box, styles.boxResponseTime)}>
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={cn(styles.boxHeader)}>
              <h3 className={cn(styles.title)}>
                {t('statistics.summary.responseTimesYearToDate.title')}
              </h3>
            </div>
            
            {/* Content */}
            <div className={cn(styles.boxContent)}>
              <div className={cn(styles.chartContainer)}>
                <div className={cn(styles.chartWrapper)}>
                  <div ref={responseChartRef} className={cn(styles.chart)} />
                </div>
              </div>
            </div>
            
            {/* Spacer */}
            <div className={cn(styles.boxSpacer)} />
            
            {/* Call to Action */}
            <CallToActionLink
              as="button"
              onClick={() => handleViewMore('response_times')}
              className="stats-summary-view-more"
            >
              {t('statistics.summary.responseTimesYearToDate.viewMore')}
            </CallToActionLink>
          </>
        )}
      </div>
    </div>
  );
}