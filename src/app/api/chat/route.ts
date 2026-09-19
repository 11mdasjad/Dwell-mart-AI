// ===========================================
// POST /api/chat — Dwell Mart AI Chat Endpoint
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/id';
import { normalizeChatRequest } from '@/lib/validation';
import { processAgentChat } from '@/lib/ai/orchestrator';
import { checkRateLimit } from '@/lib/rate-limit';
import { AIError } from '@/lib/ai/errors';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

export const maxDuration = 30; // Max execution timeout for Vercel/Next.js
const MAX_REQUEST_BODY_BYTES = 64 * 1024; // 64 KB limit

export async function POST(request: NextRequest) {
  const requestId = generateId();
  const startTime = Date.now();

  // Extract client IP safely
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  try {
    // 1. Check request size limit
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_BODY_BYTES) {
      logger.warn('Chat request rejected: body too large', {
        requestId,
        clientIp,
        contentLength,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Request payload exceeds maximum allowed size (64KB).',
          code: 'PAYLOAD_TOO_LARGE',
        },
        { status: 413 }
      );
    }

    // 2. Sliding-window rate limit check
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil((rateCheck.resetAt - Date.now()) / 1000);
      logger.warn('Chat request rejected: rate limit exceeded', {
        requestId,
        clientIp,
        retryAfter,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait a moment before sending another message.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // 3. Parse JSON body safely
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload in request body.',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    // 4. Validate & normalize messages array
    let normalized;
    try {
      normalized = normalizeChatRequest(body);
    } catch (valErr) {
      if (valErr instanceof ZodError) {
        const errorDetails = valErr.issues.map((i) => i.message).join('; ');
        return NextResponse.json(
          {
            success: false,
            error: `Validation error: ${errorDetails}`,
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request structure. Expected { messages: [...] }.',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 5. Process through safe agent orchestrator
    const result = await processAgentChat(normalized.messages);

    const assistantMessage = {
      id: generateId(),
      role: 'assistant' as const,
      content: result.content,
      timestamp: Date.now(),
      toolCalls: result.toolCalls,
    };

    const durationMs = Date.now() - startTime;
    logger.info('Chat request successfully processed', {
      requestId,
      clientIp,
      durationMs,
      mockMode: result.mock,
    });

    // 6. Return consistent response contract
    return NextResponse.json(
      {
        success: true,
        message: assistantMessage,
        mock: result.mock,
        conversationId: normalized.conversationId,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;

    if (error instanceof AIError) {
      logger.error('Operational AI error handled', {
        requestId,
        clientIp,
        durationMs,
        errorCode: error.code,
        statusCode: error.statusCode,
      });

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Unexpected internal errors — never leak stack trace or internal details
    logger.error('Unhandled server exception during chat execution', {
      requestId,
      clientIp,
      durationMs,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing your message. Please try again.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

// Reject all other HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return GET();
}

export async function DELETE() {
  return GET();
}
