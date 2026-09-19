import { CatalogProvider } from './interface';
import {
  Product,
  Category,
  Brand,
  Vendor,
  CatalogSearchFilters,
  CatalogSearchResult,
  SyncMetrics,
} from '../types';
import { CatalogIndexer } from '../indexer';
import { CategoryHierarchy } from '../hierarchy';
import { CatalogIngestionEngine } from '../ingestion';
import { logger } from '../../logger';

export class ImportCatalogProvider implements CatalogProvider {
  public readonly name = 'Authorized Import Provider';
  public readonly isLive = false;

  private indexer: CatalogIndexer;
  private hierarchy: CategoryHierarchy;
  private ingestionEngine: CatalogIngestionEngine;
  private categories: Category[] = [];
  private brands: Brand[] = [];
  private vendors: Vendor[] = [];

  constructor(indexer?: CatalogIndexer) {
    this.indexer = indexer || new CatalogIndexer();
    this.hierarchy = new CategoryHierarchy();
    this.ingestionEngine = new CatalogIngestionEngine(this.indexer);
  }

  public async importData(data: {
    products?: Array<Record<string, unknown>>;
    categories?: Category[];
    brands?: Brand[];
    vendors?: Vendor[];
  }): Promise<SyncMetrics> {
    const syncTimestamp = new Date().toISOString();

    if (data.categories) {
      this.categories = data.categories.map((c) => ({
        ...c,
        source: 'VERIFIED_IMPORTED_DATA',
        lastSynced: syncTimestamp,
      }));
      this.hierarchy.buildHierarchy(this.categories);
    }

    if (data.brands) {
      this.brands = data.brands;
    }

    if (data.vendors) {
      this.vendors = data.vendors;
    }

    if (data.products && Array.isArray(data.products)) {
      const mapped = data.products.map((p) => ({
        ...p,
        sourceType: 'VERIFIED_IMPORTED_DATA',
        lastSynced: syncTimestamp,
      }));
      await this.ingestionEngine.ingestBatch(mapped);
    }

    logger.info(`Imported ${this.indexer.size()} products from authorized feed.`);
    return this.getMetrics();
  }

  public async sync(): Promise<SyncMetrics> {
    return this.getMetrics();
  }

  public async search(filters: CatalogSearchFilters = {}): Promise<CatalogSearchResult> {
    return this.indexer.search(filters);
  }

  public async getProductById(id: string): Promise<Product | null> {
    return this.indexer.getProductById(id) || null;
  }

  public async getCategories(): Promise<Category[]> {
    return this.categories;
  }

  public async getCategoryHierarchy(): Promise<CategoryHierarchy> {
    return this.hierarchy;
  }

  public async getBrands(): Promise<Brand[]> {
    return this.brands;
  }

  public async getVendors(): Promise<Vendor[]> {
    return this.vendors;
  }

  public getMetrics(): SyncMetrics {
    const subcats = this.categories.filter((c) => c.parentId !== null).length;
    return this.ingestionEngine.getMetrics(
      this.categories.length,
      subcats,
      this.brands.length,
      this.vendors.length,
      'import',
      false
    );
  }
}
