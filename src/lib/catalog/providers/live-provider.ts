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
import { CategoryHierarchy, mapLiveApiCategoryToCategory } from '../hierarchy';
import { mapLiveApiProductToProduct } from '../schemas';
import { CatalogIngestionEngine } from '../ingestion';
import { logger } from '../../logger';

const DWELL_MART_API_BASE = process.env.DWELL_MART_API_URL || 'https://dwellmart.in/api';

export class LiveDwellMartProvider implements CatalogProvider {
  public readonly name = 'Live Dwell Mart Provider';
  public readonly isLive = true;

  private indexer: CatalogIndexer;
  private hierarchy: CategoryHierarchy;
  private ingestionEngine: CatalogIngestionEngine;
  private categories: Category[] = [];
  private brands: Brand[] = [];
  private vendors: Vendor[] = [];
  private isInitialized = false;
  private isSyncing = false;

  constructor(indexer?: CatalogIndexer) {
    this.indexer = indexer || new CatalogIndexer();
    this.hierarchy = new CategoryHierarchy();
    this.ingestionEngine = new CatalogIngestionEngine(this.indexer);
  }

  private async fetchJson(endpoint: string, timeoutMs: number = 10000): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${DWELL_MART_API_BASE}${endpoint}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DwellMartAIAgent/1.0',
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status} for ${endpoint}`);
      }

      return (await res.json()) as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
    }
  }

  public async sync(options?: { force?: boolean }): Promise<SyncMetrics> {
    if (this.isSyncing && !options?.force) {
      logger.info('Live sync already in progress, waiting for completion...');
      return this.getMetrics();
    }

    this.isSyncing = true;
    const syncTimestamp = new Date().toISOString();
    logger.info('Starting full live catalog synchronization from Dwell Mart API...');

    try {
      // 1. Fetch live categories (2,328 categories)
      try {
        const catRes = await this.fetchJson('/categories/all');
        const rawCats = (catRes?.data as Array<Record<string, unknown>>) || [];
        this.categories = rawCats.map((c) => mapLiveApiCategoryToCategory(c, syncTimestamp));
        this.hierarchy.buildHierarchy(this.categories);
        logger.info(`Synced ${this.categories.length} verified categories from live API.`);
      } catch (catErr: unknown) {
        const msg = catErr instanceof Error ? catErr.message : 'Category sync failure';
        logger.error('Failed to sync live categories:', { error: msg });
        this.ingestionEngine.logSyncError(`Category sync failed: ${msg}`);
      }

      // 2. Fetch live brands
      try {
        const brandRes = await this.fetchJson('/brands/all');
        const rawBrands = (brandRes?.data as Array<Record<string, unknown>>) || [];
        this.brands = rawBrands.map((b) => {
          const bObj = b || {};
          const bId = bObj._id || bObj.id;
          const bName = typeof bObj.name === 'string' ? bObj.name : '';
          const bSlug = typeof bObj.slug === 'string' ? bObj.slug : bName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return {
            id: String(bId || ''),
            name: bName,
            slug: bSlug,
            logo: typeof bObj.logo === 'string' ? bObj.logo : null,
            description: typeof bObj.description === 'string' ? bObj.description : null,
            productCount: typeof bObj.productCount === 'number' ? bObj.productCount : 0,
            isActive: bObj.isActive !== false,
          };
        });
        logger.info(`Synced ${this.brands.length} verified brands from live API.`);
      } catch (brandErr: unknown) {
        const msg = brandErr instanceof Error ? brandErr.message : 'Brand sync failure';
        logger.error('Failed to sync live brands:', { error: msg });
        this.ingestionEngine.logSyncError(`Brand sync failed: ${msg}`);
      }

      // 3. Fetch live vendors
      try {
        const vendorRes = await this.fetchJson('/vendors/all');
        const vData = vendorRes?.data as Record<string, unknown>;
        const rawVendors = (vData?.vendors as Array<Record<string, unknown>>) || [];
        this.vendors = rawVendors.map((v) => {
          const vObj = v || {};
          const vId = vObj._id || vObj.id;
          const vName = typeof vObj.name === 'string' ? vObj.name : typeof vObj.storeName === 'string' ? vObj.storeName : '';
          const vStoreName = typeof vObj.storeName === 'string' ? vObj.storeName : vName;
          const vSlug = typeof vObj.slug === 'string' ? vObj.slug : String(vId || '');
          const vLogo = typeof vObj.storeLogo === 'string' ? vObj.storeLogo : typeof vObj.logo === 'string' ? vObj.logo : null;
          const channels = typeof vObj.sellingChannels === 'object' && vObj.sellingChannels !== null
            ? (vObj.sellingChannels as Record<string, Record<string, unknown>>)
            : undefined;

          return {
            id: String(vId || ''),
            name: vName,
            storeName: vStoreName,
            slug: vSlug,
            storeLogo: vLogo,
            isVerified: Boolean(vObj.isVerified),
            rating: typeof vObj.rating === 'number' ? vObj.rating : 0,
            productCount: typeof vObj.productCount === 'number' ? vObj.productCount : 0,
            location: typeof vObj.location === 'string' ? vObj.location : null,
            b2bEnabled: Boolean(channels?.wholesale?.enabled),
            b2cEnabled: channels?.retail?.enabled !== false,
          };
        });
        logger.info(`Synced ${this.vendors.length} verified vendors from live API.`);
      } catch (vendorErr: unknown) {
        const msg = vendorErr instanceof Error ? vendorErr.message : 'Vendor sync failure';
        logger.error('Failed to sync live vendors:', { error: msg });
        this.ingestionEngine.logSyncError(`Vendor sync failed: ${msg}`);
      }

      // 4. Fetch live products in paginated batches
      try {
        const firstPageRes = await this.fetchJson('/products?page=1&limit=50');
        const pageData = (firstPageRes?.data as Record<string, unknown>) || {};
        const totalPages = typeof pageData.pages === 'number' ? pageData.pages : 1;
        const totalProducts = typeof pageData.total === 'number' ? pageData.total : 0;
        logger.info(`Live product catalog has ${totalProducts} products across ${totalPages} pages.`);

        const allRawProducts: Array<Record<string, unknown>> = (pageData.products as Array<Record<string, unknown>>) || [];

        for (let page = 2; page <= totalPages; page++) {
          try {
            const res = await this.fetchJson(`/products?page=${page}&limit=50`);
            const pData = (res?.data as Record<string, unknown>) || {};
            const prods = (pData.products as Array<Record<string, unknown>>) || [];
            allRawProducts.push(...prods);
          } catch (pageErr: unknown) {
            const msg = pageErr instanceof Error ? pageErr.message : `Page ${page} failure`;
            logger.error(`Error fetching page ${page} of live products:`, { error: msg });
            this.ingestionEngine.logSyncError(`Page ${page} failed: ${msg}`);
          }
        }

        const mappedProducts: Product[] = allRawProducts.map((p) =>
          mapLiveApiProductToProduct(p, syncTimestamp)
        );

        this.indexer.clear();
        await this.ingestionEngine.ingestBatch(mappedProducts as unknown as Array<Record<string, unknown>>);
        logger.info(`Successfully ingested and indexed ${mappedProducts.length} verified live products.`);
      } catch (prodErr: unknown) {
        const msg = prodErr instanceof Error ? prodErr.message : 'Product sync failure';
        logger.error('Failed to sync live products:', { error: msg });
        this.ingestionEngine.logSyncError(`Product sync failed: ${msg}`);
        throw prodErr;
      }

      this.isInitialized = true;
    } finally {
      this.isSyncing = false;
    }

    return this.getMetrics();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.indexer.size() === 0) {
      await this.sync();
    }
  }

  public async search(filters: CatalogSearchFilters = {}): Promise<CatalogSearchResult> {
    await this.ensureInitialized();
    return this.indexer.search(filters);
  }

  public async getProductById(id: string): Promise<Product | null> {
    await this.ensureInitialized();
    const product = this.indexer.getProductById(id);
    return product || null;
  }

  public async getCategories(): Promise<Category[]> {
    await this.ensureInitialized();
    return this.categories;
  }

  public async getCategoryHierarchy(): Promise<CategoryHierarchy> {
    await this.ensureInitialized();
    return this.hierarchy;
  }

  public async getBrands(): Promise<Brand[]> {
    await this.ensureInitialized();
    return this.brands;
  }

  public async getVendors(): Promise<Vendor[]> {
    await this.ensureInitialized();
    return this.vendors;
  }

  public getMetrics(): SyncMetrics {
    const subcats = this.categories.filter((c) => c.parentId !== null).length;
    return this.ingestionEngine.getMetrics(
      this.categories.length,
      subcats,
      this.brands.length,
      this.vendors.length,
      'live',
      false
    );
  }
}
