// ===========================================
// Mock AI Provider — Offline Development & Testing (Phase 3)
// ===========================================

import {
  AIProvider,
  AIProviderConfig,
  AIProviderMessage,
  AIProviderResponse,
  ToolDefinition,
} from '@/types/chat';
import { ProviderUnavailableError, MalformedResponseError } from './errors';

export interface MockProviderOptions {
  simulateLatency?: boolean;
}

/**
 * Mock AI provider for local development and offline testing without API credentials.
 * Produces deterministic, safe responses and simulates function calling.
 */
export class MockAIProvider implements AIProvider {
  public readonly name = 'mock';
  private readonly simulateLatency: boolean;

  constructor(options?: MockProviderOptions) {
    // Disable latency in test environment by default
    this.simulateLatency =
      options?.simulateLatency ?? (process.env.NODE_ENV !== 'test');
  }

  async chat(
    messages: AIProviderMessage[],
    tools?: ToolDefinition[],
    config?: Partial<AIProviderConfig>,
    signal?: AbortSignal
  ): Promise<AIProviderResponse> {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    if (this.simulateLatency) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return {
        content:
          "I'm here to help! What would you like to know about our products or wholesale options?\n\n*[Mock Mode Active]*",
        finishReason: 'stop',
      };
    }

    const text = lastMessage.content;
    const lower = text.toLowerCase();

    // ── Deterministic Test Hooks ──
    if (text.includes('__test_simulate_failure__')) {
      throw new ProviderUnavailableError('Simulated provider failure for test coverage.');
    }

    if (text.includes('__test_simulate_malformed__')) {
      throw new MalformedResponseError('Simulated malformed response for test coverage.');
    }

