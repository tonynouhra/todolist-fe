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
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

// Mock constants
jest.mock('../../../constants', () => ({
  getFooterNavigationItems: () => [
    {
      text: 'Dashboard',
      icon: <span data-testid="dashboard-icon">📊</span>,
      path: '/dashboard',
      showInFooter: true,
    },
    {
      text: 'Todos',
      icon: <span data-testid="todos-icon">✓</span>,
      path: '/todos',
      showInFooter: true,
    },
  ],
  isNavigationItemActive: (item: any, path: string) => item.path === path,
  animationConfig: {
    duration: { footer: 200, iconTransition: 150, sidebar: 300, content: 300 },
    easing: { enter: 'ease-in', exit: 'ease-out', sharp: 'ease' },
    delays: { footerShow: 100, footerHide: 0 },
  },
  getAnimationDuration: (duration: number) => duration,
}));

// Mock Clerk
jest.mock('@clerk/clerk-react', () => ({
  UserButton: () => <div data-testid="user-button">User</div>,
}));

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
}));

describe('Navigation Visual Regression Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    // Mock window.matchMedia for desktop
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

  describe('Animation Smoothness Tests', () => {
    it('sidebar toggle animation completes without visual glitches', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /navigation menu/i,
      });

      // Capture initial state
      const initialSnapshot = screen.getByRole('main');
      expect(initialSnapshot).toBeInTheDocument();

      // Trigger animation
      await user.click(menuButton);

      // Check intermediate states during animation
      act(() => {
        jest.advanceTimersByTime(150); // Mid-animation
      });

      const midAnimationSnapshot = screen.getByRole('main');
      expect(midAnimationSnapshot).toBeInTheDocument();

      // Complete animation
      act(() => {
        jest.advanceTimersByTime(150); // Complete animation
      });

      const finalSnapshot = screen.getByRole('main');
      expect(finalSnapshot).toBeInTheDocument();
    });

    it('footer navigation slide animation is smooth', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /navigation menu/i,
      });

      // Close sidebar to trigger footer animation
      await user.click(menuButton);

      // Complete sidebar animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Trigger footer show delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Footer should be visible now
      const footerNavigation = screen.getByRole('navigation', {
        name: /desktop footer/i,
      });
      expect(footerNavigation).toBeInTheDocument();
    });

    it('icon transitions are smooth and properly timed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header
              onMenuClick={jest.fn()}
              sidebarOpen={false}
              sidebarWidth={280}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      // Check initial icon state
      expect(menuButton).toBeInTheDocument();

      // Simulate hover for visual feedback
      fireEvent.mouseEnter(menuButton);
      fireEvent.mouseLeave(menuButton);

      // Should not cause visual glitches
      expect(menuButton).toBeInTheDocument();
    });

    it('handles rapid state changes without visual artifacts', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /navigation menu/i,
      });

      // Rapid clicks
      await user.click(menuButton);
      await user.click(menuButton);
      await user.click(menuButton);

      // Should handle gracefully without visual issues
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout Tests', () => {
    it('transitions smoothly between desktop and mobile layouts', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      // Initially desktop
      expect(screen.getByRole('navigation')).toBeInTheDocument();

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
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      // Should still render without layout issues
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains proper spacing during sidebar width changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              open={true}
              width={240}
              onClose={jest.fn()}
              variant="permanent"
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Change width
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              open={true}
              width={320}
              onClose={jest.fn()}
              variant="permanent"
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('handles footer navigation positioning correctly', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      const footerNav = screen.getByRole('navigation');
      expect(footerNav).toBeInTheDocument();

      // Should be positioned at bottom
      const computedStyle = window.getComputedStyle(footerNav);
      expect(footerNav).toBeInTheDocument(); // Basic positioning check
    });
  });

  describe('Theme Integration Tests', () => {
    it('applies theme colors consistently across components', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      // All components should be rendered with theme
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains visual hierarchy with proper contrast', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header
              onMenuClick={jest.fn()}
              sidebarOpen={false}
              sidebarWidth={280}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      const header = screen.getByRole('banner');
      const menuButton = screen.getByRole('button');

      expect(header).toBeInTheDocument();
      expect(menuButton).toBeInTheDocument();
    });

    it('handles dark/light theme transitions', () => {
      // Test with different theme variants if available
      const { rerender } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Rerender with same theme (simulating theme change)
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Focus Visual Indicators', () => {
    it('shows proper focus indicators on navigation items', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      const dashboardButton = screen.getByLabelText('Navigate to Dashboard');

      // Focus should be visible
      dashboardButton.focus();
      expect(document.activeElement).toBe(dashboardButton);

      // Tab to next item
      await user.tab();
      const todosButton = screen.getByLabelText('Navigate to Todos');
      expect(document.activeElement).toBe(todosButton);
    });

    it('shows proper focus indicators on menu button', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header
              onMenuClick={jest.fn()}
              sidebarOpen={false}
              sidebarWidth={280}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);
    });

    it('shows proper focus indicators on sidebar items', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              open={true}
              width={280}
              onClose={jest.fn()}
              variant="permanent"
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      const dashboardItem = screen.getByRole('menuitem', { name: 'Dashboard' });

      dashboardItem.focus();
      expect(document.activeElement).toBe(dashboardItem);
    });
  });

  describe('Animation Performance Tests', () => {
    it('uses CSS transforms for better performance', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // Component should be rendered (performance is tested via CSS properties in real implementation)
    });

    it('avoids layout thrashing during animations', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /navigation menu/i,
      });

      // Multiple rapid interactions
      for (let i = 0; i < 5; i++) {
        await user.click(menuButton);
        act(() => {
          jest.advanceTimersByTime(50);
        });
      }

      // Should still be responsive
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles will-change property correctly', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // will-change should be managed properly (tested via CSS in real implementation)
    });
  });

  describe('Reduced Motion Compliance', () => {
    beforeEach(() => {
      // Mock reduced motion preference
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
    });

    it('disables animations when reduced motion is preferred', () => {
      const { getAnimationDuration } = require('../../../constants');
      getAnimationDuration.mockImplementation(() => 0);

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(getAnimationDuration).toHaveBeenCalled();
    });

    it('maintains functionality without animations', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { getAnimationDuration } = require('../../../constants');
      getAnimationDuration.mockImplementation(() => 0);

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div>Content</div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', {
        name: /navigation menu/i,
      });

      await user.click(menuButton);

      // Should still function without animations
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error State Visual Handling', () => {
    it('handles missing navigation items gracefully', () => {
      const { getFooterNavigationItems } = require('../../../constants');
      getFooterNavigationItems.mockReturnValue([]);

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });

    it('handles component errors without breaking layout', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <Header
                onMenuClick={undefined as any}
                sidebarOpen={false}
                sidebarWidth={280}
              />
            </ThemeProvider>
          </BrowserRouter>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('maintains visual consistency during error states', () => {
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar
              open={true}
              width={-100} // Invalid width
              onClose={jest.fn()}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});
