"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '../lib/cn';

// Style objects for consistent styling
const styles = {
  nav: 'hidden md:ml-8 md:flex md:space-x-8',
  baseLink: 'nav-link px-3 py-2 text-base font-medium transition-all duration-200 ease-in-out !no-underline',
  activeLink: 'text-[var(--color-primary-action)] font-semibold border-b-2 border-[var(--color-primary-action)]',
  inactiveLink: 'text-[var(--color-text)] border-b-2 border-transparent hover:text-[var(--color-primary-hover)]'
};

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Annual Statistics' },
    { href: '/monthly-reports', label: 'Monthly Reports' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            styles.baseLink,
            isActive(item.href) ? styles.activeLink : styles.inactiveLink
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
