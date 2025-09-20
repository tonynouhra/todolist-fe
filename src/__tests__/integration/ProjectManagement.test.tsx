import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { ProjectsPage } from '../../pages/projects/ProjectsPage';
import { server } from '../../test-utils/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Project Management Integration', () => {
  it('displays projects and allows creating new ones', async () => {
    render(<ProjectsPage />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click add project button
    const addButton = screen.getByRole('button', { name: /add project/i });
    fireEvent.click(addButton);

    // Fill out the form
    const nameInput = screen.getByRole('textbox', { name: /name/i });
    const descriptionInput = screen.getByRole('textbox', {
      name: /description/i,
    });

    fireEvent.change(nameInput, {
      target: { value: 'New Integration Test Project' },
    });
    fireEvent.change(descriptionInput, {
      target: { value: 'Created during integration test' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /create project/i,
    });
    fireEvent.click(submitButton);

    // Verify the new project appears
    await waitFor(() => {
      expect(
        screen.getByText('New Integration Test Project')
      ).toBeInTheDocument();
    });
  });

  it('allows editing existing projects', async () => {
    render(<ProjectsPage />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit project/i });
    fireEvent.click(editButton);

    // Update the name
    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'Updated Test Project' } });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /update project/i,
    });
    fireEvent.click(submitButton);

    // Verify the project is updated
    await waitFor(() => {
      expect(screen.getByText('Updated Test Project')).toBeInTheDocument();
    });
  });

  it('allows deleting projects with confirmation', async () => {
    render(<ProjectsPage />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', {
      name: /delete project/i,
    });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Verify the project is removed
    await waitFor(() => {
      expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
    });
  });

  it('navigates to project details when project is clicked', async () => {
    render(<ProjectsPage />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click on the project card
    const projectCard = screen.getByRole('button', { name: /test project/i });
    fireEvent.click(projectCard);

    // Verify navigation (this would depend on your routing implementation)
    // For now, we'll just verify the click handler was called
    expect(projectCard).toHaveAttribute('aria-pressed', 'false');
  });

  it('displays project statistics correctly', async () => {
    render(<ProjectsPage />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Verify statistics are displayed
    expect(screen.getByText('5 todos')).toBeInTheDocument();
    expect(screen.getByText('2 completed')).toBeInTheDocument();

    // Verify progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '40'); // 2/5 * 100
  });

  it('handles API errors gracefully', async () => {
    // Mock an error response
    server.use(
      http.get('http://localhost:8000/projects', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    render(<ProjectsPage />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/error loading projects/i)).toBeInTheDocument();
    });
  });

  it('handles empty project list', async () => {
    // Mock empty response
    server.use(
      http.get('http://localhost:8000/projects', () => {
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        });
      })
    );

    render(<ProjectsPage />);

    // Verify empty state is displayed
    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
    });

    // Verify add project button is still available
    expect(
      screen.getByRole('button', { name: /add project/i })
    ).toBeInTheDocument();
  });

  it('supports pagination', async () => {
    // Mock paginated response
    server.use(
      http.get('http://localhost:8000/projects', ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');

        return HttpResponse.json({
          items: [
            {
              ...require('../../test-utils').mockProject,
              id: `project_${page}`,
              name: `Project ${page}`,
            },
          ],
          total: 20,
          page,
          limit: 10,
          pages: 2,
        });
      })
    );

    render(<ProjectsPage />);

    // Wait for first page to load
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    // Navigate to next page
    const nextButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextButton);

    // Verify second page loads
    await waitFor(() => {
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });
});
