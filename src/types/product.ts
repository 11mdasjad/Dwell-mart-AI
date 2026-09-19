// ===========================================
// Core Application Types
// ===========================================

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity: number;
  minWholesaleQty: number;
  wholesalePriceTiers: WholesalePriceTier[];
  tags: string[];
  isMockData: true; // Always true — marks this as demo data
}

export interface WholesalePriceTier {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  discount: number; // percentage off retail
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

export interface InventoryStatus {
  productId: string;
  productName: string;
  available: boolean;
  stockQuantity: number;
  requestedQuantity: number;
  canFulfill: boolean;
  isMockData: true;
}

export interface WholesalePriceResult {
  productId: string;
  productName: string;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  totalPrice: number;
  discount: number;
  tierApplied: string;
  isMockData: true;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  filters: SearchFilters;
  isMockData: true;
}
