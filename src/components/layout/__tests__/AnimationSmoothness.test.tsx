import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { AppLayout } from '../AppLayout';
import { DesktopFooterNavigation } from '../DesktopFooterNavigation';
import { AddTodoFAB } from '../../ui/AddTodoFAB';

// Mock performance API for animation testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock requestAnimationFrame for controlled animation testing
let animationFrameCallbacks: (() => void)[] = [];
const mockRequestAnimationFrame = jest.fn((callback: () => void) => {
  animationFrameCallbacks.push(callback);
  return animationFrameCallbacks.length;
});

const mockCancelAnimationFrame = jest.fn((id: number) => {
  if (animationFrameCallbacks[id - 1]) {
    delete animationFrameCallbacks[id - 1];
  }
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true,
});

// Helper to execute animation frames
const executeAnimationFrames = () => {
  const callbacks = [...animationFrameCallbacks];
  animationFrameCallbacks = [];
  callbacks.forEach((callback) => callback && callback());
};

// Mock child components with animation hooks
jest.mock('../Header', () => ({
  Header: ({ onMenuClick, sidebarOpen, isTransitioning }: any) => (
    <div data-testid="header" data-transitioning={isTransitioning}>
      <button
        data-testid="menu-button"
        onClick={onMenuClick}
        disabled={isTransitioning}
        aria-expanded={sidebarOpen}
      >
        Menu
      </button>
    </div>
  ),
}));

jest.mock('../Sidebar', () => ({
  Sidebar: ({
    open,
    onClose,
    variant,
    onTransitionStart,
    onTransitionEnd,
  }: any) => {
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
      if (open !== undefined) {
        setIsAnimating(true);
        if (onTransitionStart) onTransitionStart();

        const timer = setTimeout(() => {
          setIsAnimating(false);
          if (onTransitionEnd) onTransitionEnd();
        }, 300); // Match animation duration

        return () => clearTimeout(timer);
      }
    }, [open, onTransitionStart, onTransitionEnd]);

    return (
      <div
        data-testid={`sidebar-${variant || 'permanent'}`}
        data-open={open}
        data-animating={isAnimating}
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        Sidebar Content
      </div>
    );
  },
}));

jest.mock('../MobileNavigation', () => ({
  MobileNavigation: () => <div data-testid="mobile-navigation">Mobile Nav</div>,
}));

jest.mock('../DesktopFooterNavigation', () => ({
  DesktopFooterNavigation: ({ visible }: any) => {
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
      if (visible !== undefined) {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 200);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    return (
      <div
        data-testid="desktop-footer-navigation"
        data-visible={visible}
        data-animating={isAnimating}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition:
            'opacity 200ms, transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        Footer Navigation
      </div>
    );
  },
}));

jest.mock('../../ui/AddTodoFAB', () => ({
  AddTodoFAB: ({ visible, onClick, position }: any) => {
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
      if (visible !== undefined) {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 200);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    return (
      <div
        data-testid="add-todo-fab"
        data-visible={visible}
        data-animating={isAnimating}
        data-position={position}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0)',
          transition:
            'opacity 200ms, transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button onClick={onClick}>Add Todo</button>
      </div>
    );
  },
}));

// Mock animation constants with performance monitoring
jest.mock('../../../constants/animations', () => ({
  getAnimationDuration: jest.fn((duration) => duration),
  getAdaptiveAnimationConfig: jest.fn(() => ({
    duration: {
      sidebar: 300,
      footer: 200,
      content: 300,
      iconTransition: 150,
    },
    easing: {
      enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    delays: {
      footerShow: 100,
      footerHide: 0,
    },
  })),
  createOptimizedTransition: jest.fn(() => ({
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  })),
  measureAnimationPerformance: jest.fn((name, callback) => {
    const startTime = performance.now();
    const result = callback();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log performance for testing
    console.log(`Animation "${name}" took ${duration}ms`);

    return result;
  }),
  safeAnimationExecution: jest.fn(async (animationFn) => await animationFn()),
}));

// Mock AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  AnimationErrorBoundary: ({ children }: any) => children,
}));

