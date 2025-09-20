// Animation Configuration Interface
export interface AnimationConfig {
  duration: {
    sidebar: number;
    footer: number;
    content: number;
    iconTransition: number;
  };
  easing: {
    enter: string;
    exit: string;
    sharp: string;
    smooth: string; // New smooth easing for enhanced transitions
    bounce: string; // New bounce easing for interactive elements
  };
  delays: {
    footerShow: number;
    footerHide: number;
  };
}

// Animation Configuration Constants - Production-optimized with fine-tuned timing and easing
export const animationConfig: AnimationConfig = {
  duration: {
    sidebar: 280, // Fine-tuned for optimal perceived performance (reduced from 320ms)
    footer: 180, // Optimized for snappy footer transitions (reduced from 200ms)
    content: 240, // Balanced content timing for smooth flow (reduced from 280ms)
    iconTransition: 120, // Refined for crisp icon feedback (reduced from 150ms)
  },
  easing: {
    // Production-optimized easing curves for natural motion
    enter: 'cubic-bezier(0.2, 0, 0.2, 1)', // Optimized ease-out with better acceleration curve
    exit: 'cubic-bezier(0.4, 0, 1, 1)', // Refined ease-in for smooth exits
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)', // Material Design standard for quick interactions
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Enhanced smooth curve for fluid transitions
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Subtle bounce optimized for performance
  },
  delays: {
    footerShow: 80, // Reduced delay for more responsive feel (reduced from 100ms)
    footerHide: 0, // Immediate hiding for better UX
  },
};

// Transition State Interface
export interface TransitionState {
  isTransitioning: boolean;
  transitionType: 'sidebar' | 'footer' | 'content' | null;
}

// Default Transition State
export const defaultTransitionState: TransitionState = {
  isTransitioning: false,
  transitionType: null,
};

// Animation Utilities
export const getTransitionStyle = (
  property: string,
  duration: number,
  easing: string = animationConfig.easing.enter
): string => {
  return `${property} ${duration}ms ${easing}`;
};

// Enhanced Reduced Motion Support
export const shouldReduceMotion = (): boolean => {
  // Handle test environment where window.matchMedia might not exist
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    // Fallback for browsers that don't support this media query
    console.warn('prefers-reduced-motion media query not supported:', error);
    return false;
  }
};

// Get animation duration based on reduced motion preference
export const getAnimationDuration = (normalDuration: number): number => {
  if (shouldReduceMotion()) {
    // For reduced motion, use very short durations instead of 0 to maintain state transitions
    return Math.min(normalDuration * 0.1, 50);
  }
  return normalDuration;
};

// Check if user prefers reduced motion and provide appropriate feedback
export const getAccessibleAnimationConfig = () => {
  const reducedMotion = shouldReduceMotion();

  return {
    reducedMotion,
    // Provide alternative feedback methods when motion is reduced
    useAlternativeFeedback: reducedMotion,
    // Use sound or haptic feedback when available
    enableSoundFeedback: reducedMotion && 'vibrate' in navigator,
    enableHapticFeedback: reducedMotion && 'vibrate' in navigator,
  };
};

// Create transition timing function for Material-UI
export const createTransition = (
  properties: string | string[],
  duration?: number,
  easing?: string,
  delay?: number
): string => {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  const dur = duration
    ? getAnimationDuration(duration)
    : getAnimationDuration(animationConfig.duration.content);
  const ease = easing || animationConfig.easing.enter;
  const del = delay || 0;

  const delayString = del > 0 ? ` ${del}ms` : '';
  return `${props} ${dur}ms ${ease}${delayString}`;
};

// Enhanced reduced motion utilities with better accessibility support
export const getReducedMotionStyles = () => ({
  '@media (prefers-reduced-motion: reduce)': {
    // Use very short transitions instead of none to maintain state feedback
    transition: 'all 50ms ease !important',
    animation: 'none !important',
    transform: 'none !important',
    // Disable hover transforms
    '&:hover': {
      transform: 'none !important',
    },
    '&:active': {
      transform: 'none !important',
    },
    // Disable complex animations but keep opacity changes for state feedback
    '&[data-animation="complex"]': {
      transition: 'opacity 50ms ease !important',
    },
  },
});

