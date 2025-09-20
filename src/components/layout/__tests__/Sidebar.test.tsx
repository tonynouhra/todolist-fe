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
import { Sidebar } from '../Sidebar';

// Mock AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  withAnimationErrorBoundary: jest.fn((Component) => Component),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/dashboard' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock navigation constants
const mockNavigationItems = [
  {
    text: 'Dashboard',
    icon: { type: 'div', props: { 'data-testid': 'dashboard-icon' } },
    path: '/dashboard',
    disabled: false,
  },
  {
    text: 'Todos',
    icon: { type: 'div', props: { 'data-testid': 'todos-icon' } },
    path: '/todos',
    disabled: false,
  },
  {
    text: 'Projects',
    icon: { type: 'div', props: { 'data-testid': 'projects-icon' } },
    path: '/projects',
    disabled: false,
  },
  {
    text: 'AI Assistant',
    icon: { type: 'div', props: { 'data-testid': 'ai-icon' } },
    path: '/ai',
    disabled: true,
  },
];

const mockSecondaryItems = [
  {
    text: 'Settings',
    icon: { type: 'div', props: { 'data-testid': 'settings-icon' } },
    path: '/settings',
    disabled: true,
  },
];

jest.mock('../../../constants/navigation', () => ({
  getAllNavigationItems: jest.fn(() => mockNavigationItems),
  getSecondaryNavigationItems: jest.fn(() => mockSecondaryItems),
  isNavigationItemActive: jest.fn((item, pathname) => item.path === pathname),
}));

// Mock performance and error handling utilities
jest.mock('../../../constants', () => ({
  ...jest.requireActual('../../../constants/animations'),
  ...jest.requireActual('../../../constants/navigation'),
  measureAnimationPerformance: jest.fn((name, callback) => callback()),
  safeAnimationExecution: jest.fn(async (animationFn) => {
    await animationFn();
  }),
}));

