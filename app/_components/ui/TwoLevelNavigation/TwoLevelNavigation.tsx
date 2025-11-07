"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/stores/localization.store';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import styles from './TwoLevelNavigation.module.css';

export default function TwoLevelNavigation() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const upperNavItems = [
    { href: '/alerts', label: t('navigation.upperNav.alerts'), disabled: true },
    { href: '/services', label: t('navigation.upperNav.services'), disabled: true },
    { href: '/login', label: t('navigation.upperNav.login'), disabled: true },
  ];

  const lowerNavItems = [
    { href: '/usage', label: t('navigation.usage') },
    { href: '/statistics', label: t('navigation.statistics') },
    { href: '/development', label: t('navigation.lowerNav.development'), disabled: true },
    { href: '/documentation', label: t('navigation.lowerNav.documentation'), disabled: true },
    { href: '/version', label: t('navigation.lowerNav.version'), disabled: true },
    { href: '/join', label: t('navigation.lowerNav.join'), disabled: true },
    { href: '/contact', label: t('navigation.lowerNav.contact'), disabled: true },
  ];

  const isActive = (href: string) => {
    if (href === '/usage') {
      return pathname === '/' || pathname === '/usage';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.container}>
      {/* Upper Row: Logo (hidden) and Right-aligned items */}
      <div className={styles.upperRow}>
        {/* Logo section - hidden as per concept */}
        <div className={styles.logo}>
          <div className={styles.logoText}>Datahub</div>
        </div>
        
        {/* Upper Navigation - Right side */}
        <div className={styles.upperItems}>
          <div className={styles.upperItems}>
            {/* Language Selector */}
            <div className={styles.upperItem}>
              <LanguageSelector />
            </div>
            
            {/* Upper nav items */}
            {upperNavItems.map((item) => {
              if (item.disabled) {
                return (
                  <div 
                    key={item.href}
                    className={styles.upperItem}
                  >
                    <div className={styles.upperLinkDisabled}>
                      {item.label}
                    </div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={item.href}
                  className={styles.upperItem}
                >
                  <Link
                    href={item.href}
                    className={styles.upperLink}
                  >
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Navigation */}
      <div className={styles.lowerRow}>
        {lowerNavItems.map((item) => {
          const active = isActive(item.href);
          
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={styles.lowerItem}
              >
                <div className={styles.lowerLinkDisabled}>
                  {item.label}
                </div>
              </div>
            );
          }
          
          return (
            <div
              key={item.href}
              className={styles.lowerItem}
            >
              <Link
                href={item.href}
                className={cn(
                  styles.lowerLink,
                  active && styles.lowerLinkActive
                )}
              >
                {item.label}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
