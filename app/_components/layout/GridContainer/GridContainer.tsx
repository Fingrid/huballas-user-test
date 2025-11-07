'use client';

import { cn } from '@/lib/utils/cn';
import styles from './GridContainer.module.css';

interface GridContainerProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  className?: string;
}

/**
 * GridContainer provides a consistent flex layout for summary boxes and breakdown tables
 * Ensures equal width items with responsive behavior
 */
export default function GridContainer({ children, direction = 'row', className }: GridContainerProps) {
  return (
    <div className={cn(styles.container, styles[direction], className)}>
      {children}
    </div>
  );
}
