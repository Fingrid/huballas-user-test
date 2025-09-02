"use client";

import React from 'react';
import { cn } from '../../../lib/cn';

// Style objects for consistent styling
const styles = {
  container: 'content-container pt-8 pb-8',
  card: 'data-card',
  centerContainer: 'flex items-center justify-center h-64',
  textCenter: 'text-center',
  spinner: 'animate-spin h-12 w-12 mx-auto rounded-full border-2 border-[#e9eef2] border-t-[var(--color-primary-action)]',
  text: 'mt-4 text-[var(--color-text)]'
};

export default function LoadingState() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.centerContainer}>
          <div className={styles.textCenter}>
            <div className={styles.spinner}></div>
            <p className={styles.text}>
              Loading monthly reports...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
