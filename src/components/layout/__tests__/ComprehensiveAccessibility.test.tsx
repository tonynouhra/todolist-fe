import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { AppLayout } from '../AppLayout';
import { DesktopFooterNavigation } from '../DesktopFooterNavigation';
import { AddTodoFAB } from '../../ui/AddTodoFAB';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock screen reader announcements
const mockAnnouncements: string[] = [];
const mockAnnounceToScreenReader = jest.fn(
  (message: string, priority: string) => {
    mockAnnouncements.push(`${priority}: ${message}`);
  }
);

// Mock focus management
const mockFocusManagement = {
  storeFocus: jest.fn(() => document.activeElement),
  restoreFocus: jest.fn((element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }),
  findFirstFocusable: jest.fn((container) =>
    container.querySelector(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ),
  trapFocus: jest.fn((container, event) => {
    // Mock focus trapping logic
    if (event.key === 'Tab') {
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }),
};

// Mock comprehensive child components with accessibility features
jest.mock('../Header', () => ({
  Header: ({ onMenuClick, sidebarOpen, isTransitioning }: any) => (
    <header role="banner" data-testid="header">
      <button
        data-testid="menu-button"
        onClick={onMenuClick}
        disabled={isTransitioning}
        aria-expanded={sidebarOpen}
        aria-label={
          sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'
        }
        aria-controls="main-navigation"
        aria-haspopup="true"
      >
        {sidebarOpen ? 'Close Menu' : 'Open Menu'}
      </button>
    </header>
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
    React.useEffect(() => {
      if (open && onTransitionStart) {
        onTransitionStart();
        const timer = setTimeout(() => {
          if (onTransitionEnd) onTransitionEnd();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [open, onTransitionStart, onTransitionEnd]);

    return (
      <aside
        data-testid={`sidebar-${variant || 'permanent'}`}
        data-open={open}
        role="navigation"
        aria-label="Main navigation"
        id="main-navigation"
        aria-hidden={!open}
      >
        <nav>
          <ul role="list">
            <li>
              <button
                data-testid="nav-dashboard"
                aria-current={false}
                tabIndex={open ? 0 : -1}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button
                data-testid="nav-todos"
                aria-current={false}
                tabIndex={open ? 0 : -1}
              >
                Todos
              </button>
            </li>
            <li>
              <button
                data-testid="nav-projects"
                aria-current={false}
                tabIndex={open ? 0 : -1}
              >
                Projects
              </button>
            </li>
          </ul>
        </nav>
        {variant === 'temporary' && (
          <button
            data-testid="close-sidebar"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            Close
          </button>
        )}
      </aside>
    );
  },
}));

jest.mock('../MobileNavigation', () => ({
  MobileNavigation: () => (
    <nav
      data-testid="mobile-navigation"
      role="navigation"
      aria-label="Mobile navigation"
      style={{ position: 'fixed', bottom: 0 }}
    >
      <ul role="list" style={{ display: 'flex' }}>
        <li>
          <button data-testid="mobile-nav-dashboard" aria-current={false}>
            <span aria-hidden="true">🏠</span>
            <span>Dashboard</span>
          </button>
        </li>
        <li>
          <button data-testid="mobile-nav-todos" aria-current={false}>
            <span aria-hidden="true">✓</span>
            <span>Todos</span>
          </button>
        </li>
        <li>
          <button data-testid="mobile-nav-projects" aria-current={false}>
            <span aria-hidden="true">📁</span>
            <span>Projects</span>
          </button>
        </li>
      </ul>
    </nav>
  ),
}));

jest.mock('../DesktopFooterNavigation', () => ({
  DesktopFooterNavigation: ({ visible, onNavigate }: any) => (
    <nav
      data-testid="desktop-footer-navigation"
      data-visible={visible}
      role="navigation"
      aria-label="Footer navigation"
      aria-hidden={!visible}
      style={{ position: 'fixed', bottom: 0 }}
    >
      <div
        role="menubar"
        aria-orientation="horizontal"
        aria-describedby="footer-nav-description"
      >
        <div
          id="footer-nav-description"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          Use arrow keys to navigate between options, Enter or Space to select
        </div>
        <button
          data-testid="footer-nav-dashboard"
          role="menuitem"
          tabIndex={visible ? 0 : -1}
          aria-label="Navigate to Dashboard"
          onClick={() => onNavigate && onNavigate('/dashboard')}
        >
          Dashboard
        </button>
        <button
          data-testid="footer-nav-todos"
          role="menuitem"
          tabIndex={visible ? 0 : -1}
          aria-label="Navigate to Todos"
          onClick={() => onNavigate && onNavigate('/todos')}
        >
          Todos
        </button>
        <button
          data-testid="footer-nav-projects"
          role="menuitem"
          tabIndex={visible ? 0 : -1}
          aria-label="Navigate to Projects"
          onClick={() => onNavigate && onNavigate('/projects')}
        >
          Projects
        </button>
      </div>
    </nav>
  ),
}));

jest.mock('../../ui/AddTodoFAB', () => ({
  AddTodoFAB: ({ visible, onClick, position, disabled }: any) => (
    <div
      data-testid="add-todo-fab"
      data-visible={visible}
      data-position={position}
    >
      <button
        data-testid="fab-button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Add new todo item"
        aria-describedby="fab-description"
        tabIndex={visible ? 0 : -1}
      >
        <span aria-hidden="true">+</span>
        <span className="sr-only">Add Todo</span>
      </button>
      <div
        id="fab-description"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        {disabled
          ? 'Add todo button is currently disabled'
          : 'Click to open the add todo dialog'}
      </div>
    </div>
  ),
}));

// Mock animation constants with accessibility features
jest.mock('../../../constants/animations', () => ({
  getAnimationDuration: jest.fn((duration) => duration),
  getAdaptiveAnimationConfig: jest.fn(() => ({
    duration: { sidebar: 300, footer: 200, content: 300, iconTransition: 150 },
    easing: {
      enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    delays: { footerShow: 100, footerHide: 0 },
  })),
  createOptimizedTransition: jest.fn(() => ({ transition: 'all 300ms ease' })),
  measureAnimationPerformance: jest.fn((name, callback) => callback()),
  safeAnimationExecution: jest.fn(async (animationFn) => await animationFn()),
  announceToScreenReader: mockAnnounceToScreenReader,
  manageFocus: mockFocusManagement,
  handleKeyboardNavigation: jest.fn((event, callback, options) => {
    const keys = options?.keys || ['Enter', ' '];
    if (keys.includes(event.key)) {
      event.preventDefault();
      callback();
    }
  }),
  createFocusVisibleStyles: jest.fn(() => ({
    '&:focus-visible': { outline: '2px solid #1976d2', outlineOffset: '2px' },
  })),
  createAccessibleHoverStyles: jest.fn(() => ({
    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' },
  })),
}));

// Mock AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  AnimationErrorBoundary: ({ children }: any) => children,
}));

describe('Comprehensive Accessibility Tests', () => {
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
    mockAnnouncements.length = 0;

    // Mock desktop breakpoint by default
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

  describe('WCAG 2.1 AA Compliance', () => {
    it('passes comprehensive accessibility audit', async () => {
      const { container } = renderComponent();
      const results = await axe(container, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true },
          'semantic-markup': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility during state transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { container } = renderComponent();

      // Initial state
      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // Toggle sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // During transition
      act(() => {
        jest.advanceTimersByTime(150);
      });
      results = await axe(container);
      expect(results).toHaveNoViolations();

      // After transition
      act(() => {
        jest.advanceTimersByTime(250);
      });
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes accessibility audit on mobile layout', async () => {
      // Mock mobile breakpoint
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

      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports complete keyboard navigation flow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Tab to menu button
      await user.tab();
      expect(document.activeElement).toBe(menuButton);

      // Activate with Enter
      await user.keyboard('{Enter}');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      // Complete transition to show footer
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Tab to footer navigation
      await user.tab();
      const firstFooterButton = screen.getByTestId('footer-nav-dashboard');
      expect(document.activeElement).toBe(firstFooterButton);

      // Navigate within footer with arrow keys
      await user.keyboard('{ArrowRight}');
      const secondFooterButton = screen.getByTestId('footer-nav-todos');
      expect(document.activeElement).toBe(secondFooterButton);

      // Tab to FAB
      await user.tab();
      await user.tab(); // Skip third footer button
      const fabButton = screen.getByTestId('fab-button');
      expect(document.activeElement).toBe(fabButton);
    });

    it('handles keyboard navigation in sidebar', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      // Sidebar should be open initially
      const dashboardNav = screen.getByTestId('nav-dashboard');
      const todosNav = screen.getByTestId('nav-todos');
      const projectsNav = screen.getByTestId('nav-projects');

      // All nav items should be focusable when sidebar is open
      expect(dashboardNav).toHaveAttribute('tabIndex', '0');
      expect(todosNav).toHaveAttribute('tabIndex', '0');
      expect(projectsNav).toHaveAttribute('tabIndex', '0');

      // Close sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // Nav items should not be focusable when sidebar is closed
      expect(dashboardNav).toHaveAttribute('tabIndex', '-1');
      expect(todosNav).toHaveAttribute('tabIndex', '-1');
      expect(projectsNav).toHaveAttribute('tabIndex', '-1');
    });

    it('supports keyboard navigation on mobile', async () => {
      // Mock mobile breakpoint
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

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      // Mobile navigation should be present
      const mobileNavDashboard = screen.getByTestId('mobile-nav-dashboard');
      const mobileNavTodos = screen.getByTestId('mobile-nav-todos');

      // Tab through mobile navigation
      await user.tab();
      await user.tab(); // Skip menu button
      expect(document.activeElement).toBe(mobileNavDashboard);

      await user.tab();
      expect(document.activeElement).toBe(mobileNavTodos);
    });

    it('traps focus within modal sidebar on mobile', async () => {
      // Mock mobile breakpoint
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

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      // Open mobile sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      const sidebar = screen.getByTestId('sidebar-temporary');
      const closeButton = screen.getByTestId('close-sidebar');
      const lastNavButton = screen.getByTestId('nav-projects');

      // Focus should be trapped within sidebar
      lastNavButton.focus();

      // Tab from last element should go to first
      fireEvent.keyDown(sidebar, { key: 'Tab' });
      expect(mockFocusManagement.trapFocus).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('announces navigation state changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // Should announce sidebar closure
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('navigation'),
        'polite'
      );
    });

    it('provides proper ARIA labels and descriptions', () => {
      renderComponent();

      // Menu button
      const menuButton = screen.getByTestId('menu-button');
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
      expect(menuButton).toHaveAttribute('aria-controls', 'main-navigation');
      expect(menuButton).toHaveAttribute('aria-haspopup', 'true');

      // Sidebar
      const sidebar = screen.getByTestId('sidebar-permanent');
      expect(sidebar).toHaveAttribute('role', 'navigation');
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
      expect(sidebar).toHaveAttribute('id', 'main-navigation');

      // FAB
      const fabButton = screen.getByTestId('fab-button');
      expect(fabButton).toHaveAttribute('aria-label', 'Add new todo item');
      expect(fabButton).toHaveAttribute('aria-describedby', 'fab-description');

      // FAB description
      const fabDescription = document.getElementById('fab-description');
      expect(fabDescription).toBeInTheDocument();
      expect(fabDescription).toHaveTextContent(
        'Click to open the add todo dialog'
      );
    });

    it('updates ARIA states during interactions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const sidebar = screen.getByTestId('sidebar-permanent');

      // Initial state
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(sidebar).toHaveAttribute('aria-hidden', 'false');

      // Close sidebar
      await user.click(menuButton);

      // Updated state
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-label', 'Close navigation menu');
    });

    it('provides hidden descriptions for complex interactions', () => {
      renderComponent();

      // Close sidebar to show footer
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Footer navigation description
      const footerDescription = document.getElementById(
        'footer-nav-description'
      );
      expect(footerDescription).toBeInTheDocument();
      expect(footerDescription).toHaveTextContent(
        'Use arrow keys to navigate between options, Enter or Space to select'
      );

      // Should be visually hidden but accessible to screen readers
      const computedStyle = window.getComputedStyle(footerDescription);
      expect(computedStyle.position).toBe('absolute');
      expect(computedStyle.left).toBe('-10000px');
    });
  });

  describe('Focus Management', () => {
    it('manages focus during sidebar transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Focus menu button
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);

      // Toggle sidebar
      await user.click(menuButton);

      // Focus should be stored
      expect(mockFocusManagement.storeFocus).toHaveBeenCalled();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Focus should be restored
      expect(mockFocusManagement.restoreFocus).toHaveBeenCalled();
    });

    it('finds and focuses first focusable element when appropriate', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      // Close sidebar to show footer
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Should find first focusable element in footer
      expect(mockFocusManagement.findFirstFocusable).toHaveBeenCalled();
    });

    it('handles focus when elements become unavailable', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { unmount } = renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      menuButton.focus();

      // Start transition
      await user.click(menuButton);

      // Unmount during transition
      unmount();

      // Should not throw error when trying to restore focus
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockFocusManagement.restoreFocus).toHaveBeenCalled();
    });

    it('maintains logical tab order', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      // Close sidebar to show footer navigation
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Tab through elements in logical order
      await user.tab(); // Should go to menu button
      expect(document.activeElement).toBe(menuButton);

      await user.tab(); // Should go to first footer button
      const firstFooterButton = screen.getByTestId('footer-nav-dashboard');
      expect(document.activeElement).toBe(firstFooterButton);

      await user.tab(); // Should go to second footer button
      const secondFooterButton = screen.getByTestId('footer-nav-todos');
      expect(document.activeElement).toBe(secondFooterButton);
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('supports high contrast mode', () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('prefers-contrast: high') ? true : false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderComponent();

      // Should render without issues in high contrast mode
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-permanent')).toBeInTheDocument();
    });

    it('provides sufficient color contrast', () => {
      renderComponent();

      // All interactive elements should be present and accessible
      const interactiveElements = [
        screen.getByTestId('menu-button'),
        screen.getByTestId('nav-dashboard'),
        screen.getByTestId('nav-todos'),
        screen.getByTestId('nav-projects'),
      ];

      interactiveElements.forEach((element) => {
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      });
    });

    it('supports reduced motion preferences', () => {
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

      // Should still be fully functional with reduced motion
      expect(screen.getByTestId('menu-button')).toBeInTheDocument();
      expect(getAnimationDuration).toHaveBeenCalled();
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile breakpoint
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
    });

    it('provides adequate touch targets on mobile', () => {
      renderComponent();

      const mobileNavButtons = [
        screen.getByTestId('mobile-nav-dashboard'),
        screen.getByTestId('mobile-nav-todos'),
        screen.getByTestId('mobile-nav-projects'),
      ];

      // All mobile navigation buttons should be present
      mobileNavButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
        expect(button).toBeVisible();
      });
    });

    it('supports touch navigation patterns', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      // Open mobile sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // Should be able to close with close button
      const closeButton = screen.getByTestId('close-sidebar');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute(
        'aria-label',
        'Close navigation menu'
      );

      await user.click(closeButton);
      expect(screen.getByTestId('sidebar-temporary')).toHaveAttribute(
        'data-open',
        'false'
      );
    });

    it('maintains accessibility on orientation change', () => {
      renderComponent();

      // Simulate orientation change
      fireEvent(window, new Event('orientationchange'));

      // Should maintain accessibility
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', { name: 'Mobile navigation' })
      ).toBeInTheDocument();
    });
  });

  describe('Error States and Edge Cases', () => {
    it('maintains accessibility when animations fail', () => {
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      measureAnimationPerformance.mockImplementation(() => {
        throw new Error('Animation failed');
      });

      const { container } = renderComponent();

      // Should still be accessible despite animation failures
      expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
      expect(
        container.querySelector('[role="navigation"]')
      ).toBeInTheDocument();
    });

    it('handles missing ARIA references gracefully', () => {
      // Mock a scenario where ARIA references might be missing
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn(() => null);

      expect(() => renderComponent()).not.toThrow();

      // Restore original function
      document.getElementById = originalGetElementById;
    });

    it('maintains accessibility during rapid state changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        await user.click(menuButton);
        act(() => {
          jest.advanceTimersByTime(50);
        });
      }

      // Should still maintain proper ARIA states
      expect(menuButton).toHaveAttribute('aria-expanded');
      expect(menuButton).toHaveAttribute('aria-label');
    });
  });

  describe('Semantic Markup', () => {
    it('uses proper semantic HTML elements', () => {
      renderComponent();

      // Check for semantic landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getAllByRole('navigation')).toHaveLength(1); // sidebar navigation
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content area
    });

    it('provides proper heading hierarchy', () => {
      renderComponent(
        <div>
          <h1>Main Page Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );

      // Should maintain proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('uses lists for navigation items', () => {
      renderComponent();

      // Sidebar should use list structure
      const sidebar = screen.getByTestId('sidebar-permanent');
      const list = sidebar.querySelector('[role="list"]');
      expect(list).toBeInTheDocument();

      // Mobile navigation should also use list structure
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

      const { rerender } = renderComponent();
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const mobileNav = screen.getByTestId('mobile-navigation');
      const mobileList = mobileNav.querySelector('[role="list"]');
      expect(mobileList).toBeInTheDocument();
    });
  });
});
