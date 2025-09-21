import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Schedule as TimeIcon,
  Flag as PriorityIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useGenerateTodoSuggestions } from '../../hooks/useAI';
import { useProjects } from '../../hooks/useProjects';
import { useCreateTodo } from '../../hooks/useTodos';
import { useNotification } from '../../contexts/NotificationContext';
import type { TodoSuggestionRequest, GeneratedTodo } from '../../types';

interface TodoSuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  existingTodos?: string[];
}

export const TodoSuggestionDialog: React.FC<TodoSuggestionDialogProps> = ({
  open,
  onClose,
  projectId: initialProjectId,
  existingTodos = [],
}) => {
  const [userInput, setUserInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjectId || ''
  );
  const [maxTodos, setMaxTodos] = useState(5);
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());

  const { data: projectsData } = useProjects();
  const generateSuggestions = useGenerateTodoSuggestions();
  const createTodo = useCreateTodo();
  const { showNotification } = useNotification();

  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      showNotification(
        'Please enter a description of what you want to accomplish',
        'warning'
      );
      return;
    }

    const request: TodoSuggestionRequest = {
      user_input: userInput,
      project_id: selectedProjectId || undefined,
      existing_todos: existingTodos,
      max_todos: maxTodos,
    };

    try {
      await generateSuggestions.mutateAsync(request);
      setSelectedTodos(new Set());
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const handleCreateSelectedTodos = async () => {
    const suggestions = generateSuggestions.data?.generated_todos;
    if (!suggestions || selectedTodos.size === 0) return;

    try {
      const promises = Array.from(selectedTodos).map((index) => {
        const todo = suggestions[index];
        return createTodo.mutateAsync({
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          project_id: selectedProjectId || undefined,
          ai_generated: true,
        });
      });

      await Promise.all(promises);
      showNotification(
        `Successfully created ${selectedTodos.size} todo${selectedTodos.size > 1 ? 's' : ''}`,
        'success'
      );
      onClose();
    } catch (error) {
      showNotification('Failed to create some todos', 'error');
      console.error('Failed to create todos:', error);
    }
  };

  const toggleTodoSelection = (index: number) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTodos(newSelected);
  };

  const selectAllTodos = () => {
    const suggestions = generateSuggestions.data?.generated_todos;
    if (!suggestions) return;

    setSelectedTodos(new Set(suggestions.map((_, index) => index)));
  };

  const clearAllSelections = () => {
    setSelectedTodos(new Set());
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'error';
      case 4:
        return 'warning';
      case 3:
        return 'primary';
      case 2:
        return 'info';
      case 1:
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 5:
        return 'Very High';
      case 4:
        return 'High';
      case 3:
        return 'Medium';
      case 2:
        return 'Low';
      case 1:
        return 'Very Low';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI Todo Suggestions
        <IconButton aria-label="close" onClick={onClose} sx={{ ml: 'auto' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <TextField
            label="What would you like to accomplish?"
            multiline
            rows={3}
            fullWidth
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your goals or tasks you need help organizing..."
            variant="outlined"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                label="Project"
              >
                <MenuItem value="">
                  <em>No Project</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Max Suggestions</InputLabel>
              <Select
                value={maxTodos}
                onChange={(e) => setMaxTodos(Number(e.target.value))}
                label="Max Suggestions"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={generateSuggestions.isPending || !userInput.trim()}
              startIcon={
                generateSuggestions.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <AIIcon />
                )
              }
              sx={{ minWidth: 150 }}
            >
              {generateSuggestions.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </Box>

          {generateSuggestions.error && (
            <Alert severity="error">
              Failed to generate suggestions. Please try again.
            </Alert>
          )}

          {generateSuggestions.data && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  Suggested Todos (
                  {generateSuggestions.data.generated_todos.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={selectAllTodos}
                    disabled={
                      selectedTodos.size ===
                      generateSuggestions.data.generated_todos.length
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={clearAllSelections}
                    disabled={selectedTodos.size === 0}
                  >
                    Clear
                  </Button>
                </Box>
              </Box>

              <Stack spacing={2}>
                {generateSuggestions.data.generated_todos.map(
                  (todo: GeneratedTodo, index: number) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: selectedTodos.has(index) ? 2 : 1,
                        borderColor: selectedTodos.has(index)
                          ? 'primary.main'
                          : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 1,
                        },
                      }}
                      onClick={() => toggleTodoSelection(index)}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {todo.title}
                            </Typography>
                            {todo.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {todo.description}
                              </Typography>
                            )}
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                mt: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Chip
                                icon={<PriorityIcon />}
                                label={getPriorityLabel(todo.priority)}
                                size="small"
                                color={getPriorityColor(todo.priority) as any}
                                variant="outlined"
                              />
                              {todo.estimated_time && (
                                <Chip
                                  icon={<TimeIcon />}
                                  label={todo.estimated_time}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {todo.category && (
                                <Chip
                                  icon={<CategoryIcon />}
                                  label={todo.category}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                          {selectedTodos.has(index) && (
                            <AddIcon color="primary" />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        {generateSuggestions.data && (
          <Button
            variant="contained"
            onClick={handleCreateSelectedTodos}
            disabled={selectedTodos.size === 0 || createTodo.isPending}
            startIcon={
              createTodo.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <AddIcon />
              )
            }
          >
            {createTodo.isPending
              ? 'Creating...'
              : `Create Selected (${selectedTodos.size})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
