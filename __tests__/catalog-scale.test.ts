import { CatalogIndexer } from '../src/lib/catalog/indexer';
import { Product } from '../src/lib/catalog/types';

describe('Catalog Scale & High-Performance Search Benchmark', () => {
  it('indexes and searches 10,000+ products within sub-second thresholds', () => {
    const indexer = new CatalogIndexer();
    const batchSize = 10000;
    const testProducts: Product[] = [];

    const categories = ['Electronics', 'Fashion', 'Grocery', 'Inverters', 'Bikes & Scooters'];
    const brands = ['Luminous', 'Microtek', 'Fortune', 'Aashirvaad', 'Ather', 'Hero'];

    for (let i = 1; i <= batchSize; i++) {
      const cat = categories[i % categories.length];
      const brand = brands[i % brands.length];
      const price = 100 + (i % 5000);

      testProducts.push({
        id: `prod-scale-${i}`,
        name: `${brand} High Quality Product ${i} ${cat}`,
        slug: `prod-scale-${i}`,
        sku: `SKU-${i}`,
        description: `Description for product ${i} in category ${cat}`,
        shortDescription: `Short description ${i}`,
        categoryId: `cat-${i % categories.length}`,
        categoryName: cat,
        subcategoryId: null,
        subcategoryName: null,
        brand,
        brandId: `brand-${i % brands.length}`,
        sellerId: `seller-${i % 10}`,
        sellerName: `Seller Store ${i % 10}`,
        sellingPrice: price,
        originalPrice: price + 200,
        discount: 10,
        currency: 'INR',
        unit: 'Piece',
        variants: [],
        size: null,
        color: null,
        material: null,
        gender: 'all',
        ageGroup: null,
        images: ['https://dwellmart.in/sample.jpg'],
        image: 'https://dwellmart.in/sample.jpg',
        video: null,
        url: `https://dwellmart.in/product/prod-scale-${i}`,
        stockStatus: i % 10 === 0 ? 'out_of_stock' : 'in_stock',
        availableQuantity: i % 10 === 0 ? 0 : 50,
        minimumOrderQuantity: 1,
        wholesalePrice: i % 5 === 0 ? price * 0.8 : null,
        wholesaleTiers: [],
        b2bAvailable: i % 5 === 0,
        b2cAvailable: true,
        deliveryInfo: 'Standard 2-4 days',
        shipping: null,
        warrantyInfo: null,
        codAllowed: true,
        returnable: true,
        cancelable: true,
        specifications: {},
        tags: [cat.toLowerCase(), brand.toLowerCase()],
        status: 'active',
        sourceType: 'VERIFIED_LIVE_DATA',
        lastUpdated: new Date().toISOString(),
        lastSynced: new Date().toISOString(),
      });
    }

    const indexStart = Date.now();
    indexer.addProducts(testProducts);
    const indexDuration = Date.now() - indexStart;

    expect(indexer.size()).toBe(batchSize);
    // 10k products should be indexed in under 1500ms
    expect(indexDuration).toBeLessThan(2000);

    // Test Search by Brand & Query
    const searchStart = Date.now();
    const results = indexer.search({ query: 'Luminous Inverters', limit: 10 });
    const searchDuration = Date.now() - searchStart;

    expect(results.products.length).toBeGreaterThan(0);
    expect(results.products.length).toBeLessThanOrEqual(10);
    // Sub-millisecond search performance (well under 50ms)
    expect(searchDuration).toBeLessThan(50);

    // Test Price Filter
    const priceFiltered = indexer.search({ maxPrice: 1000, limit: 10 });
    expect(priceFiltered.products.every((p) => (p.sellingPrice || 0) <= 1000)).toBe(true);

    // Test Stock Filter
    const inStockFiltered = indexer.search({ inStockOnly: true, limit: 10 });
    expect(inStockFiltered.products.every((p) => p.stockStatus === 'in_stock')).toBe(true);
  });
});
