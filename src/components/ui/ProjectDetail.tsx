import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Project } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';

interface ProjectDetailProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onEdit,
  onDelete,
  onBack,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(project);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(project);
  };

  // Use project data directly instead of separate stats API
  const totalTodos = project.todo_count || 0;
  const completedTodos = project.completed_todo_count || 0;
  const inProgressTodos = Math.max(0, totalTodos - completedTodos); // Approximate

  const completionPercentage = totalTodos
    ? Math.round((completedTodos / totalTodos) * 100)
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={onBack} aria-label="go back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {project.name}
          </Typography>
        </Box>
        <IconButton onClick={handleMenuClick} aria-label="project actions">
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Project Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
          <Box flex={1}>
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {project.description || 'No description provided.'}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Created {formatDistanceToNow(new Date(project.created_at))} ago
                ({format(new Date(project.created_at), 'PPP')})
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Last updated {formatDistanceToNow(new Date(project.updated_at))}{' '}
                ago
              </Typography>
            </Box>
          </Box>

          {totalTodos > 0 && (
            <Box minWidth={{ md: 300 }}>
              <Typography variant="h6" gutterBottom>
                Progress Overview
              </Typography>
              <Box mb={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">Completion Rate</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {completionPercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completionPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Statistics Cards */}
      {totalTodos > 0 && (
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
          }}
          gap={2}
          mb={3}
        >
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AssignmentIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {totalTodos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {completedTodos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ScheduleIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {inProgressTodos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Project
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Project
        </MenuItem>
      </Menu>
    </Box>
  );
};
