// ===========================================
// Phase 3 — Product Discovery & Wholesale Tests
// ===========================================

import { MockProductAdapter } from '@/lib/products/mock-adapter';
import { executeTool } from '@/lib/ai/tool-executor';
import {
  createWholesaleInquiryDraft,
  saveConfirmedInquiry,
} from '@/lib/wholesale/inquiry-store';
import {
  productSearchParamsSchema,
  wholesaleInquiryRequestSchema,
} from '@/lib/products/schemas';

describe('Phase 3 — Product Discovery and Search Engine', () => {
  let adapter: MockProductAdapter;

  beforeEach(() => {
    adapter = new MockProductAdapter();
  });

  // 1. Search by name
  it('1. should search products by name case-insensitively', async () => {
    const result = await adapter.searchProducts({ query: 'basmati' });
    expect(result.totalResults).toBeGreaterThan(0);
    expect(result.products.some((p) => p.name.toLowerCase().includes('basmati'))).toBe(true);
    expect(result.dataSource).toBe('mock');
  });

  // 2. Category search
  it('2. should search and filter products by category', async () => {
    const result = await adapter.getProductsByCategory('Inverters');
    expect(result.totalResults).toBeGreaterThan(0);
    expect(result.products.every((p) => p.category === 'Inverters')).toBe(true);
  });

  // 3. Price filtering
  it('3. should filter products by price boundaries (e.g., inverter under 10000)', async () => {
    const result = await adapter.filterProducts({
      category: 'Inverters',
      maxPrice: 10000,
    });
    expect(result.totalResults).toBeGreaterThan(0);
    expect(result.products.every((p) => (p.price ?? Infinity) <= 10000)).toBe(true);
    // Should include Luminous Zelio+ (7499) and Microtek Luxe (8299)
    expect(result.products.some((p) => p.name.includes('Zelio+'))).toBe(true);
  });

  // 4. Brand filtering
  it('4. should filter products by brand name', async () => {
    const result = await adapter.searchProducts({ brand: 'Fortune' });
    expect(result.totalResults).toBeGreaterThan(0);
    expect(result.products.every((p) => p.brand?.toLowerCase() === 'fortune')).toBe(true);
  });

  // 5. Empty results handling
  it('5. should safely handle queries that yield zero matches', async () => {
    const result = await adapter.searchProducts({ query: 'nonexistent-quantum-widget-xyz' });
    expect(result.totalResults).toBe(0);
    expect(result.products).toEqual([]);
    expect(result.warnings).toBeDefined();
  });

  // 6. Invalid input rejection
  it('6. should reject invalid search parameters through Zod schema', () => {
    expect(() =>
      productSearchParamsSchema.parse({ minPrice: -500 })
    ).toThrow();

    expect(() =>
      productSearchParamsSchema.parse({ query: 'a'.repeat(250) })
    ).toThrow();
  });

  // 7. Result limits
  it('7. should enforce maximum result limits to prevent data flooding', async () => {
    const result = await adapter.searchProducts({ limit: 3 });
    expect(result.products.length).toBeLessThanOrEqual(3);
  });

  // 8. Mock/live source labeling
  it('8. should strictly label mock catalog data with source: mock', async () => {
    const result = await adapter.searchProducts({ limit: 10 });
    expect(result.dataSource).toBe('mock');
    expect(result.products.every((p) => p.source === 'mock')).toBe(true);
    expect(result.warnings?.[0]).toContain('demonstration mock catalog');
  });

  // 9. Categories listing
  it('9. should return all 15 required categories with item counts', async () => {
    const categories = await adapter.getCategories();
    expect(categories.length).toBe(15);
    const categoryNames = categories.map((c) => c.name);
    expect(categoryNames).toContain('Fresh Vegetables');
    expect(categoryNames).toContain('Staples & Grains');
    expect(categoryNames).toContain('Inverters');
    expect(categoryNames).toContain('Electric Scooters');
    expect(categoryNames).toContain('Cycles');
  });

  // 10. Product ID lookup
  it('10. should fetch single product by exact ID or slug', async () => {
    const product = await adapter.getProductById('prod-inv-001');
    expect(product).not.toBeNull();
    expect(product?.name).toContain('Luminous Zelio+');
    expect(product?.price).toBe(7499);
  });
});

describe('Phase 3 — AI Tool Executor Integration', () => {
  it('should execute searchProducts tool successfully', async () => {
    const toolCall = {
      name: 'searchProducts',
      arguments: { query: 'inverter', maxPrice: 10000 },
    };
    const result = await executeTool(toolCall);
    expect(result.success).toBe(true);
    const resData = result.result as Record<string, unknown>;
    expect(Array.isArray(resData.products)).toBe(true);
    expect(resData.dataSource).toBe('mock');
  });

  it('should execute getProductById tool successfully', async () => {
    const toolCall = {
      name: 'getProductById',
      arguments: { productId: 'prod-grain-001' },
    };
    const result = await executeTool(toolCall);
    expect(result.success).toBe(true);
    const resData = result.result as Record<string, unknown>;
    expect(resData.product).toBeDefined();
  });

  it('should execute getProductsByCategory tool successfully', async () => {
    const toolCall = {
      name: 'getProductsByCategory',
      arguments: { category: 'Electric Scooters' },
    };
    const result = await executeTool(toolCall);
    expect(result.success).toBe(true);
    const resData = result.result as Record<string, unknown>;
    expect(Array.isArray(resData.products)).toBe(true);
    expect(resData.category).toBe('Electric Scooters');
  });

  it('should execute getProductCategories tool successfully', async () => {
    const toolCall = {
      name: 'getProductCategories',
      arguments: {},
    };
    const result = await executeTool(toolCall);
    expect(result.success).toBe(true);
    const resData = result.result as Record<string, unknown>;
    expect(Array.isArray(resData.categories)).toBe(true);
    expect((resData.categories as unknown[]).length).toBe(15);
  });

  it('should calculate wholesale pricing correctly using catalog data', async () => {
    const toolCall = {
      name: 'getWholesalePrice',
      arguments: { productId: 'prod-012', quantity: 25 },
    };
    const result = await executeTool(toolCall);
    expect(result.success).toBe(true);
    const resData = result.result as Record<string, unknown>;
    expect(resData.totalPrice).toBe(227475); // 9099 * 25
  });
});

describe('Phase 3 — Wholesale Inquiry Workflow', () => {
  it('should create draft inquiry requiring confirmation before submission', () => {
    const inquiry = createWholesaleInquiryDraft({
      productName: 'Luminous Zelio+ 1100 Inverter',
      productId: 'prod-inv-001',
      quantity: 15,
      deliveryLocation: 'New Delhi',
      customerNotes: 'Require urgent dispatch within 3 days',
    });

    expect(inquiry.id).toMatch(/^inq-/);
    expect(inquiry.status).toBe('draft');
    expect(inquiry.quantity).toBe(15);
  });

  it('should transition to confirmed status upon explicit confirmation action', () => {
    const draft = createWholesaleInquiryDraft({
      productName: 'English Oven Bread Case',
      quantity: 20,
    });
    const confirmed = saveConfirmedInquiry(draft);
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.source).toBe('demo_flow');
  });

  it('should reject invalid inquiry submissions (e.g. 0 quantity or empty name)', () => {
    expect(() =>
      wholesaleInquiryRequestSchema.parse({
        productName: '',
        quantity: 10,
      })
    ).toThrow();

    expect(() =>
      wholesaleInquiryRequestSchema.parse({
        productName: 'Rice',
        quantity: -5,
      })
    ).toThrow();
  });
});
