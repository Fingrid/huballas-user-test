"use client";

import React from 'react';
import type { UsageDataRecord } from '@/lib/types';
import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/utils/cn';

interface BreakdownTablesProps {
  usageData: UsageDataRecord[];
  getMarketRoleDescription: (code: string) => string;
  getChannelDescription: (code: string) => string;
}

// Style objects for consistent styling
const styles = {
  container: 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 mb-8',
  table: 'bg-[var(--color-background-level-1)] border border-[var(--color-separator)] p-6 shadow-fingrid rounded-[var(--border-radius-default)]',
  tableTitle: 'text-xl font-semibold text-[var(--color-text)] mb-4 border-b-2 border-[var(--color-separator)] pb-2',
  scrollContainer: 'overflow-y-auto max-h-[300px]',
  row: 'flex justify-between items-center py-3',
  rowBorder: 'border-b border-[var(--color-separator)]',
  itemName: 'font-medium text-[var(--color-text)] text-sm mb-0.5',
  itemCode: 'text-xs text-[var(--color-text-muted)]',
  processGroupName: 'font-medium text-[var(--color-text)] text-sm',
  count: 'font-bold text-[var(--color-text)] text-base'
};

export default function BreakdownTables({ 
  usageData, 
  getMarketRoleDescription, 
  getChannelDescription 
}: BreakdownTablesProps) {
  const { t } = useLocalization();
  
  // Calculate totals for each category
  const marketRoleTotals = usageData.reduce((acc, row) => {
    acc[row.marketRoleCode] = (acc[row.marketRoleCode] || 0) + row.event_count;
    return acc;
  }, {} as { [key: string]: number });

  const processGroupTotals = usageData.reduce((acc, row) => {
    acc[row.process_group] = (acc[row.process_group] || 0) + row.event_count;
    return acc;
  }, {} as { [key: string]: number });

  const channelTotals = usageData.reduce((acc, row) => {
    acc[row.channel] = (acc[row.channel] || 0) + row.event_count;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className={styles.container}>
      {/* Market Roles Table */}
      <div className={styles.table}>
        <h3 className={styles.tableTitle}>
          {t('statistics.breakdown.marketRoles')}
        </h3>
        <div className={styles.scrollContainer}>
          {Object.entries(marketRoleTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([role, count], index) => (
              <div 
                key={role} 
                className={cn(
                  styles.row,
                  index < Object.entries(marketRoleTotals).length - 1 && styles.rowBorder
                )}
              >
                <div>
                  <div className={styles.itemName}>
                    {getMarketRoleDescription(role)}
                  </div>
                  <div className={styles.itemCode}>
                    {role}
                  </div>
                </div>
                <div className={styles.count}>
                  {count.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Process Groups Table */}
      <div className={styles.table}>
        <h3 className={styles.tableTitle}>
          {t('statistics.breakdown.processGroups')}
        </h3>
        <div className={styles.scrollContainer}>
          {Object.entries(processGroupTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([group, count], index) => (
              <div 
                key={group} 
                className={cn(
                  styles.row,
                  index < Object.entries(processGroupTotals).length - 1 && styles.rowBorder
                )}
              >
                <div className={styles.processGroupName}>
                  {group}
                </div>
                <div className={styles.count}>
                  {count.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Channels Table */}
      <div className={styles.table}>
        <h3 className={styles.tableTitle}>
          {t('statistics.breakdown.channels')}
        </h3>
        <div className={styles.scrollContainer}>
          {Object.entries(channelTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([channel, count], index) => (
              <div 
                key={channel} 
                className={cn(
                  styles.row,
                  index < Object.entries(channelTotals).length - 1 && styles.rowBorder
                )}
              >
                <div>
                  <div className={styles.itemName}>
                    {getChannelDescription(channel)}
                  </div>
                  <div className={styles.itemCode}>
                    {channel}
                  </div>
                </div>
                <div className={styles.count}>
                  {count.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}