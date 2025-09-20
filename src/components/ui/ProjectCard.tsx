import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { Project } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick: (project: Project) => void;
  stats?: {
    total_todos: number;
    completed_todos: number;
    in_progress_todos: number;
    pending_todos: number;
  };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onClick,
  stats,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit(project);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete(project);
  };

  const handleCardClick = () => {
    onClick(project);
  };

  const completionPercentage = stats?.total_todos
    ? Math.round((stats.completed_todos / stats.total_todos) * 100)
    : 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <FolderIcon color="primary" />
            <Typography variant="h6" component="h2" noWrap>
              {project.name}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            aria-label="project actions"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {project.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </Typography>
        )}

        {stats && (
          <Box mb={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.completed_todos}/{stats.total_todos} completed
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {stats && (
            <>
              <Chip
                label={`${stats.total_todos} total`}
                size="small"
                variant="outlined"
              />
              {stats.in_progress_todos > 0 && (
                <Chip
                  label={`${stats.in_progress_todos} in progress`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {stats.pending_todos > 0 && (
                <Chip
                  label={`${stats.pending_todos} pending`}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
            </>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Created {formatDistanceToNow(new Date(project.created_at))} ago
        </Typography>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};