// Create accessible transition with reduced motion support
export const createAccessibleTransition = (
  properties: string | string[],
  duration?: number,
  easing?: string,
  delay?: number
) => {
  const transition = createTransition(properties, duration, easing, delay);
  const accessibleConfig = getAccessibleAnimationConfig();

  return {
    transition,
    ...getReducedMotionStyles(),
    // Add data attribute for complex animations
    ...(accessibleConfig.reducedMotion && {
      'data-animation': 'complex',
    }),
  };
};

// Create focus-visible styles for better keyboard navigation
export const createFocusVisibleStyles = (color: string = '#1976d2') => ({
  '&:focus-visible': {
    outline: `2px solid ${color}`,
    outlineOffset: '2px',
    borderRadius: '4px',
    // Ensure focus is announced to screen readers
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '-2px',
      border: `2px solid ${color}`,
      borderRadius: '6px',
      pointerEvents: 'none',
    },
  },
  // Remove focus outline when not using keyboard
  '&:focus:not(:focus-visible)': {
    outline: 'none',
    '&::after': {
      display: 'none',
    },
  },
});

// Create accessible hover states that work with reduced motion
export const createAccessibleHoverStyles = (
  hoverColor?: string,
  hoverTransform?: string
) => ({
  '&:hover': {
    ...(hoverColor && { backgroundColor: hoverColor }),
    ...(hoverTransform && { transform: hoverTransform }),
    // Provide alternative feedback for reduced motion users
    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none !important',
      // Use subtle color changes instead of transforms
      filter: 'brightness(1.05)',
    },
  },
  '&:active': {
    '@media (prefers-reduced-motion: reduce)': {
      filter: 'brightness(0.95)',
      transform: 'none !important',
    },
  },
});

// Production-optimized performance utilities with enhanced GPU acceleration
export const getOptimizedTransformStyle = (
  transform: string,
  willChange?: string,
  forceGPU: boolean = true
) => ({
  transform,
  willChange: willChange || 'transform',
  // Enhanced GPU acceleration for smoother animations
  ...(forceGPU && {
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
    // Force hardware acceleration with translate3d if not already present
    ...(transform &&
      !transform.includes('translate3d') &&
      !transform.includes('translateZ') && {
        transform: `${transform} translateZ(0)`,
      }),
  }),
  // Optimize for compositing layers
  isolation: 'isolate' as const,
  // Prevent subpixel rendering issues
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale' as const,
  // Optimize text rendering during animations
  textRendering: 'optimizeSpeed' as const,
});

// Create performance-optimized transition for transforms
export const createOptimizedTransition = (
  properties: string | string[],
  duration?: number,
  easing?: string,
  delay?: number
) => {
  const props = Array.isArray(properties) ? properties : [properties];
  const optimizedProps = props.map((prop) => {
    // Prefer transform and opacity for better performance
    if (prop === 'margin-left' || prop === 'width') {
      return 'transform';
    }
    return prop;
  });

  return createAccessibleTransition(optimizedProps, duration, easing, delay);
};

// Animation frame utilities for smooth animations
export const requestAnimationFramePromise = (): Promise<number> => {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
};

// Debounced animation utility for performance
export const createDebouncedAnimation = (
  callback: () => void,
  delay: number = 16 // ~60fps
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let animationId: number | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(callback);
    }, delay);
  };
};

