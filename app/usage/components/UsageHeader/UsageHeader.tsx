'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { Breadcrumb, CallToActionLink } from '@/app/_components/ui';
import { cn } from '@/lib/utils/cn';
import styles from './UsageHeader.module.css';

interface UsageHeaderProps {
  children?: React.ReactNode;
}

export default function UsageHeader({ children }: UsageHeaderProps) {
  const { t } = useLocalization();

  return (
    <div className={cn(styles.headerWrapper)}>
      <div className={cn(styles.background)} />
      <div className={cn(styles.container)}>
        <div className={cn(styles.titleContainer)}>
          <Breadcrumb currentPage={t('navigation.usage')} />
          <h1 className={cn(styles.title)}>
            {t('usage.pageTitle')}
          </h1>
        </div>
        
        <p className={cn(styles.description)}>
          {t('usage.pageDescription')}
        </p>
        
        <CallToActionLink href="#">
          {t('navigation.moreInfo')}
        </CallToActionLink>
        
        <div className={cn(styles.summarySection)}>
          <h2 className={cn(styles.summaryTitle)}>
            {t('usage.yearToDate')}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
