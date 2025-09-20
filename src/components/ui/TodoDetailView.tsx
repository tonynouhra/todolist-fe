import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  SmartToy as AIIcon,
  TaskAlt as SubtaskIcon,
} from '@mui/icons-material';
import { Todo } from '../../types';
import { format, isAfter, parseISO } from 'date-fns';
import { useSubtodos, useCreateSubtask } from '../../hooks/useTodos';
import { TodoCard } from './TodoCard';
import { SubtaskCreationDialog } from './SubtaskCreationDialog';

interface TodoDetailViewProps {
  open: boolean;
  onClose: () => void;
  todo: Todo | null;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  projects?: any[];
}

const priorityColors = {
  1: '#4caf50', // Green - Low
  2: '#8bc34a', // Light Green - Low-Medium
  3: '#ff9800', // Orange - Medium
  4: '#f44336', // Red - High
  5: '#d32f2f', // Dark Red - Critical
};

const priorityLabels = {
  1: 'Low',
  2: 'Low-Medium',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

const statusColors = {
  todo: '#757575',
  in_progress: '#2196f3',
  done: '#4caf50',
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const TodoDetailView: React.FC<TodoDetailViewProps> = ({
  open,
  onClose,
  todo,
  onEdit,
  onDelete,
  onToggleStatus,
  projects = [],
}) => {
  const [showSubtaskCreationDialog, setShowSubtaskCreationDialog] =
    useState(false);

  const {
    data: subtasksData,
    isLoading: subtasksLoading,
    error: subtasksError,
  } = useSubtodos(todo?.id || '', 1, 50);

  const createSubtaskMutation = useCreateSubtask();

  if (!todo) return null;

  const isOverdue =
    todo.due_date && isAfter(new Date(), parseISO(todo.due_date));
  const isDone = todo.status === 'done';

  const handleCreateSubtask = () => {
    setShowSubtaskCreationDialog(true);
  };

  const handleManualSubtaskCreate = async (subtaskData: any) => {
    try {
      await createSubtaskMutation.mutateAsync({
        parentId: todo.id,
        subtask: subtaskData,
      });
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  const handleSubtaskDelete = (subtaskId: string) => {
    onDelete(subtaskId);
  };

  const handleSubtaskEdit = (subtask: Todo) => {
    onEdit(subtask);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Todo Details</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Main Todo Information */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="h5" component="h1" sx={{ flex: 1 }}>
                  {todo.title}
                </Typography>
                {todo.ai_generated && (
                  <Chip
                    icon={<AIIcon />}
                    label="AI Generated"
                    color="primary"
                    size="small"
                  />
                )}
              </Box>

              {todo.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {todo.description}
                </Typography>
              )}

              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  label={statusLabels[todo.status]}
                  sx={{
                    backgroundColor: statusColors[todo.status],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />

                <Chip
                  icon={<FlagIcon />}
                  label={priorityLabels[todo.priority]}
                  sx={{
                    backgroundColor: priorityColors[todo.priority],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />

                {todo.due_date && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={format(parseISO(todo.due_date), 'MMM dd, yyyy')}
                    color={isOverdue && !isDone ? 'error' : 'default'}
                    variant={isOverdue && !isDone ? 'filled' : 'outlined'}
                  />
                )}
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(todo)}
                  size="small"
                >
                  Edit Todo
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateSubtask}
                  size="small"
                  color="primary"
                >
                  Add Subtask
                </Button>
              </Box>
            </Paper>

            <Divider />

            {/* Subtasks Section */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SubtaskIcon color="primary" />
                <Typography variant="h6">
                  Subtasks ({subtasksData?.total || 0})
                </Typography>
              </Box>

              {subtasksLoading && (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress />
                </Box>
              )}

              {subtasksError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to load subtasks
                </Alert>
              )}

              {subtasksData?.data && subtasksData.data.length > 0 ? (
                <Stack spacing={2}>
                  {subtasksData.data.map((subtask) => (
                    <TodoCard
                      key={subtask.id}
                      todo={subtask}
                      onToggleStatus={onToggleStatus}
                      onEdit={handleSubtaskEdit}
                      onDelete={() => handleSubtaskDelete(subtask.id)}
                      isLoading={false}
                    />
                  ))}
                </Stack>
              ) : (
                !subtasksLoading && (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary">
                      No subtasks yet. Create one manually or use AI to generate
                      suggestions.
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Subtask Creation Dialog */}
      <SubtaskCreationDialog
        open={showSubtaskCreationDialog}
        onClose={() => setShowSubtaskCreationDialog(false)}
        parentTodo={todo}
        projects={projects}
        onManualSubtaskCreate={handleManualSubtaskCreate}
        isCreatingSubtask={createSubtaskMutation.isPending}
      />
    </>
  );
};
