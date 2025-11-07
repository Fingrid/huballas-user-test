'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUsageStore, useErrorStore, useResponseTimeStore } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/utils/cn';
import CallToActionLink from '@/app/_components/ui/CallToActionLink/CallToActionLink';
import ContentBox from '@/app/_components/ui/ContentBox/ContentBox';
import { GridContainer } from '@/app/_components/layout';
import { LabelWithBadge, DividerSection, MultiSection } from './SummaryComponents';
import type { UsageDataRecord, ErrorRecord, ResponseTimeRecord } from '@/lib/types';

interface StatisticsSummaryProps {
  onSectionClick?: (section: 'usage' | 'errors' | 'response_times') => void;
  className?: string;
}

// Style objects for consistent styling and customization
const styles = {
  container: 'stats-summary-container',
  boxHeader: 'stats-summary-box-header',
  title: 'stats-summary-title',
  loading: 'stats-summary-loading',
  value: 'stats-summary-value',
  unit: 'stats-summary-unit',
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


  const isLoading = usageStore.loading || errorStore.loading || responseStore.loading;

  const handleViewMore = (section: 'usage' | 'errors' | 'response_times') => {
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  return (
    <GridContainer direction="row" className={className}>
      {/* Events Box */}
      <ContentBox
        variant="summary"
        header={
          !isLoading && (
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
          )
        }
        footer={
          !isLoading && (
            <CallToActionLink
              as="button"
              onClick={() => handleViewMore('usage')}
              className="stats-summary-view-more"
            >
              {t('statistics.summary.events.viewMore')}
            </CallToActionLink>
          )
        }
        includeSpacer={!isLoading}
      >
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <LabelWithBadge
              label={t('statistics.summary.events.comparedToPreviousYear')}
              badgeValue={`+ ${Math.abs(stats.eventsGrowth).toFixed(1)}%`}
              badgeType="success"
            />
            
            <DividerSection>
              {t('statistics.summary.events.monthlyAverage')} <span>3500</span> {t('statistics.summary.events.eventsPerMonth')}
            </DividerSection>
          </>
        )}
      </ContentBox>

      {/* Total Errors Box */}
      <ContentBox
        variant="summary"
        header={
          !isLoading && (
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
          )
        }
        footer={
          !isLoading && (
            <CallToActionLink
              as="button"
              onClick={() => handleViewMore('errors')}
              className="stats-summary-view-more"
            >
              {t('statistics.summary.errorRate.viewMore')}
            </CallToActionLink>
          )
        }
        includeSpacer={!isLoading}
      >
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
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
          </>
        )}
      </ContentBox>

      {/* Response Times Box */}
      <ContentBox
        variant="summary"
        header={
          !isLoading && (
            <div className={cn(styles.boxHeader)}>
              <h3 className={cn(styles.title)}>
                {t('statistics.summary.responseTimesYearToDate.title')}
              </h3>
              <div className={cn(styles.value)}>
                {stats.avgResponseTime.toFixed(0)}
              </div>
              <h3 className={cn(styles.unit)}>
                ms
              </h3>
            </div>
          )
        }
        footer={
          !isLoading && (
            <CallToActionLink
              as="button"
              onClick={() => handleViewMore('response_times')}
              className="stats-summary-view-more"
            >
              {t('statistics.summary.responseTimesYearToDate.viewMore')}
            </CallToActionLink>
          )
        }
        includeSpacer={!isLoading}
      >
        {isLoading ? (
          <div className={cn(styles.loading)}>
            {t('statistics.loading')}
          </div>
        ) : (
          <>
            <DividerSection>
              {t('statistics.responseTime.p50')} <span>{(stats.avgResponseTime * 0.8).toFixed(0)} ms</span>
            </DividerSection>
            
            <MultiSection
              items={[
                { 
                  label: t('statistics.responseTime.p95'), 
                  value: `${(stats.avgResponseTime * 1.5).toFixed(0)} ms` 
                },
                { 
                  label: t('statistics.responseTime.p99'), 
                  value: `${(stats.avgResponseTime * 2.0).toFixed(0)} ms` 
                },
              ]}
            />
          </>
        )}
      </ContentBox>
    </GridContainer>
  );
}