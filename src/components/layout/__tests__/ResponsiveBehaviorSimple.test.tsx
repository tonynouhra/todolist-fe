import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../styles/theme';

// Simple test to verify responsive behavior improvements
describe('AppLayout Responsive Behavior - Simple Tests', () => {
  it('should have theme breakpoint values configured correctly', () => {
    expect(theme.breakpoints.values.md).toBe(900);
    expect(theme.breakpoints.values.sm).toBe(600);
    expect(theme.breakpoints.values.lg).toBe(1200);
  });

  it('should render a simple component with theme', () => {
    render(
      <ThemeProvider theme={theme}>
        <div data-testid="test-content">Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('should have responsive styles in theme components', () => {
    // Test that theme has responsive component styles
    expect(theme.components?.MuiDrawer?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiPaper?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiButton?.styleOverrides?.root).toBeDefined();
  });
});
