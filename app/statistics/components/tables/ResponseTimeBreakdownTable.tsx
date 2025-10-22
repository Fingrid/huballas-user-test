"use client";

import React from 'react';
import type { ChannelBreakdownData } from '@/lib/stores';
import { useLocalization } from '@/lib/stores/localization.store';
import { useDictionaryStore } from '@/lib/stores';

interface ResponseTimeBreakdownTableProps {
  channelBreakdown: ChannelBreakdownData[];
}

export default function ResponseTimeBreakdownTable({ 
  channelBreakdown 
}: ResponseTimeBreakdownTableProps) {
  const { t } = useLocalization();
  const dictionaryStore = useDictionaryStore();
  
  if (!channelBreakdown || channelBreakdown.length === 0) {
    return (
      <div className="statistics__no-data">
        {t('statistics.responseTime.noDataForRange')}
      </div>
    );
  }

  return (
    <div className="statistics__breakdown">
      <h3 className="statistics__breakdown-title">
        {t('statistics.responseTime.channelBreakdown')}
      </h3>
      
      <table className="statistics__breakdown-table">
        <thead>
          <tr>
            <th>{t('statistics.breakdown.headers.channel')}</th>
            <th>{t('statistics.breakdown.headers.average')}</th>
            <th>{t('statistics.breakdown.headers.median')}</th>
            <th>{t('statistics.breakdown.headers.stdDev')}</th>
            <th>{t('statistics.breakdown.headers.events')}</th>
          </tr>
        </thead>
        <tbody>
          {channelBreakdown
            .sort((a, b) => a.avgResponseTime - b.avgResponseTime)
            .map((breakdown) => (
              <tr key={breakdown.channel}>
                <td>
                  <div style={{ fontWeight: 500 }}>
                    {dictionaryStore.getChannelDescription(breakdown.channel)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                    {breakdown.channel}
                  </div>
                </td>
                <td>{Math.round(breakdown.avgResponseTime)}</td>
                <td>{Math.round(breakdown.medianResponseTime)}</td>
                <td>{Math.round(breakdown.stdDeviation)}</td>
                <td>{breakdown.eventCount.toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}