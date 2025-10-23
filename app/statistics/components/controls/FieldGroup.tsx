'use client';

import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

interface FieldGroupProps {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}

/**
 * A semantically correct container for form fields with labels.
 * Replaces the incorrect use of <label> elements without associated form controls.
 */
export default function FieldGroup({
  label,
  children,
  className,
  labelClassName,
}: FieldGroupProps) {
  const defaultBlockStyling = "inline-flex flex-col justify-start items-start gap-1";
  const defaultLabelStyling = "control-label";

  return (
    <div className={cn(defaultBlockStyling, className)}>
      <div className={cn(defaultLabelStyling, labelClassName)}>
        {label}
      </div>
      <div className="w-full flex">
        {children}
      </div>
    </div>
  );
}