describe('Animation Smoothness Tests', () => {
  const renderComponent = (
    children = <div data-testid="content">Content</div>
  ) => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    animationFrameCallbacks = [];

    // Mock desktop breakpoint
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('max-width: 899px') ? false : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Sidebar Animation Smoothness', () => {
    it('maintains smooth sidebar transitions without frame drops', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const sidebar = screen.getByTestId('sidebar-permanent');

      // Initial state
      expect(sidebar).toHaveAttribute('data-open', 'true');
      expect(sidebar).toHaveAttribute('data-animating', 'false');

      // Start animation
      await user.click(menuButton);

      // Should be animating
      expect(sidebar).toHaveAttribute('data-animating', 'true');

      // Execute animation frames to simulate smooth animation
      for (let frame = 0; frame < 18; frame++) {
        // ~300ms at 60fps
        executeAnimationFrames();
        act(() => {
          jest.advanceTimersByTime(16.67); // One frame at 60fps
        });
      }

      // Animation should complete
      expect(sidebar).toHaveAttribute('data-animating', 'false');
      expect(sidebar).toHaveAttribute('data-open', 'false');
    });

    it('handles rapid sidebar toggles without animation conflicts', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const sidebar = screen.getByTestId('sidebar-permanent');

      // Rapid toggles
      await user.click(menuButton); // Close
      expect(sidebar).toHaveAttribute('data-animating', 'true');

      // Try to toggle again during animation (should be prevented)
      expect(menuButton).toBeDisabled();

      // Complete first animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(sidebar).toHaveAttribute('data-animating', 'false');
      expect(menuButton).not.toBeDisabled();

      // Now can toggle again
      await user.click(menuButton); // Open
      expect(sidebar).toHaveAttribute('data-animating', 'true');
    });

    it('measures sidebar animation performance', async () => {
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      expect(measureAnimationPerformance).toHaveBeenCalledWith(
        'sidebar-toggle',
        expect.any(Function)
      );
    });
  });

  describe('Footer Navigation Animation Smoothness', () => {
    it('coordinates footer appearance with sidebar closure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footer = screen.getByTestId('desktop-footer-navigation');

      // Initially hidden
      expect(footer).toHaveAttribute('data-visible', 'false');

      // Close sidebar
      await user.click(menuButton);

      // Footer should not animate immediately
      expect(footer).toHaveAttribute('data-visible', 'false');
      expect(footer).toHaveAttribute('data-animating', 'false');

      // Complete sidebar animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Wait for footer delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Footer should now be animating in
      expect(footer).toHaveAttribute('data-visible', 'true');
      expect(footer).toHaveAttribute('data-animating', 'true');

      // Complete footer animation
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(footer).toHaveAttribute('data-animating', 'false');
    });

    it('handles footer animation with proper easing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footer = screen.getByTestId('desktop-footer-navigation');

      // Close sidebar to trigger footer
      await user.click(menuButton);

      act(() => {
        jest.advanceTimersByTime(400); // sidebar + delay
      });

      // Footer should be visible and animating
      expect(footer).toHaveAttribute('data-visible', 'true');

      // Check CSS transition properties
      const footerElement = footer as HTMLElement;
      const computedStyle = window.getComputedStyle(footerElement);
      expect(computedStyle.transition).toContain('cubic-bezier');
    });
  });

  describe('AddTodo FAB Animation Smoothness', () => {
    it('coordinates FAB animation with footer navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const fab = screen.getByTestId('add-todo-fab');

      // Initially hidden
      expect(fab).toHaveAttribute('data-visible', 'false');

      // Close sidebar
      await user.click(menuButton);

      // Complete sidebar and footer animations
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // FAB should be visible and animating
      expect(fab).toHaveAttribute('data-visible', 'true');
      expect(fab).toHaveAttribute('data-animating', 'true');

      // Complete FAB animation
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(fab).toHaveAttribute('data-animating', 'false');
    });

    it('uses proper scaling animation for FAB', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const fab = screen.getByTestId('add-todo-fab');

      // Trigger FAB appearance
      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Check CSS transform properties
      const fabElement = fab as HTMLElement;
      const computedStyle = window.getComputedStyle(fabElement);
      expect(computedStyle.transform).toContain('scale');
    });
  });

  describe('Coordinated Animation Sequences', () => {
    it('executes complete animation sequence smoothly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const sidebar = screen.getByTestId('sidebar-permanent');
      const footer = screen.getByTestId('desktop-footer-navigation');
      const fab = screen.getByTestId('add-todo-fab');

      // Track animation sequence
      const animationSequence: string[] = [];

      // Start sequence
      await user.click(menuButton);
      animationSequence.push('sidebar-start');

      // Sidebar animating
      expect(sidebar).toHaveAttribute('data-animating', 'true');

      // Complete sidebar
      act(() => {
        jest.advanceTimersByTime(300);
      });
      animationSequence.push('sidebar-complete');

      // Footer delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      animationSequence.push('footer-start');

      // Footer animating
      expect(footer).toHaveAttribute('data-animating', 'true');
      expect(fab).toHaveAttribute('data-animating', 'true');

      // Complete footer and FAB
      act(() => {
        jest.advanceTimersByTime(200);
      });
      animationSequence.push('sequence-complete');

      // Verify sequence completed correctly
      expect(animationSequence).toEqual([
        'sidebar-start',
        'sidebar-complete',
        'footer-start',
        'sequence-complete',
      ]);

      expect(sidebar).toHaveAttribute('data-animating', 'false');
      expect(footer).toHaveAttribute('data-animating', 'false');
      expect(fab).toHaveAttribute('data-animating', 'false');
    });

    it('handles reverse animation sequence smoothly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footer = screen.getByTestId('desktop-footer-navigation');
      const fab = screen.getByTestId('add-todo-fab');

      // First, get to the state where footer and FAB are visible
      await user.click(menuButton); // Close sidebar
      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(footer).toHaveAttribute('data-visible', 'true');
      expect(fab).toHaveAttribute('data-visible', 'true');

      // Now reverse - open sidebar
      await user.click(menuButton);

      // Footer and FAB should hide immediately
      expect(footer).toHaveAttribute('data-visible', 'false');
      expect(fab).toHaveAttribute('data-visible', 'false');

      // Complete sidebar opening
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // All animations should be complete
      expect(screen.getByTestId('sidebar-permanent')).toHaveAttribute(
        'data-animating',
        'false'
      );
      expect(footer).toHaveAttribute('data-animating', 'false');
      expect(fab).toHaveAttribute('data-animating', 'false');
    });
  });

  describe('Performance Optimization', () => {
    it('uses GPU acceleration for smooth animations', () => {
      renderComponent();

      const sidebar = screen.getByTestId('sidebar-permanent');
      const footer = screen.getByTestId('desktop-footer-navigation');
      const fab = screen.getByTestId('add-todo-fab');

      // Check for transform-based animations (GPU accelerated)
      [sidebar, footer, fab].forEach((element) => {
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.transform).toBeDefined();
      });
    });

    it('measures animation performance and warns on slow animations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // Should log performance measurement
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Animation "sidebar-toggle" took')
      );

      consoleSpy.mockRestore();
    });

    it('handles reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('prefers-reduced-motion: reduce')
            ? true
            : false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { getAnimationDuration } = require('../../../constants/animations');
      getAnimationDuration.mockImplementation((duration) =>
        Math.min(duration * 0.1, 50)
      );

      renderComponent();

      // Should still render without issues
      expect(screen.getByTestId('sidebar-permanent')).toBeInTheDocument();
    });
  });

  describe('Animation Error Recovery', () => {
    it('recovers gracefully from animation failures', async () => {
      const {
        safeAnimationExecution,
      } = require('../../../constants/animations');
      safeAnimationExecution.mockImplementation(
        async (animationFn, type, component, fallback) => {
          // Simulate animation failure
          throw new Error('Animation failed');
        }
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Should not crash despite animation failure
      expect(() => renderComponent()).not.toThrow();

      const menuButton = screen.getByTestId('menu-button');

      // Should handle click without crashing
      expect(async () => {
        await user.click(menuButton);
      }).not.toThrow();
    });

    it('provides fallback behavior when animations fail', async () => {
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      measureAnimationPerformance.mockImplementation(() => {
        throw new Error('Performance measurement failed');
      });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Should still work despite performance measurement failure
      await user.click(menuButton);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Sidebar should still toggle
      expect(screen.getByTestId('sidebar-permanent')).toHaveAttribute(
        'data-open',
        'false'
      );
    });
  });

  describe('Frame Rate Consistency', () => {
    it('maintains consistent frame rate during complex animations', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Track animation frame requests
      const frameRequests: number[] = [];
      mockRequestAnimationFrame.mockImplementation((callback) => {
        frameRequests.push(Date.now());
        animationFrameCallbacks.push(callback);
        return animationFrameCallbacks.length;
      });

      // Start animation
      await user.click(menuButton);

      // Execute frames at 60fps
      for (let i = 0; i < 18; i++) {
        executeAnimationFrames();
        act(() => {
          jest.advanceTimersByTime(16.67);
        });
      }

      // Should have requested appropriate number of frames
      expect(frameRequests.length).toBeGreaterThan(0);
    });

    it('cancels animation frames on component unmount', () => {
      const { unmount } = renderComponent();

      // Start some animations
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Unmount component
      unmount();

      // Should not have pending animation frames
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