// Production-optimized performance monitoring with enhanced metrics and adaptive thresholds
export const measureAnimationPerformance = (
  animationName: string,
  callback: () => void | Promise<void>
) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    const performanceLevel = getDevicePerformanceLevel();

    // Adaptive performance thresholds based on device capability
    const frameThresholds = {
      high: 16.67, // 60fps
      medium: 20, // 50fps
      low: 33.33, // 30fps
    };

    const threshold = frameThresholds[performanceLevel];

    const finish = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Enhanced performance reporting with device context
      if (duration > threshold) {
        console.warn(
          `Animation "${animationName}" took ${duration.toFixed(2)}ms ` +
            `(> ${threshold}ms threshold for ${performanceLevel} performance device). ` +
            `Consider optimizing or using fallback animation.`
        );

        // Suggest optimizations based on duration
        if (duration > threshold * 2) {
          console.warn(
            `Severe performance issue detected. Consider:
            1. Using CSS transforms instead of layout changes
            2. Reducing animation complexity
            3. Implementing a simpler fallback animation`
          );
        }
      } else if (
        process.env.NODE_ENV === 'development' &&
        duration < threshold * 0.5
      ) {
        console.log(
          `Animation "${animationName}" performed well: ${duration.toFixed(2)}ms ` +
            `(${performanceLevel} performance device)`
        );
      }
    };

    const result = callback();

    if (result instanceof Promise) {
      return result.finally(finish);
    } else {
      finish();
      return result;
    }
  } else {
    return callback();
  }
};

// Error boundary for animation failures
export class AnimationErrorBoundary extends Error {
  constructor(
    message: string,
    public animationType: string,
    public componentName: string
  ) {
    super(message);
    this.name = 'AnimationErrorBoundary';
  }
}

// Production-optimized safe animation execution with enhanced error handling and performance monitoring
export const safeAnimationExecution = async (
  animationFn: () => void | Promise<void>,
  animationType: string,
  componentName: string,
  fallbackFn?: () => void
): Promise<void> => {
  const performanceLevel = getDevicePerformanceLevel();
  const startTime = performance.now();

  try {
    // For low-performance devices, consider using fallback immediately
    if (performanceLevel === 'low' && fallbackFn && Math.random() > 0.7) {
      console.debug(
        `Using fallback animation for low-performance device: ${componentName}`
      );
      fallbackFn();
      return;
    }

    await animationFn();

    // Monitor execution time and suggest optimizations
    const executionTime = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development' && executionTime > 100) {
      console.warn(
        `Long animation execution time in ${componentName} (${animationType}): ${executionTime.toFixed(2)}ms. ` +
          'Consider optimizing or implementing a fallback.'
      );
    }
  } catch (error) {
    const animationError = new AnimationErrorBoundary(
      `Animation failed in ${componentName}`,
      animationType,
      componentName
    );

    console.error(animationError, error);

    // Report to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with your error tracking service
      try {
        // Example: Sentry, LogRocket, etc.
        console.error('Production Animation Error:', {
          component: componentName,
          animationType,
          error: error instanceof Error ? error.message : String(error),
          performanceLevel,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
      } catch (reportingError) {
        console.debug('Error reporting failed:', reportingError);
      }
    }

    // Execute fallback with additional error handling
    if (fallbackFn) {
      try {
        console.debug(`Executing fallback animation for ${componentName}`);
        fallbackFn();
      } catch (fallbackError) {
        console.error(
          `Both animation and fallback failed in ${componentName}:`,
          { originalError: error, fallbackError }
        );

        // Last resort: ensure component remains functional
        try {
          // Force a basic state update to prevent stuck UI
          const event = new CustomEvent('animationFallbackFailed', {
            detail: { componentName, animationType, error },
          });
          document.dispatchEvent(event);
        } catch (eventError) {
          console.debug('Failed to dispatch fallback event:', eventError);
        }
      }
    }
  }
};

// Enhanced device performance detection with comprehensive metrics and caching
let cachedPerformanceLevel: 'high' | 'medium' | 'low' | null = null;

// Export for testing purposes
export const resetPerformanceCache = () => {
  cachedPerformanceLevel = null;
};
let performanceTestResults: { [key: string]: number } = {};

