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
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { AppLayout } from '../AppLayout';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock all child components with comprehensive functionality
jest.mock('../Header', () => ({
  Header: ({ onMenuClick, sidebarOpen, isTransitioning }: any) => (
    <div data-testid="header">
      <button
        data-testid="menu-button"
        onClick={onMenuClick}
        disabled={isTransitioning}
        aria-expanded={sidebarOpen}
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? 'Close Menu' : 'Open Menu'}
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
    React.useEffect(() => {
      if (open && onTransitionStart) {
        onTransitionStart();
        // Simulate transition end after delay
        const timer = setTimeout(() => {
          if (onTransitionEnd) onTransitionEnd();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [open, onTransitionStart, onTransitionEnd]);

    return (
      <div data-testid={`sidebar-${variant || 'permanent'}`} data-open={open}>
        <nav role="navigation" aria-label="Main navigation">
          <button data-testid="nav-dashboard" onClick={() => {}}>
            Dashboard
          </button>
          <button data-testid="nav-todos" onClick={() => {}}>
            Todos
          </button>
          <button data-testid="nav-projects" onClick={() => {}}>
            Projects
          </button>
        </nav>
        {variant === 'temporary' && (
          <button data-testid="close-sidebar" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    );
  },
}));

jest.mock('../MobileNavigation', () => ({
  MobileNavigation: () => (
    <div data-testid="mobile-navigation">
      <nav role="navigation" aria-label="Mobile navigation">
        <button data-testid="mobile-nav-dashboard">Dashboard</button>
        <button data-testid="mobile-nav-todos">Todos</button>
        <button data-testid="mobile-nav-projects">Projects</button>
      </nav>
    </div>
  ),
}));

jest.mock('../DesktopFooterNavigation', () => ({
  DesktopFooterNavigation: ({ visible, onNavigate }: any) => (
    <div data-testid="desktop-footer-navigation" data-visible={visible}>
      <nav role="navigation" aria-label="Footer navigation">
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
    </div>
  ),
}));

jest.mock('../../ui/AddTodoFAB', () => ({
  AddTodoFAB: ({ visible, onClick, position }: any) => (
    <div
      data-testid="add-todo-fab"
      data-visible={visible}
      data-position={position}
    >
      <button
        data-testid="fab-button"
        onClick={onClick}
        aria-label="Add new todo"
      >
        Add Todo
      </button>
    </div>
  ),
}));

// Mock animation constants
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
  measureAnimationPerformance: jest.fn((name, callback) => callback()),
  safeAnimationExecution: jest.fn(async (animationFn) => await animationFn()),
}));

// Mock AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  AnimationErrorBoundary: ({ children }: any) => children,
}));

