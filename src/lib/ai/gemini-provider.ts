// ===========================================
// Gemini Provider — Google Gemini AI Integration
// ===========================================
// Activated when AI_PROVIDER=gemini (or google)
// and a valid GEMINI_API_KEY is configured.
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

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: { apiKey: string; model?: string; timeoutMs?: number }) {
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new AuthenticationError('Gemini API key is missing or empty.');
    }
    this.apiKey = config.apiKey.trim();
    this.model = config.model || 'gemini-3.5-flash-lite';
    this.timeoutMs = config.timeoutMs || 30000;
  }

  async chat(
    messages: AIProviderMessage[],
    tools?: ToolDefinition[],
    config?: Partial<AIProviderConfig>,
    signal?: AbortSignal
  ): Promise<AIProviderResponse> {
    const activeModel = config?.model || this.model;

    // Extract system instructions if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m !== systemMessage);

    // Map conversation into Gemini contents array
    const geminiContents = conversationMessages.map((m) => {
      if (m.role === 'assistant') {
        return {
          role: 'model',
          parts: [{ text: m.content || ' ' }],
        };
      }
      if (m.role === 'system') {
        return {
          role: 'user',
          parts: [{ text: `[System/Tool Results Context]:\n${m.content}` }],
        };
      }
      return {
        role: 'user',
        parts: [{ text: m.content || ' ' }],
      };
    });

    // If there are no contents (only system message provided), add a default user message
    if (geminiContents.length === 0) {
      geminiContents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    // Map tools to Gemini functionDeclarations format
    const functionDeclarations = tools && tools.length > 0
      ? tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: {
            type: 'OBJECT',
            properties: Object.fromEntries(
              Object.entries(t.parameters).map(([key, param]) => [
                key,
                {
                  type:
                    param.type === 'number'
                      ? 'NUMBER'
                      : param.type === 'boolean'
                      ? 'BOOLEAN'
                      : 'STRING',
                  description: param.description,
                  ...(param.enum ? { enum: param.enum } : {}),
                },
              ])
            ),
            required: t.required,
          },
        }))
      : undefined;

    const requestBody: Record<string, unknown> = {
      contents: geminiContents,
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens || 1024,
      },
    };

    if (systemMessage && systemMessage.content) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    if (functionDeclarations && functionDeclarations.length > 0) {
      requestBody.tools = [
        {
          functionDeclarations,
        },
      ];
    }

    // Set up request timeout
    const timeoutDuration = config?.timeoutMs || this.timeoutMs;
    const timeoutSignal = AbortSignal.timeout(timeoutDuration);
    const combinedSignal = signal
      ? AbortSignal.any([timeoutSignal, signal])
      : timeoutSignal;

    // Ordered list of models to try if the primary model is rate-limited (429), busy (503) or not found (404)
    const fallbackCandidates = [
      activeModel,
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
      'gemini-3.6-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ];
    const modelsToTry = Array.from(new Set(fallbackCandidates.filter(Boolean))) as string[];

    let response: Response | null = null;
    let lastErrorMsg = '';
    let lastStatus = 500;

    for (const modelCandidate of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelCandidate
      )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: combinedSignal,
        });
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error) {
          if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
            logger.warn('Gemini Provider request timed out or was aborted', {
              event: 'gemini_provider_timeout',
              timeoutMs: timeoutDuration,
            });
            throw new TimeoutError(`Request exceeded timeout of ${timeoutDuration}ms`);
          }
        }
        logger.error('Failed to reach Gemini Provider', {
          event: 'gemini_provider_network_error',
        });
        throw new ProviderUnavailableError('Unable to connect to Gemini provider network.');
      }

      if (response.ok) {
        break; // Success! Proceed to parse
      }

      lastStatus = response.status;
      try {
        const errorJson = await response.json();
        lastErrorMsg = errorJson?.error?.message || '';
      } catch {
        lastErrorMsg = '';
      }

      logger.warn('Gemini Provider model returned non-200 status', {
        event: 'gemini_provider_error_status',
        model: modelCandidate,
        statusCode: lastStatus,
        errorMessage: lastErrorMsg,
      });

      // If key is invalid, do not retry other models
      if (lastStatus === 400 && lastErrorMsg.includes('API_KEY_INVALID')) {
        throw new AuthenticationError('Invalid Gemini API key.');
      }
      if (lastStatus === 401 || lastStatus === 403) {
        throw new AuthenticationError('Invalid or unauthorized Gemini provider credentials.');
      }

      // If 429 (rate limit / quota), 503 (high demand) or 404 (model moved/deprecated), try next fallback model
      if ((lastStatus === 429 || lastStatus === 503 || lastStatus === 404) && modelCandidate !== modelsToTry[modelsToTry.length - 1]) {
        logger.info('Retrying with fallback Gemini model', {
          failedModel: modelCandidate,
          statusCode: lastStatus,
          errorMessage: lastErrorMsg,
        });
        // Brief pause before trying next candidate
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }

      // If all models exhausted their rate limits
      if (lastStatus === 429) {
        const retryHeader = response.headers.get('retry-after');
        const retrySeconds = retryHeader ? parseInt(retryHeader, 10) : undefined;
        throw new RateLimitError(
          'Gemini rate limit reached. Please wait a few seconds before sending another message, or switch AI_MOCK_MODE=true in .env.local.',
          retrySeconds
        );
      }

      break;
    }

    if (!response || !response.ok) {
      if (lastStatus >= 500) {
        throw new ProviderUnavailableError(`Gemini server error: ${lastErrorMsg || 'Please retry shortly.'}`);
      }
      throw new MalformedResponseError(`Gemini rejected request with status ${lastStatus}: ${lastErrorMsg}`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new MalformedResponseError('Gemini returned non-JSON response.');
    }

    // Validate candidates
    if (
      typeof data !== 'object' ||
      data === null ||
      !('candidates' in data) ||
      !Array.isArray((data as { candidates: unknown[] }).candidates) ||
      (data as { candidates: unknown[] }).candidates.length === 0
    ) {
      throw new MalformedResponseError('Gemini response is missing candidates array.');
    }

    const firstCandidate = (data as {
      candidates: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            functionCall?: {
              name?: string;
              args?: Record<string, unknown>;
            };
          }>;
        };
        finishReason?: string;
      }>;
    }).candidates[0];

    const parts = firstCandidate?.content?.parts || [];
    let textContent = '';
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
      if (part.text) {
        textContent += part.text;
      }
      if (part.functionCall && part.functionCall.name) {
        toolCalls.push({
          name: part.functionCall.name,
          arguments: part.functionCall.args || {},
        });
      }
    }

    if (toolCalls.length > 0) {
      return {
        content: textContent,
        toolCalls,
        finishReason: 'tool_calls',
      };
    }

    return {
      content: textContent,
      finishReason: firstCandidate.finishReason === 'STOP' ? 'stop' : 'length',
    };
  }
}
