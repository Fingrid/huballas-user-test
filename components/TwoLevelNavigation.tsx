"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '../lib/cn';
import { useTranslation } from '../lib/stores/localization.store';
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
    <div className="w-full max-w-[1440px] mx-auto py-4 border-b border-[var(--color-separator)] inline-flex flex-col justify-end items-start gap-6 px-10 lg:px-10 md:px-8 sm:px-4">
      {/* Upper Row: Logo (hidden) and Right-aligned items */}
      <div className="self-stretch inline-flex justify-between items-start">
        {/* Logo section - hidden as per concept */}
        <div className="opacity-0 flex justify-end items-center gap-2">
          <div className="text-right justify-start text-teal-600 text-xl font-bold leading-tight">Datahub</div>
        </div>
        
        {/* Upper Navigation - Right side */}
        <div className="flex justify-start items-center">
          <div className="flex justify-start items-center">
            {/* Language Selector */}
            <div className="px-2 flex justify-start items-center">
              <LanguageSelector />
            </div>
            
            {/* Upper nav items */}
            {upperNavItems.map((item, index) => {
              const isLast = index === upperNavItems.length - 1;
              
              if (item.disabled) {
                return (
                  <div 
                    key={item.href}
                    className={cn("flex justify-start items-center", isLast ? "pl-2" : "px-2")}
                  >
                    <div className="text-center justify-center text-[var(--color-text)] text-sm font-normal leading-none opacity-50 cursor-not-allowed">
                      {item.label}
                    </div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={item.href}
                  className={cn("flex justify-start items-center", isLast ? "pl-2" : "px-2")}
                >
                  <Link
                    href={item.href}
                    className="text-center justify-center text-[var(--color-text)] text-sm font-normal leading-none hover:text-[var(--color-primary)] transition-colors"
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
      <div className="self-stretch h-6 inline-flex justify-between items-end">
        {lowerNavItems.map((item, index) => {
          const active = isActive(item.href);
          const isFirst = index === 0;
          const isAfterFirst = index === 1;
          
          // First item uses pr-4, items after first use px-4, last items use pl-4
          let paddingClass = "px-4";
          if (isFirst) {
            paddingClass = "pr-4";
          } else if (index >= lowerNavItems.length - 2) {
            paddingClass = "pl-4";
          }
          
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={cn("flex justify-start items-center", paddingClass)}
              >
                <div className="text-center justify-center text-slate-950 text-2xl font-normal leading-normal opacity-50 cursor-not-allowed">
                  {item.label}
                </div>
              </div>
            );
          }
          
          return (
            <div
              key={item.href}
              className={cn("flex justify-start items-center", paddingClass)}
            >
              <Link
                href={item.href}
                className={cn(
                  "text-center justify-center text-2xl font-normal leading-normal transition-colors",
                  active 
                    ? "text-[var(--color-primary)] font-medium" 
                    : "text-slate-950 hover:text-[var(--color-primary)]"
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
