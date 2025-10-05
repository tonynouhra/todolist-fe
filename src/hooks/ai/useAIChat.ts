import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AIMessage, AIMessageData } from '../../components/ai/AIMessageBubble';
import type {
  GeneratedSubtask,
  GeneratedTodo,
  FileAnalysisResponse,
  TaskOptimizationResponse,
} from '../../types';

interface UseChatState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
}

interface UseChatActions {
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<AIMessage>) => void;
  clearChat: () => void;
  addUserMessage: (content: string) => string;
  addAIMessage: (content: string, data?: AIMessageData) => string;
  addSystemMessage: (content: string) => string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface UseAIChatReturn extends UseChatState, UseChatActions {
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  startNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIMessage[];
}

interface ChatState {
  sessions: Record<string, ChatSession>;
  sessionOrder: string[];
  activeSessionId: string;
}

const STORAGE_KEY = 'ai-chat-history';
const DEFAULT_TITLE = 'New conversation';
const TITLE_MAX_LENGTH = 40;
const MAX_SESSIONS = 15;

const createWelcomeMessage = (): AIMessage => ({
  id: uuidv4(),
  type: 'ai',
  content:
    "Hello! I'm your AI assistant. I can help you:\n\n• Generate subtasks for your todos\n• Analyze files and extract tasks\n• Improve task descriptions\n• Create todo lists from natural language\n\nWhat would you like to do today?",
  timestamp: new Date(),
});

const createSession = (title: string = DEFAULT_TITLE): ChatSession => {
  const welcome = createWelcomeMessage();
  const nowIso = new Date().toISOString();

  return {
    id: uuidv4(),
    title,
    createdAt: nowIso,
    updatedAt: welcome.timestamp.toISOString(),
    messages: [welcome],
  };
};

const createInitialState = (): ChatState => {
  const session = createSession();
  return {
    sessions: { [session.id]: session },
    sessionOrder: [session.id],
    activeSessionId: session.id,
  };
};

const createTitleFromContent = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed) {
    return DEFAULT_TITLE;
  }
  return trimmed.length > TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
    : trimmed;
};

const deserializeMessage = (msg: any): AIMessage | null => {
  if (!msg || typeof msg !== 'object') {
    return null;
  }

  const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();

  return {
    ...msg,
    timestamp,
    data: msg.data ? normalizeMessageData(msg.data) : undefined,
  };
};

const deriveTitleFromMessages = (messages: AIMessage[]): string => {
  const firstUserMessage = messages.find((message) => message.type === 'user');
  if (!firstUserMessage) {
    return DEFAULT_TITLE;
  }
  return createTitleFromContent(firstUserMessage.content);
};

const loadState = (): ChatState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      // Legacy format: array of messages
      const state = createInitialState();
      const sessionId = state.activeSessionId;
      const messages = parsed
        .map(deserializeMessage)
        .filter(Boolean) as AIMessage[];

      if (messages.length > 0) {
        state.sessions[sessionId] = {
          ...state.sessions[sessionId],
          messages,
          title: deriveTitleFromMessages(messages),
          updatedAt: messages[messages.length - 1].timestamp.toISOString(),
        };
      }

      return state;
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.sessions &&
      parsed.sessionOrder &&
      parsed.activeSessionId
    ) {
      const sessionsEntries = Object.entries(
        parsed.sessions as Record<string, any>
      );
      const sessions: Record<string, ChatSession> = {};

      sessionsEntries.forEach(([id, sessionValue]) => {
        const messages = Array.isArray(sessionValue.messages)
          ? (sessionValue.messages
              .map(deserializeMessage)
              .filter(Boolean) as AIMessage[])
          : [];

        const updatedAt =
          sessionValue.updatedAt ||
          messages.at(-1)?.timestamp.toISOString() ||
          new Date().toISOString();

        sessions[id] = {
          id,
          title: sessionValue.title || DEFAULT_TITLE,
          createdAt: sessionValue.createdAt || new Date().toISOString(),
          updatedAt,
          messages,
        };
      });

      const order = Array.isArray(parsed.sessionOrder)
        ? (parsed.sessionOrder as string[]).filter((id) => sessions[id])
        : Object.keys(sessions);

      const fallbackActive = order[0] ?? Object.keys(sessions)[0];
      const activeId =
        typeof parsed.activeSessionId === 'string' &&
        sessions[parsed.activeSessionId]
          ? parsed.activeSessionId
          : fallbackActive;

      if (!activeId) {
        return createInitialState();
      }

      return {
        sessions,
        sessionOrder: order.length ? order : [activeId],
        activeSessionId: activeId,
      };
    }
  } catch (error) {
    console.error('Failed to load AI chat history, resetting state.', error);
  }

  return createInitialState();
};

