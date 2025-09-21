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

// Mock child components
jest.mock('../Header', () => ({
  Header: ({ onMenuClick, sidebarOpen, isTransitioning }: any) => (
    <div data-testid="header">
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
  Sidebar: ({ open, onClose, variant }: any) => (
    <div data-testid={`sidebar-${variant || 'permanent'}`}>
      <button data-testid="close-sidebar" onClick={onClose}>
        Close
      </button>
      <div data-testid="sidebar-open">{open ? 'open' : 'closed'}</div>
    </div>
  ),
}));

jest.mock('../MobileNavigation', () => ({
  MobileNavigation: () => <div data-testid="mobile-navigation">Mobile Nav</div>,
}));

jest.mock('../DesktopFooterNavigation', () => ({
  DesktopFooterNavigation: ({ visible }: any) => (
    <div data-testid="desktop-footer-navigation">
      <div data-testid="footer-visible">{visible ? 'visible' : 'hidden'}</div>
    </div>
  ),
}));

// Mock animation constants with comprehensive mocking
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
  safeAnimationExecution: jest.fn(
    async (animationFn, type, component, fallback) => {
      try {
        await animationFn();
      } catch (error) {
        if (fallback) fallback();
      }
    }
  ),
}));

// Mock the AddTodoFAB component
jest.mock('../../ui/AddTodoFAB', () => ({
  AddTodoFAB: ({ visible, onClick, position }: any) => (
    <div data-testid="add-todo-fab">
      <div data-testid="fab-visible">{visible ? 'visible' : 'hidden'}</div>
      <div data-testid="fab-position">{position}</div>
      <button data-testid="fab-button" onClick={onClick}>
        Add Todo
      </button>
    </div>
  ),
}));

// Mock AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  AnimationErrorBoundary: ({ children }: any) => (
    <div data-testid="animation-error-boundary">{children}</div>
  ),
}));

