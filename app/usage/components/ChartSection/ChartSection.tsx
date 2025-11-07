'use client';

import { cn } from '@/lib/utils/cn';
import styles from './ChartSection.module.css';

interface ChartSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartSection({ title, description, children, className }: ChartSectionProps) {
  return (
    <div className={cn(styles.chartSection, className)}>
      <div className={cn(styles.header)}>
        <h3 className={cn(styles.title)}>{title}</h3>
        {description && (
          <p className={cn(styles.description)}>{description}</p>
        )}
      </div>
      
      {children}
    </div>
  );
}
