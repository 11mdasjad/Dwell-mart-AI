// ===========================================
// Mock Catalog Data Integrity Tests
// ===========================================

import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/data/mock-catalog';

describe('Mock Catalog', () => {
  it('should have exactly 20 products', () => {
    expect(MOCK_PRODUCTS.length).toBe(20);
  });

  it('should have exactly 5 categories', () => {
    expect(MOCK_CATEGORIES.length).toBe(5);
  });

  it('should have unique product IDs', () => {
    const ids = MOCK_PRODUCTS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique category IDs', () => {
    const ids = MOCK_CATEGORIES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all products should have isMockData = true', () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.isMockData).toBe(true);
    }
  });

  it('all products should have valid price > 0', () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it('all products should have at least one wholesale tier', () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.wholesalePriceTiers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('wholesale prices should be less than retail prices', () => {
    for (const product of MOCK_PRODUCTS) {
      for (const tier of product.wholesalePriceTiers) {
        expect(tier.pricePerUnit).toBeLessThan(product.price);
      }
    }
  });

  it('all product categories should match a known category', () => {
    const categoryNames = MOCK_CATEGORIES.map((c) => c.name);
    for (const product of MOCK_PRODUCTS) {
      expect(categoryNames).toContain(product.category);
    }
  });

  it('should have both in-stock and out-of-stock products', () => {
    const inStock = MOCK_PRODUCTS.filter((p) => p.inStock);
    const outOfStock = MOCK_PRODUCTS.filter((p) => !p.inStock);
    expect(inStock.length).toBeGreaterThan(0);
    expect(outOfStock.length).toBeGreaterThan(0);
  });
});
