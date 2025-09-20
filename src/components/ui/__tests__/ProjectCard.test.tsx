import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import { ProjectCard } from '../ProjectCard';
import { mockProject } from '../../../test-utils';

describe('ProjectCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project information correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
    expect(screen.getByText(mockProject.description!)).toBeInTheDocument();
  });

  it('displays todo count statistics', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(
      screen.getByText(`${mockProject.todo_count} todos`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${mockProject.completed_todo_count} completed`)
    ).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button', {
      name: new RegExp(mockProject.name, 'i'),
    });
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockProject);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit project/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
    expect(mockOnClick).not.toHaveBeenCalled(); // Should not trigger card click
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete project/i,
    });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockProject.id);
    expect(mockOnClick).not.toHaveBeenCalled(); // Should not trigger card click
  });

  it('displays progress indicator', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    const expectedProgress =
      (mockProject.completed_todo_count! / mockProject.todo_count!) * 100;
    expect(progressBar).toHaveAttribute(
      'aria-valuenow',
      expectedProgress.toString()
    );
  });

  it('handles project with no todos', () => {
    const emptyProject = {
      ...mockProject,
      todo_count: 0,
      completed_todo_count: 0,
    };
    render(
      <ProjectCard
        project={emptyProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('0 todos')).toBeInTheDocument();
    expect(screen.getByText('0 completed')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('has proper accessibility attributes', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button', {
      name: new RegExp(mockProject.name, 'i'),
    });
    expect(card).toHaveAttribute('aria-label');

    const editButton = screen.getByRole('button', { name: /edit project/i });
    expect(editButton).toHaveAttribute('aria-label');

    const deleteButton = screen.getByRole('button', {
      name: /delete project/i,
    });
    expect(deleteButton).toHaveAttribute('aria-label');

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label');
  });

  it('displays creation date', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });
});
