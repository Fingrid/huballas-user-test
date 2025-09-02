"use client";

import React from 'react';
import type { Statistics, DatasetStatistics } from '../utils/chartUtils';

interface StatisticsPanelProps {
  title: string;
  statistics: Statistics;
  className?: string;
}

export function StatisticsPanel({ title, statistics, className = '' }: StatisticsPanelProps) {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg border ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Count:</span>
          <span className="font-medium ml-1">{statistics.count.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Total:</span>
          <span className="font-medium ml-1">{Math.round(statistics.total).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Average:</span>
          <span className="font-medium ml-1">{Math.round(statistics.average).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Median:</span>
          <span className="font-medium ml-1">{Math.round(statistics.median).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Min:</span>
          <span className="font-medium ml-1">{Math.round(statistics.min).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Max:</span>
          <span className="font-medium ml-1">{Math.round(statistics.max).toLocaleString()}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Std Dev:</span>
          <span className="font-medium ml-1">{Math.round(statistics.standardDeviation).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface DatasetStatisticsPanelProps {
  datasetStatistics: DatasetStatistics;
  className?: string;
}

export function DatasetStatisticsPanel({ datasetStatistics, className = '' }: DatasetStatisticsPanelProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatisticsPanel 
          title="Whole Dataset (Response Times)" 
          statistics={datasetStatistics.wholeDataset}
        />
        <StatisticsPanel 
          title="Filtered Dataset (Response Times)" 
          statistics={datasetStatistics.filteredDataset}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatisticsPanel 
          title="Standard Deviations" 
          statistics={datasetStatistics.standardDeviationStats}
        />
        <StatisticsPanel 
          title="Event Counts" 
          statistics={datasetStatistics.eventCountStats}
        />
      </div>
    </div>
  );
}
