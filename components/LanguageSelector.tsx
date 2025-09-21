"use client";

import React from 'react';
import { useTranslation, type Locale } from '../lib/stores/localization.store';

export default function LanguageSelector() {
  const { locale, setLocale, isLoading } = useTranslation();

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const handleLanguageChange = async (newLocale: Locale) => {
    if (newLocale !== locale && !isLoading) {
      await setLocale(newLocale);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 hidden sm:inline">Language:</span>
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={`
              px-3 py-2 text-sm font-medium transition-colors duration-200
              ${locale === lang.code 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={lang.label}
          >
            <span className="sm:hidden">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.label}</span>
          </button>
        ))}
      </div>
      {isLoading && (
        <div className="ml-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}