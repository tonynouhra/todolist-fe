import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Fab,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AppLayout } from '../../components/layout';
import { TodoList, TodoFilters, TodoDetailView, SubtaskCreationDialog } from '../../components/ui';
import { TodoForm } from '../../components/forms';
import { ConfirmDialog } from '../../components/common';
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleTodoStatus,
  useCreateSubtask,
} from '../../hooks/useTodos';
import { useProjects } from '../../hooks/useProjects';
import { Todo } from '../../types';
import { TodoFilters as TodoFiltersType } from '../../services/todoService';

export const TodosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for filters
  const [filters, setFilters] = useState<TodoFiltersType>({
    page: 1,
    limit: 10,
  });

  // State for forms and dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [parentTodoForSubtask, setParentTodoForSubtask] = useState<Todo | null>(
    null
  );
  const [showSubtaskCreationDialog, setShowSubtaskCreationDialog] = useState(false);
  const [detailViewTodo, setDetailViewTodo] = useState<Todo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    todoId: string;
    todoTitle: string;
  }>({
    open: false,
    todoId: '',
    todoTitle: '',
  });

  // State for notifications
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Queries
  const {
    data: todosData,
    isLoading: todosLoading,
    error: todosError,
  } = useTodos(filters);
  const { data: projectsData } = useProjects();

  // Mutations
  const createTodoMutation = useCreateTodo();
  const updateTodoMutation = useUpdateTodo();
  const deleteTodoMutation = useDeleteTodo();
  const toggleStatusMutation = useToggleTodoStatus();
  const createSubtaskMutation = useCreateSubtask();

  // Computed values
  const todos = todosData?.data || [];
  const projects = projectsData?.data || [];
  const totalPages = todosData
    ? Math.ceil(todosData.total / (filters.limit || 10))
    : 1;

  // Listen for add todo requests from FAB
  React.useEffect(() => {
    const handleAddTodoRequest = (event: CustomEvent) => {
      console.log('Add todo event received:', event.detail);
      // Only handle the event if it's from the FAB and we're not already showing the form
      if (event.detail?.source === 'fab' && !isFormOpen) {
        console.log('Opening todo form from FAB');
        handleCreateTodo();
      }
    };

    // Add event listener
    document.addEventListener(
      'addTodoRequested',
      handleAddTodoRequest as EventListener
    );

    console.log('Todo event listener added');

    // Cleanup
    return () => {
      document.removeEventListener(
        'addTodoRequested',
        handleAddTodoRequest as EventListener
      );
      console.log('Todo event listener removed');
    };
  }, [isFormOpen]); // Include isFormOpen in dependencies to prevent opening multiple forms

  // Handlers
  const handleFiltersChange = (newFilters: TodoFiltersType) => {
    setFilters(newFilters);
  };

  const handleCreateTodo = () => {
    console.log('handleCreateTodo called!');
    setEditingTodo(null);
    setIsFormOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setParentTodoForSubtask(null);
    setIsFormOpen(true);
  };

  const handleViewDetails = (todo: Todo) => {
    setDetailViewTodo(todo);
  };

  const handleCreateSubtask = (parentTodo: Todo) => {
    setParentTodoForSubtask(parentTodo);
    setEditingTodo(null);
    setShowSubtaskCreationDialog(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTodo(null);
    setParentTodoForSubtask(null);
  };

  const handleSubtaskCreationDialogClose = () => {
    setShowSubtaskCreationDialog(false);
    setParentTodoForSubtask(null);
  };

  const handleManualSubtaskCreate = async (subtaskData: any) => {
    try {
      await createSubtaskMutation.mutateAsync({
        parentId: parentTodoForSubtask!.id,
        subtask: subtaskData,
      });
      showNotification('Subtask created successfully!', 'success');
    } catch (error) {
      showNotification('Failed to create subtask', 'error');
    }
  };

  const handleDetailViewClose = () => {
    setDetailViewTodo(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingTodo) {
        await updateTodoMutation.mutateAsync(data);
        showNotification('Todo updated successfully!', 'success');
      } else {
        await createTodoMutation.mutateAsync(data);
        showNotification('Todo created successfully!', 'success');
      }
      handleFormClose();
    } catch (error) {
      showNotification(
        editingTodo ? 'Failed to update todo' : 'Failed to create todo',
        'error'
      );
    }
  };

  const handleDeleteClick = (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (todo) {
      setDeleteConfirm({
        open: true,
        todoId: todo.id,
        todoTitle: todo.title,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTodoMutation.mutateAsync(deleteConfirm.todoId);
      showNotification('Todo deleted successfully!', 'success');
      setDeleteConfirm({ open: false, todoId: '', todoTitle: '' });
    } catch (error) {
      showNotification('Failed to delete todo', 'error');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, todoId: '', todoTitle: '' });
  };

  const handleToggleStatus = async (todoId: string) => {
    try {
      await toggleStatusMutation.mutateAsync(todoId);
      showNotification('Todo status updated!', 'success');
    } catch (error) {
      showNotification('Failed to update todo status', 'error');
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setNotification({ open: true, message, severity });
  };

  const handleNotificationClose = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Loading states
  const isFormLoading =
    createTodoMutation.isPending || updateTodoMutation.isPending;
  const isDeleteLoading = deleteTodoMutation.isPending;

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box pt={0} pb={{ xs: 1, sm: 1 }}>
          {/* Header */}
          <Box
            mb={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h4" component="h1">
              Todos
            </Typography>
          </Box>

          {/* Filters */}
          <TodoFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            projects={projects}
          />

          {/* Todo List */}
          <TodoList
            todos={todos}
            isLoading={todosLoading}
            error={todosError?.message || null}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEditTodo}
            onDelete={handleDeleteClick}
            onViewDetails={handleViewDetails}
            onCreateSubtask={handleCreateSubtask}
            totalPages={totalPages}
            currentPage={filters.page || 1}
            onPageChange={handlePageChange}
          />

          {/* Floating Action Button - show on mobile, desktop handles this via footer FAB */}
          {isMobile && (
            <Fab
              color="primary"
              aria-label="add todo"
              onClick={handleCreateTodo}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
              }}
            >
              <AddIcon />
            </Fab>
          )}

          {/* Todo Form Dialog */}
          <TodoForm
            open={isFormOpen}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
            todo={editingTodo}
            parentTodoId={parentTodoForSubtask?.id}
            projects={projects}
            isLoading={isFormLoading}
          />

          {/* Todo Detail View Dialog */}
          <TodoDetailView
            open={Boolean(detailViewTodo)}
            onClose={handleDetailViewClose}
            todo={detailViewTodo}
            onEdit={handleEditTodo}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
            projects={projects}
          />

          {/* Subtask Creation Dialog */}
          {parentTodoForSubtask && (
            <SubtaskCreationDialog
              open={showSubtaskCreationDialog}
              onClose={handleSubtaskCreationDialogClose}
              parentTodo={parentTodoForSubtask}
              projects={projects}
              onManualSubtaskCreate={handleManualSubtaskCreate}
              isCreatingSubtask={createSubtaskMutation.isPending}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={deleteConfirm.open}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Delete Todo"
            message={`Are you sure you want to delete "${deleteConfirm.todoTitle}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            isLoading={isDeleteLoading}
            severity="error"
          />

          {/* Notification Snackbar */}
          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={handleNotificationClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert
              onClose={handleNotificationClose}
              severity={notification.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </AppLayout>
  );
};
