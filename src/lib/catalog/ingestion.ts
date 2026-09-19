import { Product, SyncMetrics } from './types';
import { ProductSchema, IngestionValidationResult } from './schemas';
import { CatalogIndexer } from './indexer';

export interface IngestionOptions {
  batchSize?: number;
  skipInvalid?: boolean;
  onBatchProgress?: (processed: number, total: number) => void;
}

export class CatalogIngestionEngine {
  private indexer: CatalogIndexer;
  private failedRecords: Array<{ item: unknown; error: string; timestamp: string }> = [];
  private lastSyncTimestamp: string | null = null;
  private lastSyncDurationMs: number = 0;
  private syncErrors: string[] = [];

  constructor(indexer: CatalogIndexer) {
    this.indexer = indexer;
  }

  /**
   * Ingest a batch of products with deduplication, validation, and failure reporting
   */
  public async ingestBatch(
    rawProducts: Array<Record<string, unknown>>
  ): Promise<IngestionValidationResult> {
    const startTime = Date.now();
    const valid: Product[] = [];
    const failed: Array<{ item: unknown; error: string }> = [];

    const existingSeenIds = new Set<string>();

    for (const raw of rawProducts) {
      try {
        const id = raw.id || raw._id;
        if (!id) {
          throw new Error('Product ID is missing');
        }

        if (existingSeenIds.has(String(id))) {
          // Skip duplicate in same batch
          continue;
        }
        existingSeenIds.add(String(id));

        const parsed = ProductSchema.safeParse(raw);
        if (!parsed.success) {
          const errMessage = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
          failed.push({ item: raw, error: errMessage });
          this.failedRecords.push({
            item: { id: raw.id || raw._id, name: raw.name },
            error: errMessage,
            timestamp: new Date().toISOString(),
          });
        } else {
          valid.push(parsed.data as Product);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown validation error';
        failed.push({ item: raw, error: msg });
      }
    }

    // Add valid products to indexer
    if (valid.length > 0) {
      this.indexer.addProducts(valid);
    }

    this.lastSyncTimestamp = new Date().toISOString();
    this.lastSyncDurationMs = Date.now() - startTime;

    return { valid, failed };
  }

  public getFailedRecords(): Array<{ item: unknown; error: string; timestamp: string }> {
    return [...this.failedRecords];
  }

  public clearFailedRecords(): void {
    this.failedRecords = [];
    this.syncErrors = [];
  }

  public logSyncError(error: string): void {
    this.syncErrors.push(`${new Date().toISOString()}: ${error}`);
    if (this.syncErrors.length > 50) {
      this.syncErrors.shift();
    }
  }

  public getMetrics(
    categoriesCount: number = 0,
    subcategoriesCount: number = 0,
    brandsCount: number = 0,
    sellersCount: number = 0,
    dataSource: 'live' | 'import' | 'mock' = 'live',
    mockModeEnabled: boolean = false
  ): SyncMetrics {
    const allProducts = this.indexer.getAllProducts();

    let withPrice = 0;
    let withoutPrice = 0;
    let withImages = 0;
    let withoutImages = 0;
    let withStock = 0;
    let withoutStock = 0;

    for (const p of allProducts) {
      if (p.sellingPrice !== null && p.sellingPrice > 0) withPrice++;
      else withoutPrice++;

      if (p.images.length > 0 || p.image) withImages++;
      else withoutImages++;

      if (p.availableQuantity !== null && p.availableQuantity > 0) withStock++;
      else withoutStock++;
    }

    return {
      totalProducts: allProducts.length,
      totalCategories: categoriesCount,
      totalSubcategories: subcategoriesCount,
      totalBrands: brandsCount,
      totalSellers: sellersCount,
      productsWithPrice: withPrice,
      productsWithoutPrice: withoutPrice,
      productsWithImages: withImages,
      productsWithoutImages: withoutImages,
      productsWithStock: withStock,
      productsWithoutStock: withoutStock,
      duplicateProducts: 0,
      orphanProducts: 0,
      failedImports: this.failedRecords.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastSyncDurationMs: this.lastSyncDurationMs,
      currentDataSource: dataSource,
      mockModeEnabled,
      syncErrors: this.syncErrors,
    };
  }
}
