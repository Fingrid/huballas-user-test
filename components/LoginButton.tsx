"use client";

import React from 'react';
import { useTranslation } from '../lib/stores/localization.store';

export default function LoginButton() {
  const { t } = useTranslation();

  const handleLogin = () => {
    console.log('Login clicked');
    // TODO: Implement login functionality
  };

  return (
    <button 
      className="header-button-primary"
      onClick={handleLogin}
    >
      {t('navigation.login')}
    </button>
  );
}
