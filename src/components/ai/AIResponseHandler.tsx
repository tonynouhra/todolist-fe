import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AIIcon,
  CheckCircle as DoneIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as PriorityIcon,
  Lightbulb as ImprovementIcon,
  PlayArrow as InProgressIcon,
  RadioButtonUnchecked as TodoIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import type {
  GeneratedSubtask,
  GeneratedTodo,
  FileAnalysisResponse,
  TaskOptimizationResponse,
} from '../../types';
import type { AIMessageData } from './AIMessageBubble';

interface AIResponseHandlerProps {
  data: AIMessageData;
  onCreateTodos?: (todos: Array<GeneratedSubtask | GeneratedTodo>) => void;
  onApproveAll?: () => void;
  className?: string;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: '#4caf50',
  2: '#8bc34a',
  3: '#ff9800',
  4: '#f44336',
  5: '#d32f2f',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

const getPriorityChip = (priority?: number) => {
  if (!priority) return null;
  const color = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority] ?? `Priority ${priority}`;
  return (
    <Chip
      icon={<PriorityIcon />}
      label={label}
      size="small"
      sx={{
        backgroundColor: color,
        color: 'white',
      }}
    />
  );
};

const renderSummaryChip = (label: string, value?: string | number) => {
  if (value === undefined || value === null) return null;
  return <Chip label={`${label}: ${value}`} size="small" variant="outlined" />;
};

