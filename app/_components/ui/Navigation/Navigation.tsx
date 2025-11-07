"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/stores/localization.store';

// Style objects for consistent styling
const styles = {
  nav: 'hidden md:ml-8 md:flex md:space-x-6',
  baseLink: 'nav-link px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out !no-underline',
  activeLink: 'nav-link-active',
  inactiveLink: 'text-[var(--color-text)] hover:text-[var(--color-primary)]'
};

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: '/', label: t('navigation.dataHub') },
    { href: '/time-point', label: t('navigation.timePoint'), disabled: true },
    { href: '/all-data', label: t('navigation.allData'), disabled: true },
    { href: '/documents', label: t('navigation.documents'), disabled: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const active = isActive(item.href);
        
        if (item.disabled) {
          return (
            <span
              key={item.href}
              className={cn(styles.baseLink, 'opacity-50 cursor-not-allowed')}
            >
              {item.label}
            </span>
          );
        }
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              styles.baseLink,
              active ? styles.activeLink : styles.inactiveLink
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
