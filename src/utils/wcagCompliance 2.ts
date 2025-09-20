// WCAG 2.1 AA Compliance Checker
export class WCAGComplianceChecker {
  private violations: WCAGViolation[] = [];
  private warnings: WCAGWarning[] = [];

  // Main compliance check method
  public checkCompliance(element: HTMLElement): WCAGReport {
    this.violations = [];
    this.warnings = [];

    // Run all WCAG checks
    this.checkColorContrast(element);
    this.checkKeyboardAccessibility(element);
    this.checkAriaLabels(element);
    this.checkHeadingStructure(element);
    this.checkFormLabels(element);
    this.checkImageAltText(element);
    this.checkFocusManagement(element);
    this.checkSemanticMarkup(element);
    this.checkTextAlternatives(element);
    this.checkTimingAndMotion(element);

    return {
      timestamp: new Date().toISOString(),
      element: element.tagName.toLowerCase(),
      violations: this.violations,
      warnings: this.warnings,
      score: this.calculateComplianceScore(),
      level: this.determineComplianceLevel(),
    };
  }

  // 1.4.3 Contrast (Minimum) - AA
  private checkColorContrast(element: HTMLElement): void {
    const textElements = element.querySelectorAll('*');

    textElements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;

      if (this.hasVisibleText(el as HTMLElement)) {
        const contrastRatio = this.calculateContrastRatio(
          color,
          backgroundColor
        );
        const isLargeText =
          fontSize >= 18 ||
          (fontSize >= 14 &&
            (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

        const minimumRatio = isLargeText ? 3 : 4.5;
        const aaRatio = isLargeText ? 4.5 : 7;

        if (contrastRatio < minimumRatio) {
          this.violations.push({
            criterion: '1.4.3',
            level: 'AA',
            description: `Insufficient color contrast ratio: ${contrastRatio.toFixed(2)} (minimum: ${minimumRatio})`,
            element: el as HTMLElement,
            severity: 'error',
          });
        } else if (contrastRatio < aaRatio) {
          this.warnings.push({
            criterion: '1.4.6',
            level: 'AAA',
            description: `Color contrast could be improved for AAA compliance: ${contrastRatio.toFixed(2)} (recommended: ${aaRatio})`,
            element: el as HTMLElement,
          });
        }
      }
    });
  }

