"use client";

import React from 'react';
import { useTranslation, type Locale } from '../lib/stores/localization.store';
import { cn } from '../lib/cn';

export default function LanguageSelector() {
  const { locale, setLocale, isLoading } = useTranslation();

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale !== locale && !isLoading) {
      setLocale(newLocale);
    }
  };

  return (
    <div className="text-center justify-center">
      <button
        onClick={() => handleLanguageChange('fi')}
        disabled={isLoading}
        className={cn(
          "text-sm font-normal leading-none transition-colors",
          locale === 'fi' ? 'text-teal-600' : 'text-slate-700 hover:text-teal-600'
        )}
      >
        FI
      </button>
      <span className="text-slate-700 text-sm font-normal leading-none"> | </span>
      <button
        onClick={() => handleLanguageChange('en')}
        disabled={isLoading}
        className={cn(
          "text-sm font-normal leading-none transition-colors",
          locale === 'en' ? 'text-teal-600' : 'text-slate-700 hover:text-teal-600'
        )}
      >
        EN
      </button>
    </div>
  );
}