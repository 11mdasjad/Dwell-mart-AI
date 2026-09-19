// ===========================================
// Tool Executor Tests
// ===========================================

import { executeTool } from '@/lib/ai/tool-executor';

describe('executeTool', () => {
  describe('searchProducts', () => {
    it('should return products for a valid search', async () => {
      const result = await executeTool({
        name: 'searchProducts',
        arguments: { query: 'ceramic', limit: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchProducts');
      const data = result.result as { products: unknown[]; totalCount: number };
      expect(data.products).toBeDefined();
      expect(Array.isArray(data.products)).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await executeTool({
        name: 'searchProducts',
        arguments: { query: 'xyznonexistent', limit: 5 },
      });

      expect(result.success).toBe(true);
      const data = result.result as { products: unknown[]; totalCount: number };
      expect(data.products.length).toBe(0);
      expect(data.totalCount).toBe(0);
    });

    it('should filter by category', async () => {
      const result = await executeTool({
        name: 'searchProducts',
        arguments: { query: 'products', category: 'Lighting', limit: 10 },
      });

      expect(result.success).toBe(true);
      const data = result.result as { products: Array<{ category: string }> };
      for (const product of data.products) {
        expect(product.category).toBe('Lighting');
      }
    });

    it('should reject invalid arguments', async () => {
      const result = await executeTool({
        name: 'searchProducts',
        arguments: { query: '', limit: 5 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getProductDetails', () => {
    it('should return product for valid ID', async () => {
      const result = await executeTool({
        name: 'getProductDetails',
        arguments: { productId: 'prod-001' },
      });

      expect(result.success).toBe(true);
      const data = result.result as { name: string; id: string };
      expect(data.id).toBe('prod-001');
      expect(data.name).toBeDefined();
    });

    it('should fail for non-existent product', async () => {
      const result = await executeTool({
        name: 'getProductDetails',
        arguments: { productId: 'prod-999' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('checkInventory', () => {
    it('should return inventory status', async () => {
      const result = await executeTool({
        name: 'checkInventory',
        arguments: { productId: 'prod-001', quantity: 10 },
      });

      expect(result.success).toBe(true);
      const data = result.result as { canFulfill: boolean; stockQuantity: number };
      expect(data.canFulfill).toBeDefined();
      expect(data.stockQuantity).toBeDefined();
    });

    it('should report cannot fulfill for out-of-stock product', async () => {
      const result = await executeTool({
        name: 'checkInventory',
        arguments: { productId: 'prod-005', quantity: 1 },
      });

      expect(result.success).toBe(true);
      const data = result.result as { canFulfill: boolean };
      expect(data.canFulfill).toBe(false);
    });

    it('should report cannot fulfill for excessive quantity', async () => {
      const result = await executeTool({
        name: 'checkInventory',
        arguments: { productId: 'prod-001', quantity: 9999 },
      });

      expect(result.success).toBe(true);
      const data = result.result as { canFulfill: boolean };
      expect(data.canFulfill).toBe(false);
    });
  });

  describe('getWholesalePrice', () => {
    it('should return wholesale pricing with discount', async () => {
      const result = await executeTool({
        name: 'getWholesalePrice',
        arguments: { productId: 'prod-001', quantity: 50 },
      });

      expect(result.success).toBe(true);
      const data = result.result as {
        wholesalePrice: number;
        retailPrice: number;
        discount: number;
      };
      expect(data.wholesalePrice).toBeLessThan(data.retailPrice);
      expect(data.discount).toBeGreaterThan(0);
    });

    it('should return retail price when below minimum wholesale qty', async () => {
      const result = await executeTool({
        name: 'getWholesalePrice',
        arguments: { productId: 'prod-001', quantity: 1 },
      });

      expect(result.success).toBe(true);
      const data = result.result as {
        wholesalePrice: number;
        retailPrice: number;
        discount: number;
      };
      expect(data.wholesalePrice).toBe(data.retailPrice);
      expect(data.discount).toBe(0);
    });
  });

  describe('unknown tool', () => {
    it('should return error for unknown tool name', async () => {
      const result = await executeTool({
        name: 'unknownTool',
        arguments: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });
});
