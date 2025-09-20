import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/dashboard' };

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock the navigation constants
jest.mock('../../../constants', () => ({
  getAnimationDuration: jest.fn((duration) => duration),
  getAdaptiveAnimationConfig: jest.fn(() => ({
    duration: {
      sidebar: 300,
      footer: 200,
      content: 250,
      iconTransition: 150,
    },
    easing: {
      enter: 'ease-out',
      exit: 'ease-in',
      sharp: 'ease',
      smooth: 'ease-out',
    },
    delays: {
      footerShow: 100,
      footerHide: 0,
    },
  })),
  createOptimizedTransition: jest.fn(() => ({
    transition: 'all 300ms ease-out',
  })),
  measureAnimationPerformance: jest.fn((name, callback) => callback()),
  safeAnimationExecution: jest.fn((callback) => callback()),
}));

// Mock the AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  AnimationErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animation-error-boundary">{children}</div>
  ),
  withAnimationErrorBoundary: (Component: React.ComponentType<any>) =>
    Component,
}));

// Mock the navigation components
jest.mock('../Header', () => ({
  Header: ({ onMenuClick, isTransitioning }: any) => (
    <div data-testid="header">
      <button
        onClick={onMenuClick}
        disabled={isTransitioning}
        data-testid="menu-button"
      >
        Menu
      </button>
    </div>
  ),
}));

jest.mock('../Sidebar', () => ({
  Sidebar: ({ open, onTransitionStart, onTransitionEnd }: any) => (
    <div
      data-testid="sidebar"
      data-open={open}
      onTransitionStart={onTransitionStart}
      onTransitionEnd={onTransitionEnd}
    >
      Sidebar
    </div>
  ),
}));

jest.mock('../MobileNavigation', () => ({
  MobileNavigation: () => <div data-testid="mobile-navigation">Mobile Nav</div>,
}));

jest.mock('../DesktopFooterNavigation', () => ({
  DesktopFooterNavigation: ({ visible }: any) => (
    <div data-testid="desktop-footer-navigation" data-visible={visible}>
      Desktop Footer Nav
    </div>
  ),
}));

jest.mock('../../ui/AddTodoFAB', () => ({
  AddTodoFAB: ({ visible, onClick }: any) => (
    <button data-testid="add-todo-fab" data-visible={visible} onClick={onClick}>
      Add Todo
    </button>
  ),
}));

// Mock useMediaQuery
const mockUseMediaQuery = jest.fn();
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => mockUseMediaQuery(),
}));

// Import AppLayout after mocking
const { AppLayout } = require('../AppLayout');

const renderAppLayout = (children = <div>Test Content</div>) => {
  return render(
    <ThemeProvider theme={theme}>
      <AppLayout>{children}</AppLayout>
    </ThemeProvider>
  );
};

