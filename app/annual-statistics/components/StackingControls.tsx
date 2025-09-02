"use client";

import React from 'react';
import { cn } from '../../../lib/cn';

type StackingType = 'channel' | 'process_group' | 'marketRoleCode';

interface StackingControlsProps {
  stackingType: StackingType;
  setStackingType: (type: StackingType) => void;
  getChannels: () => string[];
  getProcessGroups: () => string[];
  getMarketRoles: () => string[];
}

// Style objects for consistent styling
const styles = {
  container: 'mb-6',
  title: 'text-lg font-medium text-[var(--color-text)] mb-3',
  buttonContainer: 'flex gap-2 flex-wrap'
};

export default function StackingControls({ 
  stackingType, 
  setStackingType, 
  getChannels, 
  getProcessGroups, 
  getMarketRoles 
}: StackingControlsProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Group by:
      </h3>
      <div className={styles.buttonContainer}>
        <button
          onClick={() => setStackingType('channel')}
          className={`btn-toggle ${stackingType === 'channel' ? 'active' : ''}`}
        >
          Channel ({getChannels().length})
        </button>
        <button
          onClick={() => setStackingType('process_group')}
          className={`btn-toggle ${stackingType === 'process_group' ? 'active' : ''}`}
        >
          Process Group ({getProcessGroups().length})
        </button>
        <button
          onClick={() => setStackingType('marketRoleCode')}
          className={`btn-toggle ${stackingType === 'marketRoleCode' ? 'active' : ''}`}
        >
          Market Role ({getMarketRoles().length})
        </button>
      </div>
    </div>
  );
}
