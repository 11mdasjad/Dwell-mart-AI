// ===========================================
// Agent Orchestrator — Safe AI Execution Engine
// ===========================================

import {
  AIProvider,
  AIProviderMessage,
  ClientMessage,
  ToolCallResult,
} from '@/types/chat';
import { SYSTEM_PROMPT, MOCK_MODE_ADDENDUM } from './system-prompt';
import { toolRegistry } from './tools/registry';
import { getAgentConfig, isMockModeActive } from './config';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { MockAIProvider } from './mock-provider';
import { logger } from '@/lib/logger';
import { AIError } from './errors';

export interface OrchestrationResult {
  content: string;
  toolCalls?: ToolCallResult[];
  mock: boolean;
}

export interface OrchestrationOptions {
  signal?: AbortSignal;
  maxToolLoops?: number;
}

/**
 * Creates or retrieves the configured AI provider instance
 */
export function resolveAIProvider(): AIProvider {
  const config = getAgentConfig();

  if (config.mockMode) {
    return new MockAIProvider();
  }

  if (config.provider === 'gemini' && config.geminiApiKey) {
    return new GeminiProvider({
      apiKey: config.geminiApiKey,
      model: config.model,
      timeoutMs: config.timeoutMs,
    });
  }

  if (config.provider === 'openai' && config.openaiApiKey) {
    return new OpenAIProvider({
      apiKey: config.openaiApiKey,
      model: config.model,
      timeoutMs: config.timeoutMs,
    });
  }

  return new MockAIProvider();
}

/**
 * Central agent orchestrator:
 * Validates untrusted conversation, enforces system rules,
 * executes controlled tools from whitelist, and produces normalized response.
 */
export async function processAgentChat(
  messages: ClientMessage[],
  options?: OrchestrationOptions
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const provider = resolveAIProvider();
  const isMock = isMockModeActive();

  // Enforce conversation history ceiling (max 30 messages)
  const safeHistory = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-30);

  if (safeHistory.length === 0) {
    throw new AIError('Cannot process empty conversation.', 'VALIDATION_ERROR', 400);
  }

  // Compose protected system prompt
  let systemInstructions = SYSTEM_PROMPT;
  if (isMock) {
    systemInstructions += MOCK_MODE_ADDENDUM;
  }

  // Detect if user is speaking in Hinglish
  const lastUserMessage = [...safeHistory].reverse().find((m) => m.role === 'user')?.content || '';
  const isHinglishQuery = /\b(kya|hai|hain|mujhe|dikhao|batao|chahiye|kitna|kitne|kaise|sasta|accha|achha|bhai|wapas|vapas|karein|milega|hoga|karo|bhi|nahi|nahin|aur|ke|ka|ki|ko|se|par|ye|yeh|wo|woh|kripya|namaste|shukriya|dhanyawad|order|pasand)\b/i.test(lastUserMessage);

  if (isHinglishQuery) {
    systemInstructions += `\n\n[MANDATORY LANGUAGE DIRECTIVE]: The user is speaking in Hinglish (Hindi written in English alphabet). You MUST respond completely in natural, polite, and fluent Hinglish. Explain prices, product benefits, and policies in Hinglish. DO NOT reply in pure English.`;
  }

  // Prepare provider messages (untrusted client cannot inject system role)
  const aiMessages: AIProviderMessage[] = [
    { role: 'system', content: systemInstructions },
    ...safeHistory.map((m) => ({ role: m.role, content: m.content })),
  ];

  logger.info('Processing agent chat', {
    event: 'chat_orchestration_start',
    messageCount: safeHistory.length,
    mockMode: isMock,
  });

  const toolDefinitions = toolRegistry.getDefinitions();
  const collectedToolResults: ToolCallResult[] = [];
  const maxLoops = options?.maxToolLoops ?? 3;
  let loopCount = 0;
  let currentMessages = [...aiMessages];

  while (loopCount < maxLoops) {
    loopCount++;

    const response = await provider.chat(
      currentMessages,
      toolDefinitions,
      undefined,
      options?.signal
    );

    // If no tool calls requested, we have the final assistant message
    if (!response.toolCalls || response.toolCalls.length === 0) {
      const durationMs = Date.now() - startTime;
      logger.info('Agent chat completed', {
        event: 'chat_orchestration_complete',
        durationMs,
        toolCount: collectedToolResults.length,
        mockMode: isMock,
      });

      return {
        content: response.content || 'I am here to help you with Dwell Mart wholesale.',
        toolCalls: collectedToolResults.length > 0 ? collectedToolResults : undefined,
        mock: isMock,
      };
    }

    // Execute requested tools from registry (enforcing whitelist)
    const newToolResults: ToolCallResult[] = [];
    for (const toolCall of response.toolCalls) {
      const result = await toolRegistry.execute(toolCall);
      collectedToolResults.push(result);
      newToolResults.push(result);
    }

    // Append assistant tool request and tool results to message stream
    currentMessages = [
      ...currentMessages,
      {
        role: 'assistant',
        content: response.content || `[Executed tools: ${newToolResults.map((t) => t.toolName).join(', ')}]`,
      },
      {
        role: 'system',
        content: `Tool Results:\n${JSON.stringify(
          newToolResults.map((t) => ({
            tool: t.toolName,
            success: t.success,
            data: t.result,
          }))
        )}`,
      },
    ];

    // For Mock Provider, synthesize formatted response directly from tool results
    if (isMock) {
      const formattedContent = formatMockToolResults(newToolResults);
      return {
        content: formattedContent,
        toolCalls: collectedToolResults,
        mock: true,
      };
    }
  }

  // Safety fallback if loop limit reached
  return {
    content: 'I have gathered the information for your request. How else may I assist you with Dwell Mart products?',
    toolCalls: collectedToolResults.length > 0 ? collectedToolResults : undefined,
    mock: isMock,
  };
}

