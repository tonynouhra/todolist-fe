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
import { DesktopFooterNavigation } from '../DesktopFooterNavigation';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the constants module with comprehensive mocking
jest.mock('../../../constants', () => ({
  getFooterNavigationItems: jest.fn(() => [
    {
      text: 'Dashboard',
      icon: <div data-testid="dashboard-icon">Dashboard</div>,
      path: '/dashboard',
      showInFooter: true,
    },
    {
      text: 'Todos',
      icon: <div data-testid="todos-icon">Todos</div>,
      path: '/todos',
      showInFooter: true,
    },
    {
      text: 'Projects',
      icon: <div data-testid="projects-icon">Projects</div>,
      path: '/projects',
      showInFooter: true,
    },
  ]),
  isNavigationItemActive: jest.fn((item, path) => item.path === path),
  getAnimationDuration: jest.fn((duration) => duration),
  getAdaptiveAnimationConfig: jest.fn(() => ({
    duration: {
      footer: 200,
      iconTransition: 150,
      sidebar: 300,
      content: 250,
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
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  })),
  measureAnimationPerformance: jest.fn((name, callback) => callback()),
  handleKeyboardNavigation: jest.fn((event, callback, options) => {
    const keys = options?.keys || ['Enter', ' '];
    if (keys.includes(event.key)) {
      event.preventDefault();
      callback();
    }
  }),
  announceToScreenReader: jest.fn(),
  manageFocus: {
    findFirstFocusable: jest.fn((container) =>
      container.querySelector('button:not([disabled])')
    ),
    trapFocus: jest.fn(),
  },
  createFocusVisibleStyles: jest.fn(() => ({
    '&:focus-visible': {
      outline: '2px solid #1976d2',
      outlineOffset: '2px',
    },
  })),
  createAccessibleHoverStyles: jest.fn(() => ({
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.08)',
    },
  })),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/dashboard' };

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('DesktopFooterNavigation', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      visible: true,
      ...props,
    };

    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <DesktopFooterNavigation {...defaultProps} />
        </ThemeProvider>
      </BrowserRouter>
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
    it('renders navigation items when visible', () => {
      renderComponent({ visible: true });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Desktop footer navigation')
      ).toBeInTheDocument();
      expect(screen.getByRole('menubar')).toBeInTheDocument();

      // Check navigation items
      expect(
        screen.getByLabelText('Navigate to Dashboard')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Todos')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Projects')).toBeInTheDocument();

      // Check text labels
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('does not render on mobile devices', () => {
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

      const { container } = renderComponent({ visible: true });
      expect(container.firstChild).toBeNull();
    });

    it('does not render when not visible', () => {
      const { container } = renderComponent({ visible: false });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('navigates to correct path when item is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('calls onNavigate callback when provided', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onNavigate = jest.fn();
      renderComponent({ onNavigate });

      const todosButton = screen.getByLabelText('Navigate to Todos');
      await user.click(todosButton);

      expect(onNavigate).toHaveBeenCalledWith('/todos');
      expect(mockNavigate).toHaveBeenCalledWith('/todos');
    });

    it('handles keyboard navigation with Enter key', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const projectsButton = screen.getByLabelText('Navigate to Projects');
      projectsButton.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });

    it('handles keyboard navigation with Space key', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');
      dashboardButton.focus();
      await user.keyboard(' ');

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Active State', () => {
    it('highlights active navigation item', () => {
      // Mock active item
      const { isNavigationItemActive } = require('../../../constants');
      isNavigationItemActive.mockImplementation(
        (item, path) => item.path === '/todos'
      );

      renderComponent();

      const todosButton = screen.getByLabelText('Navigate to Todos');
      expect(todosButton).toHaveAttribute('aria-current', 'page');
    });

    it('does not highlight inactive navigation items', () => {
      const { isNavigationItemActive } = require('../../../constants');
      isNavigationItemActive.mockImplementation(
        (item, path) => item.path === '/dashboard'
      );

      renderComponent();

      const todosButton = screen.getByLabelText('Navigate to Todos');
      const projectsButton = screen.getByLabelText('Navigate to Projects');

      expect(todosButton).not.toHaveAttribute('aria-current');
      expect(projectsButton).not.toHaveAttribute('aria-current');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderComponent();

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute(
        'aria-label',
        'Desktop footer navigation'
      );

      const menubar = screen.getByRole('menubar');
      expect(menubar).toHaveAttribute('aria-orientation', 'horizontal');

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);

      menuItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('passes accessibility audit', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('manages focus properly when becoming visible', async () => {
      const { rerender } = renderComponent({ visible: false });

      // Make component visible
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        const { manageFocus } = require('../../../constants');
        expect(manageFocus.findFirstFocusable).toHaveBeenCalled();
      });
    });

    it('supports keyboard navigation between items', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');
      const todosButton = screen.getByLabelText('Navigate to Todos');
      const projectsButton = screen.getByLabelText('Navigate to Projects');

      // Tab through items
      dashboardButton.focus();
      expect(document.activeElement).toBe(dashboardButton);

      await user.tab();
      expect(document.activeElement).toBe(todosButton);

      await user.tab();
      expect(document.activeElement).toBe(projectsButton);
    });

    it('supports arrow key navigation within footer', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');
      const todosButton = screen.getByLabelText('Navigate to Todos');
      const projectsButton = screen.getByLabelText('Navigate to Projects');

      // Focus first button
      dashboardButton.focus();
      expect(document.activeElement).toBe(dashboardButton);

      // Arrow right to next button
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(todosButton);

      // Arrow right to next button
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(projectsButton);

      // Arrow right should wrap to first button
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(dashboardButton);

      // Arrow left should wrap to last button
      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(projectsButton);
    });

    it('announces navigation changes to screen readers', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const { announceToScreenReader } = require('../../../constants');

      const todosButton = screen.getByLabelText('Navigate to Todos');
      await user.click(todosButton);

      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Navigating to Todos',
        'assertive'
      );
    });

    it('has proper focus-visible styles', () => {
      renderComponent();

      const { createFocusVisibleStyles } = require('../../../constants');
      expect(createFocusVisibleStyles).toHaveBeenCalled();

      const buttons = screen.getAllByRole('menuitem');
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it('supports focus trapping within navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const { manageFocus } = require('../../../constants');
      const menubar = screen.getByRole('menubar');

      // Simulate Tab key within the navigation
      await user.tab();

      // Focus trapping should be called when Tab is pressed
      fireEvent.keyDown(menubar, { key: 'Tab' });
      expect(manageFocus.trapFocus).toHaveBeenCalled();
    });

    it('provides proper descriptions for screen readers', () => {
      renderComponent();

      // Check for hidden description element
      const description = document.getElementById('footer-nav-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(
        'Use arrow keys to navigate between options, Enter or Space to select'
      );

      // Check individual item descriptions
      const dashboardDescription = document.getElementById(
        '/dashboard-description'
      );
      expect(dashboardDescription).toBeInTheDocument();
      expect(dashboardDescription).toHaveTextContent(
        'Navigate to Dashboard page'
      );
    });

    it('handles high contrast mode', () => {
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

      // Component should render without errors in high contrast mode
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('uses correct animation duration from config', () => {
      const {
        getAnimationDuration,
        getAdaptiveAnimationConfig,
      } = require('../../../constants');
      renderComponent();

      expect(getAdaptiveAnimationConfig).toHaveBeenCalled();
      expect(getAnimationDuration).toHaveBeenCalledWith(200); // footer duration
      expect(getAnimationDuration).toHaveBeenCalledWith(150); // icon transition duration
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

      const { getAnimationDuration } = require('../../../constants');
      getAnimationDuration.mockImplementation((duration) =>
        Math.min(duration * 0.1, 50)
      );

      renderComponent();

      expect(getAnimationDuration).toHaveBeenCalled();
    });

    it('uses optimized transitions for performance', () => {
      const { createOptimizedTransition } = require('../../../constants');
      renderComponent();

      expect(createOptimizedTransition).toHaveBeenCalledWith(
        ['color', 'background-color', 'transform'],
        150,
        'cubic-bezier(0.4, 0, 0.2, 1)'
      );
    });

    it('measures animation performance in development', async () => {
      const { measureAnimationPerformance } = require('../../../constants');
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderComponent();

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');
      await user.click(dashboardButton);

      expect(measureAnimationPerformance).toHaveBeenCalledWith(
        'footer-navigation',
        expect.any(Function)
      );
    });

    it('handles animation smoothness during visibility changes', async () => {
      const { rerender } = renderComponent({ visible: false });

      // Make visible
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      // Should use Slide animation with proper timing
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Make invisible
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={false} />
          </ThemeProvider>
        </BrowserRouter>
      );

      // Component should unmount after animation
      await waitFor(() => {
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      });
    });

    it('applies GPU acceleration styles for smooth animations', () => {
      renderComponent();

      const navigation = screen.getByRole('navigation');
      const computedStyle = window.getComputedStyle(navigation);

      // Check for performance optimization styles
      expect(navigation).toBeInTheDocument();
      // Note: In JSDOM, we can't directly test CSS properties like backfaceVisibility
      // but we can verify the component renders without errors
    });

    it('handles animation error boundaries', () => {
      // Mock animation error
      const { measureAnimationPerformance } = require('../../../constants');
      measureAnimationPerformance.mockImplementation(() => {
        throw new Error('Animation failed');
      });

      // Component should still render despite animation errors
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('cleans up properly on unmount', () => {
      const { unmount } = renderComponent();

      // Should not throw any errors
      expect(() => unmount()).not.toThrow();
    });

    it('prevents navigation after unmount', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { unmount } = renderComponent();

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');

      // Unmount component
      unmount();

      // Try to trigger navigation (should not crash)
      expect(() => {
        fireEvent.click(dashboardButton);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation items gracefully', () => {
      const { getFooterNavigationItems } = require('../../../constants');
      getFooterNavigationItems.mockReturnValue([]);

      expect(() => renderComponent()).not.toThrow();

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // Should not have any menu items
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    });

    it('handles disabled navigation items', () => {
      const { getFooterNavigationItems } = require('../../../constants');
      getFooterNavigationItems.mockReturnValue([
        {
          text: 'Disabled Item',
          icon: <div>Icon</div>,
          path: '/disabled',
          disabled: true,
        },
      ]);

      renderComponent();

      const disabledButton = screen.getByRole('menuitem');
      expect(disabledButton).toBeDisabled();
    });
  });
});
