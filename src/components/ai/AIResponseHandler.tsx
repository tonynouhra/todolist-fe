import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as DoneIcon,
  RadioButtonUnchecked as TodoIcon,
  PlayArrow as InProgressIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as PriorityIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { GeneratedSubtask } from '../../types';

interface AIResponseHandlerProps {
  type: 'subtasks' | 'todos' | 'analysis' | 'improvement';
  data: any;
  onCreateTodos?: (todos: Partial<GeneratedSubtask>[]) => void;
  onEditTodo?: (todo: Partial<GeneratedSubtask>) => void;
  onApproveAll?: () => void;
  className?: string;
}

interface EditTodoDialogProps {
  open: boolean;
  todo: Partial<GeneratedSubtask> | null;
  onClose: () => void;
  onSave: (todo: Partial<GeneratedSubtask>) => void;
}

const priorityColors = {
  1: '#4caf50', // Low
  2: '#8bc34a', // Low-Medium
  3: '#ff9800', // Medium
  4: '#f44336', // High
  5: '#d32f2f', // Critical
};

const priorityLabels = {
  1: 'Low',
  2: 'Low-Medium',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

const EditTodoDialog: React.FC<EditTodoDialogProps> = ({
  open,
  todo,
  onClose,
  onSave,
}) => {
  const [editedTodo, setEditedTodo] = useState<Partial<GeneratedSubtask>>(
    todo || {}
  );

  const handleSave = () => {
    onSave(editedTodo);
    onClose();
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Task</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Title"
            value={editedTodo.title || ''}
            onChange={(e) =>
              setEditedTodo({ ...editedTodo, title: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Description"
            value={editedTodo.description || ''}
            onChange={(e) =>
              setEditedTodo({ ...editedTodo, description: e.target.value })
            }
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Priority (1-5)"
            type="number"
            value={editedTodo.priority || 3}
            onChange={(e) =>
              setEditedTodo({
                ...editedTodo,
                priority: Number(e.target.value),
              })
            }
            fullWidth
            inputProps={{ min: 1, max: 5 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AIResponseHandler: React.FC<AIResponseHandlerProps> = ({
  type,
  data,
  onCreateTodos,
  onEditTodo,
  onApproveAll,
  className,
}) => {
  const theme = useTheme();
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    todo: Partial<GeneratedSubtask> | null;
  }>({ open: false, todo: null });

  const handleToggleSelect = (todoId: string) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(todoId)) {
      newSelected.delete(todoId);
    } else {
      newSelected.add(todoId);
    }
    setSelectedTodos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === data.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(
        new Set(data.map((_: any, index: number) => index.toString()))
      );
    }
  };

  const handleCreateSelected = () => {
    const selectedItems = data.filter((_: any, index: number) =>
      selectedTodos.has(index.toString())
    );
    if (selectedItems.length > 0 && onCreateTodos) {
      onCreateTodos(selectedItems);
    }
  };

  const handleEditTodo = (todo: Partial<GeneratedSubtask>, index: number) => {
    setEditDialog({ open: true, todo: { ...todo, id: index.toString() } });
  };

  const handleSaveEdit = (editedTodo: Partial<GeneratedSubtask>) => {
    if (onEditTodo) {
      onEditTodo(editedTodo);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'done':
        return <DoneIcon color="success" />;
      case 'in_progress':
        return <InProgressIcon color="primary" />;
      default:
        return <TodoIcon color="action" />;
    }
  };

  const renderSubtasks = () => (
    <Card className={className}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AIIcon color="primary" />
            <Typography variant="h6">AI Generated Subtasks</Typography>
            <Chip
              label={`${data.length} tasks`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Box display="flex" gap={1}>
            <Button size="small" onClick={handleSelectAll} variant="outlined">
              {selectedTodos.size === data.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            {selectedTodos.size > 0 && (
              <Button
                size="small"
                variant="contained"
                onClick={handleCreateSelected}
                startIcon={<AddIcon />}
              >
                Create Selected ({selectedTodos.size})
              </Button>
            )}
            {onApproveAll && (
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={onApproveAll}
                startIcon={<DoneIcon />}
              >
                Create All
              </Button>
            )}
          </Box>
        </Box>

        <List dense>
          {data.map((subtask: GeneratedSubtask, index: number) => (
            <ListItem
              key={index}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                mb: 1,
                backgroundColor: selectedTodos.has(index.toString())
                  ? theme.palette.action.selected
                  : 'transparent',
              }}
            >
              <ListItemIcon>
                <IconButton
                  size="small"
                  onClick={() => handleToggleSelect(index.toString())}
                >
                  {getStatusIcon(subtask.status)}
                </IconButton>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">{subtask.title}</Typography>
                    {subtask.priority && (
                      <Chip
                        icon={<PriorityIcon />}
                        label={
                          priorityLabels[
                            subtask.priority as keyof typeof priorityLabels
                          ]
                        }
                        size="small"
                        sx={{
                          backgroundColor:
                            priorityColors[
                              subtask.priority as keyof typeof priorityColors
                            ],
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    {subtask.description && (
                      <Typography variant="body2" color="text.secondary">
                        {subtask.description}
                      </Typography>
                    )}
                    {subtask.estimated_duration && (
                      <Typography variant="caption" color="text.secondary">
                        Estimated: {subtask.estimated_duration}
                      </Typography>
                    )}
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => handleEditTodo(subtask, index)}
                >
                  <EditIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderFileAnalysis = () => (
    <Card className={className}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AIIcon color="primary" />
          <Typography variant="h6">File Analysis Results</Typography>
        </Box>

        {data.analysis && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {data.analysis}
          </Alert>
        )}

        {data.summary && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">{data.summary}</Typography>
            </AccordionDetails>
          </Accordion>
        )}

        {data.suggested_todos && data.suggested_todos.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Extracted Tasks:
            </Typography>
            <List dense>
              {data.suggested_todos.map(
                (todo: GeneratedSubtask, index: number) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={todo.title}
                      secondary={todo.description}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => onCreateTodos && onCreateTodos([todo])}
                      >
                        Create
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              )}
            </List>
          </Box>
        )}

        {data.recommendations && data.recommendations.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Recommendations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {data.recommendations.map((rec: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );

  const renderImprovement = () => (
    <Card className={className}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AIIcon color="primary" />
          <Typography variant="h6">Improved Description</Typography>
        </Box>

        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1">{data.improved_description}</Typography>
        </Alert>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            onClick={() => onApproveAll && onApproveAll()}
          >
            Apply Changes
          </Button>
          <Button variant="outlined">Make Further Changes</Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (type) {
      case 'subtasks':
      case 'todos':
        return renderSubtasks();
      case 'analysis':
        return renderFileAnalysis();
      case 'improvement':
        return renderImprovement();
      default:
        return <Alert severity="info">Unknown response type: {type}</Alert>;
    }
  };

  return (
    <>
      {renderContent()}
      <EditTodoDialog
        open={editDialog.open}
        todo={editDialog.todo}
        onClose={() => setEditDialog({ open: false, todo: null })}
        onSave={handleSaveEdit}
      />
    </>
  );
};
