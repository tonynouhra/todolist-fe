// Performance testing utilities for animation optimization

export interface PerformanceMetrics {
  frameRate: number;
  averageFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  duration: number;
}

export interface DeviceCapabilities {
  hardwareConcurrency: number;
  deviceMemory: number;
  connectionType: string;
  performanceLevel: 'high' | 'medium' | 'low';
}

// Performance monitoring class for animations
export class AnimationPerformanceMonitor {
  private startTime: number = 0;
  private frameCount: number = 0;
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private isMonitoring: boolean = false;
  private animationId: number | null = null;

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.frameTimes = [];
    this.lastFrameTime = this.startTime;

    this.monitorFrame();
  }

  stop(): PerformanceMetrics {
    if (!this.isMonitoring) {
      throw new Error('Monitor is not running');
    }

    this.isMonitoring = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const endTime = performance.now();
    const duration = endTime - this.startTime;
    const averageFrameTime =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const frameRate = 1000 / averageFrameTime;
    const droppedFrames = this.frameTimes.filter((time) => time > 16.67).length; // Frames longer than 60fps

    return {
      frameRate,
      averageFrameTime,
      droppedFrames,
      totalFrames: this.frameCount,
      duration,
    };
  }

  private monitorFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    this.frameTimes.push(frameTime);
    this.frameCount++;
    this.lastFrameTime = currentTime;

    this.animationId = requestAnimationFrame(this.monitorFrame);
  };
}

// Get device capabilities for performance optimization
export const getDeviceCapabilities = (): DeviceCapabilities => {
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const connection = (navigator as any).connection;
  const connectionType = connection?.effectiveType || 'unknown';

  let performanceLevel: 'high' | 'medium' | 'low' = 'medium';

  // Determine performance level based on device specs
  if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
    performanceLevel = 'high';
  } else if (
    hardwareConcurrency <= 2 ||
    deviceMemory <= 2 ||
    connectionType === 'slow-2g' ||
    connectionType === '2g'
  ) {
    performanceLevel = 'low';
  }

  return {
    hardwareConcurrency,
    deviceMemory,
    connectionType,
    performanceLevel,
  };
};

// Test animation performance
export const testAnimationPerformance = async (
  animationFn: () => Promise<void> | void,
  testName: string = 'Animation Test'
): Promise<PerformanceMetrics> => {
  const monitor = new AnimationPerformanceMonitor();

  console.log(`Starting performance test: ${testName}`);
  monitor.start();

  try {
    await animationFn();

    // Wait a bit to capture the full animation
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    console.error(`Performance test failed: ${testName}`, error);
  }

  const metrics = monitor.stop();

  console.log(`Performance test results for ${testName}:`, {
    frameRate: `${metrics.frameRate.toFixed(2)} fps`,
    averageFrameTime: `${metrics.averageFrameTime.toFixed(2)} ms`,
    droppedFrames: `${metrics.droppedFrames}/${metrics.totalFrames}`,
    duration: `${metrics.duration.toFixed(2)} ms`,
  });

  // Warn about performance issues
  if (metrics.frameRate < 30) {
    console.warn(
      `Low frame rate detected in ${testName}: ${metrics.frameRate.toFixed(2)} fps`
    );
  }

  if (metrics.droppedFrames > metrics.totalFrames * 0.1) {
    console.warn(
      `High dropped frame rate in ${testName}: ${metrics.droppedFrames}/${metrics.totalFrames}`
    );
  }

  return metrics;
};

// Benchmark different animation approaches
export const benchmarkAnimationApproaches = async (
  approaches: Array<{
    name: string;
    fn: () => Promise<void> | void;
  }>
): Promise<Array<{ name: string; metrics: PerformanceMetrics }>> => {
  const results: Array<{ name: string; metrics: PerformanceMetrics }> = [];

  for (const approach of approaches) {
    try {
      const metrics = await testAnimationPerformance(
        approach.fn,
        approach.name
      );
      results.push({ name: approach.name, metrics });

      // Wait between tests to avoid interference
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Benchmark failed for ${approach.name}:`, error);
    }
  }

  // Sort by frame rate (higher is better)
  results.sort((a, b) => b.metrics.frameRate - a.metrics.frameRate);

  console.log('Animation benchmark results (sorted by frame rate):');
  results.forEach((result, index) => {
    console.log(
      `${index + 1}. ${result.name}: ${result.metrics.frameRate.toFixed(2)} fps`
    );
  });

  return results;
};

// Memory usage monitoring
export const monitorMemoryUsage = (): void => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
};

// Performance-aware animation wrapper
export const createPerformanceAwareAnimation = (
  animationFn: () => void,
  fallbackFn?: () => void,
  performanceThreshold: number = 30 // minimum fps
) => {
  return async () => {
    const deviceCapabilities = getDeviceCapabilities();

    // Use fallback for low-performance devices
    if (deviceCapabilities.performanceLevel === 'low' && fallbackFn) {
      console.log('Using fallback animation for low-performance device');
      fallbackFn();
      return;
    }

    // Test performance in development
    if (process.env.NODE_ENV === 'development') {
      const metrics = await testAnimationPerformance(
        animationFn,
        'Performance-aware animation'
      );

      if (metrics.frameRate < performanceThreshold) {
        console.warn(
          `Animation performance below threshold (${metrics.frameRate.toFixed(2)} < ${performanceThreshold} fps). ` +
            'Consider using fallback or optimizing animation.'
        );
      }
    } else {
      animationFn();
    }
  };
};

// React hook for performance monitoring (to be used in React components)
export const createPerformanceMonitoringHook = () => {
  // This function returns a hook that can be used in React components
  return (componentName: string) => {
    // Import React dynamically when the hook is used
    const React = require('react');

    const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(
      null
    );
    const monitorRef = React.useRef<AnimationPerformanceMonitor | null>(null);

    const startMonitoring = React.useCallback(() => {
      if (!monitorRef.current) {
        monitorRef.current = new AnimationPerformanceMonitor();
      }
      monitorRef.current.start();
    }, []);

    const stopMonitoring = React.useCallback(() => {
      if (monitorRef.current) {
        const result = monitorRef.current.stop();
        setMetrics(result);

        if (process.env.NODE_ENV === 'development') {
          console.log(`Performance metrics for ${componentName}:`, result);
        }

        return result;
      }
      return null;
    }, [componentName]);

    React.useEffect(() => {
      return () => {
        if (monitorRef.current) {
          try {
            monitorRef.current.stop();
          } catch (error) {
            // Monitor might not be running
          }
        }
      };
    }, []);

    return {
      metrics,
      startMonitoring,
      stopMonitoring,
    };
  };
};
