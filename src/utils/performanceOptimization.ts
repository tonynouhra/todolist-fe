import { ComponentType, lazy, LazyExoticComponent } from 'react';

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Performance-aware lazy loading with retry mechanism
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries: number = 3
): LazyExoticComponent<T> => {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempt = 0;

      const tryImport = () => {
        importFn()
          .then(resolve)
          .catch((error) => {
            attempt++;
            if (attempt < retries) {
              console.warn(
                `Failed to load component, retrying... (${attempt}/${retries})`
              );
              setTimeout(tryImport, 1000 * attempt); // Exponential backoff
            } else {
              console.error(
                'Failed to load component after all retries:',
                error
              );
              reject(error);
            }
          });
      };

      tryImport();
    });
  });
};

// Preload components for better UX
export const preloadComponent = (importFn: () => Promise<any>): void => {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
    };

    schedulePreload(() => {
      importFn().catch((error) => {
        console.warn('Failed to preload component:', error);
      });
    });
  }
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = (): void => {
  if (process.env.NODE_ENV === 'development') {
    // Log bundle information
    console.group('Bundle Analysis');

    // Check for large dependencies
    const largeDependencies = [
      '@mui/material',
      '@mui/icons-material',
      'framer-motion',
      '@tanstack/react-query',
      '@clerk/clerk-react',
    ];

    largeDependencies.forEach((dep) => {
      try {
        const module = require(dep);
        console.log(`${dep}: Loaded`);
      } catch (error) {
        console.log(`${dep}: Not loaded`);
      }
    });

    // Memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }

    console.groupEnd();
  }
};

// Performance monitoring for component loading
export const measureComponentLoadTime = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} load time: ${loadTime.toFixed(2)}ms`);

      if (loadTime > 100) {
        console.warn(
          `Slow component load detected: ${componentName} took ${loadTime.toFixed(2)}ms`
        );
      }
    }
  };
};

// Image lazy loading utility
export const createLazyImage = (
  src: string,
  alt: string,
  className?: string
) => {
  return {
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+', // Transparent placeholder
    'data-src': src,
    alt,
    className: `lazy-image ${className || ''}`,
    loading: 'lazy' as const,
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const dataSrc = img.getAttribute('data-src');
      if (dataSrc && img.src !== dataSrc) {
        img.src = dataSrc;
      }
    },
  };
};

// Resource hints for better loading performance
export const addResourceHints = (): void => {
  if (typeof document === 'undefined') return;

  const head = document.head;

  // DNS prefetch for external resources
  const dnsPrefetchUrls = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  dnsPrefetchUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    head.appendChild(link);
  });

  // Preconnect to critical resources
  const preconnectUrls = ['https://api.clerk.dev'];

  preconnectUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });
};

// Service Worker registration for caching
export const registerServiceWorker = (): void => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Critical CSS inlining utility
export const inlineCriticalCSS = (css: string): void => {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
};

// Performance budget checker
export const checkPerformanceBudget = (): void => {
  if (process.env.NODE_ENV === 'development') {
    // Check bundle size budget
    const budgets = {
      javascript: 250 * 1024, // 250KB
      css: 50 * 1024, // 50KB
      images: 500 * 1024, // 500KB
    };

    // This would typically be integrated with webpack-bundle-analyzer
    console.log('Performance budgets:', budgets);
    console.log('Use webpack-bundle-analyzer to check actual bundle sizes');
  }
};

// Web Vitals monitoring with enhanced reporting
export const monitorWebVitals = (): void => {
  if (typeof window !== 'undefined') {
    import('web-vitals')
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        const reportMetric = (metric: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`${metric.name}: ${metric.value}`, metric);
          }

          // Performance budget checks
          const budgets = {
            CLS: 0.1,
            FID: 100,
            FCP: 1800,
            LCP: 2500,
            TTFB: 800,
          };

          const budget = budgets[metric.name as keyof typeof budgets];
          if (budget && metric.value > budget) {
            console.warn(
              `Performance budget exceeded for ${metric.name}: ${metric.value} > ${budget}`
            );
          }

          // Send to analytics in production
          if (process.env.NODE_ENV === 'production' && window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(
                metric.name === 'CLS' ? metric.value * 1000 : metric.value
              ),
              event_label: metric.id,
              non_interaction: true,
            });
          }
        };

        getCLS(reportMetric);
        getFID(reportMetric);
        getFCP(reportMetric);
        getLCP(reportMetric);
        getTTFB(reportMetric);
      })
      .catch(() => {
        console.warn('Web Vitals monitoring not available');
      });
  }
};
