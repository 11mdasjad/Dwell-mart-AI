// ===========================================
// Repository Interfaces — Integration Ready
// ===========================================
// These interfaces abstract data access so the mock
// implementation can be replaced with real API calls.
// ===========================================

import {
  Product,
  Category,
  SearchFilters,
  SearchResult,
  InventoryStatus,
  WholesalePriceResult,
} from '@/types/product';

export interface ProductRepository {
  search(filters: SearchFilters): Promise<SearchResult>;
  getById(id: string): Promise<Product | null>;
  getByCategory(category: string): Promise<Product[]>;
  getCategories(): Promise<Category[]>;
}

export interface InventoryRepository {
  checkAvailability(productId: string, quantity: number): Promise<InventoryStatus | null>;
}

export interface WholesaleRepository {
  getPrice(productId: string, quantity: number): Promise<WholesalePriceResult | null>;
}
