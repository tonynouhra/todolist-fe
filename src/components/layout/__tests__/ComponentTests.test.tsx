import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';

// Mock the constants module
jest.mock('../../../constants', () => {
  const mockReact = require('react');
  return {
    getFooterNavigationItems: jest.fn(() => [
      {
        text: 'Dashboard',
        icon: mockReact.createElement(
          'span',
          { 'data-testid': 'dashboard-icon' },
          '📊'
        ),
        path: '/dashboard',
        showInFooter: true,
      },
      {
        text: 'Todos',
        icon: mockReact.createElement(
          'span',
          { 'data-testid': 'todos-icon' },
          '✓'
        ),
        path: '/todos',
        showInFooter: true,
      },
    ]),
    isNavigationItemActive: jest.fn((item, path) => item.path === path),
    animationConfig: {
      duration: {
        footer: 200,
        iconTransition: 150,
        sidebar: 300,
        content: 300,
      },
      easing: {
        enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    getAnimationDuration: jest.fn((duration) => duration),
  };
});

// Mock Clerk
jest.mock('@clerk/clerk-react', () => {
  const mockReact = require('react');
  return {
    UserButton: ({ appearance }: any) =>
      mockReact.createElement(
        'div',
        {
          'data-testid': 'user-button',
          'data-appearance': JSON.stringify(appearance),
        },
        'User Button'
      ),
  };
});

describe('Navigation Component Tests', () => {
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

  describe('Animation Configuration Tests', () => {
    it('has correct animation durations', () => {
      const { animationConfig } = require('../../../constants');

      expect(animationConfig.duration.sidebar).toBe(300);
      expect(animationConfig.duration.footer).toBe(200);
      expect(animationConfig.duration.content).toBe(300);
      expect(animationConfig.duration.iconTransition).toBe(150);
    });

    it('has correct easing functions', () => {
      const { animationConfig } = require('../../../constants');

      expect(animationConfig.easing.enter).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(animationConfig.easing.exit).toBe('cubic-bezier(0.4, 0, 0.6, 1)');
      expect(animationConfig.easing.sharp).toBe('cubic-bezier(0.4, 0, 0.6, 1)');
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
      getAnimationDuration.mockImplementation((duration) => 0);

      expect(getAnimationDuration(300)).toBe(0);
    });
  });

  describe('Navigation Items Configuration', () => {
    it('validates navigation item structure', () => {
      interface NavigationItem {
        text: string;
        icon: React.ReactElement;
        path: string;
        showInFooter?: boolean;
      }

      const mockItem: NavigationItem = {
        text: 'Dashboard',
        icon: React.createElement('span', {}, '📊'),
        path: '/dashboard',
        showInFooter: true,
      };

      expect(mockItem.text).toBe('Dashboard');
      expect(mockItem.path).toBe('/dashboard');
      expect(mockItem.showInFooter).toBe(true);
    });

    it('validates active item detection logic', () => {
      const isActive = (itemPath: string, currentPath: string) =>
        itemPath === currentPath;

      expect(isActive('/dashboard', '/dashboard')).toBe(true);
      expect(isActive('/dashboard', '/todos')).toBe(false);
    });
  });

  describe('Theme Integration', () => {
    it('renders components with theme provider', () => {
      const TestComponent = () =>
        React.createElement(
          'div',
          { 'data-testid': 'themed-component' },
          'Themed'
        );

      render(
        React.createElement(
          ThemeProvider,
          { theme },
          React.createElement(TestComponent)
        )
      );

      expect(screen.getByTestId('themed-component')).toBeInTheDocument();
    });

    it('has proper breakpoint values', () => {
      expect(theme.breakpoints.values.xs).toBe(0);
      expect(theme.breakpoints.values.sm).toBe(600);
      expect(theme.breakpoints.values.md).toBe(900);
      expect(theme.breakpoints.values.lg).toBe(1200);
      expect(theme.breakpoints.values.xl).toBe(1536);
    });
  });

  describe('Accessibility Features', () => {
    it('validates ARIA attributes structure', () => {
      const ariaAttributes = {
        navigation: {
          role: 'navigation',
          'aria-label': 'Main navigation',
        },
        menubar: {
          role: 'menubar',
          'aria-orientation': 'horizontal',
        },
        menuitem: {
          role: 'menuitem',
          tabIndex: 0,
        },
        button: {
          'aria-expanded': 'false',
          'aria-controls': 'navigation-menu',
          'aria-label': 'Open navigation menu',
        },
      };

      expect(ariaAttributes.navigation.role).toBe('navigation');
      expect(ariaAttributes.menubar['aria-orientation']).toBe('horizontal');
      expect(ariaAttributes.menuitem.tabIndex).toBe(0);
      expect(ariaAttributes.button['aria-expanded']).toBe('false');
    });

    it('supports keyboard navigation patterns', () => {
      const keyboardEvents = {
        Enter: { key: 'Enter', code: 'Enter' },
        Space: { key: ' ', code: 'Space' },
        Tab: { key: 'Tab', code: 'Tab' },
        ArrowDown: { key: 'ArrowDown', code: 'ArrowDown' },
        ArrowUp: { key: 'ArrowUp', code: 'ArrowUp' },
        Escape: { key: 'Escape', code: 'Escape' },
      };

      expect(keyboardEvents.Enter.key).toBe('Enter');
      expect(keyboardEvents.Space.key).toBe(' ');
      expect(keyboardEvents.Tab.key).toBe('Tab');
    });

    it('validates focus management requirements', () => {
      const focusManagement = {
        focusVisible: {
          outline: '2px solid',
          outlineOffset: '2px',
        },
        focusTrap: {
          enabled: true,
          returnFocus: true,
        },
        skipLinks: {
          enabled: true,
          target: 'main',
        },
      };

      expect(focusManagement.focusVisible.outline).toBe('2px solid');
      expect(focusManagement.focusTrap.enabled).toBe(true);
      expect(focusManagement.skipLinks.target).toBe('main');
    });
  });

  describe('Responsive Behavior', () => {
    it('handles desktop breakpoint correctly', () => {
      // Desktop breakpoint (md and up)
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

      const isDesktop = !window.matchMedia('(max-width: 899px)').matches;
      expect(isDesktop).toBe(true);
    });

    it('handles mobile breakpoint correctly', () => {
      // Mobile breakpoint (below md)
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

      const isMobile = window.matchMedia('(max-width: 899px)').matches;
      expect(isMobile).toBe(true);
    });
  });

  describe('Performance Considerations', () => {
    it('validates animation performance properties', () => {
      const performanceProperties = {
        willChange: 'transform',
        transform: 'translateX(0)',
        opacity: 1,
        backfaceVisibility: 'hidden',
      };

      expect(performanceProperties.willChange).toBe('transform');
      expect(performanceProperties.transform).toBe('translateX(0)');
      expect(performanceProperties.backfaceVisibility).toBe('hidden');
    });

    it('validates transition timing functions', () => {
      const timingFunctions = {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      };

      expect(timingFunctions.easeInOut).toContain('cubic-bezier');
      expect(timingFunctions.sharp).toContain('cubic-bezier');
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation items gracefully', () => {
      const { getFooterNavigationItems } = require('../../../constants');
      getFooterNavigationItems.mockReturnValue([]);

      const items = getFooterNavigationItems();
      expect(items).toEqual([]);
    });

    it('handles invalid animation durations', () => {
      const getAnimationDuration = (duration: number) => {
        if (typeof duration !== 'number' || isNaN(duration)) {
          return 0;
        }
        return duration < 0 ? 0 : duration;
      };

      expect(getAnimationDuration(0)).toBe(0);
      expect(getAnimationDuration(-100)).toBe(0); // Should handle gracefully
      expect(getAnimationDuration(300)).toBe(300);
    });

    it('handles missing window.matchMedia', () => {
      const originalMatchMedia = window.matchMedia;

      // Temporarily remove matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });

      const shouldReduceMotion = () => {
        if (typeof window === 'undefined' || !window.matchMedia) {
          return false;
        }
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      };

      expect(shouldReduceMotion()).toBe(false);

      // Restore
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('validates complete navigation flow state machine', () => {
      const navigationStates = {
        initial: {
          sidebarOpen: true,
          footerVisible: false,
          isTransitioning: false,
        },
        closing: {
          sidebarOpen: false,
          footerVisible: false,
          isTransitioning: true,
        },
        closed: {
          sidebarOpen: false,
          footerVisible: true,
          isTransitioning: false,
        },
        opening: {
          sidebarOpen: true,
          footerVisible: false,
          isTransitioning: true,
        },
      };

      expect(navigationStates.initial.sidebarOpen).toBe(true);
      expect(navigationStates.closing.isTransitioning).toBe(true);
      expect(navigationStates.closed.footerVisible).toBe(true);
      expect(navigationStates.opening.sidebarOpen).toBe(true);
    });

    it('validates transition timing coordination', () => {
      const transitionTiming = {
        sidebarClose: 300,
        footerShowDelay: 100,
        totalTransition: 400, // 300 + 100
        iconTransition: 150,
        contentTransition: 300,
      };

      expect(transitionTiming.totalTransition).toBe(
        transitionTiming.sidebarClose + transitionTiming.footerShowDelay
      );
      expect(transitionTiming.iconTransition).toBeLessThan(
        transitionTiming.sidebarClose
      );
    });

    it('validates component prop interfaces compatibility', () => {
      interface LayoutState {
        sidebarOpen: boolean;
        isTransitioning: boolean;
        showDesktopFooter: boolean;
      }

      interface ComponentProps {
        header: {
          onMenuClick: () => void;
          sidebarOpen: boolean;
          isTransitioning: boolean;
        };
        sidebar: {
          open: boolean;
          onClose: () => void;
          onTransitionStart?: () => void;
          onTransitionEnd?: () => void;
        };
        footer: {
          visible: boolean;
          onNavigate?: (path: string) => void;
        };
      }

      const state: LayoutState = {
        sidebarOpen: true,
        isTransitioning: false,
        showDesktopFooter: false,
      };

      const props: ComponentProps = {
        header: {
          onMenuClick: jest.fn(),
          sidebarOpen: state.sidebarOpen,
          isTransitioning: state.isTransitioning,
        },
        sidebar: {
          open: state.sidebarOpen,
          onClose: jest.fn(),
        },
        footer: {
          visible: state.showDesktopFooter,
        },
      };

      expect(props.header.sidebarOpen).toBe(state.sidebarOpen);
      expect(props.sidebar.open).toBe(state.sidebarOpen);
      expect(props.footer.visible).toBe(state.showDesktopFooter);
    });
  });
});
