import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Accessibility testing utilities
export const accessibilityTestUtils = {
  // Run axe accessibility tests on a component
  async testAccessibility(
    container: HTMLElement,
    options?: any
  ): Promise<void> {
    const results = await axe(container, {
      rules: {
        // Configure specific rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-markup': { enabled: true },
        ...options?.rules,
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      ...options,
    });

    expect(results).toHaveNoViolations();
  },

  // Test keyboard navigation
  async testKeyboardNavigation(container: HTMLElement): Promise<void> {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Test tab navigation
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i] as HTMLElement;
      element.focus();
      expect(document.activeElement).toBe(element);
    }

    // Test escape key handling for modals/dialogs
    const modals = container.querySelectorAll(
      '[role="dialog"], [role="alertdialog"]'
    );
    modals.forEach((modal) => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      modal.dispatchEvent(escapeEvent);
    });
  },

  // Test ARIA attributes
  testAriaAttributes(container: HTMLElement): void {
    // Check for proper ARIA labels
    const elementsNeedingLabels = container.querySelectorAll(
      'input:not([aria-label]):not([aria-labelledby]), ' +
        'select:not([aria-label]):not([aria-labelledby]), ' +
        'textarea:not([aria-label]):not([aria-labelledby])'
    );

    elementsNeedingLabels.forEach((element) => {
      const hasLabel = container.querySelector(`label[for="${element.id}"]`);
      if (!hasLabel) {
        console.warn('Element missing accessible label:', element);
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );
    let lastLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        console.warn(
          `Heading level ${level} follows level ${lastLevel}, skipping levels`
        );
      }
      lastLevel = level;
    });

    // Check for proper button labels
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledBy = button.getAttribute('aria-labelledby');

      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        console.warn('Button missing accessible label:', button);
      }
    });
  },

  // Test color contrast
  async testColorContrast(container: HTMLElement): Promise<void> {
    const textElements = container.querySelectorAll('*');
    const contrastIssues: Array<{ element: Element; ratio: number }> = [];

    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (
        color &&
        backgroundColor &&
        color !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'rgba(0, 0, 0, 0)'
      ) {
        const ratio = calculateContrastRatio(color, backgroundColor);
        if (ratio < 4.5) {
          contrastIssues.push({ element, ratio });
        }
      }
    });

    if (contrastIssues.length > 0) {
      console.warn('Color contrast issues found:', contrastIssues);
    }
  },

  // Test screen reader compatibility
  testScreenReaderCompatibility(container: HTMLElement): void {
    // Check for proper semantic markup
    const semanticElements = [
      'main',
      'nav',
      'header',
      'footer',
      'section',
      'article',
      'aside',
    ];

    semanticElements.forEach((tag) => {
      const elements = container.querySelectorAll(tag);
      if (elements.length === 0 && container.children.length > 0) {
        console.info(
          `Consider using semantic <${tag}> elements for better screen reader support`
        );
      }
    });

    // Check for alt text on images
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        console.warn('Image missing alt text:', img);
      }
    });

    // Check for proper form labels
    const formControls = container.querySelectorAll('input, select, textarea');
    formControls.forEach((control) => {
      const hasLabel = container.querySelector(`label[for="${control.id}"]`);
      const hasAriaLabel = control.getAttribute('aria-label');
      const hasAriaLabelledBy = control.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        console.warn('Form control missing label:', control);
      }
    });
  },

  // Test focus management
  testFocusManagement(container: HTMLElement): void {
    // Test focus trap in modals
    const modals = container.querySelectorAll(
      '[role="dialog"], [role="alertdialog"]'
    );
    modals.forEach((modal) => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        // Test tab trapping
        firstFocusable.focus();
        expect(document.activeElement).toBe(firstFocusable);

        // Simulate shift+tab on first element
        const shiftTabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
        });
        firstFocusable.dispatchEvent(shiftTabEvent);
        // Should focus last element (if trap is working)
      }
    });

    // Test skip links
    const skipLinks = container.querySelectorAll('a[href^="#"]');
    skipLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const target = container.querySelector(href);
        if (!target) {
          console.warn(`Skip link target not found: ${href}`);
        }
      }
    });
  },

  // Generate accessibility report
  generateAccessibilityReport(container: HTMLElement): AccessibilityReport {
    const report: AccessibilityReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalElements: container.querySelectorAll('*').length,
        focusableElements: container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ).length,
        imagesWithoutAlt: container.querySelectorAll('img:not([alt])').length,
        formsWithoutLabels: 0,
        headingHierarchyIssues: 0,
        colorContrastIssues: 0,
      },
      issues: [],
      recommendations: [],
    };

    // Count forms without labels
    const formControls = container.querySelectorAll('input, select, textarea');
    formControls.forEach((control) => {
      const hasLabel = container.querySelector(`label[for="${control.id}"]`);
      const hasAriaLabel = control.getAttribute('aria-label');
      const hasAriaLabelledBy = control.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        report.summary.formsWithoutLabels++;
        report.issues.push({
          type: 'missing-label',
          element: control.tagName.toLowerCase(),
          description: 'Form control missing accessible label',
        });
      }
    });

    // Check heading hierarchy
    const headings = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );
    let lastLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        report.summary.headingHierarchyIssues++;
        report.issues.push({
          type: 'heading-hierarchy',
          element: heading.tagName.toLowerCase(),
          description: `Heading level ${level} follows level ${lastLevel}, skipping levels`,
        });
      }
      lastLevel = level;
    });

    // Generate recommendations
    if (report.summary.imagesWithoutAlt > 0) {
      report.recommendations.push(
        'Add alt text to all images for screen reader users'
      );
    }

    if (report.summary.formsWithoutLabels > 0) {
      report.recommendations.push('Add proper labels to all form controls');
    }

    if (report.summary.headingHierarchyIssues > 0) {
      report.recommendations.push(
        'Fix heading hierarchy to improve navigation for screen reader users'
      );
    }

    return report;
  },
};

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Types
interface AccessibilityReport {
  timestamp: string;
  summary: {
    totalElements: number;
    focusableElements: number;
    imagesWithoutAlt: number;
    formsWithoutLabels: number;
    headingHierarchyIssues: number;
    colorContrastIssues: number;
  };
  issues: Array<{
    type: string;
    element: string;
    description: string;
  }>;
  recommendations: string[];
}

// Export for testing
export { calculateContrastRatio, getRelativeLuminance };