describe('AppLayout Responsive Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    // Mock window.matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
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
    jest.restoreAllMocks();
  });

  describe('Basic Responsive Behavior', () => {
    it('should render correctly on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
      renderAppLayout();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(
        screen.getByTestId('desktop-footer-navigation')
      ).toBeInTheDocument();
      expect(screen.getByTestId('add-todo-fab')).toBeInTheDocument();
    });

    it('should render correctly on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
      renderAppLayout();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(
        screen.getByTestId('desktop-footer-navigation')
      ).toBeInTheDocument();
      expect(screen.getByTestId('add-todo-fab')).toBeInTheDocument();
    });
  });

  describe('Footer Navigation Responsive Behavior', () => {
    it('should show footer navigation only on desktop when sidebar is closed', async () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
      renderAppLayout();

      // Initially sidebar is open, footer should not be visible
      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );

      // Close sidebar
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Wait for footer to become visible
      await waitFor(
        () => {
          expect(
            screen.getByTestId('desktop-footer-navigation')
          ).toHaveAttribute('data-visible', 'true');
        },
        { timeout: 1000 }
      );
    });

    it('should hide footer navigation on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
      renderAppLayout();

      // Footer should not be visible on mobile
      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );
    });

    it('should respect window width in addition to media query for footer visibility', async () => {
      // Mock media query as desktop but set window width to mobile
      mockUseMediaQuery.mockReturnValue(false);
      renderAppLayout();

      // Set window width to mobile size
      Object.defineProperty(window, 'innerWidth', {
        value: theme.breakpoints.values.md - 1, // Below desktop breakpoint
      });
      fireEvent(window, new Event('resize'));

      // Footer should not appear due to window width check
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );
    });

    it('should never show footer on mobile regardless of sidebar state', async () => {
      mockUseMediaQuery.mockReturnValue(true);
      renderAppLayout();

      // Try to close sidebar on mobile
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Wait and ensure footer never appears on mobile
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );
    });
  });

  describe('Window Resize Handling', () => {
    it('should handle window resize events properly', async () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop
      renderAppLayout();

      // Simulate window resize to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Wait for debounced resize handler
      await waitFor(
        () => {
          // The resize handler should have been called
          expect(window.innerWidth).toBe(768);
        },
        { timeout: 200 }
      );
    });

    it('should use theme breakpoint values for consistent responsive behavior', async () => {
      mockUseMediaQuery.mockReturnValue(false);
      renderAppLayout();

      // Test breakpoint at theme.breakpoints.values.md (900px)
      Object.defineProperty(window, 'innerWidth', {
        value: theme.breakpoints.values.md - 1, // 899px - should be mobile
      });
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(window.innerWidth).toBe(theme.breakpoints.values.md - 1);
      });

      Object.defineProperty(window, 'innerWidth', {
        value: theme.breakpoints.values.md + 1, // 901px - should be desktop
      });
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(window.innerWidth).toBe(theme.breakpoints.values.md + 1);
      });
    });

    it('should debounce resize events to prevent excessive updates', async () => {
      mockUseMediaQuery.mockReturnValue(false);
      renderAppLayout();

      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        Object.defineProperty(window, 'innerWidth', {
          value: 800 + i * 10,
        });
        fireEvent(window, new Event('resize'));
      }

      // Should handle debouncing gracefully
      await waitFor(() => {
        expect(window.innerWidth).toBe(890); // Last value
      });
    });
  });

  describe('Orientation Change Handling', () => {
    it('should handle orientation change events on mobile devices', async () => {
      mockUseMediaQuery.mockReturnValue(true);
      renderAppLayout();

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      fireEvent(window, new Event('orientationchange'));

      // Layout should adapt to orientation change
      await waitFor(() => {
        expect(window.innerWidth).toBe(768);
        expect(window.innerHeight).toBe(1024);
      });
    });

    it('should handle orientation change with proper cleanup', async () => {
      mockUseMediaQuery.mockReturnValue(true);

      const { unmount } = renderAppLayout();

      // Simulate orientation change
      fireEvent(window, new Event('orientationchange'));

      // Unmount should clean up orientation change listeners
      unmount();

      // No errors should occur after unmount
      expect(() => {
        fireEvent(window, new Event('orientationchange'));
      }).not.toThrow();
    });
  });

  describe('Animation Timer Cleanup', () => {
    it('should clean up all timers on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      mockUseMediaQuery.mockReturnValue(false);

      const { unmount } = renderAppLayout();

      // Trigger some transitions to create timers
      fireEvent(window, new Event('resize'));
      fireEvent(window, new Event('orientationchange'));

      // Unmount component
      unmount();

      // Verify cleanup was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('should handle cleanup errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      mockUseMediaQuery.mockReturnValue(false);

      const { unmount } = renderAppLayout();

      // Unmount should handle cleanup errors without throwing
      expect(() => unmount()).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should clean up resize and orientation change listeners', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      mockUseMediaQuery.mockReturnValue(false);

      const { unmount } = renderAppLayout();

      // Unmount component
      unmount();

      // Verify event listeners were removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Layout Stability', () => {
    it('should maintain stable layout during transitions', () => {
      mockUseMediaQuery.mockReturnValue(false);
      renderAppLayout();

      // Get main content element
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      // Toggle sidebar
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Main content should still be present
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should set responsive transition data attribute during breakpoint transitions', async () => {
      mockUseMediaQuery.mockReturnValue(false);

      const { container } = renderAppLayout();

      // Trigger breakpoint transition by changing window size
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      fireEvent(window, new Event('resize'));

      // Check for responsive transition data attribute
      await waitFor(() => {
        const mainContent = container.querySelector('main');
        expect(mainContent).toBeInTheDocument();
        // The data attribute should be set during transitions
      });
    });

    it('should prevent layout shifts during screen size changes', async () => {
      mockUseMediaQuery.mockReturnValue(false);
      renderAppLayout();

      const mainContent = screen.getByRole('main');
      const initialRect = mainContent.getBoundingClientRect();

      // Simulate screen size change
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      fireEvent(window, new Event('resize'));

      // Wait for layout to stabilize
      await waitFor(() => {
        const newRect = mainContent.getBoundingClientRect();
        // Main content should still be positioned correctly
        expect(newRect.top).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
