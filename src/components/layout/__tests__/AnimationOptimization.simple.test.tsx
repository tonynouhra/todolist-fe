import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import {
  getAdaptiveAnimationConfig,
  getDevicePerformanceLevel,
  measureAnimationPerformance,
  safeAnimationExecution,
  createProductionOptimizedTransition,
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

// Mock matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('Animation Optimization - Core Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    resetPerformanceCache();
    resetReducedMotionCache();
  });

  describe('Basic Functionality', () => {
    it('should provide adaptive animation configuration', () => {
      const config = getAdaptiveAnimationConfig();

      expect(config).toBeDefined();
      expect(config.duration).toBeDefined();
      expect(config.easing).toBeDefined();
      expect(typeof config.duration.sidebar).toBe('number');
      expect(typeof config.easing.enter).toBe('string');
    });

    it('should detect device performance level', () => {
      const performanceLevel = getDevicePerformanceLevel();
      expect(['high', 'medium', 'low']).toContain(performanceLevel);
    });

    it('should execute animations safely', async () => {
      let executed = false;
      const animationFn = () => {
        executed = true;
      };

      await safeAnimationExecution(
        animationFn,
        'test-animation',
        'TestComponent'
      );

      expect(executed).toBe(true);
    });

    it('should handle animation failures gracefully', async () => {
      let fallbackExecuted = false;
      const failingAnimation = () => {
        throw new Error('Animation failed');
      };
      const fallbackFn = () => {
        fallbackExecuted = true;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await safeAnimationExecution(
        failingAnimation,
        'test-animation',
        'TestComponent',
        fallbackFn
      );

      expect(fallbackExecuted).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should optimize CSS transitions', () => {
      const transition = createProductionOptimizedTransition([
        'opacity',
        'transform',
      ]);

      expect(transition).toBeDefined();
      expect(transition.transition).toContain('opacity');
      expect(transition.transition).toContain('transform');
    });

    it('should measure animation performance in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      let callbackExecuted = false;
      const callback = () => {
        callbackExecuted = true;
      };

      await measureAnimationPerformance('test-animation', callback);

      expect(callbackExecuted).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle reduced motion preferences', () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers-reduced-motion: reduce
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const config = getAdaptiveAnimationConfig();

      // Should provide minimal animations for reduced motion
      expect(config.duration.sidebar).toBeLessThanOrEqual(50);
      expect(config.easing.enter).toBe('linear');
    });
  });

  describe('Performance Optimization', () => {
    it('should provide different configurations for different performance levels', () => {
      // Test with different mock device specs
      const configs = [];

      // High performance
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 8,
        writable: true,
      });
      resetPerformanceCache();
      configs.push(getAdaptiveAnimationConfig());

      // Low performance
      Object.defineProperty(window.navigator, 'hardwareConcurrency', {
        value: 1,
        writable: true,
      });
      resetPerformanceCache();
      configs.push(getAdaptiveAnimationConfig());

      // Configurations should be different
      expect(configs[0].duration.sidebar).not.toBe(configs[1].duration.sidebar);
    });

    it('should handle transform-based optimizations', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      createProductionOptimizedTransition(['margin-left', 'width']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Potentially expensive CSS properties detected')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    it('should not break when performance APIs are unavailable', () => {
      const originalPerformance = window.performance;
      Object.defineProperty(window, 'performance', {
        value: undefined,
        writable: true,
      });

      expect(() => {
        getAdaptiveAnimationConfig();
      }).not.toThrow();

      Object.defineProperty(window, 'performance', {
        value: originalPerformance,
        writable: true,
      });
    });

    it('should handle missing matchMedia gracefully', () => {
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });

      expect(() => {
        getAdaptiveAnimationConfig();
      }).not.toThrow();

      Object.defineProperty(window, 'matchMedia', {
        value: originalMatchMedia,
        writable: true,
      });
    });
  });
});
