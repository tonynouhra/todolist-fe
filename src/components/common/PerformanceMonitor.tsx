import React, { useEffect, useRef } from 'react';
import {
  monitorWebVitals,
  analyzeBundleSize,
  addResourceHints,
} from '../../utils/performanceOptimization';

interface PerformanceMonitorProps {
  children: React.ReactNode;
  enableWebVitals?: boolean;
  enableBundleAnalysis?: boolean;
  enableResourceHints?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  enableWebVitals = true,
  enableBundleAnalysis = process.env.NODE_ENV === 'development',
  enableResourceHints = true,
}) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Initialize performance monitoring
    if (enableWebVitals) {
      monitorWebVitals();
    }

    if (enableBundleAnalysis) {
      analyzeBundleSize();
    }

    if (enableResourceHints) {
      addResourceHints();
    }

    // Log performance timing
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.group('Performance Timing');
          console.log(
            'DNS Lookup:',
            navigation.domainLookupEnd - navigation.domainLookupStart,
            'ms'
          );
          console.log(
            'TCP Connection:',
            navigation.connectEnd - navigation.connectStart,
            'ms'
          );
          console.log(
            'Request:',
            navigation.responseStart - navigation.requestStart,
            'ms'
          );
          console.log(
            'Response:',
            navigation.responseEnd - navigation.responseStart,
            'ms'
          );
          console.log(
            'DOM Processing:',
            navigation.domContentLoadedEventEnd - navigation.responseEnd,
            'ms'
          );
          console.log(
            'Total Load Time:',
            navigation.loadEventEnd - navigation.fetchStart,
            'ms'
          );
          console.groupEnd();
        }
      }, 1000);
    }
  }, [enableWebVitals, enableBundleAnalysis, enableResourceHints]);

  return <>{children}</>;
};
