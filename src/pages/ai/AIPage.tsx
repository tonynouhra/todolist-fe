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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Button,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  AutoAwesome as MagicIcon,
  Description as FileIcon,
  EditNote as EditIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

import { AppLayout } from '../../components/layout';
import { AIChatInterface } from '../../components/ai';
import { useAIChat } from '../../hooks/ai';
import { useAIAvailability } from '../../hooks/useAI';

export const AIPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [createdTodosCount, setCreatedTodosCount] = useState(0);
  const chat = useAIChat();

  // Fixed sticky position accounting for header height
  const headerHeight = isMobile ? 56 : 64;
  const topPadding = 16;
  const stickyTopOffset = `${headerHeight + topPadding}px`;
  const stickyMaxHeight = `calc(100vh - ${headerHeight + topPadding * 2}px)`;

  // Sidebar width constant (matches AppLayout)
  const sidebarWidth = 280;

  const { isAvailable, isLoading, error, modelName } = useAIAvailability();

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
        <Card sx={{ mb: 3, p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <AIIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            <Typography variant="h4" component="h1">
              AI Assistant
            </Typography>
            {!isLoading && (
              <Chip
                label={
                  isAvailable
                    ? `${modelName ?? 'AI Service'} Ready`
                    : 'Unavailable'
                }
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
        </Card>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            AI service is currently unavailable. You can still use the chat
            interface to explore features, but AI functions won't work until the
            service is restored.
          </Alert>
        )}

        <Grid
          container
          spacing={3}
          alignItems="stretch"
          sx={{
            flexWrap: { xs: 'wrap', md: 'nowrap' },
          }}
        >
          <Grid item xs={12} md={8} lg={8} xl={9} sx={{ display: 'flex' }}>
            <AIChatInterface
              chat={chat}
              height={isMobile ? '520px' : '720px'}
              onTodoCreated={handleTodoCreated}
            />
          </Grid>

          <Grid item xs={12} md={4} lg={4} xl={3} sx={{ display: 'flex' }}>
            <Stack spacing={3} sx={{ width: '100%' }}>
              <Card
                sx={{
                  flexGrow: 1,
                  position: { xs: 'static', md: 'sticky' },
                  top: { md: stickyTopOffset },
                  width: '100%',
                  maxHeight: { md: `calc(${stickyMaxHeight} / 2 - 12px)` },
                  overflowY: { md: 'auto' },
                  zIndex: 10,
                  transition: theme.transitions.create(['width'], {
                    duration: theme.transitions.duration.standard,
                  }),
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1.5}
                  >
                    <Typography variant="h6">Conversation History</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={chat.startNewSession}
                    >
                      New chat
                    </Button>
                  </Box>
                  {chat.sessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Start chatting with the assistant to see past
                      conversations here.
                    </Typography>
                  ) : (
                    <List dense sx={{ mt: 1 }}>
                      {chat.sessions.map((session) => (
                        <ListItem
                          key={session.id}
                          disablePadding
                          secondaryAction={
                            chat.sessions.length > 1 && (
                              <Tooltip title="Delete conversation">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    chat.deleteSession(session.id);
                                  }}
                                  sx={{
                                    opacity: 0.6,
                                    '&:hover': { opacity: 1 },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }
                        >
                          <ListItemButton
                            selected={session.id === chat.activeSessionId}
                            onClick={() => chat.switchSession(session.id)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemText
                              primary={session.title}
                              secondary={`${session.messageCount} message${
                                session.messageCount === 1 ? '' : 's'
                              } • ${formatDistanceToNow(session.updatedAt, {
                                addSuffix: true,
                              })}`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              <Card
                sx={{
                  position: { xs: 'static', md: 'sticky' },
                  top: {
                    md: `calc(${stickyTopOffset} + ${stickyMaxHeight} / 2 + 12px)`,
                  },
                  width: '100%',
                  maxHeight: { md: `calc(${stickyMaxHeight} / 2 - 12px)` },
                  overflowY: { md: 'auto' },
                  zIndex: 10,
                  transition: theme.transitions.create(['width'], {
                    duration: theme.transitions.duration.standard,
                  }),
                }}
              >
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
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? theme.palette.grey[900]
                              : theme.palette.background.default,
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
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
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
          </Grid>

          <Grid item xs={12} md={6}>
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
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  );
};