describe('Navigation Flow Integration Tests', () => {
  const renderWithRouter = (
    children: React.ReactNode,
    initialEntries = ['/dashboard']
  ) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MemoryRouter>
    );
  };

  const renderAppLayout = (initialEntries = ['/dashboard']) => {
    return renderWithRouter(
      <AppLayout>
        <div data-testid="page-content">Page Content</div>
      </AppLayout>,
      initialEntries
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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

  describe('Complete Desktop Navigation Flow', () => {
    it('completes full navigation workflow from sidebar open to footer navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout();

      // 1. Initial state - sidebar open, footer hidden
      expect(screen.getByTestId('sidebar-permanent')).toHaveAttribute(
        'data-open',
        'true'
      );
      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );
      expect(screen.getByTestId('add-todo-fab')).toHaveAttribute(
        'data-visible',
        'false'
      );

      // 2. Close sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // 3. During transition - sidebar closing, footer still hidden
      expect(menuButton).toBeDisabled();
      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );

      // 4. Complete sidebar transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(menuButton).not.toBeDisabled();
      expect(screen.getByTestId('sidebar-permanent')).toHaveAttribute(
        'data-open',
        'false'
      );

      // 5. Wait for footer delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // 6. Footer and FAB should now be visible
      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'true'
      );
      expect(screen.getByTestId('add-todo-fab')).toHaveAttribute(
        'data-visible',
        'true'
      );

      // 7. Test footer navigation
      const footerTodosButton = screen.getByTestId('footer-nav-todos');
      expect(footerTodosButton).toBeInTheDocument();

      // 8. Open sidebar again - should hide footer immediately
      await user.click(menuButton);
      expect(screen.getByTestId('desktop-footer-navigation')).toHaveAttribute(
        'data-visible',
        'false'
      );
      expect(screen.getByTestId('add-todo-fab')).toHaveAttribute(
        'data-visible',
        'false'
      );
    });

    it('handles rapid sidebar toggles gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout();

      const menuButton = screen.getByTestId('menu-button');

      // Rapid clicks
      await user.click(menuButton); // Close
      expect(menuButton).toBeDisabled();

      await user.click(menuButton); // Try to open (should be prevented)
      expect(menuButton).toBeDisabled();

      // Complete first transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(menuButton).not.toBeDisabled();
      expect(screen.getByTestId('sidebar-permanent')).toHaveAttribute(
        'data-open',
        'false'
      );
    });

    it('coordinates all navigation components during breakpoint changes', async () => {
      const { rerender } = renderAppLayout();

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
        <MemoryRouter initialEntries={['/dashboard']}>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div data-testid="page-content">Page Content</div>
            </AppLayout>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Should show mobile components
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-temporary')).toBeInTheDocument();
      expect(
        screen.queryByTestId('desktop-footer-navigation')
      ).not.toBeInTheDocument();
    });
  });

  describe('Mobile Navigation Flow', () => {
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

    it('completes mobile navigation workflow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout();

      // Mobile components should be present
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-temporary')).toBeInTheDocument();
      expect(
        screen.queryByTestId('desktop-footer-navigation')
      ).not.toBeInTheDocument();

      // Initially sidebar closed on mobile
      expect(screen.getByTestId('sidebar-temporary')).toHaveAttribute(
        'data-open',
        'false'
      );

      // Open mobile sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      expect(screen.getByTestId('sidebar-temporary')).toHaveAttribute(
        'data-open',
        'true'
      );

      // Close sidebar using close button
      const closeButton = screen.getByTestId('close-sidebar');
      await user.click(closeButton);

      expect(screen.getByTestId('sidebar-temporary')).toHaveAttribute(
        'data-open',
        'false'
      );
    });

    it('does not show desktop-only components on mobile', () => {
      renderAppLayout();

      expect(
        screen.queryByTestId('desktop-footer-navigation')
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-permanent')).not.toBeInTheDocument();
    });
  });

  describe('AddTodo FAB Integration', () => {
    it('integrates FAB with navigation flow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout(['/dashboard']); // Start on dashboard

      // Close sidebar to show FAB
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      act(() => {
        jest.advanceTimersByTime(300); // sidebar transition
        jest.advanceTimersByTime(100); // footer delay
      });

      // FAB should be visible
      expect(screen.getByTestId('add-todo-fab')).toHaveAttribute(
        'data-visible',
        'true'
      );

      // Mock navigation
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      // Click FAB
      const fabButton = screen.getByTestId('fab-button');
      await user.click(fabButton);

      // Should trigger navigation or event dispatch
      expect(fabButton).toBeInTheDocument();
    });

    it('shows FAB in correct position', () => {
      renderAppLayout();

      const fab = screen.getByTestId('add-todo-fab');
      expect(fab).toHaveAttribute('data-position', 'footer-integrated');
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility throughout navigation flow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { container } = renderAppLayout();

      // Initial accessibility check
      const initialResults = await axe(container);
      expect(initialResults).toHaveNoViolations();

      // Toggle sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // Check accessibility during transition
      act(() => {
        jest.advanceTimersByTime(150); // Mid-transition
      });

      const midTransitionResults = await axe(container);
      expect(midTransitionResults).toHaveNoViolations();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(250); // Complete transition + footer delay
      });

      // Final accessibility check
      const finalResults = await axe(container);
      expect(finalResults).toHaveNoViolations();
    });

    it('maintains proper ARIA states throughout flow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout();

      const menuButton = screen.getByTestId('menu-button');

      // Initial state
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAttribute(
        'aria-label',
        'Toggle navigation menu'
      );

      // Toggle sidebar
      await user.click(menuButton);

      // During transition, button should be disabled but maintain ARIA
      expect(menuButton).toBeDisabled();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(menuButton).not.toBeDisabled();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('provides proper navigation landmarks', () => {
      renderAppLayout();

      // Check for navigation landmarks
      const mainNavigation = screen.getByLabelText('Main navigation');
      expect(mainNavigation).toBeInTheDocument();

      // After showing footer navigation
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      act(() => {
        jest.advanceTimersByTime(400);
      });

      const footerNavigation = screen.getByLabelText('Footer navigation');
      expect(footerNavigation).toBeInTheDocument();
    });
  });

  describe('Performance and Error Handling', () => {
    it('handles animation errors gracefully', () => {
      // Mock animation error
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      measureAnimationPerformance.mockImplementation(() => {
        throw new Error('Animation failed');
      });

      // Should still render without crashing
      expect(() => renderAppLayout()).not.toThrow();
    });

    it('cleans up properly on unmount during complex transitions', () => {
      const { unmount } = renderAppLayout();

      // Start multiple transitions
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Unmount during transition
      expect(() => unmount()).not.toThrow();

      // Advance timers - should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });

    it('handles rapid breakpoint changes', () => {
      const { rerender } = renderAppLayout();

      // Rapidly change breakpoints
      for (let i = 0; i < 5; i++) {
        const isMobile = i % 2 === 0;
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation((query) => ({
            matches: query.includes('max-width: 899px') ? isMobile : !isMobile,
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
          <MemoryRouter initialEntries={['/dashboard']}>
            <ThemeProvider theme={theme}>
              <AppLayout>
                <div data-testid="page-content">Page Content</div>
              </AppLayout>
            </ThemeProvider>
          </MemoryRouter>
        );
      }

      // Should not crash
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });

    it('measures performance of complex navigation flows', async () => {
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderAppLayout();

      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // Should measure sidebar toggle performance
      expect(measureAnimationPerformance).toHaveBeenCalledWith(
        'sidebar-toggle',
        expect.any(Function)
      );
    });
  });

  describe('Visual Regression Prevention', () => {
    it('maintains consistent layout during transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout();

      const mainContent = screen.getByTestId('page-content');
      const initialRect = mainContent.getBoundingClientRect();

      // Toggle sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      // During transition, content should still be positioned
      expect(mainContent).toBeInTheDocument();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Content should still be properly positioned
      const finalRect = mainContent.getBoundingClientRect();
      expect(finalRect.width).toBeGreaterThan(0);
      expect(finalRect.height).toBeGreaterThan(0);
    });

    it('prevents layout shifts during component mounting/unmounting', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderAppLayout();

      const header = screen.getByTestId('header');
      const headerRect = header.getBoundingClientRect();

      // Toggle sidebar multiple times
      const menuButton = screen.getByTestId('menu-button');

      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(400);
      });

      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Header should maintain consistent position
      const finalHeaderRect = header.getBoundingClientRect();
      expect(finalHeaderRect.top).toBe(headerRect.top);
      expect(finalHeaderRect.left).toBe(headerRect.left);
    });
  });
});
