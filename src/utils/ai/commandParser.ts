export interface AICommand {
  type:
    | 'generate_subtasks'
    | 'analyze_file'
    | 'improve_description'
    | 'generate_todos'
    | 'general_chat';
  confidence: number;
  parameters: {
    todoId?: string;
    todoTitle?: string;
    todoDescription?: string;
    fileContent?: string;
    fileName?: string;
    projectId?: string;
    userInput?: string;
    context?: string;
  };
  originalInput: string;
}

// Keywords and patterns for different command types
const COMMAND_PATTERNS = {
  generate_subtasks: [
    /break\s+(down|up|into)\s+(.+)/i,
    /create\s+subtasks?\s+(for|from)\s+(.+)/i,
    /generate\s+subtasks?\s+(for|from)\s+(.+)/i,
    /split\s+(.+)\s+into\s+smaller\s+tasks/i,
    /what\s+steps\s+.+\s+to\s+(.+)/i,
    /how\s+to\s+(.+)/i,
  ],
  analyze_file: [
    /analyze\s+(this\s+)?file/i,
    /what\s+tasks?\s+.+\s+in\s+(this\s+)?file/i,
    /extract\s+tasks?\s+from\s+(this\s+)?file/i,
    /process\s+(this\s+)?file/i,
    /review\s+(this\s+)?file/i,
  ],
  improve_description: [
    /improve\s+(the\s+)?(description|task|todo)/i,
    /make\s+(.+)\s+(clearer|better|more\s+detailed)/i,
    /enhance\s+(the\s+)?(description|task)/i,
    /add\s+more\s+detail\s+to\s+(.+)/i,
    /clarify\s+(.+)/i,
  ],
  generate_todos: [
    /create\s+(a\s+)?todo\s+list\s+for\s+(.+)/i,
    /generate\s+tasks?\s+for\s+(.+)/i,
    /i\s+need\s+to\s+(.+)/i,
    /help\s+me\s+plan\s+(.+)/i,
    /what\s+tasks?\s+.+\s+for\s+(.+)/i,
    /todo\s+list\s+for\s+(.+)/i,
  ],
};

// Common task-related keywords
const TASK_KEYWORDS = [
  'todo',
  'task',
  'subtask',
  'project',
  'plan',
  'organize',
  'manage',
  'complete',
  'finish',
  'work',
  'job',
  'activity',
  'step',
  'action',
];

// Context extraction patterns
const CONTEXT_PATTERNS = {
  todoTitle: /(?:todo|task)\s+(?:called|named|titled)\s+"([^"]+)"/i,
  projectContext: /(?:for|in|on)\s+(?:the\s+)?(.+?)\s+project/i,
  timeContext: /(?:by|before|within|in)\s+(\d+\s+\w+)/i,
  priorityContext: /(?:high|low|medium|urgent|important)\s+priority/i,
};

export class AICommandParser {
  /**
   * Parse user input and determine the intended AI command
   */
  parseCommand(input: string): AICommand {
    const normalizedInput = input.trim().toLowerCase();

    // Check each command type
    for (const [commandType, patterns] of Object.entries(COMMAND_PATTERNS)) {
      for (const pattern of patterns) {
        const match = normalizedInput.match(pattern);
        if (match) {
          return this.buildCommand(
            commandType as AICommand['type'],
            input,
            match,
            0.8 // High confidence for direct pattern match
          );
        }
      }
    }

    // Check for task-related keywords (lower confidence)
    const hasTaskKeywords = TASK_KEYWORDS.some((keyword) =>
      normalizedInput.includes(keyword)
    );

    if (hasTaskKeywords) {
      return this.buildCommand('generate_todos', input, null, 0.5);
    }

    // Default to general chat
    return this.buildCommand('general_chat', input, null, 0.3);
  }

