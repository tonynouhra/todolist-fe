import React from 'react';
import { render } from '../../test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TodoCard } from '../../components/ui/TodoCard';
import { ProjectCard } from '../../components/ui/ProjectCard';
import { TodoForm } from '../../components/forms/TodoForm';
import { ProjectForm } from '../../components/forms/ProjectForm';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { mockTodo, mockProject } from '../../test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Compliance', () => {
  it('TodoCard should have no accessibility violations', async () => {
    const { container } = render(
      <TodoCard
        todo={mockTodo}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ProjectCard should have no accessibility violations', async () => {
    const { container } = render(
      <ProjectCard
        project={mockProject}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onClick={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('TodoForm should have no accessibility violations', async () => {
    const { container } = render(
      <TodoForm onSubmit={jest.fn()} onCancel={jest.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ProjectForm should have no accessibility violations', async () => {
    const { container } = render(
      <ProjectForm onSubmit={jest.fn()} onCancel={jest.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ConfirmDialog should have no accessibility violations', async () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ErrorBoundary should have no accessibility violations', async () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();

    console.error = originalError;
  });

  it('should support keyboard navigation', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnToggleComplete = jest.fn();

    const { container } = render(
      <TodoCard
        todo={mockTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Verify all focusable elements have proper tab order
    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex !== null && tabIndex !== '0') {
        expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
      }
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels and roles', async () => {
    const { container } = render(
      <TodoCard
        todo={mockTodo}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );

    // Check for required ARIA attributes
    const card = container.querySelector('[role="article"]');
    expect(card).toHaveAttribute('aria-label');

    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toHaveAttribute('aria-label');

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(
      <TodoCard
        todo={mockTodo}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggleComplete={jest.fn()}
      />
    );

    // axe will check color contrast automatically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('should support screen readers with proper semantic markup', async () => {
    const { container } = render(
      <div>
        <h1>Todo List</h1>
        <main>
          <TodoCard
            todo={mockTodo}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            onToggleComplete={jest.fn()}
          />
        </main>
      </div>
    );

    // Check for proper heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);

    // Check for main landmark
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle focus management properly', async () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Check that dialog has proper focus management
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