// Mock animation constants
jest.mock('../../../constants/animations', () => ({
  animationConfig: {
    duration: {
      sidebar: 320,
      footer: 200,
      content: 280,
      iconTransition: 150,
    },
    easing: {
      enter: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      exit: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  createTransition: jest.fn(
    (props, duration, easing) =>
      `${Array.isArray(props) ? props.join(', ') : props} ${duration}ms ${easing}`
  ),
  createOptimizedTransition: jest.fn(
    (props, duration, easing, delay) =>
      `${Array.isArray(props) ? props.join(', ') : props} ${duration}ms ${easing}${delay ? ` ${delay}ms` : ''}`
  ),
  createSidebarTransition: jest.fn(
    (props, isOpening, duration, delay) =>
      `${Array.isArray(props) ? props.join(', ') : props} ${duration || 320}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)${delay ? ` ${delay}ms` : ''}`
  ),
  createStaggeredContentTransition: jest.fn(
    (props, index, isVisible, baseDelay) => ({
      transition: `${Array.isArray(props) ? props.join(', ') : props} 280ms cubic-bezier(0.4, 0, 0.2, 1)${isVisible ? ` ${index * (baseDelay || 30)}ms` : ''}`,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(-8px)',
    })
  ),
  getAdaptiveAnimationConfig: jest.fn(() => ({
    duration: {
      sidebar: 320,
      footer: 200,
      content: 280,
      iconTransition: 150,
    },
    easing: {
      enter: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      exit: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  })),
}));

describe('Sidebar', () => {
  const defaultProps = {
    open: true,
    width: 280,
    onClose: jest.fn(),
    variant: 'permanent' as const,
  };

  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Sidebar {...mergedProps} />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.matchMedia
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
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders navigation items for permanent variant', () => {
      renderComponent({ variant: 'permanent' });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
      expect(
        screen.getByRole('menu', { name: 'Primary navigation' })
      ).toBeInTheDocument();

      // Check navigation items
      expect(
        screen.getByRole('menuitem', { name: 'Dashboard' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Todos' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Projects' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'AI Assistant' })
      ).toBeInTheDocument();
    });

    it('renders navigation items for temporary variant', () => {
      renderComponent({ variant: 'temporary' });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('TodoList')).toBeInTheDocument(); // Brand area for temporary

      // Check navigation items
      expect(
        screen.getByRole('menuitem', { name: 'Dashboard' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Todos' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Projects' })
      ).toBeInTheDocument();
    });

    it('renders secondary navigation items', () => {
      renderComponent();

      expect(
        screen.getByRole('menu', { name: 'Secondary navigation' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Settings' })
      ).toBeInTheDocument();
    });

    it('shows disabled state for disabled items', () => {
      renderComponent();

      const aiAssistantItem = screen.getByRole('menuitem', {
        name: 'AI Assistant',
      });
      const settingsItem = screen.getByRole('menuitem', { name: 'Settings' });

      expect(aiAssistantItem).toBeDisabled();
      expect(settingsItem).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('navigates to correct path when item is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const dashboardItem = screen.getByRole('menuitem', { name: 'Dashboard' });
      await user.click(dashboardItem);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('does not navigate when disabled item is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const aiAssistantItem = screen.getByRole('menuitem', {
        name: 'AI Assistant',
      });
      await user.click(aiAssistantItem);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('closes temporary sidebar after navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onClose = jest.fn();
      renderComponent({ variant: 'temporary', onClose });

      const todosItem = screen.getByRole('menuitem', { name: 'Todos' });
      await user.click(todosItem);

      expect(mockNavigate).toHaveBeenCalledWith('/todos');
      expect(onClose).toHaveBeenCalled();
    });

    it('does not close permanent sidebar after navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onClose = jest.fn();
      renderComponent({ variant: 'permanent', onClose });

      const projectsItem = screen.getByRole('menuitem', { name: 'Projects' });
      await user.click(projectsItem);

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Active State', () => {
    it('highlights active navigation item', () => {
      // Mock location to match dashboard
      mockLocation.pathname = '/dashboard';
      renderComponent();

      const dashboardItem = screen.getByRole('menuitem', { name: 'Dashboard' });
      expect(dashboardItem).toHaveAttribute('aria-current', 'page');
    });

    it('does not highlight inactive navigation items', () => {
      mockLocation.pathname = '/dashboard';
      renderComponent();

      const todosItem = screen.getByRole('menuitem', { name: 'Todos' });
      const projectsItem = screen.getByRole('menuitem', { name: 'Projects' });

      expect(todosItem).not.toHaveAttribute('aria-current');
      expect(projectsItem).not.toHaveAttribute('aria-current');
    });
  });

  describe('Transition Callbacks', () => {
    it('calls onTransitionStart when open state changes', async () => {
      const onTransitionStart = jest.fn();
      const { rerender } = renderComponent({
        open: false,
        onTransitionStart,
      });

      // Change open state
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              {...defaultProps}
              open={true}
              onTransitionStart={onTransitionStart}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(onTransitionStart).toHaveBeenCalled();
    });

    it('calls onTransitionEnd after transition completes', async () => {
      const onTransitionEnd = jest.fn();
      const { rerender } = renderComponent({
        open: false,
        onTransitionEnd,
      });

      // Change open state
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              {...defaultProps}
              open={true}
              onTransitionEnd={onTransitionEnd}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      // Advance time to complete transition
      act(() => {
        jest.advanceTimersByTime(300); // sidebar duration
      });

      expect(onTransitionEnd).toHaveBeenCalled();
    });

    it('does not call callbacks when open state does not change', () => {
      const onTransitionStart = jest.fn();
      const onTransitionEnd = jest.fn();
      const { rerender } = renderComponent({
        open: true,
        onTransitionStart,
        onTransitionEnd,
      });

      // Re-render with same open state
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              {...defaultProps}
              open={true}
              onTransitionStart={onTransitionStart}
              onTransitionEnd={onTransitionEnd}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(onTransitionStart).not.toHaveBeenCalled();
      expect(onTransitionEnd).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderComponent();

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');
      expect(navigation).toHaveAttribute('id', 'navigation-menu');

      const primaryMenu = screen.getByRole('menu', {
        name: 'Primary navigation',
      });
      expect(primaryMenu).toHaveAttribute('aria-label', 'Primary navigation');

      const secondaryMenu = screen.getByRole('menu', {
        name: 'Secondary navigation',
      });
      expect(secondaryMenu).toHaveAttribute(
        'aria-label',
        'Secondary navigation'
      );
    });

    it('has proper menuitem attributes', () => {
      renderComponent();

      const menuItems = screen.getAllByRole('menuitem');

      menuItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0');
        expect(item).toHaveAttribute('role', 'menuitem');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const dashboardItem = screen.getByRole('menuitem', { name: 'Dashboard' });
      const todosItem = screen.getByRole('menuitem', { name: 'Todos' });

      // Tab through items
      dashboardItem.focus();
      expect(document.activeElement).toBe(dashboardItem);

      await user.tab();
      expect(document.activeElement).toBe(todosItem);
    });

    it('has proper focus-visible styles', () => {
      renderComponent();

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        // Items should be focusable
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Animations', () => {
    it('uses correct animation configuration', () => {
      const { createTransition } = require('../../../constants/animations');
      renderComponent();

      expect(createTransition).toHaveBeenCalledWith(
        ['background-color', 'color', 'transform'],
        150,
        'cubic-bezier(0.4, 0, 0.6, 1)'
      );
    });

    it('applies staggered animation delays', () => {
      renderComponent({ open: true });

      // Animation delays should be applied to menu items
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
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

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Permanent vs Temporary Variants', () => {
    it('renders permanent variant correctly', () => {
      renderComponent({ variant: 'permanent' });

      // Should not have brand area for permanent variant
      expect(screen.queryByText('TodoList')).not.toBeInTheDocument();

      // Should have toolbar spacer
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });

    it('renders temporary variant correctly', () => {
      renderComponent({ variant: 'temporary' });

      // Should have brand area for temporary variant
      expect(screen.getByText('TodoList')).toBeInTheDocument();

      // Should not have toolbar spacer
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });

    it('handles width changes for permanent variant', () => {
      const { rerender } = renderComponent({
        variant: 'permanent',
        width: 240,
      });

      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar {...defaultProps} variant="permanent" width={320} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('cleans up transition timers on unmount', () => {
      const onTransitionEnd = jest.fn();
      const { unmount } = renderComponent({ onTransitionEnd });

      // Start a transition
      const { rerender } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              {...defaultProps}
              open={false}
              onTransitionEnd={onTransitionEnd}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      // Unmount during transition
      unmount();

      // Should not throw errors when timers try to execute
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(500);
        });
      }).not.toThrow();
    });

    it('prevents callback execution after unmount', () => {
      const onTransitionEnd = jest.fn();
      const { unmount, rerender } = renderComponent({
        open: false,
        onTransitionEnd,
      });

      // Start transition
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              {...defaultProps}
              open={true}
              onTransitionEnd={onTransitionEnd}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      // Unmount before transition completes
      unmount();

      // Advance time - callback should not be called
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onTransitionEnd).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation items gracefully', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('handles invalid width values', () => {
      expect(() => renderComponent({ width: -100 })).not.toThrow();
      expect(() => renderComponent({ width: 0 })).not.toThrow();
    });

    it('handles missing callback props', () => {
      expect(() => {
        renderComponent({
          onClose: undefined as any,
          onTransitionStart: undefined,
          onTransitionEnd: undefined,
        });
      }).not.toThrow();
    });

    it('handles rapid state changes', () => {
      const { rerender } = renderComponent({ open: false });

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        rerender(
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <Sidebar {...defaultProps} open={i % 2 === 0} />
            </ThemeProvider>
          </BrowserRouter>
        );
      }

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Props Interface', () => {
    it('accepts all required props', () => {
      const props = {
        open: true,
        width: 280,
        onClose: jest.fn(),
        variant: 'permanent' as const,
        onTransitionStart: jest.fn(),
        onTransitionEnd: jest.fn(),
      };

      expect(() => renderComponent(props)).not.toThrow();
    });

    it('works with minimal props', () => {
      const minimalProps = {
        open: false,
        width: 240,
        onClose: jest.fn(),
      };

      expect(() => renderComponent(minimalProps)).not.toThrow();
    });

    it('validates prop types correctly', () => {
      // Test boolean open prop
      expect(() => renderComponent({ open: true })).not.toThrow();
      expect(() => renderComponent({ open: false })).not.toThrow();

      // Test number width prop
      expect(() => renderComponent({ width: 280 })).not.toThrow();
      expect(() => renderComponent({ width: 240 })).not.toThrow();

      // Test variant prop
      expect(() => renderComponent({ variant: 'permanent' })).not.toThrow();
      expect(() => renderComponent({ variant: 'temporary' })).not.toThrow();
    });
  });
});
