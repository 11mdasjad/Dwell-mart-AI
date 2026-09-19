import {
  Product,
  Category,
  Brand,
  Vendor,
  CatalogSearchFilters,
  CatalogSearchResult,
  SyncMetrics,
} from '../types';
import { CategoryHierarchy } from '../hierarchy';

export interface CatalogProvider {
  readonly name: string;
  readonly isLive: boolean;

  search(filters?: CatalogSearchFilters): Promise<CatalogSearchResult>;
  getProductById(id: string): Promise<Product | null>;
  getCategories(): Promise<Category[]>;
  getCategoryHierarchy(): Promise<CategoryHierarchy>;
  getBrands(): Promise<Brand[]>;
  getVendors(): Promise<Vendor[]>;
  sync(options?: { force?: boolean }): Promise<SyncMetrics>;
  getMetrics(): SyncMetrics;
}
