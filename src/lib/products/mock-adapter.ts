// ===========================================
// Mock Product Catalog Adapter — Phase 3
// ===========================================
// Provides in-memory search, category filtering,
// brand filtering, price boundaries, and stock checks.
// Clearly labels data with source: 'mock'.
// ===========================================

import {
  Product,
  CategoryInfo,
  ProductSearchParams,
  ProductSearchResult,
  ProductCatalogAdapter,
} from './types';
import { productSearchParamsSchema } from './schemas';
import { MOCK_PRODUCTS_DATA, MOCK_CATEGORIES_DATA } from './mock-catalog';

export class MockProductAdapter implements ProductCatalogAdapter {
  public readonly name = 'mock-product-adapter';
  public readonly dataSource = 'mock' as const;

  private products: Product[];
  private categories: CategoryInfo[];

  constructor(customProducts?: Product[], customCategories?: CategoryInfo[]) {
    this.products = customProducts || MOCK_PRODUCTS_DATA;
    this.categories = customCategories || MOCK_CATEGORIES_DATA;
  }

  /**
   * Search products by text query, category, brand, and price filters
   */
  async searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
    const validated = productSearchParamsSchema.parse(params);
    return this.applyFilters(validated);
  }

  /**
   * Look up a single product by exact ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const cleanId = (id || '').trim().toLowerCase();
    if (!cleanId) return null;

    const match = this.products.find(
      (p) => p.id.toLowerCase() === cleanId || p.slug.toLowerCase() === cleanId
    );
    return match ? { ...match } : null;
  }

  /**
   * Retrieve products belonging to a specific category or subcategory
   */
  async getProductsByCategory(
    category: string,
    subcategory?: string,
    limit = 10
  ): Promise<ProductSearchResult> {
    return this.searchProducts({
      category,
      subcategory,
      limit,
    });
  }

  /**
   * Advanced multi-faceted filtering
   */
  async filterProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
    return this.searchProducts(params);
  }

  /**
   * Retrieve list of all available categories
   */
  async getCategories(): Promise<CategoryInfo[]> {
    return this.categories.map((c) => ({
      ...c,
      productCount: this.products.filter(
        (p) => p.category.toLowerCase() === c.name.toLowerCase()
      ).length,
    }));
  }

  /**
   * Core in-memory filter engine
   */
  private applyFilters(filters: ProductSearchParams): ProductSearchResult {
    const query = filters.query?.trim().toLowerCase();
    const category = filters.category?.trim().toLowerCase();
    const subcategory = filters.subcategory?.trim().toLowerCase();
    const brand = filters.brand?.trim().toLowerCase();
    const minPrice = filters.minPrice;
    const maxPrice = filters.maxPrice;
    const stockStatus = filters.stockStatus;
    const inStockOnly = filters.inStockOnly;
    const limit = Math.min(Math.max(filters.limit || 10, 1), 20);
    const offset = Math.max(filters.offset || 0, 0);

    const filtered = this.products.filter((p) => {
      // 1. Text query matching (name, description, tags, brand, category)
      if (query) {
        const nameMatch = p.name.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        const brandMatch = p.brand?.toLowerCase().includes(query);
        const catMatch = p.category.toLowerCase().includes(query);
        const tagMatch = p.tags.some((t) => t.toLowerCase().includes(query));

        // Substring word tokens match
        const queryTokens = query.split(/\s+/).filter(Boolean);
        const tokensMatch = queryTokens.length > 1 && queryTokens.every(token =>
          p.name.toLowerCase().includes(token) ||
          p.description.toLowerCase().includes(token) ||
          p.tags.some(t => t.toLowerCase().includes(token))
        );

        if (!nameMatch && !descMatch && !brandMatch && !catMatch && !tagMatch && !tokensMatch) {
          return false;
        }
      }

      // 2. Category matching (case-insensitive, partial matching)
      if (category) {
        const catLower = p.category.toLowerCase();
        if (catLower !== category && !catLower.includes(category) && !category.includes(catLower)) {
          return false;
        }
      }

      // 3. Subcategory matching
      if (subcategory && p.subcategory) {
        const subLower = p.subcategory.toLowerCase();
        if (subLower !== subcategory && !subLower.includes(subcategory)) {
          return false;
        }
      }

      // 4. Brand matching
      if (brand && p.brand) {
        if (!p.brand.toLowerCase().includes(brand)) {
          return false;
        }
      }

      // 5. Price bounds
      if (p.price !== undefined) {
        if (minPrice !== undefined && p.price < minPrice) return false;
        if (maxPrice !== undefined && p.price > maxPrice) return false;
      }

      // 6. Stock status
      if (stockStatus && p.stockStatus !== stockStatus) {
        return false;
      }

      if (inStockOnly && p.stockStatus !== 'in_stock') {
        return false;
      }

      return true;
    });

    const totalResults = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      products: paginated,
      totalResults,
      appliedFilters: filters,
      dataSource: this.dataSource,
      warnings: [
        'Notice: Results are provided from the demonstration mock catalog and do not represent verified live Dwell Mart inventory.',
      ],
    };
  }
}