export const getDevicePerformanceLevel = (): 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'medium';

  // Return cached result if available (performance detection is expensive)
  if (cachedPerformanceLevel) {
    return cachedPerformanceLevel;
  }

  // Gather comprehensive device metrics
  const connection = (navigator as any).connection;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const userAgent = navigator.userAgent.toLowerCase();

  // Performance scoring system (0-100)
  let performanceScore = 50; // Start with medium baseline

  // CPU cores scoring
  if (hardwareConcurrency >= 8) {
    performanceScore += 20;
  } else if (hardwareConcurrency >= 4) {
    performanceScore += 10;
  } else if (hardwareConcurrency <= 2) {
    performanceScore -= 15;
  }

  // Memory scoring
  if (deviceMemory >= 8) {
    performanceScore += 15;
  } else if (deviceMemory >= 4) {
    performanceScore += 5;
  } else if (deviceMemory <= 2) {
    performanceScore -= 20;
  }

  // Connection quality scoring
  if (connection) {
    switch (connection.effectiveType) {
      case '4g':
        performanceScore += 10;
        break;
      case '3g':
        performanceScore += 0;
        break;
      case 'slow-2g':
      case '2g':
        performanceScore -= 25;
        break;
    }

    // Data saver mode indicates performance concern
    if (connection.saveData) {
      performanceScore -= 10;
    }
  }

  // Device type detection (mobile devices typically have lower performance)
  if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
    performanceScore -= 10;

    // Older mobile devices
    if (/android [1-4]\.|iphone os [1-9]_/i.test(userAgent)) {
      performanceScore -= 20;
    }
  }

  // Browser performance characteristics
  if (/chrome/i.test(userAgent)) {
    performanceScore += 5; // Chrome generally has good animation performance
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    performanceScore += 3; // Safari has good GPU acceleration
  } else if (/firefox/i.test(userAgent)) {
    performanceScore += 2; // Firefox decent performance
  }

  // Runtime performance test (simple animation frame timing)
  try {
    const testStart = performance.now();
    let frameCount = 0;
    const testDuration = 50; // 50ms test

    const testFrame = () => {
      frameCount++;
      if (performance.now() - testStart < testDuration) {
        requestAnimationFrame(testFrame);
      } else {
        const fps = (frameCount / testDuration) * 1000;
        performanceTestResults.frameTest = fps;

        if (fps >= 55) {
          performanceScore += 10;
        } else if (fps <= 30) {
          performanceScore -= 15;
        }
      }
    };

    requestAnimationFrame(testFrame);
  } catch (error) {
    // Fallback if performance test fails
    console.debug('Performance test failed, using static metrics');
  }

  // Determine performance level based on score
  let level: 'high' | 'medium' | 'low';
  if (performanceScore >= 70) {
    level = 'high';
  } else if (performanceScore <= 30) {
    level = 'low';
  } else {
    level = 'medium';
  }

  // Cache the result
  cachedPerformanceLevel = level;

  // Log performance analysis in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Device Performance Analysis:', {
      level,
      score: performanceScore,
      metrics: {
        hardwareConcurrency,
        deviceMemory,
        connectionType: connection?.effectiveType || 'unknown',
        saveData: connection?.saveData || false,
        userAgent: userAgent.substring(0, 50) + '...',
      },
      testResults: performanceTestResults,
    });
  }

  return level;
};

// Enhanced sidebar transition utility
export const createSidebarTransition = (
  properties: string | string[],
  isOpening: boolean,
  duration?: number,
  delay?: number
) => {
  const config = getAdaptiveAnimationConfig();
  const props = Array.isArray(properties) ? properties : [properties];
  const dur = duration || config.duration.sidebar;
  const easing = isOpening ? config.easing.enter : config.easing.exit;
  const del = delay || 0;

  return createOptimizedTransition(props, dur, easing, del);
};

// Enhanced content stagger animation utility
export const createStaggeredContentTransition = (
  properties: string | string[],
  index: number,
  isVisible: boolean,
  baseDelay: number = 30
) => {
  const config = getAdaptiveAnimationConfig();
  const staggerDelay = isVisible ? index * baseDelay : 0;

  return createOptimizedTransition(
    properties,
    config.duration.content,
    config.easing.smooth,
    staggerDelay
  );
};