const SubtasksSection: React.FC<{
  subtasks: GeneratedSubtask[];
  parentTitle: string;
  autoCreated?: boolean;
  className?: string;
}> = ({ subtasks, parentTitle, autoCreated, className }) => {
  const theme = useTheme();

  return (
    <Card className={className}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <AIIcon color="primary" />
            <Typography variant="h6">Generated Subtasks</Typography>
            {renderSummaryChip('Count', subtasks.length)}
          </Box>
          {autoCreated && (
            <Chip
              label="Saved to todo"
              color="success"
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {`These subtasks were created for "${parentTitle}"${
            autoCreated ? ' and added to your workspace automatically.' : '.'
          }`}
        </Typography>

        <List dense>
          {subtasks.map((subtask, index) => (
            <ListItem
              key={`${subtask.title}-${index}`}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemIcon>
                <Chip
                  label={`#${subtask.order}`}
                  size="small"
                  variant="outlined"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">{subtask.title}</Typography>
                    {getPriorityChip(subtask.priority)}
                  </Box>
                }
                secondary={
                  <Stack spacing={0.5} mt={0.5}>
                    {subtask.description && (
                      <Typography variant="body2" color="text.secondary">
                        {subtask.description}
                      </Typography>
                    )}
                    {subtask.estimated_time && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        <TimeIcon fontSize="inherit" />
                        {subtask.estimated_time}
                      </Typography>
                    )}
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const TodoSuggestionsSection: React.FC<{
  suggestions: GeneratedTodo[];
  requestDescription: string;
  onCreateTodos?: (todos: GeneratedTodo[]) => void;
  onApproveAll?: () => void;
  className?: string;
}> = ({
  suggestions,
  requestDescription,
  onCreateTodos,
  onApproveAll,
  className,
}) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCreate = (items: GeneratedTodo[]) => {
    if (!onCreateTodos) return;
    onCreateTodos(items);
  };

  const createSelected = () => {
    if (!selected.size || !onCreateTodos) return;
    const items = suggestions.filter((_, index) => selected.has(index));
    handleCreate(items);
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === suggestions.length
        ? new Set()
        : new Set(suggestions.map((_, index) => index))
    );
  };

  return (
    <Card className={className}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <AIIcon color="primary" />
            <Typography variant="h6">Todo Suggestions</Typography>
            {renderSummaryChip('Total', suggestions.length)}
          </Box>
          <Stack direction="row" gap={1}>
            <Button size="small" variant="outlined" onClick={toggleSelectAll}>
              {selected.size === suggestions.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            {selected.size > 0 && (
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={createSelected}
              >
                {`Create Selected (${selected.size})`}
              </Button>
            )}
          </Stack>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {`Prompt: "${requestDescription}"`}
        </Typography>

        <List dense>
          {suggestions.map((todo, index) => {
            const isSelected = selected.has(index);
            return (
              <ListItem
                key={`${todo.title}-${index}`}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: isSelected
                    ? theme.palette.action.selected
                    : 'transparent',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  py: 1.5,
                }}
              >
                {/* Top row: checkbox, title, and create button */}
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={1}
                  width="100%"
                  mb={1}
                >
                  <IconButton
                    size="small"
                    onClick={() => toggleSelection(index)}
                    sx={{ mt: -0.5 }}
                  >
                    {isSelected ? (
                      <InProgressIcon color="primary" />
                    ) : (
                      <TodoIcon color="action" />
                    )}
                  </IconButton>

                  <Box flex={1} minWidth={0}>
                    <Typography
                      variant="subtitle2"
                      sx={{ wordBreak: 'break-word' }}
                    >
                      {todo.title}
                    </Typography>
                  </Box>

                  {onCreateTodos && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleCreate([todo])}
                      sx={{ flexShrink: 0 }}
                    >
                      Create
                    </Button>
                  )}
                </Box>

                {/* Chips row */}
                {(todo.priority || todo.category) && (
                  <Box
                    display="flex"
                    gap={1}
                    flexWrap="wrap"
                    ml={5}
                    mb={todo.description || todo.estimated_time ? 1 : 0}
                  >
                    {getPriorityChip(todo.priority)}
                    {todo.category && (
                      <Chip
                        label={todo.category}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}

                {/* Description and time */}
                {(todo.description || todo.estimated_time) && (
                  <Box ml={5}>
                    <Stack spacing={0.5}>
                      {todo.description && (
                        <Typography variant="body2" color="text.secondary">
                          {todo.description}
                        </Typography>
                      )}
                      {todo.estimated_time && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                        >
                          <TimeIcon fontSize="inherit" />
                          {todo.estimated_time}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </ListItem>
            );
          })}
        </List>

        {onApproveAll && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button startIcon={<DoneIcon />} onClick={onApproveAll}>
              Create All
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const FileAnalysisSection: React.FC<{
  analysis: FileAnalysisResponse;
  onCreateTodos?: (todos: GeneratedTodo[]) => void;
  className?: string;
}> = ({ analysis, onCreateTodos, className }) => (
  <Card className={className}>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <AIIcon color="primary" />
        <Typography variant="h6">File Analysis</Typography>
        {renderSummaryChip(
          'Confidence',
          `${Math.round(analysis.confidence_score * 100)}%`
        )}
      </Box>

      {analysis.summary && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {analysis.summary}
        </Alert>
      )}

      {analysis.key_points.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Key Points</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {analysis.key_points.map((point, index) => (
                <ListItem key={`${point}-${index}`}>
                  <ListItemIcon>
                    <ImprovementIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {analysis.suggested_tasks.length > 0 && (
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Suggested Tasks</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {analysis.suggested_tasks.map((task, index) => (
                <ListItem key={`${task}-${index}`} divider>
                  <ListItemText primary={task} />
                  {onCreateTodos && (
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          onCreateTodos([{ title: task, priority: 3 }])
                        }
                      >
                        Create
                      </Button>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </CardContent>
  </Card>
);

const OptimizationSection: React.FC<{
  optimization: TaskOptimizationResponse;
  onApproveAll?: () => void;
  className?: string;
}> = ({ optimization, onApproveAll, className }) => {
  const hasChanges = Boolean(
    optimization.optimized_title || optimization.optimized_description
  );

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <AIIcon color="primary" />
          <Typography variant="h6">Task Optimization</Typography>
          {renderSummaryChip('Type', optimization.optimization_type)}
        </Box>

        {!hasChanges && (
          <Alert severity="info">
            The AI did not suggest any changes for this task.
          </Alert>
        )}

        {hasChanges && (
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Original
                </Typography>
                {optimization.original_title && (
                  <Typography variant="h6" gutterBottom>
                    {optimization.original_title}
                  </Typography>
                )}
                {optimization.original_description && (
                  <Typography variant="body2" color="text.secondary">
                    {optimization.original_description}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="success.main"
                  gutterBottom
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <ImprovementIcon fontSize="small" /> Optimized
                </Typography>
                {optimization.optimized_title && (
                  <Typography variant="h6" gutterBottom>
                    {optimization.optimized_title}
                  </Typography>
                )}
                {optimization.optimized_description && (
                  <Typography variant="body2" color="text.secondary">
                    {optimization.optimized_description}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {optimization.improvements.length > 0 && (
              <Alert
                severity="success"
                icon={<ImprovementIcon fontSize="small" />}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Improvements
                </Typography>
                <List dense>
                  {optimization.improvements.map((item, index) => (
                    <ListItem key={`${item}-${index}`}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {onApproveAll && (
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={<DoneIcon />}
                  onClick={onApproveAll}
                >
                  Apply Changes
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export const AIResponseHandler: React.FC<AIResponseHandlerProps> = ({
  data,
  onCreateTodos,
  onApproveAll,
  className,
}) => {
  const content = useMemo(() => {
    switch (data.type) {
      case 'subtasks':
        return (
          <SubtasksSection
            subtasks={data.subtasks}
            parentTitle={data.parentTaskTitle}
            autoCreated={data.autoCreated}
            className={className}
          />
        );
      case 'todo_suggestions':
        return (
          <TodoSuggestionsSection
            suggestions={data.suggestions}
            requestDescription={data.requestDescription}
            onCreateTodos={
              onCreateTodos as ((todos: GeneratedTodo[]) => void) | undefined
            }
            onApproveAll={onApproveAll}
            className={className}
          />
        );
      case 'analysis':
        return (
          <FileAnalysisSection
            analysis={data.analysis}
            onCreateTodos={
              onCreateTodos as ((todos: GeneratedTodo[]) => void) | undefined
            }
            className={className}
          />
        );
      case 'optimization':
        return (
          <OptimizationSection
            optimization={data.optimization}
            onApproveAll={onApproveAll}
            className={className}
          />
        );
      default:
        return (
          <Alert severity="info">
            I prepared a response, but I do not know how to display it yet.
          </Alert>
        );
    }
  }, [className, data, onApproveAll, onCreateTodos]);

  return <>{content}</>;
};
