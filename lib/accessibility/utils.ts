/**
 * Accessibility utilities and ARIA helpers
 * Provides utilities for improving accessibility across the application
 */

// ARIA live region utilities
export const ariaLiveRegions = {
  polite: 'polite' as const,
  assertive: 'assertive' as const,
  off: 'off' as const
};

// Screen reader text utilities
export const createScreenReaderText = (text: string): string => {
  return `Screen reader: ${text}`;
};

// Focus trap implementation
export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: Element | null = null;
  private focusableElements: NodeListOf<HTMLElement> | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  activate(): void {
    this.previousActiveElement = document.activeElement;
    this.updateFocusableElements();
    this.focusFirstElement();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
  }

  private updateFocusableElements(): void {
    this.focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }

  private focusFirstElement(): void {
    if (this.focusableElements && this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  private focusLastElement(): void {
    if (this.focusableElements && this.focusableElements.length > 0) {
      this.focusableElements[this.focusableElements.length - 1].focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    if (!this.focusableElements || this.focusableElements.length === 0) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };
}

// Reduced motion utilities
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const respectReducedMotion = (normalAnimation: string, reducedAnimation: string = 'none'): string => {
  return prefersReducedMotion() ? reducedAnimation : normalAnimation;
};

// Color contrast utilities
export const meetsContrastRequirements = (foreground: string, background: string): boolean => {
  // This is a simplified implementation
  // In a real app, you'd use a proper color contrast calculation library
  const luminance = (color: string): number => {
    // Simplified luminance calculation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return contrast >= 4.5; // WCAG AA standard
};

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End'
} as const;

// ARIA attribute builders
export const buildAriaProps = (config: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  busy?: boolean;
  controls?: string;
  owns?: string;
}) => {
  const props: Record<string, any> = {};

  if (config.label) props['aria-label'] = config.label;
  if (config.labelledBy) props['aria-labelledby'] = config.labelledBy;
  if (config.describedBy) props['aria-describedby'] = config.describedBy;
  if (config.expanded !== undefined) props['aria-expanded'] = config.expanded;
  if (config.selected !== undefined) props['aria-selected'] = config.selected;
  if (config.disabled !== undefined) props['aria-disabled'] = config.disabled;
  if (config.required !== undefined) props['aria-required'] = config.required;
  if (config.invalid !== undefined) props['aria-invalid'] = config.invalid;
  if (config.live) props['aria-live'] = config.live;
  if (config.atomic !== undefined) props['aria-atomic'] = config.atomic;
  if (config.busy !== undefined) props['aria-busy'] = config.busy;
  if (config.controls) props['aria-controls'] = config.controls;
  if (config.owns) props['aria-owns'] = config.owns;

  return props;
};

// Text utilities for screen readers
export const formatNumberForScreenReader = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentageForScreenReader = (percentage: number): string => {
  return `${percentage}%`;
};

export const formatDateForScreenReader = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Skip link utilities
export const createSkipLink = (target: string, text: string): HTMLAnchorElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${target}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md';
  
  return skipLink;
};

// Landmark utilities
export const landmarkRoles = {
  main: 'main',
  navigation: 'navigation',
  banner: 'banner',
  contentinfo: 'contentinfo',
  complementary: 'complementary',
  search: 'search',
  form: 'form',
  region: 'region'
} as const;

// Error message utilities
export const createAccessibleErrorMessage = (fieldId: string, message: string): {
  id: string;
  message: string;
  ariaDescribedBy: string;
} => {
  const errorId = `${fieldId}-error`;
  return {
    id: errorId,
    message,
    ariaDescribedBy: errorId
  };
};

// Loading state announcements
export const loadingAnnouncements = {
  started: 'Loading started',
  progress: (percentage: number) => `Loading ${percentage}% complete`,
  completed: 'Loading completed',
  failed: 'Loading failed, please try again'
};

// Chart accessibility utilities
export const generateChartDescription = (data: any[], type: 'line' | 'bar' | 'pie'): string => {
  const dataLength = data.length;
  
  switch (type) {
    case 'line':
      return `Line chart with ${dataLength} data points showing trends over time`;
    case 'bar':
      return `Bar chart with ${dataLength} categories comparing values`;
    case 'pie':
      return `Pie chart with ${dataLength} segments showing proportional data`;
    default:
      return `Chart with ${dataLength} data points`;
  }
};

export const generateDataTableFromChart = (data: any[]): string => {
  // Convert chart data to a screen reader friendly table description
  if (!data || data.length === 0) return 'No data available';
  
  const tableRows = data.map(item => {
    if (typeof item === 'object' && item !== null) {
      const keys = Object.keys(item);
      return keys.map(key => `${key}: ${item[key]}`).join(', ');
    }
    return String(item);
  });
  
  return `Data table: ${tableRows.join('; ')}`;
};

// High contrast mode detection
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Text scaling utilities
export const respectTextScaling = (baseFontSize: number): string => {
  // Respect user's font size preferences
  return `${baseFontSize}rem`;
};

// Validation utilities
export const validateAccessibilityConfig = (config: {
  hasLabel: boolean;
  hasDescription?: boolean;
  isInteractive: boolean;
  hasKeyboardSupport?: boolean;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.hasLabel) {
    errors.push('Missing accessible label');
  }
  
  if (config.isInteractive && !config.hasKeyboardSupport) {
    errors.push('Interactive element lacks keyboard support');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};