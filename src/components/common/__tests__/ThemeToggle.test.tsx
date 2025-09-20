import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { ThemeToggle } from '../ThemeToggle';

// Mock the theme context
const mockToggleTheme = jest.fn();
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'light',
    toggleTheme: mockToggleTheme,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('calls toggleTheme when clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveAttribute('aria-label');
  });

  it('displays correct icon for light mode', () => {
    render(<ThemeToggle />);

    // Should show dark mode icon when in light mode (to switch to dark)
    expect(screen.getByTestId('Brightness4Icon')).toBeInTheDocument();
  });
});
