'use client';

import Link from 'next/link';
import { useLocalization } from '@/lib/stores/localization.store';
import { cn } from '@/lib/utils/cn';

interface BreadcrumbProps {
  currentPage: string;
  className?: string;
}

export default function Breadcrumb({ currentPage, className }: BreadcrumbProps) {
  const { t } = useLocalization();

  return (
    <nav aria-label="Breadcrumb" className={cn('breadcrumb-container', className)}>
      <Link href="/" className="breadcrumb-link">
        <svg 
          className="breadcrumb-home-icon" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path 
            d="M2 6L8 2L14 6V13C14 13.2652 13.8946 13.5196 13.7071 13.7071C13.5196 13.8946 13.2652 14 13 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V6Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M6 14V8H10V14" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {t('navigation.breadcrumb.home')}
      </Link>
      
      <span className="breadcrumb-separator" aria-hidden="true">&gt;</span>
      
      <Link href="#" className="breadcrumb-link">
        {t('navigation.breadcrumb.services')}
      </Link>
      
      <span className="breadcrumb-separator" aria-hidden="true">&gt;</span>
      
      <span className="breadcrumb-current" aria-current="page">
        {currentPage}
      </span>
    </nav>
  );
}