// Keyboard navigation utilities
export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  callback: () => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    keys?: string[];
  } = {}
) => {
  const {
    preventDefault = true,
    stopPropagation = false,
    keys = ['Enter', ' '],
  } = options;

  if (keys.includes(event.key)) {
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    callback();
  }
};

// ARIA live region utilities for screen reader announcements
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  timeout: number = 1000
) => {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute(
    'role',
    priority === 'assertive' ? 'alert' : 'status'
  );
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Clean up after screen readers have processed the announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, timeout);
};

// Focus management utilities
export const manageFocus = {
  // Store the currently focused element
  storeFocus: (): Element | null => {
    return document.activeElement;
  },

  // Restore focus to a previously stored element
  restoreFocus: (element: Element | null) => {
    if (element && 'focus' in element && typeof element.focus === 'function') {
      (element as HTMLElement).focus();
    }
  },

  // Find the first focusable element within a container
  findFirstFocusable: (container: Element): HTMLElement | null => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
    ].join(', ');

    return container.querySelector(focusableSelectors);
  },

  // Trap focus within a container (useful for modals/drawers)
  trapFocus: (container: Element, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[role="button"]:not([disabled])',
        '[role="menuitem"]:not([disabled])',
      ].join(', ')
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  },
};

// Production-optimized adaptive animation configuration with enhanced device performance handling
export const getAdaptiveAnimationConfig = (): AnimationConfig => {
  const performanceLevel = getDevicePerformanceLevel();
  const accessibleConfig = getAccessibleAnimationConfig();
  const baseConfig = animationConfig;

  // If reduced motion is preferred, use minimal but still functional animations
  if (accessibleConfig.reducedMotion) {
    return {
      ...baseConfig,
      duration: {
        sidebar: 40, // Minimal but perceptible for state feedback
        footer: 40,
        content: 40,
        iconTransition: 40,
      },
      easing: {
        enter: 'linear', // Simplest easing for reduced motion
        exit: 'linear',
        sharp: 'linear',
        smooth: 'linear',
        bounce: 'linear', // No bounce for reduced motion
      },
    };
  }

  switch (performanceLevel) {
    case 'low':
      // Optimized for low-end devices with simpler animations
      return {
        ...baseConfig,
        duration: {
          sidebar: Math.max(baseConfig.duration.sidebar * 0.6, 160), // More aggressive reduction
          footer: Math.max(baseConfig.duration.footer * 0.6, 100),
          content: Math.max(baseConfig.duration.content * 0.6, 140),
          iconTransition: Math.max(
            baseConfig.duration.iconTransition * 0.6,
            80
          ),
        },
        easing: {
          // Use browser-optimized easing functions for better performance
          enter: 'ease-out',
          exit: 'ease-in',
          sharp: 'ease',
          smooth: 'ease-out',
          bounce: 'ease-out', // No complex bounce for low-end devices
        },
      };
    case 'high':
      // Enhanced animations for high-performance devices
      return {
        ...baseConfig,
        duration: {
          sidebar: Math.min(baseConfig.duration.sidebar * 1.2, 350), // Cap maximum duration
          footer: Math.min(baseConfig.duration.footer * 1.2, 220),
          content: Math.min(baseConfig.duration.content * 1.2, 300),
          iconTransition: Math.min(
            baseConfig.duration.iconTransition * 1.2,
            150
          ),
        },
        easing: {
          ...baseConfig.easing,
          // Use more sophisticated easing for high-end devices
          enter: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Enhanced ease-out with subtle overshoot
          smooth: 'cubic-bezier(0.23, 1, 0.32, 1)', // Ultra-smooth for high-end devices
        },
      };
    default:
      // Medium performance - use base config with minor optimizations
      return {
        ...baseConfig,
        duration: {
          sidebar: baseConfig.duration.sidebar * 0.95, // Slightly faster for better perceived performance
          footer: baseConfig.duration.footer * 0.95,
          content: baseConfig.duration.content * 0.95,
          iconTransition: baseConfig.duration.iconTransition * 0.95,
        },
      };
  }
};

