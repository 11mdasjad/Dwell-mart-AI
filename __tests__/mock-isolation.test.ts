import { getCatalogProvider, resetCatalogProvider } from '../src/lib/catalog/providers/factory';
import { mapLiveApiProductToProduct } from '../src/lib/catalog/schemas';

describe('Production Mock Isolation & Source Classification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetCatalogProvider();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetCatalogProvider();
  });

  it('strictly forbids mock data when ENABLE_MOCK_MODE=false', () => {
    process.env.DATA_SOURCE = 'mock';
    process.env.ENABLE_MOCK_MODE = 'false';

    expect(() => getCatalogProvider()).toThrow(/Mock mode requested while ENABLE_MOCK_MODE=false/);
  });

  it('strictly forbids mock data in production mode', () => {
    (process.env as Record<string, string | undefined>)['NODE_ENV'] = 'production';
    process.env.DATA_SOURCE = 'mock';
    process.env.ENABLE_MOCK_MODE = 'true'; // even if true, NODE_ENV=production blocks it

    expect(() => getCatalogProvider()).toThrow(/Mock data is forbidden/);
  });

  it('resolves LiveDwellMartProvider by default in production', () => {
    (process.env as Record<string, string | undefined>)['NODE_ENV'] = 'production';
    process.env.DATA_SOURCE = 'live';
    process.env.ENABLE_MOCK_MODE = 'false';

    const provider = getCatalogProvider();
    expect(provider.isLive).toBe(true);
    expect(provider.name).toBe('Live Dwell Mart Provider');
  });

  it('maps raw live API response into strict validated schema without fabricating fields', () => {
    const rawApiProduct = {
      _id: '6aae55044c7d58c9d02bc148',
      name: 'Beetroot And Onion Seed Oil Nourishing Hair Oil',
      slug: 'beetroot-and-onion-seed-oil-nourishing-hair-oil-e515da',
      sku: 'BEETROOT-&-ONION-HAIR-OIL',
      price: 269,
      originalPrice: 349,
      unit: 'Piece',
      categoryId: { _id: '6a701e4af806337a2ad1825e', name: 'Beauty & Personal Care' },
      vendorId: { _id: '6aacdc198ab52f4216752638', storeName: 'Welish Cosmetics' },
      stock: 'in_stock',
      stockQuantity: 20,
      minimumOrderQuantity: 1,
      shipping: { weight: 0.2, weightUnit: 'kg' },
      isActive: true,
      updatedAt: '2026-09-19T09:25:24.479Z',
    };

    const mapped = mapLiveApiProductToProduct(rawApiProduct, '2026-09-20T03:00:00.000Z');

    expect(mapped.id).toBe('6aae55044c7d58c9d02bc148');
    expect(mapped.name).toBe('Beetroot And Onion Seed Oil Nourishing Hair Oil');
    expect(mapped.sellingPrice).toBe(269);
    expect(mapped.originalPrice).toBe(349);
    expect(mapped.discount).toBe(23); // (349 - 269) / 349 = ~23%
    expect(mapped.categoryName).toBe('Beauty & Personal Care');
    expect(mapped.sellerName).toBe('Welish Cosmetics');
    expect(mapped.stockStatus).toBe('in_stock');
    expect(mapped.sourceType).toBe('VERIFIED_LIVE_DATA');
    expect(mapped.currency).toBe('INR');
    expect(mapped.url).toBe('https://dwellmart.in/product/beetroot-and-onion-seed-oil-nourishing-hair-oil-e515da');
  });
});