/**
 * Format simulated tool results into user-friendly responses for Mock mode
 */
function formatMockToolResults(toolResults: ToolCallResult[]): string {
  const parts: string[] = [];

  for (const tr of toolResults) {
    if (
      tr.toolName === 'searchProducts' ||
      tr.toolName === 'filterProducts' ||
      tr.toolName === 'getProductsByCategory'
    ) {
      const data = tr.result as {
        products?: Array<{
          name: string;
          category: string;
          brand?: string;
          price?: number;
          stockStatus?: string;
          inStock?: boolean;
        }>;
        totalResults?: number;
        category?: string;
      };

      if (data.products && data.products.length > 0) {
        const header = data.category
          ? `Here are available products in **${data.category}**:`
          : 'Here are matching products from our catalog:';
        parts.push(header);

        for (const p of data.products) {
          const priceStr = typeof p.price === 'number' ? `₹${p.price.toLocaleString('en-IN')}` : 'Price unlisted';
          const stock = p.stockStatus === 'in_stock' || p.inStock ? 'In Stock' : 'Low Stock / Order to Source';
          parts.push(`- **${p.name}** (${p.brand ? p.brand + ' · ' : ''}${p.category}) — ${priceStr} [${stock}]`);
        }
      } else {
        parts.push('No products matched your exact query in the demonstration catalog. You can browse categories like **Staples & Grains**, **Inverters**, **Electric Scooters**, or **Home & General Products**.');
      }
    } else if (tr.toolName === 'getProductById' || tr.toolName === 'getProductDetails') {
      const data = tr.result as {
        product?: {
          name: string;
          category: string;
          brand?: string;
          price?: number;
          wholesalePrice?: number;
          description: string;
          stockStatus?: string;
          minimumOrderQuantity?: number;
        };
      };
      if (data.product) {
        const p = data.product;
        const formattedPrice = typeof p.price === 'number' ? `₹${p.price.toLocaleString('en-IN')}` : 'N/A';
        const formattedWholesale = typeof p.wholesalePrice === 'number' ? `- **Wholesale Tier Unit:** ₹${p.wholesalePrice.toLocaleString('en-IN')}\n` : '';
        parts.push(
          `### ${p.name}\n` +
          `- **Category:** ${p.category}\n` +
          `- **Brand:** ${p.brand || 'Dwell Mart'}\n` +
          `- **Retail Price:** ${formattedPrice}\n` +
          formattedWholesale +
          (p.minimumOrderQuantity ? `- **MOQ:** ${p.minimumOrderQuantity} units\n` : '') +
          `- **Description:** ${p.description}`
        );
      } else {
        parts.push('Product details are currently unavailable.');
      }
    } else if (tr.toolName === 'getProductCategories') {
      const data = tr.result as {
        categories?: Array<{ name: string; productCount: number; subcategories: string[] }>;
      };
      if (data.categories && data.categories.length > 0) {
        parts.push('### Available Wholesale & Retail Categories:\n');
        for (const c of data.categories) {
          parts.push(`- **${c.name}** (${c.productCount} items) — Subcategories: ${c.subcategories.slice(0, 3).join(', ')}`);
        }
      }
    } else if (tr.toolName === 'getWholesalePrice') {
      if (!tr.success || !tr.result || typeof tr.result !== 'object') {
        parts.push(tr.error || 'Wholesale pricing information is currently unavailable.');
        continue;
      }
      const data = tr.result as Record<string, unknown>;
      const productName = (data.productName as string) || 'Selected Product';
      const quantity = (data.quantity as number) || 1;
      const retailPrice = (data.retailPrice as number) ?? (data.basePrice as number) ?? 0;
      const wholesalePrice = (data.wholesalePrice as number) ?? (data.unitPrice as number) ?? retailPrice;
      const totalPrice = (data.totalPrice as number) ?? wholesalePrice * quantity;
      const discount = (data.discount as number) ?? (data.discountPercent as number) ?? 0;
      const savings = (data.savings as number) ?? Math.max(0, (retailPrice - wholesalePrice) * quantity);
      const tier = (data.tierApplied as string) ?? (data.tierName as string) ?? 'Standard Wholesale Tier';

      parts.push(
        `### Wholesale Quote: ${productName}\n\n` +
        `| Metric | Details |\n` +
        `|---|---|\n` +
        `| **Quantity** | ${quantity} units |\n` +
        `| **Tier** | ${tier} (${discount}% off) |\n` +
        `| **Unit Price** | ₹${wholesalePrice.toLocaleString('en-IN')} (Retail: ₹${retailPrice.toLocaleString('en-IN')}) |\n` +
        `| **Total Order Value** | ₹${totalPrice.toLocaleString('en-IN')} |\n` +
        `| **Total Savings** | ₹${savings.toLocaleString('en-IN')} |\n\n` +
        `*Note: Demo wholesale calculation based on simulated catalog tiers.*`
      );
    } else if (tr.toolName === 'checkInventory') {
      if (!tr.success || !tr.result || typeof tr.result !== 'object') {
        parts.push(tr.error || 'Inventory status is currently unavailable.');
        continue;
      }
      const data = tr.result as Record<string, unknown>;
      const productName = (data.productName as string) || 'Product';
      const available = Boolean(data.available);
      const currentStock = (data.currentStock as number) ?? (data.stockQuantity as number) ?? 0;
      const leadTimeDays = (data.leadTimeDays as number) ?? 3;

      parts.push(
        `**Inventory Status for ${productName}**:\n` +
        `- Availability: **${available ? 'Ready to Ship' : 'Insufficient Immediate Stock'}**\n` +
        `- Warehouse Stock: ${currentStock} units\n` +
        `- Estimated Fulfillment Lead Time: ${leadTimeDays} business days\n`
      );
    } else {
      parts.push(`Completed action for **${tr.toolName}**.`);
    }
  }

  return parts.join('\n\n') + '\n\n*(Notice: Results are provided from demo catalog data. Final wholesale pricing must be confirmed through official Dwell Mart sales channels.)*';
}
