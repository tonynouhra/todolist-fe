import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import {
  getAdaptiveAnimationConfig,
  getDevicePerformanceLevel,
  measureAnimationPerformance,
  safeAnimationExecution,
  createProductionOptimizedTransition,
  getReducedMotionPreference,
  createAnimationProfiler,
  resetPerformanceCache,
  resetReducedMotionCache,
} from '../../../constants/animations';

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock matchMedia for reduced motion testing
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});
Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
});

// Mock navigator properties for device performance testing
const mockNavigator = {
  hardwareConcurrency: 4,
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('Animation Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    // Reset cached performance level and reduced motion cache
    resetPerformanceCache();
    resetReducedMotionCache();
  });

  describe('Device Performance Detection', () => {
    it('should detect high-performance devices correctly', () => {
      // Mock high-performance device
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 8,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 8,
        writable: true,
      });

      const performanceLevel = getDevicePerformanceLevel();
      expect(performanceLevel).toBe('high');
    });

    it('should detect low-performance devices correctly', () => {
      // Reset cache first
      resetPerformanceCache();

      // Mock low-performance device
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 1, // Very low core count
        writable: true,
      });
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 1, // Very low memory
        writable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0', // Mobile device
        writable: true,
      });

      const performanceLevel = getDevicePerformanceLevel();
      expect(performanceLevel).toBe('low');
    });

    it('should default to medium performance for unknown devices', () => {
      // Reset cache first
      resetPerformanceCache();

      // Mock medium-performance device
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 4,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 4,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });

      const performanceLevel = getDevicePerformanceLevel();
      expect(performanceLevel).toBe('medium');
    });
  });

  describe('Adaptive Animation Configuration', () => {
    it('should provide reduced animations for reduced motion preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers-reduced-motion: reduce
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const config = getAdaptiveAnimationConfig();

      expect(config.duration.sidebar).toBeLessThanOrEqual(50);
      expect(config.duration.footer).toBeLessThanOrEqual(50);
      expect(config.easing.enter).toBe('linear');
    });

    it('should provide optimized animations for high-performance devices', () => {
      // Mock high-performance device
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 8,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 8,
        writable: true,
      });

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const config = getAdaptiveAnimationConfig();

      expect(config.duration.sidebar).toBeGreaterThan(280);
      expect(config.easing.enter).toContain('cubic-bezier');
    });

    it('should provide simplified animations for low-performance devices', () => {
      // Reset caches first
      resetPerformanceCache();
      resetReducedMotionCache();

      // Mock low-performance device
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 1,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 1,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
        writable: true,
      });

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const config = getAdaptiveAnimationConfig();

      expect(config.duration.sidebar).toBeLessThan(280);
      expect(config.easing.enter).toBe('ease-out');
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure animation performance in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      let callbackExecuted = false;
      const slowCallback = () => {
        // Simulate slow animation
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Busy wait to simulate slow operation
        }
        callbackExecuted = true;
      };

      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(50);

      await measureAnimationPerformance('test-animation', slowCallback);

      expect(callbackExecuted).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Animation "test-animation" took')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not measure performance in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      let callbackExecuted = false;
      const callback = () => {
        callbackExecuted = true;
      };

      await measureAnimationPerformance('test-animation', callback);

      expect(callbackExecuted).toBe(true);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Safe Animation Execution', () => {
    it('should execute animation successfully', async () => {
      let animationExecuted = false;
      const animationFn = () => {
        animationExecuted = true;
      };

      await safeAnimationExecution(
        animationFn,
        'test-animation',
        'TestComponent'
      );

      expect(animationExecuted).toBe(true);
    });

    it('should execute fallback on animation failure', async () => {
      let fallbackExecuted = false;
      const animationFn = () => {
        throw new Error('Animation failed');
      };
      const fallbackFn = () => {
        fallbackExecuted = true;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await safeAnimationExecution(
        animationFn,
        'test-animation',
        'TestComponent',
        fallbackFn
      );

      expect(fallbackExecuted).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use fallback for low-performance devices', async () => {
      // Reset cache first
      resetPerformanceCache();

      // Mock low-performance device
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 1,
        writable: true,
      });
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 1,
        writable: true,
      });

      let animationExecuted = false;
      let fallbackExecuted = false;

      const animationFn = () => {
        animationExecuted = true;
      };
      const fallbackFn = () => {
        fallbackExecuted = true;
      };

      // Mock Math.random to ensure fallback is used (need to be > 0.7 to skip fallback)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5); // Less than 0.7 threshold, so should use fallback

      await safeAnimationExecution(
        animationFn,
        'test-animation',
        'TestComponent',
        fallbackFn
      );

      // Should use fallback for low-performance device
      expect(fallbackExecuted).toBe(true);
      expect(animationExecuted).toBe(false);

      Math.random = originalRandom;
    });
  });

  describe('Production Optimized Transitions', () => {
    it('should optimize layout-affecting properties to transforms', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const transition = createProductionOptimizedTransition([
        'margin-left',
        'width',
        'opacity',
      ]);

      expect(transition.transition).toContain('transform');
      expect(transition.transition).toContain('opacity');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Potentially expensive CSS properties detected')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not warn about expensive properties in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      createProductionOptimizedTransition(['width', 'height']);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Reduced Motion Detection', () => {
    it('should detect reduced motion preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const reducedMotion = getReducedMotionPreference();
      expect(reducedMotion).toBe(true);
    });

    it('should handle matchMedia not being available', () => {
      // Reset cache first
      resetReducedMotionCache();

      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });

      const reducedMotion = getReducedMotionPreference();
      expect(reducedMotion).toBe(false);

      // Restore matchMedia
      Object.defineProperty(window, 'matchMedia', {
        value: originalMatchMedia,
        writable: true,
      });
    });
  });

  describe('Animation Profiler', () => {
    it('should profile animations in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const profiler = createAnimationProfiler('TestComponent');

      // Mock performance.now to return predictable values
      let callCount = 0;
      mockPerformance.now.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 100; // First call returns 0, second returns 100
      });

      profiler.start('test-animation');
      profiler.end('test-animation');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Animation "test-animation" in TestComponent: 100.00ms'
        )
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not profile animations in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const profiler = createAnimationProfiler('TestComponent');

      // Should return no-op functions
      expect(typeof profiler.start).toBe('function');
      expect(typeof profiler.end).toBe('function');

      // Should not throw or log anything
      profiler.start('test');
      profiler.end('test');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Component Integration', () => {
    it('should handle animation utilities without errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Test basic animation utility functions
      const config = getAdaptiveAnimationConfig();
      expect(config).toBeDefined();
      expect(config.duration).toBeDefined();
      expect(config.easing).toBeDefined();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should handle animation cleanup properly', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Test animation cleanup utilities
      const {
        createAnimationCleanup,
      } = require('../../../constants/animations');
      const cleanup = createAnimationCleanup();

      let cleanupExecuted = false;
      cleanup.add(() => {
        cleanupExecuted = true;
      });

      cleanup.cleanup();
      expect(cleanupExecuted).toBe(true);

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from animation errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock an animation that fails
      const failingAnimation = () => {
        throw new Error('Animation failed');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let fallbackExecuted = false;

      await safeAnimationExecution(
        failingAnimation,
        'test-animation',
        'TestComponent',
        () => {
          fallbackExecuted = true;
        }
      );

      expect(fallbackExecuted).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
