"use client";

import React from 'react';
import { LoadingDebugger } from '../../../components/LoadingDebugger';
import { ChartLoadingState } from '../../../components/ChartLoadingState';
import type { UsageDataRecord } from '../../../lib/stores';
import { cn } from '../../../lib/cn';

interface SummaryOverviewProps {
  usageData: UsageDataRecord[];
}

// Style objects for consistent styling
const styles = {
  container: 'bg-white border-2 border-[var(--color-primary-action)] p-8 shadow-[0_2px_6px_rgba(213,18,30,0.1)] mb-8 text-center',
  title: 'text-xl font-semibold text-[var(--color-text)] mb-2',
  value: 'text-5xl font-bold text-[var(--color-primary-action)] m-0'
};

export default function SummaryOverview({ usageData }: SummaryOverviewProps) {
  const totalEvents = usageData.reduce((sum, row) => sum + row.event_count, 0);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Total events
      </h2>
      <p className={styles.value}>
        {totalEvents.toLocaleString()}
      </p>
    </div>
  );
}