// Production-optimized animation utilities with transform-first approach
export const createProductionOptimizedTransition = (
  properties: string | string[],
  duration?: number,
  easing?: string,
  delay?: number
) => {
  const config = getAdaptiveAnimationConfig();
  const props = Array.isArray(properties) ? properties : [properties];

  // Transform layout-affecting properties to transform-based ones for better performance
  const optimizedProps = props.map((prop) => {
    switch (prop) {
      case 'margin-left':
      case 'margin-right':
      case 'left':
      case 'right':
        return 'transform'; // Use translateX instead
      case 'margin-top':
      case 'margin-bottom':
      case 'top':
      case 'bottom':
        return 'transform'; // Use translateY instead
      case 'width':
      case 'height':
        // For width/height, prefer scale when possible, otherwise keep as-is
        return prop; // Keep original but add warning in dev
      default:
        return prop;
    }
  });

  // Remove duplicates
  const uniqueProps = optimizedProps.filter(
    (prop, index) => optimizedProps.indexOf(prop) === index
  );

  // Warn about potentially expensive properties in development
  if (process.env.NODE_ENV === 'development') {
    const expensiveProps = props.filter((prop) =>
      ['width', 'height', 'margin', 'padding', 'border-width'].some(
        (expensive) => prop.includes(expensive)
      )
    );

    if (expensiveProps.length > 0) {
      console.warn(
        `Potentially expensive CSS properties detected: ${expensiveProps.join(', ')}. ` +
          'Consider using transform-based alternatives for better performance.'
      );
    }
  }

  return createAccessibleTransition(
    uniqueProps,
    duration || config.duration.content,
    easing || config.easing.enter,
    delay
  );
};

// Enhanced will-change management for better performance
export const createWillChangeManager = () => {
  const activeElements = new WeakMap<Element, Set<string>>();

  return {
    // Add will-change property to element
    add: (element: Element, properties: string | string[]) => {
      const props = Array.isArray(properties) ? properties : [properties];
      const currentProps = activeElements.get(element) || new Set();

      props.forEach((prop) => currentProps.add(prop));
      activeElements.set(element, currentProps);

      if (element instanceof HTMLElement) {
        element.style.willChange = Array.from(currentProps).join(', ');
      }
    },

    // Remove will-change property from element
    remove: (element: Element, properties?: string | string[]) => {
      const currentProps = activeElements.get(element);
      if (!currentProps) return;

      if (properties) {
        const propsToRemove = Array.isArray(properties)
          ? properties
          : [properties];
        propsToRemove.forEach((prop) => currentProps.delete(prop));
      } else {
        currentProps.clear();
      }

      if (element instanceof HTMLElement) {
        if (currentProps.size === 0) {
          element.style.willChange = 'auto';
          activeElements.delete(element);
        } else {
          element.style.willChange = Array.from(currentProps).join(', ');
        }
      }
    },

    // Clean up all will-change properties
    cleanup: () => {
      // This would be called on component unmount
      // The WeakMap will automatically clean up when elements are garbage collected
    },
  };
};

// Global will-change manager instance
export const willChangeManager = createWillChangeManager();

// Animation frame scheduler for smooth animations
export const createAnimationScheduler = () => {
  const scheduledCallbacks = new Set<() => void>();
  let isScheduled = false;

  const flush = () => {
    isScheduled = false;
    const callbacks = Array.from(scheduledCallbacks);
    scheduledCallbacks.clear();

    callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Animation scheduler callback failed:', error);
      }
    });
  };

  return {
    schedule: (callback: () => void) => {
      scheduledCallbacks.add(callback);

      if (!isScheduled) {
        isScheduled = true;
        requestAnimationFrame(flush);
      }
    },

    cancel: (callback: () => void) => {
      scheduledCallbacks.delete(callback);
    },

    clear: () => {
      scheduledCallbacks.clear();
      isScheduled = false;
    },
  };
};

// Global animation scheduler instance
export const animationScheduler = createAnimationScheduler();

