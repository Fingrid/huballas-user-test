"use client";

import React from 'react';
import { useTranslation } from '@/lib/stores/localization.store';
import styles from './LoginButton.module.css';

export default function LoginButton() {
  const { t } = useTranslation();

  const handleLogin = () => {
    console.log('Login clicked');
    // TODO: Implement login functionality
  };

  return (
    <button 
      className={styles.button}
      onClick={handleLogin}
    >
      {t('navigation.login')}
    </button>
  );
}
