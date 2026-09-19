'use client';

import { useState, useCallback, useRef } from 'react';
import { generateId } from '@/lib/id';
import { ChatMessage, Conversation } from '@/types/chat';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  conversationId: string;
}

export function useChat(initialConversationId?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState(() => initialConversationId || generateId());
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    // Clear any previous error
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .slice(-20)
              .map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: trimmed },
          ],
          conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: data.message.timestamp,
        toolCalls: data.message.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save to localStorage
      saveConversation(conversationId, [...messages, userMessage, assistantMessage]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, not an error
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(errorMessage);

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `I encountered an issue: ${errorMessage}\n\nPlease try again or rephrase your question.`,
        timestamp: Date.now(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setConversationId(generateId());
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    conversationId,
  };
}

// ── Local Storage Helpers ──
function saveConversation(id: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;

  try {
    const conversations: Conversation[] = JSON.parse(
      localStorage.getItem('dwellmart-conversations') || '[]'
    );

    const existingIndex = conversations.findIndex((c) => c.id === id);
    const title = messages.find((m) => m.role === 'user')?.content.slice(0, 60) || 'New Conversation';

    const conversation: Conversation = {
      id,
      title,
      messages,
      createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    // Keep only last 50 conversations
    const trimmed = conversations.slice(0, 50);
    localStorage.setItem('dwellmart-conversations', JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('dwellmart-conversations') || '[]');
  } catch {
    return [];
  }
}

export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const conversations: Conversation[] = JSON.parse(
      localStorage.getItem('dwellmart-conversations') || '[]'
    );
    const filtered = conversations.filter((c) => c.id !== id);
    localStorage.setItem('dwellmart-conversations', JSON.stringify(filtered));
  } catch {
    // silent
  }
}
