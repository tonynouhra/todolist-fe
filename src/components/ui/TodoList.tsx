import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
} from '@mui/material';
import { TodoCard } from './TodoCard';
import { Todo } from '../../types';

interface TodoListProps {
  todos: Todo[];
  isLoading?: boolean;
  error?: string | null;
  onToggleStatus: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (todo: Todo) => void;
  onCreateSubtask?: (parentTodo: Todo) => void;
  // Pagination props
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  isLoading = false,
  error = null,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewDetails,
  onCreateSubtask,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
}) => {
  if (isLoading && todos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (todos.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No todos found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first todo to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2}>
        {todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            onCreateSubtask={onCreateSubtask}
            isLoading={isLoading}
          />
        ))}
      </Stack>

      {totalPages > 1 && onPageChange && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};
