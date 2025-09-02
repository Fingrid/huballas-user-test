"use client";

import React from 'react';
import { cn } from '../../../lib/cn';

interface TrendIconData {
  icon: string;
  text: string;
  color: string;
}

interface MonthlyStats {
  totalEvents: number;
  activeGroups: number;
  dailyAverage: number;
}

interface MonthlySummaryCardsProps {
  monthlyStats: MonthlyStats;
  groupBy: 'channel' | 'process_group' | 'marketRoleCode';
  trendIconData: TrendIconData;
}

// Style objects for consistent styling
const styles = {
  container: 'mb-6 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6',
  cardTitle: 'text-lg font-medium text-[var(--color-text)] mb-2',
  cardValue: 'text-3xl font-bold text-[var(--color-primary-action)] m-0',
  trendContainer: 'flex items-center text-sm mt-1',
  trendIcon: 'mr-1'
};

export default function MonthlySummaryCards({
  monthlyStats,
  groupBy,
  trendIconData
}: MonthlySummaryCardsProps) {
  const getGroupLabel = () => {
    switch (groupBy) {
      case 'marketRoleCode':
        return 'Market Roles';
      case 'process_group':
        return 'Process Groups';
      default:
        return 'Channels';
    }
  };

  return (
    <div className={styles.container}>
      <div className="data-card">
        <h3 className={styles.cardTitle}>
          Total Events
        </h3>
        <p className={styles.cardValue}>
          {monthlyStats.totalEvents.toLocaleString()}
        </p>
        <div 
          className={styles.trendContainer}
          style={{ color: trendIconData.color }}
        >
          <span className={styles.trendIcon}>{trendIconData.icon}</span>
          {trendIconData.text}
        </div>
      </div>
      
      <div className="data-card">
        <h3 className={styles.cardTitle}>
          Active {getGroupLabel()}
        </h3>
        <p className={styles.cardValue}>
          {monthlyStats.activeGroups}
        </p>
      </div>
      
      <div className="data-card">
        <h3 className={styles.cardTitle}>
          Avg Events/Day
        </h3>
        <p className={styles.cardValue}>
          {monthlyStats.dailyAverage.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
