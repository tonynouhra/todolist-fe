import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { TodosPage } from '../../pages/todos/TodosPage';
import { server } from '../../test-utils/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Todo Management Integration', () => {
  it('displays todos and allows creating new ones', async () => {
    render(<TodosPage />);

    // Wait for todos to load
    await waitFor(() => {
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });

    // Click add todo button
    const addButton = screen.getByRole('button', { name: /add todo/i });
    fireEvent.click(addButton);

    // Fill out the form
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const descriptionInput = screen.getByRole('textbox', {
      name: /description/i,
    });

    fireEvent.change(titleInput, {
      target: { value: 'New Integration Test Todo' },
    });
    fireEvent.change(descriptionInput, {
      target: { value: 'Created during integration test' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create todo/i });
    fireEvent.click(submitButton);

    // Verify the new todo appears
    await waitFor(() => {
      expect(screen.getByText('New Integration Test Todo')).toBeInTheDocument();
    });
  });

  it('allows editing existing todos', async () => {
    render(<TodosPage />);

    // Wait for todos to load
    await waitFor(() => {
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Update the title
    const titleInput = screen.getByDisplayValue('Test Todo');
    fireEvent.change(titleInput, { target: { value: 'Updated Test Todo' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update todo/i });
    fireEvent.click(submitButton);

    // Verify the todo is updated
    await waitFor(() => {
      expect(screen.getByText('Updated Test Todo')).toBeInTheDocument();
    });
  });

  it('allows deleting todos with confirmation', async () => {
    render(<TodosPage />);

    // Wait for todos to load
    await waitFor(() => {
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Verify the todo is removed
    await waitFor(() => {
      expect(screen.queryByText('Test Todo')).not.toBeInTheDocument();
    });
  });

  it('allows toggling todo completion status', async () => {
    render(<TodosPage />);

    // Wait for todos to load
    await waitFor(() => {
      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });

    // Click the checkbox to complete the todo
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Verify the todo is marked as completed
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock an error response
    server.use(
      http.get('http://localhost:8000/todos', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    render(<TodosPage />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/error loading todos/i)).toBeInTheDocument();
    });
  });

  it('filters todos by status', async () => {
    // Mock todos with different statuses
    server.use(
      http.get('http://localhost:8000/todos', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        const todos = [
          {
            ...require('../../test-utils').mockTodo,
            id: '1',
            title: 'Todo 1',
            status: 'todo',
          },
          {
            ...require('../../test-utils').mockTodo,
            id: '2',
            title: 'Todo 2',
            status: 'done',
          },
        ];

        const filteredTodos = status
          ? todos.filter((todo) => todo.status === status)
          : todos;

        return HttpResponse.json({
          items: filteredTodos,
          total: filteredTodos.length,
          page: 1,
          limit: 10,
          pages: 1,
        });
      })
    );

    render(<TodosPage />);

    // Wait for todos to load
    await waitFor(() => {
      expect(screen.getByText('Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
    });

    // Filter by completed status
    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusFilter);

    const completedOption = screen.getByText('Done');
    fireEvent.click(completedOption);

    // Verify only completed todos are shown
    await waitFor(() => {
      expect(screen.queryByText('Todo 1')).not.toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
    });
  });

  it('searches todos by title', async () => {
    // Mock search functionality
    server.use(
      http.get('http://localhost:8000/todos', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');

        const todos = [
          {
            ...require('../../test-utils').mockTodo,
            id: '1',
            title: 'Important Task',
          },
          {
            ...require('../../test-utils').mockTodo,
            id: '2',
            title: 'Regular Todo',
          },
        ];

        const filteredTodos = search
          ? todos.filter((todo) =>
              todo.title.toLowerCase().includes(search.toLowerCase())
            )
          : todos;

        return HttpResponse.json({
          items: filteredTodos,
          total: filteredTodos.length,
          page: 1,
          limit: 10,
          pages: 1,
        });
      })
    );

    render(<TodosPage />);

    // Wait for todos to load
    await waitFor(() => {
      expect(screen.getByText('Important Task')).toBeInTheDocument();
      expect(screen.getByText('Regular Todo')).toBeInTheDocument();
    });

    // Search for specific todo
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'Important' } });

    // Verify search results
    await waitFor(() => {
      expect(screen.getByText('Important Task')).toBeInTheDocument();
      expect(screen.queryByText('Regular Todo')).not.toBeInTheDocument();
    });
  });
});
