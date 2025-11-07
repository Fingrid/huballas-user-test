'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './ContentBox.module.css';

export type ContentBoxVariant = 'summary' | 'table' | 'default';

interface ContentBoxProps {
  /**
   * Main content of the box
   */
  children: ReactNode;
  
  /**
   * Optional header content
   */
  header?: ReactNode;
  
  /**
   * Optional footer content (e.g., call to action button)
   */
  footer?: ReactNode;
  
  /**
   * Variant of the box
   * - 'summary': Fixed height (24rem) with larger padding for summary cards
   * - 'table': Flexible height for table containers
   * - 'default': Standard box styling
   */
  variant?: ContentBoxVariant;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Additional CSS classes for the content area
   */
  contentClassName?: string;
  
  /**
   * Whether to include a spacer that pushes footer to the bottom
   */
  includeSpacer?: boolean;
}

export default function ContentBox({
  children,
  header,
  footer,
  variant = 'default',
  className,
  contentClassName,
  includeSpacer = false,
}: ContentBoxProps) {
  return (
    <div 
      className={cn(
        styles.box,
        variant === 'summary' && styles.summary,
        variant === 'table' && styles.table,
        className
      )}
    >
      {header && (
        <div className={styles.header}>
          {header}
        </div>
      )}
      
      <div className={cn(styles.content, contentClassName)}>
        {children}
      </div>
      
      {includeSpacer && <div className={styles.spacer} />}
      
      {footer}
    </div>
  );
}