const serializeState = (state: ChatState) => ({
  ...state,
  sessions: Object.fromEntries(
    Object.entries(state.sessions).map(([id, session]) => [
      id,
      {
        ...session,
        messages: session.messages.map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
      },
    ])
  ),
});

export const useAIChat = (): UseAIChatReturn => {
  const [chatState, setChatState] = useState<ChatState>(() => loadState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = chatState.sessions[chatState.activeSessionId];

  const messages = useMemo(
    () => activeSession?.messages ?? [],
    [activeSession]
  );

  // Persist sessions whenever they change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(serializeState(chatState))
    );
  }, [chatState]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const updateActiveSession = useCallback(
    (updater: (session: ChatSession) => ChatSession) => {
      setChatState((prev) => {
        const session = prev.sessions[prev.activeSessionId];
        if (!session) {
          return prev;
        }

        const updatedSession = updater(session);
        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [prev.activeSessionId]: updatedSession,
          },
        };
      });
    },
    []
  );

  const addMessage = useCallback(
    (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
      const id = uuidv4();
      const timestamp = new Date();
      const newMessage: AIMessage = {
        ...message,
        id,
        timestamp,
      };

      setChatState((prev) => {
        const session = prev.sessions[prev.activeSessionId];
        if (!session) {
          return prev;
        }

        const shouldRename =
          message.type === 'user' &&
          (session.title === DEFAULT_TITLE ||
            session.title.startsWith('Conversation '));

        const updatedSession: ChatSession = {
          ...session,
          title: shouldRename
            ? createTitleFromContent(message.content)
            : session.title,
          messages: [...session.messages, newMessage],
          updatedAt: timestamp.toISOString(),
        };

        const newOrder = [
          prev.activeSessionId,
          ...prev.sessionOrder.filter(
            (sessionId) => sessionId !== prev.activeSessionId
          ),
        ];

        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [prev.activeSessionId]: updatedSession,
          },
          sessionOrder: newOrder,
        };
      });

      return id;
    },
    []
  );

  const updateMessage = useCallback(
    (id: string, updates: Partial<AIMessage>) => {
      updateActiveSession((session) => ({
        ...session,
        messages: session.messages.map((message) =>
          message.id === id ? { ...message, ...updates } : message
        ),
      }));
    },
    [updateActiveSession]
  );

  const clearChat = useCallback(() => {
    updateActiveSession((session) => ({
      ...session,
      title: DEFAULT_TITLE,
      messages: [createWelcomeMessage()],
      updatedAt: new Date().toISOString(),
    }));
    setIsLoading(false);
    setError(null);
  }, [updateActiveSession]);

  const addUserMessage = useCallback(
    (content: string) =>
      addMessage({
        type: 'user',
        content,
      }),
    [addMessage]
  );

  const addAIMessage = useCallback(
    (content: string, data?: AIMessageData) =>
      addMessage({
        type: 'ai',
        content,
        data,
      }),
    [addMessage]
  );

  const addSystemMessage = useCallback(
    (content: string) =>
      addMessage({
        type: 'system',
        content,
      }),
    [addMessage]
  );

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null);
    }
  }, []);

  const setErrorState = useCallback((localError: string | null) => {
    setError(localError);
    if (localError) {
      setIsLoading(false);
    }
  }, []);

  const startNewSession = useCallback(() => {
    setChatState((prev) => {
      const newSession = createSession();
      const nextSessions = {
        ...prev.sessions,
        [newSession.id]: newSession,
      };
      const nextOrder = [newSession.id, ...prev.sessionOrder];

      if (nextOrder.length > MAX_SESSIONS) {
        const trimmedOrder = nextOrder.slice(0, MAX_SESSIONS);
        const trimmedSessions: Record<string, ChatSession> = {};

        trimmedOrder.forEach((sessionId) => {
          trimmedSessions[sessionId] = nextSessions[sessionId];
        });

        return {
          sessions: trimmedSessions,
          sessionOrder: trimmedOrder,
          activeSessionId: newSession.id,
        };
      }

      return {
        sessions: nextSessions,
        sessionOrder: nextOrder,
        activeSessionId: newSession.id,
      };
    });
    setIsLoading(false);
    setError(null);
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setChatState((prev) => {
      if (!prev.sessions[sessionId] || prev.activeSessionId === sessionId) {
        return prev;
      }

      return {
        ...prev,
        activeSessionId: sessionId,
        sessionOrder: [
          sessionId,
          ...prev.sessionOrder.filter((existingId) => existingId !== sessionId),
        ],
      };
    });
    setIsLoading(false);
    setError(null);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setChatState((prev) => {
      // Can't delete if it's the only session
      if (prev.sessionOrder.length <= 1) {
        return prev;
      }

      // Remove session from sessions and order
      const { [sessionId]: deletedSession, ...remainingSessions } =
        prev.sessions;
      const newOrder = prev.sessionOrder.filter((id) => id !== sessionId);

      // If deleting active session, switch to the next one
      const newActiveId =
        prev.activeSessionId === sessionId ? newOrder[0] : prev.activeSessionId;

      return {
        sessions: remainingSessions,
        sessionOrder: newOrder,
        activeSessionId: newActiveId,
      };
    });
    setIsLoading(false);
    setError(null);
  }, []);

  const sessionSummaries = useMemo<ChatSessionSummary[]>(() => {
    return chatState.sessionOrder
      .map((sessionId) => chatState.sessions[sessionId])
      .filter((session): session is ChatSession => Boolean(session))
      .map((session, index) => ({
        id: session.id,
        title:
          session.title === DEFAULT_TITLE
            ? `Conversation ${chatState.sessionOrder.length - index}`
            : session.title,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messageCount: session.messages.length,
      }));
  }, [chatState.sessionOrder, chatState.sessions]);

  return {
    messages,
    isLoading,
    error,
    messagesEndRef,
    scrollToBottom,
    addMessage,
    updateMessage,
    clearChat,
    addUserMessage,
    addAIMessage,
    addSystemMessage,
    setLoading: setLoadingState,
    setError: setErrorState,
    sessions: sessionSummaries,
    activeSessionId: chatState.activeSessionId,
    startNewSession,
    switchSession,
    deleteSession,
  };
};

