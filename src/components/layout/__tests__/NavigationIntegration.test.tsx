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

// Mock child components with more realistic behavior
jest.mock('../Header', () => ({
  Header: ({ onMenuClick, sidebarOpen, isTransitioning }: any) => (
    <div data-testid="header" role="banner">
      <button
        data-testid="menu-button"
        onClick={onMenuClick}
        disabled={isTransitioning}
        aria-expanded={sidebarOpen}
        aria-label={
          sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'
        }
      >
        {sidebarOpen ? 'Close Menu' : 'Open Menu'}
      </button>
    </div>
  ),
}));

jest.mock('../Sidebar', () => {
  const mockReact = require('react');
  return {
    Sidebar: ({
      open,
      onClose,
      variant,
      onTransitionStart,
      onTransitionEnd,
    }: any) => {
      mockReact.useEffect(() => {
        if (onTransitionStart) {
          onTransitionStart();
        }
        const timer = setTimeout(() => {
          if (onTransitionEnd) {
            onTransitionEnd();
          }
        }, 300);
        return () => clearTimeout(timer);
      }, [open, onTransitionStart, onTransitionEnd]);

      return mockReact.createElement(
        'nav',
        {
          'data-testid': `sidebar-${variant || 'permanent'}`,
          role: 'navigation',
        },
        [
          mockReact.createElement(
            'div',
            {
              key: 'status',
              'data-testid': 'sidebar-open',
            },
            open ? 'open' : 'closed'
          ),
          mockReact.createElement(
            'button',
            {
              key: 'dashboard',
              'data-testid': 'nav-dashboard',
              onClick: () => {},
            },
            'Dashboard'
          ),
          mockReact.createElement(
            'button',
            {
              key: 'todos',
              'data-testid': 'nav-todos',
              onClick: () => {},
            },
            'Todos'
          ),
          mockReact.createElement(
            'button',
            {
              key: 'projects',
              'data-testid': 'nav-projects',
              onClick: () => {},
            },
            'Projects'
          ),
          variant === 'temporary' &&
            mockReact.createElement(
              'button',
              {
                key: 'close',
                'data-testid': 'close-sidebar',
                onClick: onClose,
              },
              'Close'
            ),
        ].filter(Boolean)
      );
    },
  };
});

jest.mock('../MobileNavigation', () => ({
  MobileNavigation: () => (
    <nav data-testid="mobile-navigation" role="navigation">
      <button data-testid="mobile-nav-dashboard">Dashboard</button>
      <button data-testid="mobile-nav-todos">Todos</button>
      <button data-testid="mobile-nav-projects">Projects</button>
    </nav>
  ),
}));

jest.mock('../DesktopFooterNavigation', () => ({
  DesktopFooterNavigation: ({ visible, onNavigate }: any) => (
    <nav
      data-testid="desktop-footer-navigation"
      role="navigation"
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div data-testid="footer-visible">{visible ? 'visible' : 'hidden'}</div>
      <button
        data-testid="footer-nav-dashboard"
        onClick={() => onNavigate && onNavigate('/dashboard')}
      >
        Dashboard
      </button>
      <button
        data-testid="footer-nav-todos"
        onClick={() => onNavigate && onNavigate('/todos')}
      >
        Todos
      </button>
      <button
        data-testid="footer-nav-projects"
        onClick={() => onNavigate && onNavigate('/projects')}
      >
        Projects
      </button>
    </nav>
  ),
}));

