import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AIMessage } from '../../components/ai/AIMessageBubble';

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
  addAIMessage: (content: string, data?: any) => string;
  addSystemMessage: (content: string) => string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface UseAIChatReturn extends UseChatState, UseChatActions {
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
}

const STORAGE_KEY = 'ai-chat-history';

export const useAIChat = (): UseAIChatReturn => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedMessages = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedMessages);
      } else {
        // Add welcome message if no history
        const welcomeMessage: AIMessage = {
          id: uuidv4(),
          type: 'ai',
          content:
            "Hello! I'm your AI assistant. I can help you:\n\n• Generate subtasks for your todos\n• Analyze files and extract tasks\n• Improve task descriptions\n• Create todo lists from natural language\n\nWhat would you like to do today?",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback(
    (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
      const id = uuidv4();
      const newMessage: AIMessage = {
        ...message,
        id,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      return id;
    },
    []
  );

  const updateMessage = useCallback(
    (id: string, updates: Partial<AIMessage>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addUserMessage = useCallback(
    (content: string) => {
      return addMessage({
        type: 'user',
        content,
      });
    },
    [addMessage]
  );

  const addAIMessage = useCallback(
    (content: string, data?: any) => {
      return addMessage({
        type: 'ai',
        content,
        data,
      });
    },
    [addMessage]
  );

  const addSystemMessage = useCallback(
    (content: string) => {
      return addMessage({
        type: 'system',
        content,
      });
    },
    [addMessage]
  );

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    setError(null);
  }, []);

  const setErrorState = useCallback((error: string | null) => {
    setError(error);
    setIsLoading(false);
  }, []);

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
  };
};
