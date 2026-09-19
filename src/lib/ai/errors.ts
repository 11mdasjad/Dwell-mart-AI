// ===========================================
// AI System Structured Errors
// ===========================================

export type AIErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'PROVIDER_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'TOOL_EXECUTION_ERROR'
  | 'INTERNAL_ERROR';

export class AIError extends Error {
  public readonly code: AIErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: AIErrorCode = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends AIError {
  constructor(message: string = 'Authentication failed with the AI provider.') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AIError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded.', retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends AIError {
  constructor(message: string = 'The AI provider request timed out.') {
    super(message, 'TIMEOUT', 504);
    this.name = 'TimeoutError';
  }
}

export class MalformedResponseError extends AIError {
  constructor(message: string = 'Received a malformed response from the AI provider.') {
    super(message, 'MALFORMED_RESPONSE', 502);
    this.name = 'MalformedResponseError';
  }
}

export class ProviderUnavailableError extends AIError {
  constructor(message: string = 'AI provider service is temporarily unavailable.') {
    super(message, 'PROVIDER_UNAVAILABLE', 503);
    this.name = 'ProviderUnavailableError';
  }
}

export class ToolExecutionError extends AIError {
  public readonly toolName: string;

  constructor(toolName: string, message: string = 'Tool execution failed.') {
    super(`Tool '${toolName}' execution failed: ${message}`, 'TOOL_EXECUTION_ERROR', 400);
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
  }
}
