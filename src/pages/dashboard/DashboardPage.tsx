import React from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assignment as TodoIcon,
  Folder as ProjectIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { AppLayout } from '../../components/layout';
import { useTodos } from '../../hooks/useTodos';
import { useProjects } from '../../hooks/useProjects';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" component="div" sx={{ color }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.7, fontSize: '2rem' }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { user } = useUser();

  // Fetch todos and projects data
  const {
    data: todosData,
    isLoading: todosLoading,
    error: todosError,
  } = useTodos();
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects();

  const isLoading = todosLoading || projectsLoading;
  const hasError = todosError || projectsError;

  // Calculate stats from the data
  const totalTodos = todosData?.total || 0;
  const completedTodos =
    todosData?.data?.filter((todo) => todo.status === 'done').length || 0;
  const pendingTodos = totalTodos - completedTodos;
  const totalProjects = projectsData?.total || 0;

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box pt={0} pb={{ xs: 1, sm: 1 }}>
          <Box mb={2}>
            <Typography variant="h4" component="h1">
              Welcome back, {user?.firstName || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Here's an overview of your tasks and projects
            </Typography>
          </Box>

          {isLoading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {hasError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load dashboard data. Please try refreshing the page.
            </Alert>
          )}

          {!isLoading && !hasError && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 3,
              }}
            >
              <StatCard
                title="Total Todos"
                value={totalTodos}
                icon={<TodoIcon />}
                color="#1976d2"
              />
              <StatCard
                title="Completed"
                value={completedTodos}
                icon={<CompletedIcon />}
                color="#2e7d32"
              />
              <StatCard
                title="Pending"
                value={pendingTodos}
                icon={<PendingIcon />}
                color="#ed6c02"
              />
              <StatCard
                title="Projects"
                value={totalProjects}
                icon={<ProjectIcon />}
                color="#9c27b0"
              />
            </Box>
          )}

          {!isLoading && !hasError && (
            <Box mt={4}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 3,
                }}
              >
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Todos
                  </Typography>
                  {todosData?.data && todosData.data.length > 0 ? (
                    <Box>
                      {todosData.data.slice(0, 5).map((todo) => (
                        <Box
                          key={todo.id}
                          sx={{
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {todo.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Status: {todo.status} • Priority: {todo.priority}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No todos yet. Create your first todo to get started!
                    </Typography>
                  )}
                </Paper>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Projects
                  </Typography>
                  {projectsData?.data && projectsData.data.length > 0 ? (
                    <Box>
                      {projectsData.data.slice(0, 5).map((project) => (
                        <Box
                          key={project.id}
                          sx={{
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {project.name}
                          </Typography>
                          {project.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {project.description}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No projects yet. Create your first project to organize
                      your todos!
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </AppLayout>
  );
};
