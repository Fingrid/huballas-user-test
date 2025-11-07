'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useLocalization();

  const footerLinks = [
    { key: 'privacyPolicy', href: '#' },
    { key: 'accessibilityStatement', href: '#' },
    { key: 'termsOfUse', href: '#' },
    { key: 'cookies', href: '#' },
    { key: 'feedback', href: '#' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <nav className={styles.links} aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className={styles.link}
            >
              {t(`navigation.footer.${link.key}`)}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
