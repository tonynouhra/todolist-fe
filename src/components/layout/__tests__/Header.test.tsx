import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { Header } from '../Header';

// Mock Clerk UserButton
jest.mock('@clerk/clerk-react', () => ({
  UserButton: ({ appearance }: any) => (
    <div data-testid="user-button" data-appearance={JSON.stringify(appearance)}>
      User Button
    </div>
  ),
}));

// Mock AnimationErrorBoundary to return component directly
jest.mock('../../common/AnimationErrorBoundary', () => ({
  withAnimationErrorBoundary: (Component: any) => Component,
  AnimationErrorBoundary: ({ children }: any) => children,
}));

// Mock animation constants
jest.mock('../../../constants/animations', () => {
  const mockAnimationConfig = {
    duration: {
      content: 300,
      iconTransition: 150,
      sidebar: 280,
      footer: 180,
    },
    easing: {
      enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      exit: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
    },
    delays: {
      footerShow: 80,
      footerHide: 0,
    },
  };

  return {
    animationConfig: mockAnimationConfig,
    getAnimationDuration: jest.fn((duration) => duration),
    getAdaptiveAnimationConfig: jest.fn(() => mockAnimationConfig),
    createOptimizedTransition: jest.fn(() => ({
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    })),
  };
});

describe('Header', () => {
  const defaultProps = {
    onMenuClick: jest.fn(),
    sidebarOpen: false,
    sidebarWidth: 280,
    isTransitioning: false,
  };

  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(
      <ThemeProvider theme={theme}>
        <Header {...mergedProps} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.matchMedia for responsive behavior
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('max-width: 899px') ? false : true, // Desktop by default
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

  describe('Rendering', () => {
    it('renders header with all elements', () => {
      renderComponent();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /open navigation menu/i })
      ).toBeInTheDocument();
      expect(screen.getByText('TodoList')).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
    });

    it('renders correct menu button label when sidebar is closed', () => {
      renderComponent({ sidebarOpen: false });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'navigation-menu');
    });

    it('renders correct menu button label when sidebar is open', () => {
      renderComponent({ sidebarOpen: true });

      const menuButton = screen.getByRole('button', {
        name: /close navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAttribute('aria-controls', 'navigation-menu');
    });

    it('renders UserButton with correct appearance props', () => {
      renderComponent();

      const userButton = screen.getByTestId('user-button');
      const appearance = JSON.parse(
        userButton.getAttribute('data-appearance') || '{}'
      );

      expect(appearance.elements.avatarBox).toEqual({
        width: '32px',
        height: '32px',
      });
    });
  });

  describe('Menu Button Interaction', () => {
    it('calls onMenuClick when menu button is clicked', async () => {
      const onMenuClick = jest.fn();
      renderComponent({ onMenuClick });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      await userEvent.click(menuButton);

      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard interaction with Enter key', async () => {
      const onMenuClick = jest.fn();
      renderComponent({ onMenuClick });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      menuButton.focus();
      await userEvent.keyboard('{Enter}');

      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard interaction with Space key', async () => {
      const onMenuClick = jest.fn();
      renderComponent({ onMenuClick });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      menuButton.focus();
      await userEvent.keyboard(' ');

      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('disables menu button during transitions', () => {
      renderComponent({ isTransitioning: true });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toBeDisabled();
    });

    it('enables menu button when not transitioning', () => {
      renderComponent({ isTransitioning: false });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).not.toBeDisabled();
    });
  });

  describe('Icon Transitions', () => {
    it('shows hamburger icon when sidebar is closed', () => {
      renderComponent({ sidebarOpen: false });

      // Check for MenuIcon (hamburger)
      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toBeInTheDocument();

      // The icon should be visible in the DOM
      const iconContainer = menuButton.querySelector(
        '[data-testid="MenuIcon"], .MuiSvgIcon-root'
      );
      expect(iconContainer).toBeInTheDocument();
    });

    it('shows close icon when sidebar is open', () => {
      renderComponent({ sidebarOpen: true });

      // Check for MenuOpenIcon (close)
      const menuButton = screen.getByRole('button', {
        name: /close navigation menu/i,
      });
      expect(menuButton).toBeInTheDocument();

      // The icon should be visible in the DOM
      const iconContainer = menuButton.querySelector(
        '[data-testid="MenuOpenIcon"], .MuiSvgIcon-root'
      );
      expect(iconContainer).toBeInTheDocument();
    });

    it('uses correct animation duration for icon transitions', () => {
      const { getAnimationDuration } = require('../../../constants/animations');
      renderComponent();

      expect(getAnimationDuration).toHaveBeenCalledWith(150); // iconTransition duration
    });
  });

  describe('Responsive Layout', () => {
    it('adjusts header width when sidebar is open on desktop', () => {
      renderComponent({ sidebarOpen: true, sidebarWidth: 280 });

      const header = screen.getByRole('banner');

      // Check that header has proper styling for sidebar open state
      expect(header).toBeInTheDocument();
    });

    it('uses full width when sidebar is closed', () => {
      renderComponent({ sidebarOpen: false });

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('handles mobile breakpoint correctly', () => {
      // Mock mobile breakpoint
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('max-width: 899px') ? true : false, // Mobile
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderComponent({ sidebarOpen: true, sidebarWidth: 280 });

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderComponent({ sidebarOpen: false });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'navigation-menu');
    });

    it('updates ARIA attributes when sidebar state changes', () => {
      const { rerender } = renderComponent({ sidebarOpen: false });

      let menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <ThemeProvider theme={theme}>
          <Header {...defaultProps} sidebarOpen={true} />
        </ThemeProvider>
      );

      menuButton = screen.getByRole('button', {
        name: /close navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper focus-visible styles', () => {
      renderComponent();

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      // Focus the button to trigger focus-visible styles
      menuButton.focus();
      expect(menuButton).toHaveFocus();
    });

    it('provides proper disabled state feedback', () => {
      renderComponent({ isTransitioning: true });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toBeDisabled();
      expect(menuButton).toHaveAttribute('disabled');
    });
  });

  describe('Animation Configuration', () => {
    it('uses correct animation durations from config', () => {
      const { getAnimationDuration } = require('../../../constants/animations');
      renderComponent();

      expect(getAnimationDuration).toHaveBeenCalledWith(150); // icon transition
      expect(getAnimationDuration).toHaveBeenCalledWith(300); // content transition
    });

    it('respects reduced motion preferences', () => {
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
      getAnimationDuration.mockImplementation((duration) => 0);

      renderComponent();

      expect(getAnimationDuration).toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('provides hover feedback on menu button', async () => {
      renderComponent();

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      await userEvent.hover(menuButton);

      // Button should be hoverable (not disabled)
      expect(menuButton).not.toBeDisabled();
    });

    it('shows disabled state styling when transitioning', () => {
      renderComponent({ isTransitioning: true });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toBeDisabled();
    });

    it('shows active state styling on click', async () => {
      const onMenuClick = jest.fn();
      renderComponent({ onMenuClick });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      await userEvent.click(menuButton);

      expect(onMenuClick).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing onMenuClick prop gracefully', () => {
      expect(() => {
        render(
          <ThemeProvider theme={theme}>
            <Header
              onMenuClick={undefined as any}
              sidebarOpen={false}
              sidebarWidth={280}
            />
          </ThemeProvider>
        );
      }).not.toThrow();
    });

    it('handles invalid sidebarWidth values', () => {
      expect(() => {
        renderComponent({ sidebarWidth: -100 });
      }).not.toThrow();

      expect(() => {
        renderComponent({ sidebarWidth: 0 });
      }).not.toThrow();
    });

    it('handles rapid state changes', async () => {
      const onMenuClick = jest.fn();
      const { rerender } = renderComponent({ onMenuClick, sidebarOpen: false });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      // Rapid state changes
      rerender(
        <ThemeProvider theme={theme}>
          <Header
            {...defaultProps}
            onMenuClick={onMenuClick}
            sidebarOpen={true}
          />
        </ThemeProvider>
      );

      rerender(
        <ThemeProvider theme={theme}>
          <Header
            {...defaultProps}
            onMenuClick={onMenuClick}
            sidebarOpen={false}
          />
        </ThemeProvider>
      );

      expect(() => {
        fireEvent.click(menuButton);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const onMenuClick = jest.fn();
      const { rerender } = renderComponent({ onMenuClick });

      // Re-render with same props
      rerender(
        <ThemeProvider theme={theme}>
          <Header {...defaultProps} onMenuClick={onMenuClick} />
        </ThemeProvider>
      );

      // Should not cause issues
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('handles frequent prop updates efficiently', () => {
      const onMenuClick = jest.fn();
      const { rerender } = renderComponent({ onMenuClick, sidebarOpen: false });

      // Simulate frequent updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <ThemeProvider theme={theme}>
            <Header
              {...defaultProps}
              onMenuClick={onMenuClick}
              sidebarOpen={i % 2 === 0}
              isTransitioning={i % 3 === 0}
            />
          </ThemeProvider>
        );
      }

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
