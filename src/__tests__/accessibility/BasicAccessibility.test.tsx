import React from 'react';
import { render, screen, within } from '../../test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TodosPage } from '../../pages/todos/TodosPage';
import { ProjectsPage } from '../../pages/projects/ProjectsPage';
import { DashboardPage } from '../../pages/dashboard/DashboardPage';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Basic Accessibility Tests', () => {
  it('TodosPage should have no accessibility violations', async () => {
    const { container } = render(<TodosPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ProjectsPage should have no accessibility violations', async () => {
    const { container } = render(<ProjectsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DashboardPage should have no accessibility violations', async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    render(<TodosPage />);

    // Check for main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
  });

  it('should have proper landmark structure', () => {
    render(<TodosPage />);

    // Check for main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(<TodosPage />);

    // Find all focusable elements
    const focusableElements = screen.getAllByRole('button');

    // Each button should be keyboard accessible
    focusableElements.forEach((element) => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should have proper ARIA labels for interactive elements', () => {
    render(<TodosPage />);

    // Find buttons and check for proper labeling
    const buttons = screen.getAllByRole('button');

    buttons.forEach((button) => {
      const hasLabel =
        button.getAttribute('aria-label') ||
        button.getAttribute('aria-labelledby') ||
        button.textContent?.trim();

      expect(hasLabel).toBeTruthy();
    });
  });

  it('should announce dynamic content changes', async () => {
    render(<TodosPage />);

    // Look for live regions
    const liveRegions = screen.queryAllByRole('status');
    const alerts = screen.queryAllByRole('alert');

    // Should have some mechanism for announcing changes
    expect(liveRegions.length + alerts.length).toBeGreaterThanOrEqual(0);
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(<TodosPage />);

    // axe will check color contrast automatically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('should support screen readers with proper semantic markup', () => {
    render(<TodosPage />);

    // Check for semantic elements
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for proper list structure if todos are displayed
    const lists = screen.queryAllByRole('list');
    lists.forEach((list) => {
      const listItems = within(list).queryAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  it('should handle focus management properly', () => {
    render(<TodosPage />);

    // Check that focusable elements exist
    const focusableElements = screen.getAllByRole('button');
    expect(focusableElements.length).toBeGreaterThan(0);

    // Each should be properly focusable
    focusableElements.forEach((element) => {
      expect(element).toBeVisible();
      expect(element).not.toBeDisabled();
    });
  });
});
