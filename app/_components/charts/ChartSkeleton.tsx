'use client';

import { memo } from 'react';

export const ChartSkeleton = memo(() => (
  <div className="animate-pulse" role="status" aria-label="Loading chart">
    <div className="h-64 bg-gray-200 rounded-md mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <span className="sr-only">Loading chart data...</span>
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

export default ChartSkeleton;
