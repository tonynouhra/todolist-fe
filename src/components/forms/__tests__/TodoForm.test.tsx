import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { TodoForm } from '../TodoForm';
import { mockTodo } from '../../../test-utils';

describe('TodoForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no initial todo is provided', () => {
    render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create todo/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit form when initial todo is provided', () => {
    render(
      <TodoForm
        initialTodo={mockTodo}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue(mockTodo.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockTodo.description!)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /update todo/i })
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /create todo/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const descriptionInput = screen.getByRole('textbox', {
      name: /description/i,
    });
    const submitButton = screen.getByRole('button', { name: /create todo/i });

    fireEvent.change(titleInput, { target: { value: 'New Todo' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New Description' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Todo',
          description: 'New Description',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('handles priority selection', async () => {
    render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const prioritySelect = screen.getByLabelText(/priority/i);
    fireEvent.mouseDown(prioritySelect);

    const highPriorityOption = screen.getByText('High');
    fireEvent.click(highPriorityOption);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    fireEvent.change(titleInput, { target: { value: 'High Priority Todo' } });

    const submitButton = screen.getByRole('button', { name: /create todo/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'High Priority Todo',
          priority: 5,
        })
      );
    });
  });

  it('handles status selection in edit mode', async () => {
    render(
      <TodoForm
        initialTodo={mockTodo}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);

    const completedOption = screen.getByText('Done');
    fireEvent.click(completedOption);

    const submitButton = screen.getByRole('button', { name: /update todo/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'done',
        })
      );
    });
  });

  it('has proper accessibility attributes', () => {
    render(<TodoForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const descriptionInput = screen.getByRole('textbox', {
      name: /description/i,
    });

    expect(titleInput).toHaveAttribute('required');
    expect(titleInput).toHaveAttribute('aria-label');
    expect(descriptionInput).toHaveAttribute('aria-label');
  });
});