const normalizeMessageData = (raw: any): AIMessageData | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  switch (raw.type) {
    case 'subtasks': {
      const subtasks: GeneratedSubtask[] =
        raw.subtasks || raw.generated_subtasks || raw.data || [];
      if (!Array.isArray(subtasks) || subtasks.length === 0) {
        return undefined;
      }

      const parentTaskTitle =
        raw.parentTaskTitle || raw.parent_task_title || 'Task';

      return {
        type: 'subtasks',
        parentTaskTitle,
        subtasks,
        autoCreated: Boolean(raw.autoCreated),
      };
    }

    case 'todo_suggestions':
    case 'todos': {
      const suggestions: GeneratedTodo[] =
        raw.suggestions || raw.generated_todos || raw.data || [];
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return undefined;
      }

      const requestDescription =
        raw.requestDescription || raw.request_description || 'Your request';

      return {
        type: 'todo_suggestions',
        requestDescription,
        suggestions,
      };
    }

    case 'analysis': {
      const analysis: FileAnalysisResponse = raw.analysis || raw.data;
      if (!analysis) {
        return undefined;
      }

      return {
        type: 'analysis',
        analysis,
      };
    }

    case 'optimization':
    case 'improvement': {
      const optimization: TaskOptimizationResponse =
        raw.optimization || raw.data;
      if (!optimization) {
        return undefined;
      }

      return {
        type: 'optimization',
        optimization,
      };
    }

    default:
      return undefined;
  }
};
