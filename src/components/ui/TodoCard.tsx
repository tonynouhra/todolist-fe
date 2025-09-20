import React, { useState } from 'react';
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
import { useSubtaskCount } from '../../hooks/useTodos';

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

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewDetails,
  onCreateSubtask,
  isLoading = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const subtaskCount = useSubtaskCount(todo.id);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(todo);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(todo.id);
    handleMenuClose();
  };

  const handleViewDetails = () => {
    onViewDetails?.(todo);
    handleMenuClose();
  };

  const handleCreateSubtask = () => {
    onCreateSubtask?.(todo);
    handleMenuClose();
  };

  const isOverdue =
    todo.due_date && isAfter(new Date(), parseISO(todo.due_date));
  const isDone = todo.status === 'done';

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
                label={statusLabels[todo.status]}
                sx={{
                  backgroundColor: statusColors[todo.status],
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />

              <Chip
                size="small"
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
                  size="small"
                  icon={<ScheduleIcon />}
                  label={format(parseISO(todo.due_date), 'MMM dd, yyyy')}
                  color={isOverdue && !isDone ? 'error' : 'default'}
                  variant={isOverdue && !isDone ? 'filled' : 'outlined'}
                />
              )}

              {subtaskCount > 0 && (
                <Chip
                  size="small"
                  icon={<SubtaskIcon />}
                  label={`${subtaskCount} subtasks`}
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>

            {/* Action buttons for subtasks */}
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
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
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
    </Card>
  );
};
