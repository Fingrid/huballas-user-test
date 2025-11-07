"use client";

import React, { useState } from 'react';
import type { UsageDataRecord } from '@/lib/types';
import { useLocalization } from '@/lib/stores/localization.store';
import ContentBox from '@/app/_components/ui/ContentBox/ContentBox';
import { GridContainer } from '@/app/_components/layout';

type SortField = 'name' | 'count';
type SortDirection = 'asc' | 'desc';

interface BreakdownTablesProps {
  usageData: UsageDataRecord[];
  getMarketRoleDescription: (code: string) => string;
  getChannelDescription: (code: string) => string;
}

interface BreakdownTableItem {
  key: string;
  count: number;
  label: string;
  subLabel?: string;
}

interface BreakdownTableProps {
  title: string;
  items: BreakdownTableItem[];
  description?: string;
}

// Style objects for consistent styling - referencing CSS classes from globals.css
const styles = {
  tableWrapper: 'breakdown-table-wrapper',
  tableHeader: 'breakdown-table-header',
  tableTitle: 'breakdown-table-title',
  tableDescription: 'breakdown-table-description',
  table: 'breakdown-table',
  scrollContainer: 'breakdown-table-scroll-container',
  bodyRow: 'breakdown-table-body-row',
  bodyCell: 'breakdown-table-body-cell',
  headerCell: 'breakdown-table-header-cell',
  headerCellContent: 'breakdown-table-header-cell-content',
  headerCellText: 'breakdown-table-header-label',
  sortIcon: 'breakdown-table-sort-icon',
  sortIconActive: 'breakdown-table-sort-icon--active',
  itemName: 'breakdown-table-item-name',
  itemCode: 'breakdown-table-item-code',
  processGroupName: 'breakdown-table-process-group-name',
  count: 'breakdown-table-count',
};

/**
 * Sort icon component for table headers
 */
interface SortIconProps {
  field: SortField;
  currentSortField: SortField;
  sortDirection: SortDirection;
  t: (key: string) => string;
}

function SortIcon({ field, currentSortField, sortDirection, t }: SortIconProps) {
  const isActive = currentSortField === field;
  const iconClass = isActive 
    ? `${styles.sortIcon} ${styles.sortIconActive}`
    : styles.sortIcon;
  
  if (isActive) {
    return (
      <span className={iconClass} aria-label={sortDirection === 'asc' ? t('statistics.breakdown.sort.ascending') : t('statistics.breakdown.sort.descending')}>
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  }
  
  return (
    <span className={iconClass} aria-label={t('statistics.breakdown.sort.sortBy')}>
      ↕
    </span>
  );
}

/**
 * Internal component for rendering a single breakdown table
 */
function BreakdownTable({ title, items, description}: BreakdownTableProps) {
  const { t } = useLocalization();
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending for count, ascending for name
      setSortField(field);
      setSortDirection(field === 'count' ? 'desc' : 'asc');
    }
  };
  
  // Sort items based on current sort state
  const sortedItems = [...items].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.label.localeCompare(b.label);
    } else {
      comparison = a.count - b.count;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return (
    <ContentBox
      variant="table"
      header={
        <div className={styles.tableHeader}>
          <h4 className={styles.tableTitle}>{title}</h4>
          {description && (
            <p className={styles.tableDescription}>{description}</p>
          )}
        </div>
      }
    >
      {/* Table with column headers and data */}
      <div className={styles.scrollContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th 
                className={styles.headerCell}
                onClick={() => handleSort('name')}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('name');
                  }
                }}
              >
                <div className={styles.headerCellContent}>
                  <div className={styles.headerCellText}>
                    {t('statistics.breakdown.columnHeaders.item')}
                  </div>
                  <SortIcon 
                    field="name" 
                    currentSortField={sortField} 
                    sortDirection={sortDirection} 
                    t={t} 
                  />
                </div>
              </th>
              <th 
                className={styles.headerCell}
                onClick={() => handleSort('count')}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('count');
                  }
                }}
              >
                <div className={styles.headerCellContent}>
                  <div className={styles.headerCellText}>
                    {t('statistics.breakdown.columnHeaders.total')}
                  </div>
                  <SortIcon 
                    field="count" 
                    currentSortField={sortField} 
                    sortDirection={sortDirection} 
                    t={t} 
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.key} className={styles.bodyRow}>
                <td className={styles.bodyCell}>
                  <div className={item.subLabel ? styles.itemName : styles.processGroupName}>
                    {item.label}
                  </div>
                  {item.subLabel && (
                    <div className={styles.itemCode}>
                      {item.subLabel}
                    </div>
                  )}
                </td>
                <td className={styles.bodyCell}>
                  <div className={styles.count}>
                    {item.count.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentBox>
  );
}

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

  // Prepare data for market roles table
  const marketRoleItems: BreakdownTableItem[] = Object.entries(marketRoleTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => ({
      key: role,
      count,
      label: getMarketRoleDescription(role),
      subLabel: role
    }));

  // Prepare data for process groups table
  const processGroupItems: BreakdownTableItem[] = Object.entries(processGroupTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({
      key: group,
      count,
      label: group
    }));

  // Prepare data for channels table
  const channelItems: BreakdownTableItem[] = Object.entries(channelTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([channel, count]) => ({
      key: channel,
      count,
      label: getChannelDescription(channel),
      subLabel: channel
    }));

  return (
    <GridContainer direction="row">
      <div className={styles.tableWrapper}>
        <BreakdownTable 
          title={t('statistics.breakdown.marketRoles.title')} 
          description={t('statistics.breakdown.marketRoles.description')}
          items={marketRoleItems} 
        />
      </div>
      <div className={styles.tableWrapper}>
        <BreakdownTable 
          title={t('statistics.breakdown.processGroups.title')} 
          description={t('statistics.breakdown.processGroups.description')} 
          items={processGroupItems} 
        />
      </div>
      <div className={styles.tableWrapper}>
        <BreakdownTable 
          title={t('statistics.breakdown.channels.title')} 
          description={t('statistics.breakdown.channels.description')} 
          items={channelItems} 
        />
      </div>
    </GridContainer>
  );
}