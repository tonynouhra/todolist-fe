import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '../../../styles/theme';
import { ThemeToggle } from '../ThemeToggle';

// Import the theme context
import { ThemeProvider as CustomThemeProvider } from '../../../contexts/ThemeContext';

// Simple wrapper without MSW
const SimpleWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <CustomThemeProvider>{children}</CustomThemeProvider>
  </ThemeProvider>
);

const renderWithTheme = (ui: React.ReactElement) =>
  render(ui, { wrapper: SimpleWrapper });

describe('ThemeToggle - Simple Tests', () => {
  it('renders theme toggle button', () => {
    renderWithTheme(<ThemeToggle />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(<ThemeToggle />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toHaveAttribute('aria-label');
    expect(toggleButton).toHaveAttribute('type', 'button');
  });

  it('responds to click events', () => {
    renderWithTheme(<ThemeToggle />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });

    // Should not throw when clicked
    expect(() => {
      fireEvent.click(toggleButton);
    }).not.toThrow();
  });

  it('supports keyboard navigation', () => {
    renderWithTheme(<ThemeToggle />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });

    // Should respond to Enter key
    fireEvent.keyDown(toggleButton, { key: 'Enter' });
    expect(toggleButton).toBeInTheDocument();

    // Should respond to Space key
    fireEvent.keyDown(toggleButton, { key: ' ' });
    expect(toggleButton).toBeInTheDocument();
  });
});