  // 2.1.1 Keyboard - A
  private checkKeyboardAccessibility(element: HTMLElement): void {
    const interactiveElements = element.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex], [role="button"], [role="link"], [role="menuitem"]'
    );

    interactiveElements.forEach((el) => {
      const tabIndex = el.getAttribute('tabindex');

      // Check for keyboard trap (tabindex="-1" on interactive elements)
      if (
        tabIndex === '-1' &&
        !this.isValidTabIndexMinusOne(el as HTMLElement)
      ) {
        this.violations.push({
          criterion: '2.1.1',
          level: 'A',
          description:
            'Interactive element not keyboard accessible (tabindex="-1")',
          element: el as HTMLElement,
          severity: 'error',
        });
      }

      // Check for missing keyboard event handlers
      if (
        el.getAttribute('onclick') &&
        !this.hasKeyboardHandler(el as HTMLElement)
      ) {
        this.warnings.push({
          criterion: '2.1.1',
          level: 'A',
          description:
            'Element with click handler should also handle keyboard events',
          element: el as HTMLElement,
        });
      }
    });
  }

  // 4.1.2 Name, Role, Value - A
  private checkAriaLabels(element: HTMLElement): void {
    const elementsNeedingLabels = element.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, button:empty, [role="button"]:empty'
    );

    elementsNeedingLabels.forEach((el) => {
      const hasLabel = this.hasAccessibleName(el as HTMLElement);

      if (!hasLabel) {
        this.violations.push({
          criterion: '4.1.2',
          level: 'A',
          description:
            'Form control or interactive element missing accessible name',
          element: el as HTMLElement,
          severity: 'error',
        });
      }
    });

    // Check ARIA attributes validity
    const elementsWithAria = element.querySelectorAll('[aria-*]');
    elementsWithAria.forEach((el) => {
      this.validateAriaAttributes(el as HTMLElement);
    });
  }

  // 1.3.1 Info and Relationships - A
  private checkHeadingStructure(element: HTMLElement): void {
    const headings = Array.from(
      element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );
    let lastLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));

      if (level === 1) {
        hasH1 = true;
        if (index > 0) {
          this.warnings.push({
            criterion: '1.3.1',
            level: 'A',
            description:
              'Multiple H1 elements found - consider using only one per page',
            element: heading as HTMLElement,
          });
        }
      }

      if (level > lastLevel + 1) {
        this.violations.push({
          criterion: '1.3.1',
          level: 'A',
          description: `Heading level ${level} follows level ${lastLevel}, skipping levels`,
          element: heading as HTMLElement,
          severity: 'error',
        });
      }

      lastLevel = level;
    });

    if (headings.length > 0 && !hasH1) {
      this.warnings.push({
        criterion: '1.3.1',
        level: 'A',
        description:
          'No H1 heading found - consider adding one for better document structure',
        element: element,
      });
    }
  }

  // 3.3.2 Labels or Instructions - A
  private checkFormLabels(element: HTMLElement): void {
    const formControls = element.querySelectorAll(
      'input:not([type="hidden"]), select, textarea'
    );

    formControls.forEach((control) => {
      const hasLabel = this.hasFormLabel(control as HTMLElement);

      if (!hasLabel) {
        this.violations.push({
          criterion: '3.3.2',
          level: 'A',
          description: 'Form control missing label or instructions',
          element: control as HTMLElement,
          severity: 'error',
        });
      }
    });
  }

  // 1.1.1 Non-text Content - A
  private checkImageAltText(element: HTMLElement): void {
    const images = element.querySelectorAll('img');

    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const ariaLabelledBy = img.getAttribute('aria-labelledby');
      const role = img.getAttribute('role');

      if (role === 'presentation' || role === 'none') {
        if (alt && alt.trim() !== '') {
          this.warnings.push({
            criterion: '1.1.1',
            level: 'A',
            description: 'Decorative image should have empty alt attribute',
            element: img,
          });
        }
      } else if (!alt && !ariaLabel && !ariaLabelledBy) {
        this.violations.push({
          criterion: '1.1.1',
          level: 'A',
          description: 'Image missing alternative text',
          element: img,
          severity: 'error',
        });
      }
    });
  }

  // 2.4.3 Focus Order - A
  private checkFocusManagement(element: HTMLElement): void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check for logical tab order
    const tabIndexElements = Array.from(element.querySelectorAll('[tabindex]'))
      .filter((el) => {
        const tabIndex = parseInt(el.getAttribute('tabindex') || '0');
        return tabIndex > 0;
      })
      .sort((a, b) => {
        const aIndex = parseInt(a.getAttribute('tabindex') || '0');
        const bIndex = parseInt(b.getAttribute('tabindex') || '0');
        return aIndex - bIndex;
      });

    if (tabIndexElements.length > 0) {
      this.warnings.push({
        criterion: '2.4.3',
        level: 'A',
        description:
          'Positive tabindex values found - consider using natural tab order',
        element: element,
      });
    }

    // Check for focus traps in modals
    const modals = element.querySelectorAll(
      '[role="dialog"], [role="alertdialog"]'
    );
    modals.forEach((modal) => {
      const modalFocusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (modalFocusable.length === 0) {
        this.violations.push({
          criterion: '2.4.3',
          level: 'A',
          description: 'Modal dialog contains no focusable elements',
          element: modal as HTMLElement,
          severity: 'error',
        });
      }
    });
  }

  // 1.3.1 Info and Relationships - A
  private checkSemanticMarkup(element: HTMLElement): void {
    // Check for proper landmark usage
    const landmarks = [
      'main',
      'nav',
      'header',
      'footer',
      'section',
      'article',
      'aside',
    ];
    const hasLandmarks = landmarks.some((landmark) =>
      element.querySelector(landmark)
    );

    if (!hasLandmarks && element.children.length > 0) {
      this.warnings.push({
        criterion: '1.3.1',
        level: 'A',
        description:
          'Consider using semantic HTML5 landmarks for better structure',
        element: element,
      });
    }

    // Check for proper list markup
    const listItems = element.querySelectorAll('li');
    listItems.forEach((li) => {
      const parent = li.parentElement;
      if (
        parent &&
        !['ul', 'ol', 'menu'].includes(parent.tagName.toLowerCase())
      ) {
        this.violations.push({
          criterion: '1.3.1',
          level: 'A',
          description: 'List item not contained within proper list element',
          element: li,
          severity: 'error',
        });
      }
    });
  }

  // 1.1.1 Non-text Content - A
  private checkTextAlternatives(element: HTMLElement): void {
    // Check for text alternatives for complex content
    const complexElements = element.querySelectorAll(
      'canvas, svg, object, embed, iframe'
    );

    complexElements.forEach((el) => {
      const hasTextAlternative =
        this.hasAccessibleName(el as HTMLElement) ||
        el.textContent?.trim() ||
        el.querySelector('title, desc');

      if (!hasTextAlternative) {
        this.violations.push({
          criterion: '1.1.1',
          level: 'A',
          description: `${el.tagName.toLowerCase()} element missing text alternative`,
          element: el as HTMLElement,
          severity: 'error',
        });
      }
    });
  }

  // 2.2.2 Pause, Stop, Hide - A
  private checkTimingAndMotion(element: HTMLElement): void {
    // Check for auto-playing media
    const mediaElements = element.querySelectorAll('video, audio');
    mediaElements.forEach((media) => {
      const autoplay = media.hasAttribute('autoplay');
      const controls = media.hasAttribute('controls');

      if (autoplay && !controls) {
        this.violations.push({
          criterion: '2.2.2',
          level: 'A',
          description: 'Auto-playing media should have user controls',
          element: media as HTMLElement,
          severity: 'error',
        });
      }
    });

    // Check for animations that might cause seizures
    const animatedElements = element.querySelectorAll(
      '[style*="animation"], .animate'
    );
    if (animatedElements.length > 0) {
      this.warnings.push({
        criterion: '2.3.1',
        level: 'A',
        description:
          "Animated content detected - ensure it doesn't flash more than 3 times per second",
        element: element,
      });
    }
  }

  // Helper methods
  private hasVisibleText(element: HTMLElement): boolean {
    const text = element.textContent?.trim();
    const styles = window.getComputedStyle(element);
    return !!(
      text &&
      styles.display !== 'none' &&
      styles.visibility !== 'hidden'
    );
  }

  private calculateContrastRatio(
    foreground: string,
    background: string
  ): number {
    const fgLum = this.getRelativeLuminance(foreground);
    const bgLum = this.getRelativeLuminance(background);
    const brightest = Math.max(fgLum, bgLum);
    const darkest = Math.min(fgLum, bgLum);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private getRelativeLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private parseColor(
    color: string
  ): { r: number; g: number; b: number } | null {
    // Handle hex colors
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16),
      };
    }

    // Handle rgb/rgba colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    }

    return null;
  }

  private hasAccessibleName(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.textContent?.trim()
    );
  }

  private hasFormLabel(element: HTMLElement): boolean {
    const id = element.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = element.getAttribute('aria-label');
    const hasAriaLabelledBy = element.getAttribute('aria-labelledby');
    const hasTitle = element.getAttribute('title');

    return !!(hasLabel || hasAriaLabel || hasAriaLabelledBy || hasTitle);
  }

  private isValidTabIndexMinusOne(element: HTMLElement): boolean {
    // Valid cases for tabindex="-1"
    const validRoles = ['dialog', 'alertdialog', 'tooltip', 'status'];
    const role = element.getAttribute('role');
    return !!(role && validRoles.includes(role));
  }

  private hasKeyboardHandler(element: HTMLElement): boolean {
    const events = ['onkeydown', 'onkeyup', 'onkeypress'];
    return events.some((event) => element.getAttribute(event));
  }

  private validateAriaAttributes(element: HTMLElement): void {
    const attributes = Array.from(element.attributes).filter((attr) =>
      attr.name.startsWith('aria-')
    );

    attributes.forEach((attr) => {
      // Basic ARIA attribute validation
      if (!this.isValidAriaAttribute(attr.name)) {
        this.violations.push({
          criterion: '4.1.2',
          level: 'A',
          description: `Invalid ARIA attribute: ${attr.name}`,
          element: element,
          severity: 'error',
        });
      }
    });
  }

  private isValidAriaAttribute(attrName: string): boolean {
    const validAriaAttributes = [
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-hidden',
      'aria-expanded',
      'aria-selected',
      'aria-checked',
      'aria-disabled',
      'aria-required',
      'aria-invalid',
      'aria-live',
      'aria-atomic',
      'aria-relevant',
      'aria-busy',
      'aria-controls',
      'aria-owns',
      'aria-activedescendant',
      'aria-level',
      'aria-setsize',
      'aria-posinset',
      // Add more as needed
    ];
    return validAriaAttributes.includes(attrName);
  }

  private calculateComplianceScore(): number {
    const totalChecks = this.violations.length + this.warnings.length;
    if (totalChecks === 0) return 100;

    const violationWeight = 2;
    const warningWeight = 1;
    const totalWeight =
      this.violations.length * violationWeight +
      this.warnings.length * warningWeight;

    return Math.max(0, 100 - totalWeight * 5); // Each weighted issue reduces score by 5%
  }

  private determineComplianceLevel(): 'AAA' | 'AA' | 'A' | 'Non-compliant' {
    const aaViolations = this.violations.filter(
      (v) => v.level === 'AA' || v.level === 'A'
    );
    const aViolations = this.violations.filter((v) => v.level === 'A');

    if (this.violations.length === 0) return 'AAA';
    if (aaViolations.length === 0) return 'AA';
    if (aViolations.length === 0) return 'A';
    return 'Non-compliant';
  }
}

// Types
interface WCAGViolation {
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  description: string;
  element: HTMLElement;
  severity: 'error' | 'warning';
}

interface WCAGWarning {
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  description: string;
  element: HTMLElement;
}

interface WCAGReport {
  timestamp: string;
  element: string;
  violations: WCAGViolation[];
  warnings: WCAGWarning[];
  score: number;
  level: 'AAA' | 'AA' | 'A' | 'Non-compliant';
}

// Export singleton instance
export const wcagChecker = new WCAGComplianceChecker();
