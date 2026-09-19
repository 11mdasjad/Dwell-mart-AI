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
import {
  MOCK_PRODUCTS_DATA as MOCK_PRODUCTS,
  MOCK_CATEGORIES_DATA as MOCK_CATEGORIES,
} from '../../products/mock-catalog';

interface LegacyMockProduct {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  price?: number | { amount?: number };
  originalPrice?: number;
  wholesalePrice?: number;
  category?: string | { id?: string; name?: string };
  subcategory?: string;
  brand?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unavailable';
  stock?: { status?: string; quantity?: number };
  availableQuantity?: number;
  minimumOrderQuantity?: number;
  wholesale?: { minimumOrderQuantity?: number };
  currency?: string;
  unit?: string;
  images?: string[];
  imageUrl?: string;
  primaryImage?: string;
  specifications?: Record<string, string | number | boolean>;
  tags?: string[];
  lastUpdated?: string;
}

export class MockCatalogProvider implements CatalogProvider {
  public readonly name = 'Development Mock Provider';
  public readonly isLive = false;

  private indexer: CatalogIndexer;
  private hierarchy: CategoryHierarchy;
  private ingestionEngine: CatalogIngestionEngine;
  private categories: Category[] = [];

  constructor(indexer?: CatalogIndexer) {
    this.indexer = indexer || new CatalogIndexer();
    this.hierarchy = new CategoryHierarchy();
    this.ingestionEngine = new CatalogIngestionEngine(this.indexer);
    this.seedMockData();
  }

  private seedMockData(): void {
    const timestamp = new Date().toISOString();

    // Map existing mock categories
    this.categories = MOCK_CATEGORIES.map((mc) => ({
      id: mc.id,
      name: mc.name,
      parentId: null,
      slug: mc.slug,
      url: `https://dwellmart.in/category/${mc.slug}`,
      imageUrl: null,
      isActive: true,
      productCount: mc.productCount,
      source: 'DEVELOPMENT_MOCK',
      lastSynced: timestamp,
    }));
    this.hierarchy.buildHierarchy(this.categories);

    // Map existing mock products into strict 35+ field schema
    const mapped: Product[] = (MOCK_PRODUCTS as unknown as LegacyMockProduct[]).map((mp) => {
      const price = typeof mp.price === 'number' ? mp.price : (mp.price?.amount || 0);
      const originalPrice = typeof mp.originalPrice === 'number' ? mp.originalPrice : price;
      const wholesalePrice = typeof mp.wholesalePrice === 'number' ? mp.wholesalePrice : null;

      const categoryName = typeof mp.category === 'string' ? mp.category : (mp.category?.name || 'General');
      const categoryId = (typeof mp.category === 'object' && mp.category?.id) ? mp.category.id : null;

      const stockStatus = mp.stockStatus || (mp.stock?.status === 'in_stock' ? 'in_stock' : 'in_stock');
      const availableQuantity = typeof mp.availableQuantity === 'number' ? mp.availableQuantity : (mp.stock?.quantity ?? 100);

      const moq = typeof mp.minimumOrderQuantity === 'number'
        ? mp.minimumOrderQuantity
        : (mp.wholesale?.minimumOrderQuantity || 1);

      return {
        id: mp.id,
        name: mp.name,
        slug: mp.slug || mp.id,
        sku: mp.sku || null,
        description: mp.description || '',
        shortDescription: mp.shortDescription || null,
        categoryId,
        categoryName,
        subcategoryId: null,
        subcategoryName: mp.subcategory || null,
        brand: mp.brand || 'Dwell Mart',
        brandId: null,
        sellerId: 'dev-seller',
        sellerName: 'Development Store',
        sellingPrice: price,
        originalPrice,
        discount: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
        currency: mp.currency || 'INR',
        unit: mp.unit || 'Piece',
        variants: [],
        size: null,
        color: null,
        material: null,
        gender: 'all',
        ageGroup: null,
        images: mp.images || (mp.imageUrl ? [mp.imageUrl] : []),
        image: mp.imageUrl || mp.primaryImage || mp.images?.[0] || null,
        video: null,
        url: `https://dwellmart.in/product/${mp.slug || mp.id}`,
        stockStatus,
        availableQuantity,
        minimumOrderQuantity: moq,
        wholesalePrice,
        wholesaleTiers: wholesalePrice ? [{ minQuantity: moq, pricePerUnit: wholesalePrice }] : [],
        b2bAvailable: Boolean(wholesalePrice),
        b2cAvailable: true,
        deliveryInfo: 'Development standard delivery (2-4 days)',
        shipping: null,
        warrantyInfo: null,
        codAllowed: true,
        returnable: true,
        cancelable: true,
        specifications: mp.specifications || {},
        tags: mp.tags || [],
        status: 'active',
        sourceType: 'DEVELOPMENT_MOCK',
        lastUpdated: mp.lastUpdated || timestamp,
        lastSynced: timestamp,
      };
    });

    this.indexer.addProducts(mapped);
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
    return [];
  }

  public async getVendors(): Promise<Vendor[]> {
    return [];
  }

  public getMetrics(): SyncMetrics {
    return this.ingestionEngine.getMetrics(
      this.categories.length,
      0,
      0,
      0,
      'mock',
      true
    );
  }
}
