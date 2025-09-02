"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

// Style objects for consistent styling
const styles = {
  container: 'fixed top-2.5 right-2.5 bg-black/90 text-white p-2.5 text-xs max-w-md z-[1000] rounded',
  logItem: 'mb-0.5'
};

export function LoadingDebugger() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Intercept console.log to capture our loading logs
    const originalLog = console.log;
    const logItems: string[] = [];
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('📥') || message.includes('⏳') || message.includes('Fetching') || message.includes('Using cached')) {
        logItems.push(`${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`);
        setLogs([...logItems]);
      }
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className={styles.container}>
      <h4>CSV Loading Debug:</h4>
      {logs.map((log, index) => (
        <div key={index} className={styles.logItem}>{log}</div>
      ))}
    </div>
  );
}
