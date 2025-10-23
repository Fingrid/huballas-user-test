'use client';

import React, { useState, useRef, useEffect, type CSSProperties } from 'react';
import {
  Label,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
  type Selection,
} from 'react-aria-components';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  hideLabel?: boolean;
  options: SelectOption[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  placeholder?: string;
  errorMessage?: string;
  hideErrorMessage?: boolean;
  wrapperClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  popoverClassName?: string;
  listBoxClassName?: string;
  errorMessageClassName?: string;
  isDisabled?: boolean;
  selectionMode?: 'single' | 'multiple';
  className?: string;
  displayValuesInMultiSelect?: boolean; // Show values instead of labels in comma-separated list
}

// Expand more icon component
const ExpandMore = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
  </svg>
);

// Checkbox icon (checked state)
const CheckBoxIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
    <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Checkbox outline (unchecked state)
const CheckBoxOutlineBlank = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

/**
 * Design system compliant Select component using React Aria
 * Supports both single and multi-select modes with checkboxes
 * Styled to match Fingrid Design System specifications
 */
export default function Select({
  label,
  hideLabel = false,
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  errorMessage,
  hideErrorMessage = false,
  wrapperClassName,
  labelClassName,
  selectClassName,
  popoverClassName,
  listBoxClassName,
  errorMessageClassName,
  isDisabled = false,
  selectionMode = 'single',
  className,
  displayValuesInMultiSelect = false,
}: SelectProps) {
  const [isOpen, setOpen] = useState(false);
  const [elementWidth, setElementWidth] = useState<number | undefined>(undefined);
  const outerRef = useRef<HTMLButtonElement>(null);

  // Measure button width for popover
  useEffect(() => {
    if (outerRef.current) {
      setElementWidth(outerRef.current.offsetWidth);
    }
  }, []);

  const hasError = Boolean(errorMessage);
  
  // Convert value to Selection type for React Aria
  const selectedKeys: Selection = selectionMode === 'multiple' 
    ? new Set(Array.isArray(value) ? value : (value ? [value] : []))
    : (value ? new Set([value as string]) : new Set());

  // Handle selection change
  const handleSelectionChange = (keys: Selection) => {
    if (selectionMode === 'multiple') {
      const selectedArray = keys === 'all' ? options.map(o => o.value) : Array.from(keys as Set<string>);
      onValueChange?.(selectedArray);
    } else {
      const selectedValue = keys === 'all' ? '' : Array.from(keys as Set<string>)[0] || '';
      onValueChange?.(selectedValue);
      // Close popover after single selection
      setOpen(false);
    }
  };

  // Get display text for selected items
  const getSelectedText = () => {
    if (selectionMode === 'multiple') {
      const selected = Array.isArray(value) ? value : value ? [value] : [];
      if (selected.length === 0) return placeholder;
      
      // Get labels or values for all selected items
      const selectedLabels = selected
        .map(val => {
          if (displayValuesInMultiSelect) {
            return val; // Just return the value (e.g., "CAP", "DH-100")
          }
          const option = options.find(o => o.value === val);
          return option?.label || val;
        });
      
      return selectedLabels.join(', ');
    } else {
      const option = options.find(o => o.value === value);
      return option?.label || placeholder;
    }
  };

  // Styles matching the design system
  const styles = {
    wrapper: cn('inline-flex flex-col gap-1', wrapperClassName, className),
    label: cn('control-label text-sm font-medium text-[var(--color-text)]', labelClassName),
    button: cn(
      'w-full px-4 py-2 bg-white',
      'text-base font-normal leading-normal',
      'cursor-pointer',
      'flex items-center justify-between gap-2',
      // Border styles
      'outline-1 outline-offset-[-1px]',
      hasError ? 'outline-red-500' : 'outline-slate-500',
      // Focus styles
      'focus:outline-2 focus:outline-offset-[-2px]',
      hasError ? 'focus:outline-red-600' : 'focus:outline-[var(--color-primary)]',
      // Disabled styles
      'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
      // Hover styles
      'hover:bg-slate-50 disabled:hover:bg-slate-100',
      selectClassName
    ),
    buttonText: cn(
      'flex-1 text-left',
      (selectionMode === 'single' && !value) || (selectionMode === 'multiple' && (!value || (Array.isArray(value) && value.length === 0)))
        ? 'text-slate-400'
        : 'text-slate-600'
    ),
    icon: cn(
      'text-slate-600 flex-shrink-0',
      isDisabled && 'text-slate-400'
    ),
    popover: cn(
      'bg-white shadow-lg',
      'outline outline-1 outline-slate-300',
      'max-h-[300px] overflow-auto',
      popoverClassName
    ),
    topPlacement: 'mb-1',
    otherPlacement: 'mt-1',
    list: cn(
      'outline-none',
      listBoxClassName
    ),
    listItem: cn(
      'px-4 py-2 cursor-pointer outline-none',
      'text-base font-normal leading-normal',
      'flex items-center gap-3'
    ),
  };

  return (
    <div className={styles.wrapper}>
      {!hideLabel && label && (
        <Label className={styles.label}>{label}</Label>
      )}
      
      <Button
        ref={outerRef}
        className={styles.button}
        onPress={() => !isDisabled && setOpen(!isOpen)}
        isDisabled={isDisabled}
        aria-label={hideLabel ? label : undefined}
      >
        <span className={styles.buttonText}>
          {getSelectedText()}
        </span>
        <ExpandMore className={styles.icon} />
      </Button>
      
      {!hideErrorMessage && errorMessage && (
        <span
          className={cn(
            'text-sm text-red-600 font-normal',
            errorMessageClassName
          )}
          role="alert"
        >
          {errorMessage}
        </span>
      )}
      
      {isOpen && (
        <Popover
          className={({ placement }) => {
            const isTopPlacement = placement === 'top';
            return cn(styles.popover, {
              [styles.otherPlacement]: !isTopPlacement,
              [styles.topPlacement]: isTopPlacement,
            });
          }}
          style={
            {
              '--trigger-width': elementWidth ? `${elementWidth}px` : undefined,
              width: elementWidth || undefined,
            } as CSSProperties
          }
          triggerRef={outerRef}
          offset={0}
          isOpen={isOpen}
          onOpenChange={setOpen}
        >
          <ListBox
            className={styles.list}
            selectionMode={selectionMode}
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            disallowEmptySelection={false}
            aria-label={label || 'Select options'}
          >
            {options.map((option) => (
              <ListBoxItem
                key={option.value}
                id={option.value}
                textValue={option.label}
                isDisabled={option.disabled}
                className={({ isSelected, isFocused, isDisabled }) =>
                  cn(
                    styles.listItem,
                    isDisabled && 'text-slate-400 cursor-not-allowed',
                    !isDisabled && isSelected && selectionMode === 'single' && 'bg-[var(--color-background-level-4)] font-medium',
                    !isDisabled && isFocused && 'bg-[var(--color-background-level-2)]',
                    !isDisabled && !isSelected && !isFocused && 'text-slate-600'
                  )
                }
              >
                {({ isSelected }) => (
                  <>
                    {selectionMode === 'multiple' && (
                      <>
                        {isSelected ? (
                          <CheckBoxIcon className={cn('text-[var(--color-primary)]', styles.icon)} />
                        ) : (
                          <CheckBoxOutlineBlank className={cn('text-slate-400', styles.icon)} />
                        )}
                      </>
                    )}
                    <span className="flex-1">{option.label}</span>
                  </>
                )}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      )}
    </div>
  );
}
