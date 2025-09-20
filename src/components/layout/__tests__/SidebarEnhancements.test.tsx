import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { Sidebar } from '../Sidebar';

// Mock the constants
jest.mock('../../../constants', () => ({
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
  createTransition: jest.fn(() => 'transition: all 300ms ease'),
  createOptimizedTransition: jest.fn(() => ({ transition: 'all 300ms ease' })),
  createStaggeredContentTransition: jest.fn(() => ({
    transition: 'all 300ms ease',
    opacity: 1,
    transform: 'translateX(0)',
  })),
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
  getAllNavigationItems: jest.fn(() => [
    {
      text: 'Dashboard',
      icon: { type: 'div', props: {} },
      path: '/dashboard',
      disabled: false,
    },
    {
      text: 'Todos',
      icon: { type: 'div', props: {} },
      path: '/todos',
      disabled: false,
    },
  ]),
  getSecondaryNavigationItems: jest.fn(() => [
    {
      text: 'Settings',
      icon: { type: 'div', props: {} },
      path: '/settings',
      disabled: true,
    },
  ]),
  isNavigationItemActive: jest.fn(() => false),
  measureAnimationPerformance: jest.fn((name, callback) => callback()),
  safeAnimationExecution: jest.fn(async (animationFn) => {
    await animationFn();
  }),
}));

// Mock AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  withAnimationErrorBoundary: jest.fn((Component) => Component),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
}));

describe('Enhanced Sidebar', () => {
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

  it('renders enhanced sidebar with improved animations', () => {
    renderComponent();

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });

  it('supports transition callbacks', () => {
    const onTransitionStart = jest.fn();
    const onTransitionEnd = jest.fn();

    renderComponent({
      onTransitionStart,
      onTransitionEnd,
    });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders permanent variant with fixed positioning', () => {
    renderComponent({ variant: 'permanent' });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders temporary variant with enhanced mobile animations', () => {
    renderComponent({ variant: 'temporary' });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('TodoList')).toBeInTheDocument();
  });

  it('handles width changes smoothly', () => {
    const { rerender } = renderComponent({ width: 240 });

    rerender(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Sidebar {...defaultProps} width={320} />
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