describe('AppLayout', () => {
  const renderComponent = (
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
    it('renders all layout components on desktop', () => {
      renderComponent();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-permanent')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(
        screen.getByTestId('desktop-footer-navigation')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();
    });

    it('renders mobile layout components on mobile', () => {
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

      renderComponent();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-temporary')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-permanent')).not.toBeInTheDocument();
    });

    it('renders children content', () => {
      const testContent = <div data-testid="test-content">Test Content</div>;
      renderComponent(testContent);

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle', () => {
    it('toggles sidebar when menu button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const sidebarOpen = screen.getByTestId('sidebar-open');

      // Initially open on desktop
      expect(sidebarOpen).toHaveTextContent('open');
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      await user.click(menuButton);

      act(() => {
        jest.advanceTimersByTime(50); // Advance past initial transition delay
      });

      expect(sidebarOpen).toHaveTextContent('closed');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('prevents multiple simultaneous transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Click rapidly
      await user.click(menuButton);
      await user.click(menuButton);

      // Button should be disabled during transition
      expect(menuButton).toBeDisabled();
    });

    it('enables button after transition completes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      await user.click(menuButton);

      // Button should be disabled during transition
      expect(menuButton).toBeDisabled();

      // Advance time to complete transition
      act(() => {
        jest.advanceTimersByTime(300); // sidebar animation duration
      });

      // Button should be enabled again
      expect(menuButton).not.toBeDisabled();
    });
  });

  describe('Desktop Footer Navigation', () => {
    it('shows footer when sidebar is closed on desktop', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footerVisible = screen.getByTestId('footer-visible');

      // Initially hidden when sidebar is open
      expect(footerVisible).toHaveTextContent('hidden');

      // Close sidebar
      await user.click(menuButton);

      // Advance time for sidebar to close and footer delay
      act(() => {
        jest.advanceTimersByTime(100); // footer show delay
      });

      expect(footerVisible).toHaveTextContent('visible');
    });

    it('hides footer when sidebar is opened on desktop', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footerVisible = screen.getByTestId('footer-visible');

      // Close sidebar first
      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(footerVisible).toHaveTextContent('visible');

      // Open sidebar again
      await user.click(menuButton);

      // Footer should hide immediately
      expect(footerVisible).toHaveTextContent('hidden');
    });

    it('does not show footer on mobile', () => {
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

      renderComponent();

      // Desktop footer should not be present on mobile
      expect(
        screen.queryByTestId('desktop-footer-navigation')
      ).not.toBeInTheDocument();
    });

    it('coordinates footer visibility with transition states', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footerVisible = screen.getByTestId('footer-visible');

      // Close sidebar to show footer
      await user.click(menuButton);

      // During transition, footer should still be hidden
      expect(footerVisible).toHaveTextContent('hidden');

      // After transition completes and delay passes
      act(() => {
        jest.advanceTimersByTime(300); // sidebar transition
        jest.advanceTimersByTime(100); // footer delay
      });

      expect(footerVisible).toHaveTextContent('visible');
    });
  });

  describe('AddTodo FAB Integration', () => {
    it('shows FAB when footer is visible', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const fabVisible = screen.getByTestId('fab-visible');

      // Initially hidden when sidebar is open
      expect(fabVisible).toHaveTextContent('hidden');

      // Close sidebar to show footer and FAB
      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(fabVisible).toHaveTextContent('visible');
    });

    it('hides FAB when footer is hidden', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const fabVisible = screen.getByTestId('fab-visible');

      // Close sidebar first to show FAB
      await user.click(menuButton);
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(fabVisible).toHaveTextContent('visible');

      // Open sidebar to hide FAB
      await user.click(menuButton);
      expect(fabVisible).toHaveTextContent('hidden');
    });

    it('uses footer-integrated position for FAB', () => {
      renderComponent();

      const fabPosition = screen.getByTestId('fab-position');
      expect(fabPosition).toHaveTextContent('footer-integrated');
    });

    it('handles FAB click to navigate to todos page', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Mock location to be on a different page
      const mockLocation = { pathname: '/dashboard' };
      const mockNavigate = jest.fn();

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => mockLocation,
        useNavigate: () => mockNavigate,
      }));

      renderComponent();

      const fabButton = screen.getByTestId('fab-button');
      await user.click(fabButton);

      // Should navigate to todos page
      expect(mockNavigate).toHaveBeenCalledWith('/todos');
    });

    it('dispatches add todo event when already on todos page', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Mock location to be on todos page
      const mockLocation = { pathname: '/todos' };

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => mockLocation,
        useNavigate: () => jest.fn(),
      }));

      // Mock document.dispatchEvent
      const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

      renderComponent();

      const fabButton = screen.getByTestId('fab-button');
      await user.click(fabButton);

      // Should dispatch custom event
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'addTodoRequested',
          detail: { source: 'fab' },
        })
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles breakpoint changes from desktop to mobile', async () => {
      const { rerender } = renderComponent();

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

    it('handles breakpoint changes from mobile to desktop', async () => {
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

      const { rerender } = renderComponent();

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

  describe('Transition State Management', () => {
    it('manages complex transition states correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Initially not transitioning
      expect(menuButton).not.toBeDisabled();

      // Start transition
      await user.click(menuButton);
      expect(menuButton).toBeDisabled();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(menuButton).not.toBeDisabled();
    });

    it('prevents multiple simultaneous transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Start first transition
      await user.click(menuButton);
      expect(menuButton).toBeDisabled();

      // Try to start second transition
      await user.click(menuButton);

      // Should still be disabled (preventing second transition)
      expect(menuButton).toBeDisabled();
    });

    it('coordinates sidebar and footer transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const footerVisible = screen.getByTestId('footer-visible');

      // Close sidebar
      await user.click(menuButton);

      // Footer should not show immediately during sidebar transition
      expect(footerVisible).toHaveTextContent('hidden');

      // Complete sidebar transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Footer should still be hidden until its delay passes
      expect(footerVisible).toHaveTextContent('hidden');

      // Complete footer delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Now footer should be visible
      expect(footerVisible).toHaveTextContent('visible');
    });

    it('handles transition cleanup on unmount', () => {
      const { unmount } = renderComponent();

      // Start a transition
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

    it('uses safe animation execution', async () => {
      const {
        safeAnimationExecution,
      } = require('../../../constants/animations');
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      expect(safeAnimationExecution).toHaveBeenCalled();
    });

    it('measures animation performance', async () => {
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

  describe('Focus Management', () => {
    it('manages focus during sidebar transitions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Focus the menu button
      menuButton.focus();
      expect(menuButton).toHaveFocus();

      // Toggle sidebar
      await user.click(menuButton);

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Focus should be restored to menu button if it's still the active element
      // (In real scenarios, this depends on whether user moved focus elsewhere)
      expect(menuButton).toHaveFocus();
    });

    it('does not restore focus if user has moved focus elsewhere', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');
      const mainContent = screen.getByTestId('main-content');

      // Focus the menu button and toggle
      menuButton.focus();
      await user.click(menuButton);

      // User moves focus elsewhere during transition
      mainContent.focus();

      // Complete transition
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Focus should remain on the element user focused on
      expect(mainContent).toHaveFocus();
    });

    it('stores and restores focus properly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Focus and click
      menuButton.focus();
      await user.click(menuButton);

      // During transition, focus management should be active
      expect(menuButton).toBeDisabled();

      // After transition, focus should be restored
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // If no other element was focused, should restore to menu button
      expect(menuButton).toHaveFocus();
    });

    it('handles focus restoration when element is no longer connected', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { unmount } = renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Start transition
      menuButton.focus();
      await user.click(menuButton);

      // Unmount component during transition
      unmount();

      // Complete transition - should not throw error
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(300);
        });
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { unmount } = renderComponent();

      // Start a transition
      const menuButton = screen.getByTestId('menu-button');
      fireEvent.click(menuButton);

      // Unmount component
      unmount();

      // Should not throw errors when timers try to execute
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });

    it('prevents state updates after unmount', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { unmount } = renderComponent();

      const menuButton = screen.getByTestId('menu-button');

      // Start transition
      await user.click(menuButton);

      // Unmount during transition
      unmount();

      // Advance timers - should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(500);
        });
      }).not.toThrow();
    });
  });

  describe('Animation Configuration', () => {
    it('uses correct animation durations', () => {
      const { getAnimationDuration } = require('../../../constants/animations');
      renderComponent();

      expect(getAnimationDuration).toHaveBeenCalledWith(50); // breakpoint transition delay
      expect(getAnimationDuration).toHaveBeenCalledWith(300); // sidebar duration
    });

    it('respects reduced motion preferences', () => {
      const { getAnimationDuration } = require('../../../constants/animations');
      getAnimationDuration.mockImplementation((duration) => 0);

      renderComponent();

      expect(getAnimationDuration).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing child components gracefully', () => {
      expect(() => renderComponent(null)).not.toThrow();
    });

    it('handles invalid breakpoint values', () => {
      // Mock invalid matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => {
          throw new Error('Invalid media query');
        }),
      });

      expect(() => renderComponent()).not.toThrow();
    });
  });
});
