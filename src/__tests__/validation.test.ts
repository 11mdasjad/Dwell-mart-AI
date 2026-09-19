// ===========================================
// Validation Tests
// ===========================================

import {
  chatRequestSchema,
  searchProductsArgsSchema,
  getProductDetailsArgsSchema,
  checkInventoryArgsSchema,
  getWholesalePriceArgsSchema,
  sanitizeInput,
  sanitizeForDisplay,
} from '@/lib/validation';

describe('chatRequestSchema', () => {
  it('should accept a valid message', () => {
    const result = chatRequestSchema.safeParse({ message: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('should reject an empty message', () => {
    const result = chatRequestSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('should reject a message that is too long', () => {
    const result = chatRequestSchema.safeParse({ message: 'a'.repeat(4001) });
    expect(result.success).toBe(false);
  });

  it('should accept optional conversationId', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Hello',
      conversationId: 'abc-123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional history', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Hello',
      history: [
        { id: '1', role: 'user', content: 'Hi', timestamp: 1234 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid role in history', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Hello',
      history: [
        { id: '1', role: 'admin', content: 'Hi', timestamp: 1234 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('searchProductsArgsSchema', () => {
  it('should accept valid search args', () => {
    const result = searchProductsArgsSchema.safeParse({ query: 'vase' });
    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const result = searchProductsArgsSchema.safeParse({
      query: 'kitchen',
      category: 'Kitchen & Dining',
      brand: 'ChefLine',
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty query', () => {
    const result = searchProductsArgsSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  it('should reject limit > 20', () => {
    const result = searchProductsArgsSchema.safeParse({ query: 'test', limit: 50 });
    expect(result.success).toBe(false);
  });
});

describe('getProductDetailsArgsSchema', () => {
  it('should accept valid product ID', () => {
    const result = getProductDetailsArgsSchema.safeParse({ productId: 'prod-001' });
    expect(result.success).toBe(true);
  });

  it('should reject empty product ID', () => {
    const result = getProductDetailsArgsSchema.safeParse({ productId: '' });
    expect(result.success).toBe(false);
  });
});

describe('checkInventoryArgsSchema', () => {
  it('should accept valid inventory check', () => {
    const result = checkInventoryArgsSchema.safeParse({
      productId: 'prod-001',
      quantity: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should reject quantity of 0', () => {
    const result = checkInventoryArgsSchema.safeParse({
      productId: 'prod-001',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject quantity over 10000', () => {
    const result = checkInventoryArgsSchema.safeParse({
      productId: 'prod-001',
      quantity: 10001,
    });
    expect(result.success).toBe(false);
  });
});

describe('getWholesalePriceArgsSchema', () => {
  it('should accept valid wholesale price request', () => {
    const result = getWholesalePriceArgsSchema.safeParse({
      productId: 'prod-001',
      quantity: 50,
    });
    expect(result.success).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('should escape HTML characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });
});

describe('sanitizeForDisplay', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeForDisplay(input)).toBe('Hello  World');
  });

  it('should remove javascript: URLs', () => {
    expect(sanitizeForDisplay('javascript:alert(1)')).toBe('alert(1)');
  });
});
