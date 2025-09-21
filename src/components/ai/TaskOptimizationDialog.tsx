import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Compare as CompareIcon,
  Check as CheckIcon,
  Lightbulb as ImprovementIcon,
} from '@mui/icons-material';
import { useOptimizeTask } from '../../hooks/useAI';
import { useUpdateTodo } from '../../hooks/useTodos';
import { useNotification } from '../../contexts/NotificationContext';
import type { TaskOptimizationRequest, Todo } from '../../types';

interface TaskOptimizationDialogProps {
  open: boolean;
  onClose: () => void;
  todo?: Todo;
  initialTitle?: string;
  initialDescription?: string;
}

type OptimizationType = 'description' | 'title' | 'both' | 'clarity' | 'detail';

export const TaskOptimizationDialog: React.FC<TaskOptimizationDialogProps> = ({
  open,
  onClose,
  todo,
  initialTitle = '',
  initialDescription = '',
}) => {
  const [optimizationType, setOptimizationType] =
    useState<OptimizationType>('both');
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [currentDescription, setCurrentDescription] =
    useState(initialDescription);
  const [context, setContext] = useState('');

  const optimizeTask = useOptimizeTask();
  const updateTodo = useUpdateTodo();
  const { showNotification } = useNotification();

  // Update form when todo changes
  useEffect(() => {
    if (todo) {
      setCurrentTitle(todo.title);
      setCurrentDescription(todo.description || '');
    } else {
      setCurrentTitle(initialTitle);
      setCurrentDescription(initialDescription);
    }
  }, [todo, initialTitle, initialDescription]);

  const handleOptimize = async () => {
    if (!currentTitle.trim() && !currentDescription.trim()) {
      showNotification(
        'Please provide a title or description to optimize',
        'warning'
      );
      return;
    }

    const request: TaskOptimizationRequest = {
      todo_id: todo?.id,
      current_title: currentTitle || undefined,
      current_description: currentDescription || undefined,
      optimization_type: optimizationType,
      context: context || undefined,
    };

    try {
      await optimizeTask.mutateAsync(request);
    } catch (error) {
      console.error('Failed to optimize task:', error);
    }
  };

  const handleApplyOptimization = async () => {
    const optimization = optimizeTask.data;
    if (!optimization || !todo) return;

    try {
      const updates: Partial<Todo> = {};

      if (optimization.optimized_title) {
        updates.title = optimization.optimized_title;
      }

      if (optimization.optimized_description) {
        updates.description = optimization.optimized_description;
      }

      await updateTodo.mutateAsync({
        id: todo.id,
        ...updates,
      });

      showNotification('Task optimized successfully!', 'success');
      onClose();
    } catch (error) {
      showNotification('Failed to apply optimization', 'error');
      console.error('Failed to update todo:', error);
    }
  };

  const getOptimizationTypeDescription = (type: OptimizationType) => {
    switch (type) {
      case 'title':
        return 'Improve only the task title for clarity and actionability';
      case 'description':
        return 'Enhance only the description with more detail and context';
      case 'both':
        return 'Optimize both title and description for maximum clarity';
      case 'clarity':
        return 'Focus on making the task clearer and easier to understand';
      case 'detail':
        return 'Add helpful details while keeping the task focused';
      default:
        return '';
    }
  };

  const optimization = optimizeTask.data;
  const hasChanges =
    optimization &&
    (optimization.optimized_title || optimization.optimized_description);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI Task Optimization
        <IconButton aria-label="close" onClick={onClose} sx={{ ml: 'auto' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <TextField
            label="Task Title"
            fullWidth
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="Enter the task title to optimize..."
          />

          <TextField
            label="Task Description"
            multiline
            rows={3}
            fullWidth
            value={currentDescription}
            onChange={(e) => setCurrentDescription(e.target.value)}
            placeholder="Enter the task description to optimize..."
          />

          <FormControl fullWidth>
            <InputLabel>Optimization Type</InputLabel>
            <Select
              value={optimizationType}
              onChange={(e) =>
                setOptimizationType(e.target.value as OptimizationType)
              }
              label="Optimization Type"
            >
              <MenuItem value="both">Both Title & Description</MenuItem>
              <MenuItem value="title">Title Only</MenuItem>
              <MenuItem value="description">Description Only</MenuItem>
              <MenuItem value="clarity">Focus on Clarity</MenuItem>
              <MenuItem value="detail">Add More Detail</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {getOptimizationTypeDescription(optimizationType)}
          </Typography>

          <TextField
            label="Additional Context (Optional)"
            multiline
            rows={2}
            fullWidth
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide any additional context that might help with optimization..."
          />

          <Button
            variant="contained"
            onClick={handleOptimize}
            disabled={
              optimizeTask.isPending ||
              (!currentTitle.trim() && !currentDescription.trim())
            }
            startIcon={
              optimizeTask.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <AIIcon />
              )
            }
            sx={{ alignSelf: 'flex-start' }}
          >
            {optimizeTask.isPending ? 'Optimizing...' : 'Optimize Task'}
          </Button>

          {optimizeTask.error && (
            <Alert severity="error">
              Failed to optimize task. Please try again.
            </Alert>
          )}

          {optimization && (
            <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CompareIcon color="primary" />
                Optimization Results
              </Typography>

              <Stack spacing={3}>
                {optimization.optimized_title && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      Optimized Title:
                    </Typography>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {optimization.optimized_title}
                        </Typography>
                      </CardContent>
                    </Card>
                    {optimization.original_title && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Original: {optimization.original_title}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {optimization.optimized_description && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      Optimized Description:
                    </Typography>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="body2">
                          {optimization.optimized_description}
                        </Typography>
                      </CardContent>
                    </Card>
                    {optimization.original_description && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Original: {optimization.original_description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {optimization.improvements.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <ImprovementIcon />
                      Key Improvements:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {optimization.improvements.map((improvement, index) => (
                        <Chip
                          key={index}
                          label={improvement}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                <Divider />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Generated by {optimization.ai_model} on{' '}
                    {new Date(
                      optimization.optimization_timestamp
                    ).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Optimization Type: {optimization.optimization_type}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        {hasChanges && todo && (
          <Button
            variant="contained"
            onClick={handleApplyOptimization}
            disabled={updateTodo.isPending}
            startIcon={
              updateTodo.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <CheckIcon />
              )
            }
          >
            {updateTodo.isPending ? 'Applying...' : 'Apply Optimization'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