// Production-optimized stagger animation utility
export const createOptimizedStaggerAnimation = (
  elements: Element[],
  animationFn: (element: Element, index: number) => void,
  staggerDelay: number = 50,
  maxConcurrent: number = 3
) => {
  const performanceLevel = getDevicePerformanceLevel();

  // Adjust parameters based on device performance
  const adjustedDelay =
    performanceLevel === 'low' ? staggerDelay * 0.5 : staggerDelay;
  const adjustedConcurrent = performanceLevel === 'low' ? 1 : maxConcurrent;

  let currentIndex = 0;
  let activeAnimations = 0;

  const processNext = () => {
    while (
      activeAnimations < adjustedConcurrent &&
      currentIndex < elements.length
    ) {
      const element = elements[currentIndex];
      const index = currentIndex;

      activeAnimations++;
      currentIndex++;

      // Create a closure to avoid the loop function warning
      const createAnimationCallback = (el: Element, idx: number) => () => {
        try {
          animationFn(el, idx);
        } catch (error) {
          console.error(`Stagger animation failed for element ${idx}:`, error);
        } finally {
          activeAnimations--;
          processNext();
        }
      };

      setTimeout(
        createAnimationCallback(element, index),
        index * adjustedDelay
      );
    }
  };

  processNext();
};

// Memory-efficient animation cleanup utility
export const createAnimationCleanup = () => {
  const cleanupTasks = new Set<() => void>();

  return {
    add: (task: () => void) => {
      cleanupTasks.add(task);
    },

    remove: (task: () => void) => {
      cleanupTasks.delete(task);
    },

    cleanup: () => {
      cleanupTasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.debug('Animation cleanup task failed:', error);
        }
      });
      cleanupTasks.clear();
    },
  };
};

// Enhanced reduced motion detection with user preference caching
let reducedMotionCache: boolean | null = null;
let reducedMotionMediaQuery: MediaQueryList | null = null;

// Export for testing purposes
export const resetReducedMotionCache = () => {
  reducedMotionCache = null;
  reducedMotionMediaQuery = null;
};

export const getReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Return cached value if available
  if (reducedMotionCache !== null) {
    return reducedMotionCache;
  }

  try {
    if (!reducedMotionMediaQuery) {
      reducedMotionMediaQuery = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );

      // Listen for changes and update cache
      reducedMotionMediaQuery.addEventListener('change', (e) => {
        reducedMotionCache = e.matches;
      });
    }

    reducedMotionCache = reducedMotionMediaQuery.matches;
    return reducedMotionCache;
  } catch (error) {
    console.debug('Reduced motion detection failed:', error);
    return false;
  }
};

// Production-ready animation performance profiler
export const createAnimationProfiler = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development') {
    return {
      start: () => {},
      end: () => {},
      mark: () => {},
      measure: () => {},
    };
  }

  const marks: { [key: string]: number } = {};

  return {
    start: (label: string = 'animation') => {
      const markName = `${componentName}-${label}-start`;
      marks[markName] = performance.now();
      performance.mark?.(markName);
    },

    end: (label: string = 'animation') => {
      const startMark = `${componentName}-${label}-start`;
      const endMark = `${componentName}-${label}-end`;
      const endTime = performance.now();

      performance.mark?.(endMark);

      if (marks[startMark]) {
        const duration = endTime - marks[startMark];
        console.log(
          `Animation "${label}" in ${componentName}: ${duration.toFixed(2)}ms`
        );

        try {
          performance.measure?.(
            `${componentName}-${label}`,
            startMark,
            endMark
          );
        } catch (error) {
          console.debug('Performance measure failed:', error);
        }
      }
    },

    mark: (label: string) => {
      const markName = `${componentName}-${label}`;
      marks[markName] = performance.now();
      performance.mark?.(markName);
    },

    measure: (name: string, startMark: string, endMark?: string) => {
      try {
        const fullStartMark = `${componentName}-${startMark}`;
        const fullEndMark = endMark ? `${componentName}-${endMark}` : undefined;
        performance.measure?.(
          `${componentName}-${name}`,
          fullStartMark,
          fullEndMark
        );
      } catch (error) {
        console.debug('Performance measure failed:', error);
      }
    },
  };
};
