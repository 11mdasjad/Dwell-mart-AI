// ===========================================
// Product Data Layer — Canonical Phase 3 Types
// ===========================================

export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
export type ProductDataSource = 'mock' | 'live';

export interface WholesalePriceTier {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  discount: number; // percentage off retail (e.g. 20 for 20%)
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price?: number; // Retail price in INR, undefined if unlisted
  wholesalePrice?: number; // Verified base wholesale price if available
  currency: string; // Defaults to 'INR'
  imageUrl?: string;
  productUrl?: string; // Verified canonical URL only, NEVER guessed
  stockStatus: ProductStockStatus;
  availableQuantity?: number;
  minimumOrderQuantity?: number; // MOQ for wholesale inquiries
  tags: string[];
  source: ProductDataSource;
  lastUpdated?: string;

  // Backward compatibility fields
  unit?: string;
  inStock?: boolean;
  stockQuantity?: number;
  minWholesaleQty?: number;
  wholesalePriceTiers?: WholesalePriceTier[];
  isMockData?: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
  subcategories: string[];
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: ProductStockStatus;
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductSearchResult {
  products: Product[];
  totalResults: number;
  appliedFilters: ProductSearchParams;
  dataSource: ProductDataSource;
  warnings?: string[];
}

// ── Wholesale Inquiry Types ──
export interface WholesaleInquiryRequest {
  productId?: string;
  productName: string;
  quantity: number;
  targetBudget?: number;
  deliveryLocation?: string;
  customerNotes?: string;
}

export interface WholesaleInquiryRecord extends WholesaleInquiryRequest {
  id: string;
  createdAt: number;
  status: 'draft' | 'confirmed' | 'simulated';
  source: 'demo_flow';
}

// ── Adapter Contract ──
export interface ProductCatalogAdapter {
  readonly name: string;
  readonly dataSource: ProductDataSource;

  searchProducts(params: ProductSearchParams): Promise<ProductSearchResult>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByCategory(category: string, subcategory?: string, limit?: number): Promise<ProductSearchResult>;
  filterProducts(params: ProductSearchParams): Promise<ProductSearchResult>;
  getCategories(): Promise<CategoryInfo[]>;
}
