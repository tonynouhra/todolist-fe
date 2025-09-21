import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  AutoAwesome as MagicIcon,
  Description as FileIcon,
  EditNote as EditIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { AppLayout } from '../../components/layout';
import { AIChatInterface } from '../../components/ai';
import { useAIAvailability } from '../../hooks/useAI';

export const AIPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [createdTodosCount, setCreatedTodosCount] = useState(0);

  const { isAvailable, isLoading, error, serviceName } = useAIAvailability();

  const handleTodoCreated = () => {
    setCreatedTodosCount((prev) => prev + 1);
  };

  const features = [
    {
      icon: <MagicIcon color="primary" />,
      title: 'Generate Subtasks',
      description: 'Break down complex tasks into manageable steps',
      example: 'Break down "Plan wedding" into subtasks',
    },
    {
      icon: <FileIcon color="secondary" />,
      title: 'Analyze Files',
      description: 'Extract actionable tasks from documents',
      example: 'Upload meeting notes to extract action items',
    },
    {
      icon: <EditIcon color="success" />,
      title: 'Improve Descriptions',
      description: 'Make your task descriptions clearer and more detailed',
      example: 'Make this task clearer: "Fix the thing"',
    },
    {
      icon: <CheckIcon color="info" />,
      title: 'Create Todo Lists',
      description: 'Generate comprehensive task lists from natural language',
      example: 'Create a todo list for moving to a new house',
    },
  ];

  return (
    <AppLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <AIIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="h1">
              AI Assistant
            </Typography>
            {!isLoading && (
              <Chip
                label={isAvailable ? `${serviceName} Ready` : 'Unavailable'}
                color={isAvailable ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Your intelligent task management companion powered by AI
          </Typography>
          {createdTodosCount > 0 && (
            <Chip
              label={`${createdTodosCount} todos created this session`}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* AI Service Status */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            AI service is currently unavailable. You can still use the chat
            interface to explore features, but AI functions won't work until the
            service is restored.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Chat Interface */}
          <Grid item xs={12} md={8}>
            <AIChatInterface
              height={isMobile ? '500px' : '700px'}
              onTodoCreated={handleTodoCreated}
            />
          </Grid>

          {/* Features Panel */}
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Capabilities Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Capabilities
                  </Typography>
                  <List dense>
                    {features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {feature.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {feature.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {feature.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* Examples Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Try These Examples
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {features.map((feature, index) => (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          "{feature.example}"
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pro Tips
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="📎 Drag & Drop"
                        secondary="Drop files directly into the chat to analyze them"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="⚡ Quick Actions"
                        secondary="Use the suggested prompts below the input field"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="✏️ Edit Before Saving"
                        secondary="Review and modify AI suggestions before creating todos"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="🔄 Iterative Refinement"
                        secondary="Ask follow-up questions to improve results"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  );
};
