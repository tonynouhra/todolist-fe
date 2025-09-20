import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { TodoCard } from '../TodoCard';
import { mockTodo } from '../../../test-utils';

describe('TodoCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders todo information correctly', () => {
    render(
      <TodoCard
        todo={mockTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText(mockTodo.title)).toBeInTheDocument();
    expect(screen.getByText(mockTodo.description!)).toBeInTheDocument();
  });

  it('displays priority indicator', () => {
    const highPriorityTodo = { ...mockTodo, priority: 5 };
    render(
      <TodoCard
        todo={highPriorityTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('displays status correctly', () => {
    const completedTodo = { ...mockTodo, status: 'done' as const };
    render(
      <TodoCard
        todo={completedTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TodoCard
        todo={mockTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TodoCard
        todo={mockTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTodo.id);
  });

  it('calls onToggleComplete when checkbox is clicked', () => {
    render(
      <TodoCard
        todo={mockTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTodo.id);
  });

  it('shows completed state correctly', () => {
    const completedTodo = { ...mockTodo, status: 'done' as const };
    render(
      <TodoCard
        todo={completedTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('displays due date when available', () => {
    const todoWithDueDate = { ...mockTodo, due_date: '2024-12-31T23:59:59Z' };
    render(
      <TodoCard
        todo={todoWithDueDate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText(/due:/i)).toBeInTheDocument();
  });

  it('shows AI generated indicator when applicable', () => {
    const aiTodo = { ...mockTodo, ai_generated: true };
    render(
      <TodoCard
        todo={aiTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText(/ai generated/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TodoCard
        todo={mockTodo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label');

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label');

    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toHaveAttribute('aria-label');

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toHaveAttribute('aria-label');
  });
});