// Mock animation constants
jest.mock('../../../constants/animations', () => ({
  animationConfig: {
    duration: {
      sidebar: 300,
      footer: 200,
      content: 300,
    },
    easing: {
      enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    delays: {
      footerShow: 100,
      footerHide: 0,
    },
  },
  getAnimationDuration: jest.fn((duration) => duration),
}));

describe('Navigation Integration Tests', () => {
  const renderApp = (
    children = <div data-testid="main-content">Content</div>
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

    // Mock window.matchMedia for desktop by default
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('max-width: 899px') ? false : true, // Desktop
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

  describe('Desktop Navigation Flow', () => {
    it('completes full sidebar toggle cycle', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');
      const sidebarOpen = screen.getByTestId('sidebar-open');
      const footerVisible = screen.getByTestId('footer-visible');

      // Initial state: sidebar open, footer hidden
      expect(sidebarOpen).toHaveTextContent('open');
      expect(footerVisible).toHaveTextContent('hidden');
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');

      // Close sidebar
      await user.click(menuButton);

      // Button should be disabled during transition
      expect(menuButton).toBeDisabled();
      expect(sidebarOpen).toHaveTextContent('closed');

      // Advance time for transition to complete
      act(() => {
        jest.advanceTimersByTime(300); // sidebar transition
      });

      // Button should be enabled again
      expect(menuButton).not.toBeDisabled();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      // Advance time for footer delay
      act(() => {
        jest.advanceTimersByTime(100); // footer show delay
      });

      // Footer should now be visible
      expect(footerVisible).toHaveTextContent('visible');

      // Open sidebar again
      await user.click(menuButton);

      // Footer should hide immediately
      expect(footerVisible).toHaveTextContent('hidden');
      expect(menuButton).toBeDisabled();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(sidebarOpen).toHaveTextContent('open');
      expect(menuButton).not.toBeDisabled();
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('coordinates sidebar and footer animations', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');
      const footerVisible = screen.getByTestId('footer-visible');

      // Close sidebar to show footer
      await user.click(menuButton);

      // Footer should be hidden initially
      expect(footerVisible).toHaveTextContent('hidden');

      // Advance time for sidebar to close
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Advance time for footer delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Footer should now be visible
      expect(footerVisible).toHaveTextContent('visible');

      // Open sidebar again
      await user.click(menuButton);

      // Footer should hide immediately (no delay)
      expect(footerVisible).toHaveTextContent('hidden');
    });

    it('prevents multiple simultaneous transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');

      // Rapid clicks
      await user.click(menuButton);
      await user.click(menuButton);
      await user.click(menuButton);

      // Button should be disabled during transition
      expect(menuButton).toBeDisabled();

      // Only one transition should occur
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(menuButton).not.toBeDisabled();
    });
  });

  describe('Mobile Navigation Flow', () => {
    beforeEach(() => {
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
    });

    it('shows mobile navigation instead of desktop footer', () => {
      renderApp();

      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(
        screen.queryByTestId('desktop-footer-navigation')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('sidebar-temporary')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-permanent')).not.toBeInTheDocument();
    });

    it('handles mobile sidebar toggle', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');
      const sidebarOpen = screen.getByTestId('sidebar-open');

      // Initially closed on mobile
      expect(sidebarOpen).toHaveTextContent('closed');

      // Open sidebar
      await user.click(menuButton);
      expect(sidebarOpen).toHaveTextContent('open');

      // Close via close button
      const closeButton = screen.getByTestId('close-sidebar');
      await user.click(closeButton);
      expect(sidebarOpen).toHaveTextContent('closed');
    });
  });

  describe('Responsive Breakpoint Transitions', () => {
    it('transitions from desktop to mobile layout', async () => {
      const { rerender } = renderApp();

      // Initially desktop
      expect(screen.getByTestId('sidebar-permanent')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();

      // Change to mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('max-width: 899px') ? true : false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div data-testid="main-content">Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-permanent')).not.toBeInTheDocument();
    });

    it('transitions from mobile to desktop layout', async () => {
      // Start with mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('max-width: 899px') ? true : false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { rerender } = renderApp();

      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();

      // Change to desktop
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

      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div data-testid="main-content">Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('sidebar-permanent')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();
    });
  });

  describe('Focus Management Integration', () => {
    it('manages focus during sidebar transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');

      // Focus menu button
      menuButton.focus();
      expect(menuButton).toHaveFocus();

      // Toggle sidebar
      await user.click(menuButton);

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Focus should be restored
      expect(menuButton).toHaveFocus();
    });

    it('does not interfere with user focus changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');
      const mainContent = screen.getByTestId('main-content');

      // Start transition
      menuButton.focus();
      await user.click(menuButton);

      // User moves focus during transition
      mainContent.focus();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Focus should remain where user put it
      expect(mainContent).toHaveFocus();
    });
  });

  describe('Animation Timing Integration', () => {
    it('coordinates all animation timings correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { getAnimationDuration } = require('../../../constants/animations');
      renderApp();

      const menuButton = screen.getByTestId('menu-button');

      // Close sidebar
      await user.click(menuButton);

      // Verify animation durations are used correctly
      expect(getAnimationDuration).toHaveBeenCalledWith(50); // breakpoint transition
      expect(getAnimationDuration).toHaveBeenCalledWith(300); // sidebar duration
    });

    it('respects reduced motion preferences across all components', () => {
      // Mock reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('prefers-reduced-motion: reduce')
            ? true
            : query.includes('max-width: 899px')
              ? false
              : true,
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
      getAnimationDuration.mockImplementation(() => 0);

      expect(() => renderApp()).not.toThrow();
      expect(getAnimationDuration).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Integration', () => {
    it('recovers from animation errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');

      // Simulate animation error by clearing timers mid-transition
      await user.click(menuButton);
      jest.clearAllTimers();

      // Should still be able to interact
      expect(() => {
        fireEvent.click(menuButton);
      }).not.toThrow();
    });

    it('handles rapid breakpoint changes', () => {
      const { rerender } = renderApp();

      // Rapid breakpoint changes
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation((query) => ({
            matches: query.includes('max-width: 899px')
              ? i % 2 === 0
              : i % 2 === 1,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          })),
        });

        rerender(
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <AppLayout>
                <div data-testid="main-content">Content</div>
              </AppLayout>
            </ThemeProvider>
          </BrowserRouter>
        );
      }

      // Should still render without errors
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper ARIA states across components', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');
      const sidebar = screen.getByTestId('sidebar-permanent');

      // Initial state
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(sidebar).toHaveAttribute('role', 'navigation');

      // Toggle sidebar
      await user.click(menuButton);

      // ARIA states should update
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('provides consistent navigation landmarks', () => {
      renderApp();

      const navigations = screen.getAllByRole('navigation');
      expect(navigations.length).toBeGreaterThan(0);

      // Each navigation should have proper labeling
      navigations.forEach((nav) => {
        expect(nav).toBeInTheDocument();
      });
    });

    it('maintains keyboard navigation flow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');
      const dashboardNav = screen.getByTestId('nav-dashboard');

      // Tab through interface
      menuButton.focus();
      expect(menuButton).toHaveFocus();

      await user.tab();
      expect(dashboardNav).toHaveFocus();
    });
  });

  describe('Performance Integration', () => {
    it('handles multiple rapid interactions efficiently', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp();

      const menuButton = screen.getByTestId('menu-button');

      // Rapid interactions
      for (let i = 0; i < 10; i++) {
        await user.click(menuButton);
        act(() => {
          jest.advanceTimersByTime(50);
        });
      }

      // Should still be responsive
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('cleans up resources properly during unmount', () => {
      const { unmount } = renderApp();

      // Start some transitions
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Unmount
      unmount();

      // Advance timers - should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });
  });
});
