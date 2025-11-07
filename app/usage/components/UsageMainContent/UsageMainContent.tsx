'use client';

import { cn } from '@/lib/utils/cn';
import styles from './UsageMainContent.module.css';

interface UsageMainContentProps {
  children: React.ReactNode;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

export default function UsageMainContent({ children, contentRef }: UsageMainContentProps) {
  return (
    <div ref={contentRef} className={cn(styles.mainContent)}>
      <section className={cn(styles.section)}>
        {children}
      </section>
    </div>
  );
}
