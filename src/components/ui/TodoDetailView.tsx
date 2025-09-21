import React, { useEffect, useState } from 'react';
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
  Menu,
  MenuItem,
  Popover,
  TextField,
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
import {
  useSubtodos,
  useCreateSubtask,
  useUpdateTodo,
} from '../../hooks/useTodos';
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
  onViewDetails?: (todo: Todo) => void;
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
  onViewDetails,
}) => {
  const [showSubtaskCreationDialog, setShowSubtaskCreationDialog] =
    useState(false);
  const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [priorityAnchorEl, setPriorityAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [dueDateAnchorEl, setDueDateAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [dueDateInput, setDueDateInput] = useState('');
  const [localTodo, setLocalTodo] = useState<Todo | null>(todo);

  const [subtaskStack, setSubtaskStack] = useState<Todo[]>([]);

  const currentTodoId = subtaskStack.length
    ? subtaskStack[subtaskStack.length - 1].id
    : todo?.id || '';

  const {
    data: subtasksData,
    isLoading: subtasksLoading,
    error: subtasksError,
  } = useSubtodos(currentTodoId, 1, 50);

  const createSubtaskMutation = useCreateSubtask();
  const updateTodoMutation = useUpdateTodo();
  const isUpdating = updateTodoMutation.isPending;

  useEffect(() => {
    if (subtaskStack.length === 0) {
      setLocalTodo(todo);
    }
  }, [todo, subtaskStack.length]);

  useEffect(() => {
    if (!open) {
      setSubtaskStack([]);
      setLocalTodo(todo);
    }
  }, [open, todo]);

  useEffect(() => {
    if (localTodo?.due_date) {
      setDueDateInput(localTodo.due_date.split('T')[0]);
    } else {
      setDueDateInput('');
    }
  }, [localTodo?.due_date]);

  if (!localTodo) return null;

  const isOverdue =
    localTodo.due_date && isAfter(new Date(), parseISO(localTodo.due_date));
  const isDone = localTodo.status === 'done';
  const dueDateColor =
    localTodo.due_date && isOverdue && !isDone ? 'error' : 'default';
  const dueDateVariant =
    localTodo.due_date && isOverdue && !isDone ? 'filled' : 'outlined';

  const handleCreateSubtask = () => {
    setShowSubtaskCreationDialog(true);
  };

  const handleManualSubtaskCreate = async (subtaskData: any) => {
    try {
      await createSubtaskMutation.mutateAsync({
        parentId: localTodo.id,
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

  const handleViewSubtaskDetail = (subtask: Todo) => {
    setSubtaskStack((prev) => [...prev, subtask]);
    setLocalTodo(subtask);
  };

  const handleBackToParent = () => {
    if (subtaskStack.length === 0) return;
    setSubtaskStack((prev) => {
      const updated = [...prev];
      updated.pop();
      const newCurrent = updated.length ? updated[updated.length - 1] : todo;
      setLocalTodo(newCurrent || null);
      return updated;
    });
  };

  const handleStatusChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const handlePriorityChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setPriorityAnchorEl(event.currentTarget);
  };

  const handleDueDateChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setDueDateAnchorEl(event.currentTarget);
  };

  const closeMenus = () => {
    setStatusAnchorEl(null);
    setPriorityAnchorEl(null);
  };

  const handleStatusSelect = async (newStatus: Todo['status']) => {
    if (!localTodo || newStatus === localTodo.status) {
      closeMenus();
      return;
    }

    const previousTodo = localTodo;
    setLocalTodo({
      ...previousTodo,
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : undefined,
    });
    closeMenus();

    try {
      await updateTodoMutation.mutateAsync({
        id: previousTodo.id,
        status: newStatus,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      setLocalTodo(previousTodo);
    }
  };

  const handlePrioritySelect = async (newPriority: Todo['priority']) => {
    if (!localTodo || newPriority === localTodo.priority) {
      closeMenus();
      return;
    }

    const previousTodo = localTodo;
    setLocalTodo({
      ...previousTodo,
      priority: newPriority,
    });
    setPriorityAnchorEl(null);

    try {
      await updateTodoMutation.mutateAsync({
        id: previousTodo.id,
        priority: newPriority,
      });
    } catch (error) {
      console.error('Failed to update priority:', error);
      setLocalTodo(previousTodo);
    }
  };

  const handleDueDateSave = async () => {
    if (!localTodo || !dueDateInput) return;

    const previousTodo = localTodo;
    const nextDueDate = dueDateInput ? `${dueDateInput}T00:00:00Z` : null;

    setLocalTodo({
      ...previousTodo,
      due_date: nextDueDate || undefined,
    });
    setDueDateAnchorEl(null);

    try {
      await updateTodoMutation.mutateAsync({
        id: previousTodo.id,
        due_date: nextDueDate as unknown as string,
      });
    } catch (error) {
      console.error('Failed to update due date:', error);
      setLocalTodo(previousTodo);
      setDueDateInput(
        previousTodo.due_date ? previousTodo.due_date.split('T')[0] : ''
      );
    }
  };

  const handleDueDateClear = async () => {
    if (!localTodo) return;

    const previousTodo = localTodo;
    setLocalTodo({
      ...previousTodo,
      due_date: undefined,
    });
    setDueDateInput('');
    setDueDateAnchorEl(null);

    try {
      await updateTodoMutation.mutateAsync({
        id: previousTodo.id,
        due_date: null as unknown as string,
      });
    } catch (error) {
      console.error('Failed to clear due date:', error);
      setLocalTodo(previousTodo);
      setDueDateInput(
        previousTodo.due_date ? previousTodo.due_date.split('T')[0] : ''
      );
    }
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
            <Box display="flex" alignItems="center" gap={1}>
              {subtaskStack.length > 0 && (
                <Button size="small" onClick={handleBackToParent}>
                  Back
                </Button>
              )}
              <Typography variant="h6">Todo Details</Typography>
            </Box>
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
                  {localTodo.title}
                </Typography>
                {localTodo.ai_generated && (
                  <Chip
                    icon={<AIIcon />}
                    label="AI Generated"
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
              {localTodo.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {localTodo.description}
                </Typography>
              )}

              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  label={statusLabels[localTodo.status]}
                  sx={{
                    backgroundColor: statusColors[localTodo.status],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                  clickable
                  onClick={handleStatusChipClick}
                />

                <Chip
                  icon={<FlagIcon />}
                  label={priorityLabels[localTodo.priority]}
                  sx={{
                    backgroundColor: priorityColors[localTodo.priority],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                  clickable
                  onClick={handlePriorityChipClick}
                />

                <Chip
                  icon={<ScheduleIcon />}
                  label={
                    localTodo.due_date
                      ? format(parseISO(localTodo.due_date), 'MMM dd, yyyy')
                      : 'Set Due Date'
                  }
                  color={dueDateColor}
                  variant={dueDateVariant}
                  clickable
                  onClick={handleDueDateChipClick}
                />
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(localTodo)}
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
                      onViewDetails={handleViewSubtaskDetail}
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
        parentTodo={localTodo}
        projects={projects}
        onManualSubtaskCreate={handleManualSubtaskCreate}
        isCreatingSubtask={createSubtaskMutation.isPending}
      />

      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={closeMenus}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <MenuItem
            key={value}
            selected={localTodo.status === value}
            onClick={() => handleStatusSelect(value as Todo['status'])}
            disabled={isUpdating}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={priorityAnchorEl}
        open={Boolean(priorityAnchorEl)}
        onClose={() => setPriorityAnchorEl(null)}
      >
        {Object.entries(priorityLabels).map(([value, label]) => {
          const priorityValue = Number(value) as Todo['priority'];
          return (
            <MenuItem
              key={value}
              selected={localTodo.priority === priorityValue}
              onClick={() => handlePrioritySelect(priorityValue)}
              disabled={isUpdating}
            >
              {label}
            </MenuItem>
          );
        })}
      </Menu>

      <Popover
        anchorEl={dueDateAnchorEl}
        open={Boolean(dueDateAnchorEl)}
        onClose={() => setDueDateAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box p={2} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Due Date"
            type="date"
            value={dueDateInput}
            onChange={(event) => setDueDateInput(event.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleDueDateSave}
              disabled={isUpdating || !dueDateInput}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDueDateClear}
              disabled={isUpdating || (!localTodo.due_date && !dueDateInput)}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};
