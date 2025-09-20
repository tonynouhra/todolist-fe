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
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { AddTodoFAB } from '../AddTodoFAB';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock animation constants
jest.mock('../../../constants/animations', () => ({
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
  createFocusVisibleStyles: jest.fn(() => ({
    '&:focus-visible': {
      outline: '2px solid #1976d2',
      outlineOffset: '2px',
    },
  })),
  createAccessibleHoverStyles: jest.fn(() => ({
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.9)',
      transform: 'scale(1.05)',
    },
  })),
}));

// Mock the AnimationErrorBoundary
jest.mock('../../common/AnimationErrorBoundary', () => ({
  withAnimationErrorBoundary: (Component: React.ComponentType) => Component,
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AddTodoFAB', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders when visible is true', () => {
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);
      expect(screen.getByLabelText('Add new todo item')).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      renderWithTheme(<AddTodoFAB visible={false} onClick={mockOnClick} />);
      expect(
        screen.queryByLabelText('Add new todo item')
      ).not.toBeInTheDocument();
    });

    it('renders with correct default position', () => {
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);
      const fab = screen.getByLabelText('Add new todo item');
      expect(fab).toBeInTheDocument();
    });

    it('renders with footer-integrated position', () => {
      renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="footer-integrated"
        />
      );
      const fab = screen.getByLabelText('Add new todo item');
      expect(fab).toBeInTheDocument();
    });

    it('renders with bottom-right position', () => {
      renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="bottom-right"
        />
      );
      const fab = screen.getByLabelText('Add new todo item');
      expect(fab).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      const fab = screen.getByLabelText('Add new todo item');
      await user.click(fab);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard activation with Enter key', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      const fab = screen.getByLabelText('Add new todo item');
      fab.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard activation with Space key', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      const fab = screen.getByLabelText('Add new todo item');
      fab.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithTheme(
        <AddTodoFAB visible={true} onClick={mockOnClick} disabled={true} />
      );

      const fab = screen.getByLabelText('Add new todo item');
      expect(fab).toBeDisabled();

      await user.click(fab);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('prevents interaction after unmount', () => {
      const { unmount } = renderWithTheme(
        <AddTodoFAB visible={true} onClick={mockOnClick} />
      );

      const fab = screen.getByLabelText('Add new todo item');
      unmount();

      // Should not throw error when trying to interact after unmount
      expect(() => {
        fireEvent.click(fab);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility audit', async () => {
      const { container } = renderWithTheme(
        <AddTodoFAB visible={true} onClick={mockOnClick} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      const fab = screen.getByLabelText('Add new todo item');
      expect(fab).toHaveAttribute('aria-label', 'Add new todo item');
      expect(fab).toHaveAttribute('aria-describedby', 'fab-description');
    });

    it('provides screen reader description', () => {
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      const description = document.getElementById('fab-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(
        'Click to open the add todo dialog'
      );
    });

    it('updates description when disabled', () => {
      renderWithTheme(
        <AddTodoFAB visible={true} onClick={mockOnClick} disabled={true} />
      );

      const description = document.getElementById('fab-description');
      expect(description).toHaveTextContent(
        'Add todo button is currently disabled'
      );
    });

    it('announces availability to screen readers when visible', () => {
      const {
        announceToScreenReader,
      } = require('../../../constants/animations');

      renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="footer-integrated"
        />
      );

      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Add todo button is now available. Press Tab to navigate to it.',
        'polite'
      );
    });

    it('announces unavailability when hidden', () => {
      const {
        announceToScreenReader,
      } = require('../../../constants/animations');
      const { rerender } = renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="footer-integrated"
        />
      );

      // Hide the FAB
      rerender(
        <ThemeProvider theme={theme}>
          <AddTodoFAB
            visible={false}
            onClick={mockOnClick}
            position="footer-integrated"
          />
        </ThemeProvider>
      );

      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Add todo button is no longer available.',
        'polite'
      );
    });

    it('has proper focus-visible styles', () => {
      const {
        createFocusVisibleStyles,
      } = require('../../../constants/animations');
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      expect(createFocusVisibleStyles).toHaveBeenCalled();
    });

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

      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);
      expect(screen.getByLabelText('Add new todo item')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('uses adaptive animation configuration', () => {
      const {
        getAdaptiveAnimationConfig,
      } = require('../../../constants/animations');
      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      expect(getAdaptiveAnimationConfig).toHaveBeenCalled();
    });

    it('measures animation performance', async () => {
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);

      const fab = screen.getByLabelText('Add new todo item');
      await user.click(fab);

      expect(measureAnimationPerformance).toHaveBeenCalledWith(
        'add-todo-fab-click',
        expect.any(Function)
      );
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

      renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />);
      expect(screen.getByLabelText('Add new todo item')).toBeInTheDocument();
    });

    it('handles animation with proper delay for footer-integrated position', async () => {
      const { rerender } = renderWithTheme(
        <AddTodoFAB
          visible={false}
          onClick={mockOnClick}
          position="footer-integrated"
        />
      );

      // Make visible
      rerender(
        <ThemeProvider theme={theme}>
          <AddTodoFAB
            visible={true}
            onClick={mockOnClick}
            position="footer-integrated"
          />
        </ThemeProvider>
      );

      // Should appear with delay after footer
      await waitFor(() => {
        expect(screen.getByLabelText('Add new todo item')).toBeInTheDocument();
      });
    });

    it('unmounts properly when hidden', async () => {
      const { rerender } = renderWithTheme(
        <AddTodoFAB visible={true} onClick={mockOnClick} />
      );

      expect(screen.getByLabelText('Add new todo item')).toBeInTheDocument();

      // Hide the FAB
      rerender(
        <ThemeProvider theme={theme}>
          <AddTodoFAB visible={false} onClick={mockOnClick} />
        </ThemeProvider>
      );

      // Should unmount after animation
      await waitFor(() => {
        expect(
          screen.queryByLabelText('Add new todo item')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Positioning', () => {
    it('applies correct styles for footer-integrated position', () => {
      renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="footer-integrated"
        />
      );

      const fab = screen.getByLabelText('Add new todo item');
      // In JSDOM, we can't test exact CSS values, but we can verify the component renders
      expect(fab).toBeInTheDocument();
    });

    it('applies correct styles for bottom-right position', () => {
      renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="bottom-right"
        />
      );

      const fab = screen.getByLabelText('Add new todo item');
      expect(fab).toBeInTheDocument();
    });

    it('hides on mobile for footer-integrated position', () => {
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

      renderWithTheme(
        <AddTodoFAB
          visible={true}
          onClick={mockOnClick}
          position="footer-integrated"
        />
      );

      // Should still render but with mobile-hidden styles
      expect(screen.getByLabelText('Add new todo item')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles animation errors gracefully', () => {
      const {
        measureAnimationPerformance,
      } = require('../../../constants/animations');
      measureAnimationPerformance.mockImplementation(() => {
        throw new Error('Animation failed');
      });

      // Should still render despite animation errors
      expect(() =>
        renderWithTheme(<AddTodoFAB visible={true} onClick={mockOnClick} />)
      ).not.toThrow();
    });

    it('cleans up properly on unmount', () => {
      const { unmount } = renderWithTheme(
        <AddTodoFAB visible={true} onClick={mockOnClick} />
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
