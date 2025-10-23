"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/stores/localization.store';
import LanguageSelector from './LanguageSelector';

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
    <div className="header-nav-container">
      {/* Upper Row: Logo (hidden) and Right-aligned items */}
      <div className="header-nav-upper-row">
        {/* Logo section - hidden as per concept */}
        <div className="header-nav-logo">
          <div className="header-nav-logo-text">Datahub</div>
        </div>
        
        {/* Upper Navigation - Right side */}
        <div className="header-nav-upper-items">
          <div className="header-nav-upper-items">
            {/* Language Selector */}
            <div className="header-nav-upper-item">
              <LanguageSelector />
            </div>
            
            {/* Upper nav items */}
            {upperNavItems.map((item, index) => {
              const isLast = index === upperNavItems.length - 1;
              
              if (item.disabled) {
                return (
                  <div 
                    key={item.href}
                    className={cn("header-nav-upper-item", isLast && "header-nav-upper-item:last-child")}
                  >
                    <div className="header-nav-upper-link-disabled">
                      {item.label}
                    </div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={item.href}
                  className={cn("header-nav-upper-item", isLast && "header-nav-upper-item:last-child")}
                >
                  <Link
                    href={item.href}
                    className="header-nav-upper-link"
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
      <div className="header-nav-lower-row">
        {lowerNavItems.map((item, index) => {
          const active = isActive(item.href);
          const isFirst = index === 0;
          
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="header-nav-lower-item"
              >
                <div className="header-nav-lower-link-disabled">
                  {item.label}
                </div>
              </div>
            );
          }
          
          return (
            <div
              key={item.href}
              className="header-nav-lower-item"
            >
              <Link
                href={item.href}
                className={cn(
                  "header-nav-lower-link",
                  active && "header-nav-lower-link-active"
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