    // ── Tool Simulation ──
    if (tools && tools.length > 0) {
      // 0. Categories lookup
      if (lower.includes('category') || lower.includes('categories') || lower.includes('browse catalog')) {
        return {
          content: '',
          toolCalls: [
            {
              name: 'getProductCategories',
              arguments: {},
            },
          ],
          finishReason: 'tool_calls',
        };
      }

      // 1. Wholesale pricing search
      if (
        (lower.includes('wholesale') || lower.includes('bulk') || lower.includes('quote') || lower.includes('discount')) &&
        (lower.includes('price') || lower.includes('rate') || lower.includes('tier') || lower.includes('pieces') || lower.includes('units') || lower.includes('units of') || lower.includes('for 25'))
      ) {
        const qtyMatch = lower.match(/(\d+)\s*(?:units?|pcs?|pieces?|qty)?/);
        const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 25;

        let productId = 'prod-012'; // default: office chair
        if (lower.includes('inverter') || lower.includes('luminous')) productId = 'prod-inv-001';
        else if (lower.includes('rice') || lower.includes('basmati')) productId = 'prod-grain-001';
        else if (lower.includes('scooter') || lower.includes('ev') || lower.includes('ather')) productId = 'prod-ev-001';
        else if (lower.includes('chair') || lower.includes('office')) productId = 'prod-012';
        else if (lower.includes('atta') || lower.includes('aashirvaad')) productId = 'prod-atta-001';
        else if (lower.includes('oil') || lower.includes('ghee')) productId = 'prod-oil-001';

        return {
          content: '',
          toolCalls: [
            {
              name: 'getWholesalePrice',
              arguments: { productId, quantity },
            },
          ],
          finishReason: 'tool_calls',
        };
      }

      // 2. Inventory check
      if (lower.includes('inventory') || lower.includes('stock') || lower.includes('available') || lower.includes('in stock')) {
        let productId = 'prod-012';
        if (lower.includes('inverter')) productId = 'prod-inv-001';
        else if (lower.includes('rice')) productId = 'prod-grain-001';
        else if (lower.includes('scooter')) productId = 'prod-ev-001';
        else if (lower.includes('chair')) productId = 'prod-012';
        else if (lower.includes('oil')) productId = 'prod-oil-001';

        return {
          content: '',
          toolCalls: [
            {
              name: 'checkInventory',
              arguments: { productId, quantity: 10 },
            },
          ],
          finishReason: 'tool_calls',
        };
      }

      // 3. Product Search (English & Hinglish)
      if (
        lower.includes('search') ||
        lower.includes('find') ||
        lower.includes('look for') ||
        lower.includes('show') ||
        lower.includes('product') ||
        lower.includes('catalog') ||
        lower.includes('chahiye') ||
        lower.includes('dikhao') ||
        lower.includes('inverter') ||
        lower.includes('rice') ||
        lower.includes('scooter') ||
        lower.includes('chair') ||
        lower.includes('atta') ||
        lower.includes('dal') ||
        lower.includes('cycle')
      ) {
        let query = extractSearchKeyword(lower);
        let maxPrice: number | undefined;

        const underPriceMatch = lower.match(/(?:under|below|less than|kam)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
        if (underPriceMatch) {
          maxPrice = parseInt(underPriceMatch[1], 10);
        }

        if (lower.includes('inverter')) query = 'inverter';
        else if (lower.includes('rice')) query = 'rice';
        else if (lower.includes('scooter')) query = 'scooter';
        else if (lower.includes('chair')) query = 'chair';
        else if (lower.includes('atta')) query = 'atta';
        else if (lower.includes('cycle')) query = 'cycle';
        else if (lower.includes('oil')) query = 'oil';

        return {
          content: '',
          toolCalls: [
            {
              name: 'searchProducts',
              arguments: {
                query,
                maxPrice,
                limit: 6,
              },
            },
          ],
          finishReason: 'tool_calls',
        };
      }

      // 4. Policy & Customer Support lookup
      if (
        lower.includes('return') ||
        lower.includes('vapas') ||
        lower.includes('wapas') ||
        lower.includes('cancel') ||
        lower.includes('refund') ||
        lower.includes('delivery') ||
        lower.includes('shipping') ||
        lower.includes('kab tak') ||
        lower.includes('kab aayega') ||
        lower.includes('kitne din') ||
        lower.includes('pincode')
      ) {
        return {
          content: '',
          toolCalls: [
            {
              name: 'lookupStorePolicy',
              arguments: { query: text },
            },
          ],
          finishReason: 'tool_calls',
        };
      }
    }

    // ── Conversational Responses (with clear mock label) ──
    const label = '\n\n*(Demo/Mock Mode: No live AI billing)*';
    const isHinglish = /\b(kya|hai|hain|mujhe|dikhao|batao|chahiye|kitna|kitne|kaise|sasta|accha|achha|bhai|wapas|vapas|karein|milega|hoga|karo|bhi|nahi|nahin|aur|ke|ka|ki|ko|se|par|ye|yeh|wo|woh|kripya|namaste)\b/i.test(lower);

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('namaste')) {
      return {
        content: isHinglish
          ? 'Namaste! Dwell Mart AI Assistant mein aapka swagat hai. Main aapko products search karne, wholesale pricing dekhne aur store policies check karne mein madad kar sakta hoon. Aapko kis product ya service ke baare mein janna hai?' + label
          : 'Hello! Welcome to Dwell Mart AI. I can assist you with product discovery, wholesale price quotes, and checking inventory across our 15 categories (including Staples, Inverters, EV Scooters, and Home products).' + label,
        finishReason: 'stop',
      };
    }

    if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('kaun ho') || lower.includes('kya kar sakte ho')) {
      return {
        content: isHinglish
          ? "Main **Dwell Mart AI Shopping & Wholesale Discovery Guide** hoon. Main aapko catalog se products dhoondhne, stock availability check karne aur wholesale volume discounts calculate karne mein madad karta hoon." + label
          : "I am the **Dwell Mart AI Shopping & Wholesale Discovery Guide**. I'm here to help you search our catalog, check stock availability, and calculate tiered wholesale volume discounts." + label,
        finishReason: 'stop',
      };
    }

    return {
      content: isHinglish
        ? `Aapke inquiry "${text.slice(0, 50)}" ke liye main Dwell Mart verified catalog check kar sakta hoon. Kya aap koi product dhoondhna chahte hain, wholesale bulk tiers dekhna chahte hain, ya stock check karna chahte hain?` + label
        : `Thank you for reaching out! I understand you are inquiring about "${text.slice(0, 50)}". Would you like me to search products, inspect wholesale bulk tiers, or check stock availability?` + label,
      finishReason: 'stop',
    };
  }
}

function extractSearchKeyword(message: string): string {
  const clean = message
    .replace(/(search|find|look for|show me|do you have|can i get|products?|catalog|chahiye|dikhao|mujhe|batao|kripya|accha|achha|best|sasta|wali|wale|ke liye|ka|ki|ke|bhai|bhi)/gi, '')
    .trim();
  return clean || 'staples';
}
