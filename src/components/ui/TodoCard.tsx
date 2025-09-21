import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Button,
  Popover,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  SmartToy as AIIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  TaskAlt as SubtaskIcon,
} from '@mui/icons-material';
import { Todo } from '../../types';
import { format, isAfter, parseISO } from 'date-fns';
import { useSubtaskCount, useUpdateTodo } from '../../hooks/useTodos';

interface TodoCardProps {
  todo: Todo;
  onToggleStatus: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (todo: Todo) => void;
  onCreateSubtask?: (parentTodo: Todo) => void;
  isLoading?: boolean;
}

const priorityColors = {
  1: '#4caf50',
  2: '#8bc34a',
  3: '#ff9800',
  4: '#f44336',
  5: '#d32f2f',
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

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewDetails,
  onCreateSubtask,
  isLoading = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(
    null
  );
  const [dueDateAnchor, setDueDateAnchor] = useState<HTMLElement | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [localTodo, setLocalTodo] = useState(todo);

  const updateTodoMutation = useUpdateTodo();
  const isUpdating = updateTodoMutation.isPending;
  const subtaskCount = useSubtaskCount(todo.id);

  useEffect(() => {
    setLocalTodo(todo);
  }, [todo]);

  useEffect(() => {
    if (localTodo.due_date) {
      setDueDateInput(localTodo.due_date.split('T')[0]);
    } else {
      setDueDateInput('');
    }
  }, [localTodo.due_date]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    onEdit(todo);
    closeMenu();
  };

  const handleDelete = () => {
    onDelete(todo.id);
    closeMenu();
  };

  const handleViewDetails = () => {
    onViewDetails?.(todo);
    closeMenu();
  };

  const handleCreateSubtask = () => {
    onCreateSubtask?.(todo);
    closeMenu();
  };

  const handleStatusChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusAnchor(event.currentTarget);
  };

  const handlePriorityChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setPriorityAnchor(event.currentTarget);
  };

  const handleDueDateChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setDueDateAnchor(event.currentTarget);
  };

  const updateTodoField = async (
    displayPayload: Partial<Todo>,
    apiOverrides?: Record<string, unknown>
  ) => {
    setLocalTodo((prev) => ({ ...prev, ...displayPayload }));
    const payloadToSend = apiOverrides
      ? { ...displayPayload, ...apiOverrides }
      : displayPayload;
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        ...payloadToSend,
      });
    } catch (error) {
      console.error('Failed to update todo', error);
      setLocalTodo(todo);
    }
  };

  const handleStatusSelect = async (newStatus: Todo['status']) => {
    if (newStatus === localTodo.status) {
      setStatusAnchor(null);
      return;
    }
    setStatusAnchor(null);
    const completed_at =
      newStatus === 'done' ? new Date().toISOString() : undefined;
    await updateTodoField({ status: newStatus, completed_at });
  };

  const handlePrioritySelect = async (newPriority: Todo['priority']) => {
    if (newPriority === localTodo.priority) {
      setPriorityAnchor(null);
      return;
    }
    setPriorityAnchor(null);
    await updateTodoField({ priority: newPriority });
  };

  const handleDueDateSave = async () => {
    if (!dueDateInput) {
      setDueDateAnchor(null);
      return;
    }
    const nextDueDate = `${dueDateInput}T00:00:00Z`;
    setDueDateAnchor(null);
    await updateTodoField({ due_date: nextDueDate });
  };

  const handleDueDateClear = async () => {
    setDueDateAnchor(null);
    setDueDateInput('');
    await updateTodoField({ due_date: undefined }, { due_date: null });
  };

  const isOverdue =
    localTodo.due_date && isAfter(new Date(), parseISO(localTodo.due_date));
  const isDone = localTodo.status === 'done';

  return (
    <Card
      elevation={2}
      sx={{
        opacity: isLoading ? 0.7 : 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
        },
        border: isDone ? '2px solid #4caf50' : 'none',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Checkbox
            checked={isDone}
            onChange={() => onToggleStatus(todo.id)}
            disabled={isLoading}
            sx={{
              mt: -1,
              '&.Mui-checked': {
                color: '#4caf50',
              },
            }}
          />

          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  textDecoration: isDone ? 'line-through' : 'none',
                  color: isDone ? 'text.secondary' : 'text.primary',
                  wordBreak: 'break-word',
                }}
              >
                {todo.title}
              </Typography>

              {todo.ai_generated && (
                <Tooltip title="AI Generated">
                  <AIIcon color="primary" fontSize="small" />
                </Tooltip>
              )}
            </Box>

            {todo.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  textDecoration: isDone ? 'line-through' : 'none',
                  wordBreak: 'break-word',
                }}
              >
                {todo.description}
              </Typography>
            )}

            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
              <Chip
                size="small"
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
                size="small"
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
                size="small"
                icon={<ScheduleIcon />}
                label={
                  localTodo.due_date
                    ? format(parseISO(localTodo.due_date), 'MMM dd, yyyy')
                    : 'Set Due Date'
                }
                color={
                  localTodo.due_date && isOverdue && !isDone
                    ? 'error'
                    : 'default'
                }
                variant={isOverdue && !isDone ? 'filled' : 'outlined'}
                clickable
                onClick={handleDueDateChipClick}
              />

              {subtaskCount > 0 && (
                <Chip
                  size="small"
                  icon={<SubtaskIcon />}
                  label={`${subtaskCount} subtasks`}
                  variant="outlined"
                  color="primary"
                  clickable={Boolean(onViewDetails)}
                  onClick={() => onViewDetails?.(todo)}
                />
              )}
            </Box>

            {(onViewDetails || onCreateSubtask) && (
              <Box display="flex" gap={1} mt={2}>
                {onViewDetails && subtaskCount > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={handleViewDetails}
                    disabled={isLoading}
                  >
                    View Details
                  </Button>
                )}
                {onCreateSubtask && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleCreateSubtask}
                    disabled={isLoading}
                  >
                    Add Subtask
                  </Button>
                )}
              </Box>
            )}
          </Box>

          <IconButton
            onClick={handleMenuClick}
            disabled={isLoading}
            size="small"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {onViewDetails && subtaskCount > 0 && (
          <MenuItem onClick={handleViewDetails}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}

        {onCreateSubtask && (
          <MenuItem onClick={handleCreateSubtask}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Subtask</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
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
        anchorEl={priorityAnchor}
        open={Boolean(priorityAnchor)}
        onClose={() => setPriorityAnchor(null)}
      >
        {Object.entries(priorityLabels).map(([value, label]) => {
          const numericValue = Number(value) as Todo['priority'];
          return (
            <MenuItem
              key={value}
              selected={localTodo.priority === numericValue}
              onClick={() => handlePrioritySelect(numericValue)}
              disabled={isUpdating}
            >
              {label}
            </MenuItem>
          );
        })}
      </Menu>

      <Popover
        anchorEl={dueDateAnchor}
        open={Boolean(dueDateAnchor)}
        onClose={() => setDueDateAnchor(null)}
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
    </Card>
  );
};
