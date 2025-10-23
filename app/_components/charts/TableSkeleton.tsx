'use client';

import { memo } from 'react';

export const TableSkeleton = memo(() => (
  <div className="animate-pulse" role="status" aria-label="Loading table">
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded"></div>
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
    <span className="sr-only">Loading table data...</span>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

export default TableSkeleton;
