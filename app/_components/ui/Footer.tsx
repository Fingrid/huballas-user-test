'use client';

import { useLocalization } from '@/lib/stores/localization.store';

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
    <footer className="app-footer">
      <div className="app-footer-content">
        <nav className="app-footer-links" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="app-footer-link"
            >
              {t(`navigation.footer.${link.key}`)}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