  /**
   * Extract specific parameters based on command type and input
   */
  private buildCommand(
    type: AICommand['type'],
    originalInput: string,
    match: RegExpMatchArray | null,
    baseConfidence: number
  ): AICommand {
    const parameters: AICommand['parameters'] = {
      userInput: originalInput,
    };

    // Extract context information
    const context = this.extractContext(originalInput);
    parameters.context = context;

    // Type-specific parameter extraction
    switch (type) {
      case 'generate_subtasks':
        if (match && match[2]) {
          parameters.todoTitle = match[2].trim();
        } else if (match && match[1]) {
          parameters.todoTitle = match[1].trim();
        }
        break;

      case 'generate_todos':
        if (match && match[2]) {
          parameters.todoDescription = match[2].trim();
        } else if (match && match[1]) {
          parameters.todoDescription = match[1].trim();
        }
        break;

      case 'improve_description':
        if (match && match[1]) {
          parameters.todoDescription = match[1].trim();
        }
        break;

      case 'analyze_file':
        // File parameters will be set when file is uploaded
        break;
    }

    // Extract additional context
    const todoTitleMatch = originalInput.match(CONTEXT_PATTERNS.todoTitle);
    if (todoTitleMatch) {
      parameters.todoTitle = todoTitleMatch[1];
    }

    const projectMatch = originalInput.match(CONTEXT_PATTERNS.projectContext);
    if (projectMatch) {
      parameters.context =
        (parameters.context || '') + ` Project: ${projectMatch[1]}`;
    }

    // Adjust confidence based on parameter extraction
    let confidence = baseConfidence;
    if (parameters.todoTitle || parameters.todoDescription) {
      confidence += 0.1;
    }
    if (parameters.context) {
      confidence += 0.05;
    }

    return {
      type,
      confidence: Math.min(confidence, 1.0),
      parameters,
      originalInput,
    };
  }

  /**
   * Extract general context from the input
   */
  private extractContext(input: string): string {
    const contexts: string[] = [];

    // Time context
    const timeMatch = input.match(CONTEXT_PATTERNS.timeContext);
    if (timeMatch) {
      contexts.push(`Timeline: ${timeMatch[1]}`);
    }

    // Priority context
    const priorityMatch = input.match(CONTEXT_PATTERNS.priorityContext);
    if (priorityMatch) {
      contexts.push(`Priority: ${priorityMatch[0]}`);
    }

    return contexts.join(', ');
  }

  /**
   * Generate suggested follow-up questions based on command type
   */
  getSuggestions(command: AICommand): string[] {
    switch (command.type) {
      case 'generate_subtasks':
        return [
          'Would you like me to set priorities for these subtasks?',
          'Should I add due dates to any of these subtasks?',
          'Do you want to modify any of these subtasks?',
        ];

      case 'generate_todos':
        return [
          'Would you like me to break down any of these todos into subtasks?',
          'Should I organize these into a project?',
          'Do you want to set priorities or due dates?',
        ];

      case 'improve_description':
        return [
          'Would you like me to suggest subtasks for this improved task?',
          'Should I set a priority or due date for this task?',
          'Do you want to add this to a specific project?',
        ];

      case 'analyze_file':
        return [
          'Would you like me to create todos from the extracted tasks?',
          'Should I organize these tasks into a project?',
          'Do you want to set priorities for these tasks?',
        ];

      default:
        return [
          'How can I help you with task management?',
          'Would you like to create some todos?',
          'Do you need help organizing your tasks?',
        ];
    }
  }

  /**
   * Validate if the command has sufficient information to execute
   */
  validateCommand(command: AICommand): {
    isValid: boolean;
    missingInfo: string[];
  } {
    const missingInfo: string[] = [];

    switch (command.type) {
      case 'generate_subtasks':
        if (!command.parameters.todoTitle && !command.parameters.todoId) {
          missingInfo.push('task title or ID');
        }
        break;

      case 'improve_description':
        if (!command.parameters.todoDescription && !command.parameters.todoId) {
          missingInfo.push('task description or ID');
        }
        break;

      case 'analyze_file':
        if (!command.parameters.fileContent && !command.parameters.fileName) {
          missingInfo.push('file to analyze');
        }
        break;

      case 'generate_todos':
        if (
          !command.parameters.todoDescription &&
          !command.parameters.userInput
        ) {
          missingInfo.push('description of what you want to accomplish');
        }
        break;
    }

    return {
      isValid: missingInfo.length === 0,
      missingInfo,
    };
  }
}
