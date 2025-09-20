import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import { ProjectForm } from '../ProjectForm';
import { mockProject } from '../../../test-utils';

describe('ProjectForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no initial project is provided', () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create project/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit form when initial project is provided', () => {
    render(
      <ProjectForm
        initialProject={mockProject}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue(mockProject.name)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(mockProject.description!)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /update project/i })
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', {
      name: /create project/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByRole('textbox', { name: /name/i });
    const descriptionInput = screen.getByRole('textbox', {
      name: /description/i,
    });
    const submitButton = screen.getByRole('button', {
      name: /create project/i,
    });

    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New Project Description' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Project',
          description: 'New Project Description',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('validates name length constraints', async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByRole('textbox', { name: /name/i });
    const submitButton = screen.getByRole('button', {
      name: /create project/i,
    });

    // Test minimum length
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    // Test maximum length
    const longName = 'a'.repeat(201);
    fireEvent.change(nameInput, { target: { value: longName } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at most 200 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByRole('textbox', { name: /name/i });
    const descriptionInput = screen.getByRole('textbox', {
      name: /description/i,
    });

    expect(nameInput).toHaveAttribute('required');
    expect(nameInput).toHaveAttribute('aria-label');
    expect(descriptionInput).toHaveAttribute('aria-label');
  });
});
