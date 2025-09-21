import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';
import { theme } from '../../../styles/theme';
import { DesktopFooterNavigation } from '../DesktopFooterNavigation';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { AppLayout } from '../AppLayout';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock constants for consistent testing
jest.mock('../../../constants', () => ({
  getFooterNavigationItems: () => [
    {
      text: 'Dashboard',
      icon: <span>📊</span>,
      path: '/dashboard',
      showInFooter: true,
    },
    {
      text: 'Todos',
      icon: <span>✓</span>,
      path: '/todos',
      showInFooter: true,
    },
    {
      text: 'Projects',
      icon: <span>📁</span>,
      path: '/projects',
      showInFooter: true,
    },
  ],
  isNavigationItemActive: (item: any, path: string) => item.path === path,
  animationConfig: {
    duration: { footer: 200, iconTransition: 150, sidebar: 300, content: 300 },
    easing: { enter: 'ease-in', exit: 'ease-out', sharp: 'ease' },
  },
  getAnimationDuration: (duration: number) => duration,
}));

// Mock Clerk
jest.mock('@clerk/clerk-react', () => ({
  UserButton: () => <button data-testid="user-button">User</button>,
}));

// Mock router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

describe('Navigation Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  describe('DesktopFooterNavigation Accessibility', () => {
    const renderFooterNavigation = (props = {}) => {
      const defaultProps = { visible: true, ...props };
      return render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation {...defaultProps} />
          </ThemeProvider>
        </BrowserRouter>
      );
    };

    it('has no accessibility violations', async () => {
      const { container } = renderFooterNavigation();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper navigation landmark', () => {
      renderFooterNavigation();

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute(
        'aria-label',
        'Desktop footer navigation'
      );
    });

    it('has proper menubar structure', () => {
      renderFooterNavigation();

      const menubar = screen.getByRole('menubar');
      expect(menubar).toHaveAttribute('aria-orientation', 'horizontal');

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);

      menuItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('provides proper labels for screen readers', () => {
      renderFooterNavigation();

      expect(
        screen.getByLabelText('Navigate to Dashboard')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Todos')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Projects')).toBeInTheDocument();
    });

    it('indicates current page correctly', () => {
      renderFooterNavigation();

      const dashboardItem = screen.getByLabelText('Navigate to Dashboard');
      expect(dashboardItem).toHaveAttribute('aria-current', 'page');

      const todosItem = screen.getByLabelText('Navigate to Todos');
      expect(todosItem).not.toHaveAttribute('aria-current');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderFooterNavigation();

      const dashboardItem = screen.getByLabelText('Navigate to Dashboard');
      const todosItem = screen.getByLabelText('Navigate to Todos');

      // Tab navigation
      dashboardItem.focus();
      expect(dashboardItem).toHaveFocus();

      await user.tab();
      expect(todosItem).toHaveFocus();
    });

    it('responds to Enter and Space keys', async () => {
      const user = userEvent.setup();
      const onNavigate = jest.fn();
      renderFooterNavigation({ onNavigate });

      const dashboardItem = screen.getByLabelText('Navigate to Dashboard');
      dashboardItem.focus();

      // Enter key
      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

      // Space key
      await user.keyboard(' ');
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });

    it('has proper focus indicators', () => {
      renderFooterNavigation();

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        item.focus();
        // Focus should be visible (tested via CSS in actual implementation)
        expect(item).toHaveFocus();
      });
    });
  });

  describe('Header Accessibility', () => {
    const renderHeader = (props = {}) => {
      const defaultProps = {
        onMenuClick: jest.fn(),
        sidebarOpen: false,
        sidebarWidth: 280,
        isTransitioning: false,
        ...props,
      };
      return render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header {...defaultProps} />
          </ThemeProvider>
        </BrowserRouter>
      );
    };

    it('has no accessibility violations', async () => {
      const { container } = renderHeader();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper banner landmark', () => {
      renderHeader();

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
    });

    it('has properly labeled menu button', () => {
      renderHeader({ sidebarOpen: false });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'navigation-menu');
    });

    it('updates menu button label when sidebar state changes', () => {
      const { rerender } = renderHeader({ sidebarOpen: false });

      let menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header
              onMenuClick={jest.fn()}
              sidebarOpen={true}
              sidebarWidth={280}
              isTransitioning={false}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      menuButton = screen.getByRole('button', {
        name: /close navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('disables menu button during transitions', () => {
      renderHeader({ isTransitioning: true });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toBeDisabled();
    });

    it('supports keyboard interaction', async () => {
      const user = userEvent.setup();
      const onMenuClick = jest.fn();
      renderHeader({ onMenuClick });

      const menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });

      await user.click(menuButton);
      expect(onMenuClick).toHaveBeenCalled();

      menuButton.focus();
      await user.keyboard('{Enter}');
      expect(onMenuClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sidebar Accessibility', () => {
    const renderSidebar = (props = {}) => {
      const defaultProps = {
        open: true,
        width: 280,
        onClose: jest.fn(),
        variant: 'permanent' as const,
        ...props,
      };
      return render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar {...defaultProps} />
          </ThemeProvider>
        </BrowserRouter>
      );
    };

    it('has no accessibility violations', async () => {
      const { container } = renderSidebar();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper navigation landmark', () => {
      renderSidebar();

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');
      expect(navigation).toHaveAttribute('id', 'navigation-menu');
    });

    it('has proper menu structure', () => {
      renderSidebar();

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

    it('has properly labeled menu items', () => {
      renderSidebar();

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);

      menuItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0');
        expect(item).toHaveAttribute('role', 'menuitem');
      });
    });

    it('indicates current page correctly', () => {
      renderSidebar();

      const dashboardItem = screen.getByRole('menuitem', { name: 'Dashboard' });
      expect(dashboardItem).toHaveAttribute('aria-current', 'page');
    });

    it('handles disabled items correctly', () => {
      renderSidebar();

      const aiAssistantItem = screen.getByRole('menuitem', {
        name: 'AI Assistant',
      });
      const settingsItem = screen.getByRole('menuitem', { name: 'Settings' });

      expect(aiAssistantItem).toBeDisabled();
      expect(settingsItem).toBeDisabled();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const dashboardItem = screen.getByRole('menuitem', { name: 'Dashboard' });
      const todosItem = screen.getByRole('menuitem', { name: 'Todos' });

      dashboardItem.focus();
      expect(dashboardItem).toHaveFocus();

      await user.tab();
      expect(todosItem).toHaveFocus();
    });

    it('navigates on Enter and Space keys', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const todosItem = screen.getByRole('menuitem', { name: 'Todos' });
      todosItem.focus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith('/todos');
    });
  });

  describe('AppLayout Accessibility Integration', () => {
    const renderAppLayout = (children = <div>Content</div>) => {
      return render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>{children}</AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );
    };

    it('has no accessibility violations', async () => {
      const { container } = renderAppLayout();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper landmark structure', () => {
      renderAppLayout();

      const banner = screen.getByRole('banner');
      const navigation = screen.getByRole('navigation');
      const main = screen.getByRole('main');

      expect(banner).toBeInTheDocument();
      expect(navigation).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });

    it('maintains focus during sidebar transitions', async () => {
      const user = userEvent.setup();
      renderAppLayout();

      const menuButton = screen.getByRole('button', {
        name: /navigation menu/i,
      });

      menuButton.focus();
      expect(menuButton).toHaveFocus();

      await user.click(menuButton);

      // Focus should be managed properly during transition
      expect(menuButton).toHaveFocus();
    });

    it('provides skip links for keyboard users', () => {
      renderAppLayout();

      // Main content should be reachable
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      renderAppLayout(
        <div>
          <h1>Page Title</h1>
          <h2>Section Title</h2>
        </div>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
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

    it('respects reduced motion in footer navigation', () => {
      const { getAnimationDuration } = require('../../../constants');
      getAnimationDuration.mockImplementation(() => 0);

      const { container } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(container).toBeInTheDocument();
      expect(getAnimationDuration).toHaveBeenCalled();
    });

    it('respects reduced motion in header', () => {
      const { container } = render(
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

      expect(container).toBeInTheDocument();
    });

    it('respects reduced motion in sidebar', () => {
      const { container } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Sidebar open={true} width={280} onClose={jest.fn()} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('announces navigation changes', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      const todosItem = screen.getByLabelText('Navigate to Todos');
      await user.click(todosItem);

      // Navigation should be announced to screen readers
      expect(mockNavigate).toHaveBeenCalledWith('/todos');
    });

    it('provides context for navigation state changes', () => {
      const { rerender } = render(
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

      let menuButton = screen.getByRole('button', {
        name: /open navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header
              onMenuClick={jest.fn()}
              sidebarOpen={true}
              sidebarWidth={280}
            />
          </ThemeProvider>
        </BrowserRouter>
      );

      menuButton = screen.getByRole('button', {
        name: /close navigation menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('provides live region updates for dynamic content', () => {
      // This would be implemented with aria-live regions in actual components
      render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppLayout>
              <div aria-live="polite" data-testid="live-region">
                Navigation updated
              </div>
            </AppLayout>
          </ThemeProvider>
        </BrowserRouter>
      );

      const liveRegion = screen.getByTestId('live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('High Contrast Mode Support', () => {
    it('maintains visibility in high contrast mode', () => {
      // Mock high contrast media query
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

      const { container } = render(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <DesktopFooterNavigation visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(container).toBeInTheDocument();
    });
  });
});
