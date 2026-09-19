// ===========================================
// Zod Validation Schemas & Input Sanitization
// ===========================================

import { z } from 'zod';
import { ClientMessage } from '@/types/chat';

// ── Client Message Schema (Strict: only user/assistant allowed) ──
export const clientMessageSchema = z.object({
  role: z.enum(['user', 'assistant'], {
    message: 'Role must be either "user" or "assistant". System messages from clients are not permitted.',
  }),
  content: z
    .string({
      message: 'Message content must be a string.',
    })
    .trim()
    .min(1, 'Message content cannot be empty.')
    .max(4000, 'Message content cannot exceed 4,000 characters.'),
});

// ── Canonical Chat Request Schema ──
export const canonicalChatRequestSchema = z.object({
  messages: z
    .array(clientMessageSchema, {
      message: 'Messages must be an array of message objects.',
    })
    .min(1, 'At least one message is required.')
    .max(30, 'Conversation history cannot exceed 30 messages.'),
  conversationId: z.string().max(100).optional(),
});

// ── Backward Compatible Legacy Schema ──
export const legacyChatRequestSchema = z.object({
  message: z
    .string({
      message: 'Message must be a string.',
    })
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(4000, 'Message cannot exceed 4,000 characters.'),
  conversationId: z.string().max(100).optional(),
  history: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(['user', 'assistant', 'system']).optional(),
        content: z.string().max(4000),
        timestamp: z.number().optional(),
      })
    )
    .max(30)
    .optional(),
});

// Combined schema for request parsing
export const chatRequestSchema = z.union([
  canonicalChatRequestSchema,
  legacyChatRequestSchema,
]);

/**
 * Normalizes any valid incoming request into canonical ClientMessage[] format
 */
export function normalizeChatRequest(body: unknown): {
  messages: ClientMessage[];
  conversationId?: string;
} {
  // First attempt canonical format
  const canonicalResult = canonicalChatRequestSchema.safeParse(body);
  if (canonicalResult.success) {
    return {
      messages: canonicalResult.data.messages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      })),
      conversationId: canonicalResult.data.conversationId,
    };
  }

  // Next attempt legacy format
  const legacyResult = legacyChatRequestSchema.safeParse(body);
  if (legacyResult.success) {
    const messages: ClientMessage[] = [];

    if (legacyResult.data.history) {
      for (const item of legacyResult.data.history) {
        const role = item.role === 'assistant' ? 'assistant' : 'user';
        if (item.content && item.content.trim().length > 0) {
          messages.push({
            role,
            content: sanitizeInput(item.content),
          });
        }
      }
    }

    messages.push({
      role: 'user',
      content: sanitizeInput(legacyResult.data.message),
    });

    return {
      messages: messages.slice(-30),
      conversationId: legacyResult.data.conversationId,
    };
  }

  // If both failed, re-parse with canonical to throw detailed error
  canonicalChatRequestSchema.parse(body);
  throw new Error('Invalid request format');
}

// ── Tool Argument Schemas ──
export const searchProductsArgsSchema = z.object({
  query: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export const getProductDetailsArgsSchema = z.object({
  productId: z.string().trim().min(1).max(100),
});

export const checkInventoryArgsSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(10000),
});

export const getWholesalePriceArgsSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(10000),
});

// ── Defensive Sanitization ──
export function sanitizeInput(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\0/g, '') // Strip null bytes
    .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Strip control chars
    .trim();
}

export function sanitizeForDisplay(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
