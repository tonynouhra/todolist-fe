import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppLayout } from '../../components/layout';
import { ProjectList, ProjectDetail } from '../../components/ui';
import { ProjectForm } from '../../components/forms';
import { ConfirmDialog } from '../../components/common';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../../hooks/useProjects';
import { Project } from '../../types';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../../services/projectService';

export const ProjectsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Queries
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects({ search: searchTerm });

  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];

  // Get todos for the selected project (we'll implement this later if needed)
  // const { data: todosData, isLoading: todosLoading } = useTodos(
  //   selectedProject ? { project_id: selectedProject.id } : {}
  // );

  // Mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
  };

  const handleFormSubmit = async (data: CreateProjectRequest) => {
    try {
      if (editingProject) {
        await updateProjectMutation.mutateAsync({
          id: editingProject.id,
          ...data,
        } as UpdateProjectRequest);
        showNotification('Project updated successfully', 'success');
      } else {
        await createProjectMutation.mutateAsync(data);
        showNotification('Project created successfully', 'success');
      }
      setFormOpen(false);
      setEditingProject(null);
    } catch (error) {
      showNotification(
        editingProject
          ? 'Failed to update project'
          : 'Failed to create project',
        'error'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      showNotification('Project deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);

      // If we're viewing the deleted project, go back to list
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(null);
      }
    } catch (error) {
      showNotification('Failed to delete project', 'error');
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const isLoading =
    projectsLoading ||
    createProjectMutation.isPending ||
    updateProjectMutation.isPending ||
    deleteProjectMutation.isPending;

  if (selectedProject) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box pt={0} pb={{ xs: 1, sm: 1 }}>
            <ProjectDetail
              project={selectedProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onBack={handleBackToList}
            />

            {/* Project Form Dialog */}
            <ProjectForm
              open={formOpen}
              onClose={() => setFormOpen(false)}
              onSubmit={handleFormSubmit}
              project={editingProject}
              loading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
              open={deleteDialogOpen}
              title="Delete Project"
              message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
              onConfirm={handleConfirmDelete}
              onClose={() => setDeleteDialogOpen(false)}
              confirmText="Delete"
              cancelText="Cancel"
              severity="error"
            />

            {/* Notification Snackbar */}
            <Snackbar
              open={notification.open}
              autoHideDuration={6000}
              onClose={handleCloseNotification}
            >
              <Alert
                onClose={handleCloseNotification}
                severity={notification.severity}
                sx={{ width: '100%' }}
              >
                {notification.message}
              </Alert>
            </Snackbar>
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box pt={0} pb={{ xs: 1, sm: 1 }}>
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h4" component="h1">
              Projects
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              New Project
            </Button>
          </Box>

          {/* Search */}
          <Box mb={3}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {/* Project List */}
          <ProjectList
            projects={projects}
            loading={projectsLoading}
            error={projectsError?.message || null}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onClick={handleProjectClick}
          />

          {/* Floating Action Button for Mobile */}
          <Fab
            color="primary"
            aria-label="add project"
            onClick={handleCreateProject}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              display: { xs: 'flex', sm: 'none' },
            }}
          >
            <AddIcon />
          </Fab>

          {/* Project Form Dialog */}
          <ProjectForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSubmit={handleFormSubmit}
            project={editingProject}
            loading={isLoading}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={deleteDialogOpen}
            title="Delete Project"
            message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onClose={() => setDeleteDialogOpen(false)}
            confirmText="Delete"
            cancelText="Cancel"
            severity="error"
          />

          {/* Notification Snackbar */}
          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={handleCloseNotification}
          >
            <Alert
              onClose={handleCloseNotification}
              severity={notification.severity}
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
