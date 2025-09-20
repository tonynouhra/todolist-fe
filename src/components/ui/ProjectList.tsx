import React from 'react';
import { Box, Typography, Alert, Skeleton } from '@mui/material';
import { ProjectCardWithStats } from './ProjectCardWithStats';
import { Project } from '../../types';

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  error?: string | null;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading = false,
  error,
  onEdit,
  onDelete,
  onClick,
}) => {
  if (loading) {
    return (
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
        gap={3}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={200}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={8}
        textAlign="center"
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No projects found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first project to get started organizing your todos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
      gap={3}
    >
      {projects.map((project) => (
        <ProjectCardWithStats
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </Box>
  );
};
