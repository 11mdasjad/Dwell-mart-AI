// ===========================================
// Mock Repository Implementations
// ===========================================

import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/data/mock-catalog';
import {
  Product,
  Category,
  SearchFilters,
  SearchResult,
  InventoryStatus,
  WholesalePriceResult,
} from '@/types/product';
import {
  ProductRepository,
  InventoryRepository,
  WholesaleRepository,
} from './interfaces';

export class MockProductRepository implements ProductRepository {
  async search(filters: SearchFilters): Promise<SearchResult> {
    let results = [...MOCK_PRODUCTS];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters.category) {
      const cat = filters.category.toLowerCase();
      results = results.filter(
        (p) => p.category.toLowerCase().includes(cat)
      );
    }

    if (filters.brand) {
      const brand = filters.brand.toLowerCase();
      results = results.filter(
        (p) => p.brand.toLowerCase().includes(brand)
      );
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.inStockOnly) {
      results = results.filter((p) => p.inStock);
    }

    const totalCount = results.length;
    const limit = filters.limit ?? 10;
    results = results.slice(0, limit);

    return {
      products: results,
      totalCount,
      filters,
      isMockData: true,
    };
  }

  async getById(id: string): Promise<Product | null> {
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  async getByCategory(category: string): Promise<Product[]> {
    const cat = category.toLowerCase();
    return MOCK_PRODUCTS.filter((p) =>
      p.category.toLowerCase().includes(cat)
    );
  }

  async getCategories(): Promise<Category[]> {
    return [...MOCK_CATEGORIES];
  }
}

export class MockInventoryRepository implements InventoryRepository {
  async checkAvailability(
    productId: string,
    quantity: number
  ): Promise<InventoryStatus | null> {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return null;

    return {
      productId: product.id,
      productName: product.name,
      available: product.inStock,
      stockQuantity: product.stockQuantity,
      requestedQuantity: quantity,
      canFulfill: product.inStock && product.stockQuantity >= quantity,
      isMockData: true,
    };
  }
}

export class MockWholesaleRepository implements WholesaleRepository {
  async getPrice(
    productId: string,
    quantity: number
  ): Promise<WholesalePriceResult | null> {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return null;

    if (quantity < product.minWholesaleQty) {
      return {
        productId: product.id,
        productName: product.name,
        retailPrice: product.price,
        wholesalePrice: product.price,
        quantity,
        totalPrice: product.price * quantity,
        discount: 0,
        tierApplied: `Minimum wholesale quantity is ${product.minWholesaleQty} units. Retail pricing applied.`,
        isMockData: true,
      };
    }

    // Find the applicable tier
    const tier = product.wholesalePriceTiers.find(
      (t) => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)
    );

    if (!tier) {
      return {
        productId: product.id,
        productName: product.name,
        retailPrice: product.price,
        wholesalePrice: product.price,
        quantity,
        totalPrice: product.price * quantity,
        discount: 0,
        tierApplied: 'No applicable tier found. Retail pricing applied.',
        isMockData: true,
      };
    }

    return {
      productId: product.id,
      productName: product.name,
      retailPrice: product.price,
      wholesalePrice: tier.pricePerUnit,
      quantity,
      totalPrice: tier.pricePerUnit * quantity,
      discount: tier.discount,
      tierApplied: `${tier.minQty}–${tier.maxQty ?? '∞'} units (${tier.discount}% off)`,
      isMockData: true,
    };
  }
}
