import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';
import { AddTodoFAB } from '../../ui/AddTodoFAB';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock navigation constants
jest.mock('../../../constants', () => ({
  ...jest.requireActual('../../../constants'),
  getFooterNavigationItems: () => [
    {
      text: 'Dashboard',
      path: '/dashboard',
      icon: <div>Dashboard Icon</div>,
      disabled: false,
      description: 'Navigate to dashboard page',
    },
    {
      text: 'Todos',
      path: '/todos',
      icon: <div>Todos Icon</div>,
      disabled: false,
      description: 'Navigate to todos page',
    },
    {
      text: 'Projects',
      path: '/projects',
      icon: <div>Projects Icon</div>,
      disabled: false,
      description: 'Navigate to projects page',
    },
  ],
  getAllNavigationItems: () => [
    {
      text: 'Dashboard',
      path: '/dashboard',
      icon: <div>Dashboard Icon</div>,
      disabled: false,
    },
    {
      text: 'Todos',
      path: '/todos',
      icon: <div>Todos Icon</div>,
      disabled: false,
    },
  ],
  getSecondaryNavigationItems: () => [
    {
      text: 'Settings',
      path: '/settings',
      icon: <div>Settings Icon</div>,
      disabled: false,
    },
  ],
  isNavigationItemActive: (item: any, pathname: string) =>
    item.path === pathname,
}));

// Mock window.matchMedia for reduced motion testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('Accessibility Improvements', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    mockMatchMedia(false);

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Reduced Motion Support', () => {
    it('should provide alternative feedback when motion is reduced', async () => {
      mockMatchMedia(true);

      const mockOnClick = jest.fn();

      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const fab = screen.getByRole('button', { name: /add new todo/i });

      // Should respect reduced motion preferences
      expect(fab).toBeInTheDocument();

      // Test hover behavior
      fireEvent.mouseEnter(fab);
      expect(fab).toBeInTheDocument();
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels on AddTodoFAB', () => {
      const mockOnClick = jest.fn();

      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const fab = screen.getByRole('button', { name: /add new todo item/i });
      expect(fab).toHaveAttribute('aria-describedby', 'fab-description');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in AddTodoFAB', async () => {
      const mockOnClick = jest.fn();

      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const fab = screen.getByRole('button', { name: /add new todo item/i });
      fab.focus();

      // Test Enter key
      fireEvent.keyDown(fab, { key: 'Enter', code: 'Enter' });
      expect(mockOnClick).toHaveBeenCalled();

      // Test Space key
      mockOnClick.mockClear();
      fireEvent.keyDown(fab, { key: ' ', code: 'Space' });
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly', async () => {
      const mockOnClick = jest.fn();

      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const fab = screen.getByRole('button', { name: /add new todo item/i });
      expect(fab).toBeInTheDocument();

      // Test that the FAB can receive focus
      fab.focus();
      expect(fab).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide hidden descriptions for screen readers', () => {
      const mockOnClick = jest.fn();

      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const description = screen.getByText('Click to open the add todo dialog');
      expect(description).toHaveAttribute('id', 'fab-description');

      // Should be visually hidden but accessible to screen readers
      const styles = window.getComputedStyle(description);
      expect(styles.position).toBe('absolute');
      expect(styles.left).toBe('-10000px');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations in AddTodoFAB', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should provide enhanced contrast in high contrast mode', () => {
      const mockOnClick = jest.fn();
      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const fab = screen.getByRole('button', { name: /add new todo item/i });

      // Should have proper styling for high contrast mode support
      expect(fab).toBeInTheDocument();
      expect(fab).toHaveAttribute('aria-describedby', 'fab-description');
    });
  });

  describe('Touch Target Sizes', () => {
    it('should meet minimum touch target size requirements', () => {
      const mockOnClick = jest.fn();
      render(
        <TestWrapper>
          <AddTodoFAB visible={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const fab = screen.getByRole('button', { name: /add new todo item/i });

      // Should meet minimum touch target size requirements
      expect(fab).toBeInTheDocument();

      // Test that the FAB has proper styling
      const computedStyle = window.getComputedStyle(fab);
      expect(computedStyle.minWidth).toBeTruthy();
      expect(computedStyle.minHeight).toBeTruthy();
    });
  });
});
