// ===========================================
// Chat & AI Types — Canonical Phase 2 Contracts
// ===========================================

export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Client message in conversation array (system is forbidden from untrusted client)
 */
export interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCallResult[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ── API Contracts ──
export interface ChatRequestBody {
  messages?: ClientMessage[];
  // Backward compatibility fields
  message?: string;
  conversationId?: string;
  history?: ChatMessage[];
}

export interface ChatSuccessResponse {
  success: true;
  message: {
    id: string;
    role: 'assistant';
    content: string;
    timestamp: number;
    toolCalls?: ToolCallResult[];
  };
  mock: boolean;
  conversationId?: string;
}

export interface ChatFailureResponse {
  success: false;
  error: string;
  code?: string;
}

export type ChatApiResponse = ChatSuccessResponse | ChatFailureResponse;

// ── Tool Types ──
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  required: string[];
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean';
  description: string;
  enum?: string[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  success: boolean;
  error?: string;
}

// ── AI Provider & Orchestration Types ──
export interface AIProviderConfig {
  apiKey?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProviderMessage {
  role: MessageRole;
  content: string;
}

export interface AIProviderResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface AIProvider {
  name: string;
  chat(
    messages: AIProviderMessage[],
    tools?: ToolDefinition[],
    config?: Partial<AIProviderConfig>,
    signal?: AbortSignal
  ): Promise<AIProviderResponse>;
}
