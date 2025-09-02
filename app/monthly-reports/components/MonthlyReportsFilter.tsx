"use client";

import React from 'react';
import { cn } from '../../../lib/cn';

interface MonthlyReportsFilterProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  groupBy: 'channel' | 'process_group' | 'marketRoleCode';
  setGroupBy: (groupBy: 'channel' | 'process_group' | 'marketRoleCode') => void;
  availableMonths: string[];
}

// Style objects for consistent styling
const styles = {
  card: 'data-card mb-6',
  container: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 items-end',
  title: 'text-lg font-medium text-[var(--color-text)] mb-4',
  select: 'p-2 border border-[var(--color-separator)] bg-[var(--color-background-level-1)] text-[var(--color-text)] text-base min-w-[200px] w-full',
  buttonContainer: 'flex gap-2 flex-wrap'
};

export default function MonthlyReportsFilter({
  selectedMonth,
  setSelectedMonth,
  groupBy,
  setGroupBy,
  availableMonths
}: MonthlyReportsFilterProps) {
  return (
    <div className={styles.card}>
      <div className={styles.container}>
        <div>
          <h3 className={styles.title}>
            Select Month
          </h3>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={styles.select}
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <h3 className={styles.title}>
            Group By
          </h3>
          <div className={styles.buttonContainer}>
            {[
              { value: 'channel', label: 'Channel' },
              { value: 'process_group', label: 'Process Group' },
              { value: 'marketRoleCode', label: 'Market Role' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setGroupBy(option.value as 'channel' | 'process_group' | 'marketRoleCode')}
                className={`btn-toggle ${groupBy === option.value ? 'active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
