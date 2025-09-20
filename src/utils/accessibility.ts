import React, { useEffect, useRef, useCallback } from 'react';

// ARIA live region announcer
export class LiveAnnouncer {
  private static instance: LiveAnnouncer;
  private liveElement: HTMLElement | null = null;

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer();
    }
    return LiveAnnouncer.instance;
  }

  private constructor() {
    this.createLiveElement();
  }

  private createLiveElement(): void {
    if (typeof document === 'undefined') return;

    this.liveElement = document.createElement('div');
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    this.liveElement.setAttribute('aria-relevant', 'additions text');
    this.liveElement.style.position = 'absolute';
    this.liveElement.style.left = '-10000px';
    this.liveElement.style.width = '1px';
    this.liveElement.style.height = '1px';
    this.liveElement.style.overflow = 'hidden';
    document.body.appendChild(this.liveElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveElement) return;

    this.liveElement.setAttribute('aria-live', priority);
    this.liveElement.textContent = message;

    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (this.liveElement) {
        this.liveElement.textContent = '';
      }
    }, 1000);
  }
}

// Focus management utilities
export const focusManagement = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Save and restore focus
  saveFocus: (): (() => void) => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },

  // Focus first error in form
  focusFirstError: (formElement: HTMLElement): void => {
    const errorElement = formElement.querySelector(
      '[aria-invalid="true"], .error'
    ) as HTMLElement;
    if (errorElement) {
      errorElement.focus();
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: NodeListOf<HTMLElement> | HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ): void => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onIndexChange(newIndex);
    (items[newIndex] as HTMLElement)?.focus();
  },

  // Handle escape key
  handleEscape:
    (callback: () => void) =>
    (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        callback();
      }
    },
};

// Screen reader utilities
export const screenReader = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create ARIA description
  createDescription: (
    text: string,
    id?: string
  ): { id: string; element: HTMLElement } => {
    const descId = id || screenReader.generateId('desc');
    const element = document.createElement('div');
    element.id = descId;
    element.textContent = text;
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    document.body.appendChild(element);

    return { id: descId, element };
  },
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getRelativeLuminance: (color: string): number => {
    const rgb = colorContrast.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = colorContrast.getRelativeLuminance(color1);
    const lum2 = colorContrast.getRelativeLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check WCAG compliance
  checkWCAGCompliance: (
    foreground: string,
    background: string
  ): {
    aa: boolean;
    aaa: boolean;
    ratio: number;
  } => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
      ratio,
    };
  },
};

// React hooks for accessibility
export const useAnnouncer = () => {
  const announcer = useRef(LiveAnnouncer.getInstance());

  return useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announcer.current.announce(message, priority);
    },
    []
  );
};

export const useFocusTrap = (isActive: boolean) => {
  const elementRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    restoreFocusRef.current = focusManagement.saveFocus();
    const cleanup = focusManagement.trapFocus(elementRef.current);

    return () => {
      cleanup();
      if (restoreFocusRef.current) {
        restoreFocusRef.current();
      }
    };
  }, [isActive]);

  return elementRef;
};

export const useKeyboardNavigation = (
  items: HTMLElement[],
  isActive: boolean = true
) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;
      keyboardNavigation.handleArrowNavigation(
        event,
        items,
        currentIndex,
        setCurrentIndex
      );
    },
    [items, currentIndex, isActive]
  );

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isActive]);

  return { currentIndex, setCurrentIndex };
};

export const useAriaDescribedBy = (description: string) => {
  const [descriptionId, setDescriptionId] = React.useState<string>('');

  useEffect(() => {
    if (description) {
      const { id, element } = screenReader.createDescription(description);
      setDescriptionId(id);

      return () => {
        document.body.removeChild(element);
      };
    }
  }, [description]);

  return descriptionId;
};

// Skip link component (to be used in React components)
export const createSkipLink = (href: string, children: React.ReactNode) => {
  const React = require('react');

  return React.createElement(
    'a',
    {
      href,
      style: {
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      },
      onFocus: (e: React.FocusEvent<HTMLAnchorElement>) => {
        const target = e.target as HTMLAnchorElement;
        target.style.position = 'static';
        target.style.left = 'auto';
        target.style.width = 'auto';
        target.style.height = 'auto';
        target.style.overflow = 'visible';
      },
      onBlur: (e: React.FocusEvent<HTMLAnchorElement>) => {
        const target = e.target as HTMLAnchorElement;
        target.style.position = 'absolute';
        target.style.left = '-10000px';
        target.style.width = '1px';
        target.style.height = '1px';
        target.style.overflow = 'hidden';
      },
    },
    children
  );
};

// Accessibility testing utilities
export const accessibilityTesting = {
  // Check for missing alt text
  checkMissingAltText: (): HTMLImageElement[] => {
    const images = Array.from(
      document.querySelectorAll('img')
    ) as HTMLImageElement[];
    return images.filter((img) => !img.alt && !img.getAttribute('aria-label'));
  },

  // Check for missing form labels
  checkMissingFormLabels: (): HTMLInputElement[] => {
    const inputs = Array.from(
      document.querySelectorAll('input, select, textarea')
    ) as HTMLInputElement[];
    return inputs.filter((input) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
    });
  },

  // Check heading hierarchy
  checkHeadingHierarchy: (): { element: HTMLElement; issue: string }[] => {
    const headings = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );
    const issues: { element: HTMLElement; issue: string }[] = [];
    let lastLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push({
          element: heading as HTMLElement,
          issue: `Heading level ${level} follows level ${lastLevel}, skipping levels`,
        });
      }
      lastLevel = level;
    });

    return issues;
  },
};
