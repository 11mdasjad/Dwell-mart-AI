// ===========================================
// OpenAI Provider — Production AI Integration
// ===========================================
// Activated when AI_PROVIDER=openai and a valid
// OPENAI_API_KEY is configured on the server.
// ===========================================

import {
  AIProvider,
  AIProviderConfig,
  AIProviderMessage,
  AIProviderResponse,
  ToolDefinition,
  ToolCall,
} from '@/types/chat';
import {
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  MalformedResponseError,
  ProviderUnavailableError,
} from './errors';
import { logger } from '@/lib/logger';

export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: { apiKey: string; model?: string; timeoutMs?: number }) {
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new AuthenticationError('OpenAI API key is missing or empty.');
    }
    this.apiKey = config.apiKey.trim();
    this.model = config.model || 'gpt-4o';
    this.timeoutMs = config.timeoutMs || 25000;
  }

  async chat(
    messages: AIProviderMessage[],
    tools?: ToolDefinition[],
    config?: Partial<AIProviderConfig>,
    signal?: AbortSignal
  ): Promise<AIProviderResponse> {
    const openaiMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const openaiTools = tools && tools.length > 0
      ? tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(t.parameters).map(([key, param]) => [
                  key,
                  {
                    type: param.type,
                    description: param.description,
                    ...(param.enum ? { enum: param.enum } : {}),
                  },
                ])
              ),
              required: t.required,
            },
          },
        }))
      : undefined;

    const requestBody: Record<string, unknown> = {
      model: config?.model || this.model,
      messages: openaiMessages,
      max_tokens: config?.maxTokens || 1024,
      temperature: config?.temperature ?? 0.7,
    };

    if (openaiTools && openaiTools.length > 0) {
      requestBody.tools = openaiTools;
      requestBody.tool_choice = 'auto';
    }

    // Set up request timeout and merge with external signal if provided
    const timeoutDuration = config?.timeoutMs || this.timeoutMs;
    const timeoutSignal = AbortSignal.timeout(timeoutDuration);
    const combinedSignal = signal
      ? AbortSignal.any([timeoutSignal, signal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: combinedSignal,
      });
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof Error) {
        if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
          logger.warn('AI Provider request timed out or was aborted', {
            event: 'provider_timeout',
            timeoutMs: timeoutDuration,
          });
          throw new TimeoutError(`Request exceeded timeout of ${timeoutDuration}ms`);
        }
      }
      logger.error('Failed to reach AI Provider', {
        event: 'provider_network_error',
      });
      throw new ProviderUnavailableError('Unable to connect to AI provider network.');
    }

    // Handle non-200 HTTP responses
    if (!response.ok) {
      const status = response.status;
      logger.warn('AI Provider returned non-200 status', {
        event: 'provider_error_status',
        statusCode: status,
      });

      if (status === 401 || status === 403) {
        throw new AuthenticationError('Invalid or unauthorized AI provider credentials.');
      }

      if (status === 429) {
        let errorDetails = '';
        try {
          const errData = await response.json();
          if (
            errData?.error?.code === 'insufficient_quota' ||
            errData?.error?.code === 'credit_balance_exhausted' ||
            errData?.error?.type === 'insufficient_quota'
          ) {
            errorDetails = 'OpenAI credit balance is exhausted. Please add credits at https://platform.openai.com/billing or switch AI_MOCK_MODE=true in .env.local.';
          }
        } catch {
          // ignore parse error
        }

        const retryHeader = response.headers.get('retry-after');
        const retrySeconds = retryHeader ? parseInt(retryHeader, 10) : undefined;
        throw new RateLimitError(
          errorDetails || 'AI provider rate limit reached. Please wait a moment.',
          retrySeconds
        );
      }

      if (status >= 500) {
        throw new ProviderUnavailableError('AI provider server error. Please retry shortly.');
      }

      throw new MalformedResponseError(`AI provider rejected request with status ${status}`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new MalformedResponseError('Provider returned non-JSON response.');
    }

    // Validate structure of OpenAI response
    if (
      typeof data !== 'object' ||
      data === null ||
      !('choices' in data) ||
      !Array.isArray((data as { choices: unknown[] }).choices) ||
      (data as { choices: unknown[] }).choices.length === 0
    ) {
      throw new MalformedResponseError('Provider response is missing choices array.');
    }

    const firstChoice = (data as {
      choices: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            function?: { name?: string; arguments?: string };
          }>;
        };
        finish_reason?: string;
      }>;
    }).choices[0];

    const message = firstChoice?.message;
    if (!message) {
      throw new MalformedResponseError('Provider response choice contains no message object.');
    }

    // Process tool calls if present
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCalls: ToolCall[] = [];

      for (const tc of message.tool_calls) {
        const functionName = tc.function?.name;
        if (!functionName) continue;

        let parsedArgs: Record<string, unknown> = {};
        try {
          if (tc.function?.arguments) {
            parsedArgs = JSON.parse(tc.function.arguments);
          }
        } catch {
          logger.warn('Malformed JSON arguments in tool call from model', {
            toolName: functionName,
          });
          parsedArgs = {};
        }

        toolCalls.push({
          name: functionName,
          arguments: parsedArgs,
        });
      }

      return {
        content: message.content || '',
        toolCalls,
        finishReason: 'tool_calls',
      };
    }

    return {
      content: message.content || '',
      finishReason: firstChoice.finish_reason === 'stop' ? 'stop' : 'length',
    };
  }
}
