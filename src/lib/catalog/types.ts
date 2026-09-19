/**
 * Comprehensive Product & Catalog Data Model for Dwell Mart AI Agent
 * Supports 100,000+ catalog scalability with strict typing and verified data tagging.
 */

export type SourceClassification =
  | 'VERIFIED_LIVE_DATA'
  | 'VERIFIED_IMPORTED_DATA'
  | 'VERIFIED_OFFICIAL_POLICY'
  | 'VERIFIED_PRODUCT_PAGE'
  | 'UNAVAILABLE'
  | 'DEVELOPMENT_MOCK';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'unavailable';

export interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  material?: string;
  sku?: string;
  price?: number;
  stock?: number;
}

export interface WholesalePriceTier {
  minQuantity: number;
  pricePerUnit: number;
  discountPercentage?: number;
}

export interface ProductShippingInfo {
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  deliveryEstimate?: string;
  source?: string;
}

/**
 * Validated Product Model containing all 35+ fields required by Dwell Mart
 */
export interface Product {
  // Identification
  id: string;
  name: string;
  slug: string;
  sku: string | null;

  // Descriptions
  description: string | null;
  shortDescription: string | null;

  // Categorization
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;

  // Brand & Seller
  brand: string | null;
  brandId: string | null;
  sellerId: string | null;
  sellerName: string | null;

  // Pricing & Currency
  sellingPrice: number | null;
  originalPrice: number | null;
  discount: number | null;
  currency: string;
  unit: string;

  // Variants & Attributes
  variants: ProductVariant[];
  size: string | null;
  color: string | null;
  material: string | null;
  gender: 'men' | 'women' | 'kids' | 'unisex' | 'all' | null;
  ageGroup: string | null;

  // Media & Links
  images: string[];
  image: string | null;
  video: string | null;
  url: string;

  // Inventory & Stock
  stockStatus: StockStatus;
  availableQuantity: number | null;
  minimumOrderQuantity: number;

  // Wholesale & B2B / B2C
  wholesalePrice: number | null;
  wholesaleTiers: WholesalePriceTier[];
  b2bAvailable: boolean;
  b2cAvailable: boolean;

  // Logistics & Policies
  deliveryInfo: string | null;
  shipping: ProductShippingInfo | null;
  warrantyInfo: string | null;
  codAllowed: boolean;
  returnable: boolean;
  cancelable: boolean;

  // Specifications & Technical Details
  specifications: Record<string, string | number | boolean>;
  tags: string[];
  status: 'active' | 'inactive' | 'draft';

  // Data Integrity & Audit
  sourceType: SourceClassification;
  lastUpdated: string;
  lastSynced: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parentName?: string | null;
  subcategoryId?: string | null;
  subcategoryName?: string | null;
  slug: string;
  url: string;
  imageUrl: string | null;
  isActive: boolean;
  productCount?: number;
  source: SourceClassification;
  lastSynced: string;
}

export interface CategoryHierarchyNode extends Category {
  children: CategoryHierarchyNode[];
  level: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  productCount: number;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  storeName: string;
  slug: string;
  storeLogo: string | null;
  isVerified: boolean;
  rating: number;
  productCount: number;
  location: string | null;
  b2bEnabled: boolean;
  b2cEnabled: boolean;
}

export interface CatalogSearchFilters {
  query?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  brand?: string;
  seller?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  b2bOnly?: boolean;
  b2cOnly?: boolean;
  gender?: string;
  size?: string;
  color?: string;
  material?: string;
  unit?: string;
  minMoq?: number;
  maxMoq?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'discount';
  page?: number;
  limit?: number;
}

export interface CatalogSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  source: SourceClassification;
  freshnessTimestamp: string;
  appliedFilters: Partial<CatalogSearchFilters>;
}

export interface SyncMetrics {
  totalProducts: number;
  totalCategories: number;
  totalSubcategories: number;
  totalBrands: number;
  totalSellers: number;
  productsWithPrice: number;
  productsWithoutPrice: number;
  productsWithImages: number;
  productsWithoutImages: number;
  productsWithStock: number;
  productsWithoutStock: number;
  duplicateProducts: number;
  orphanProducts: number;
  failedImports: number;
  lastSyncTimestamp: string | null;
  lastSyncDurationMs: number;
  currentDataSource: 'live' | 'import' | 'mock';
  mockModeEnabled: boolean;
  syncErrors: string[];
}
