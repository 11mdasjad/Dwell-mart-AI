import { Product, CatalogSearchFilters, CatalogSearchResult, SourceClassification } from './types';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'ke', 'ka', 'ki', 'ko', 'me', 'mein', 'hai', 'kya', 'aur'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export class CatalogIndexer {
  private products: Map<string, Product> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private brandIndex: Map<string, Set<string>> = new Map();
  private sellerIndex: Map<string, Set<string>> = new Map();
  private b2bIndex: Set<string> = new Set();
  private inStockIndex: Set<string> = new Set();
  private genderIndex: Map<string, Set<string>> = new Map();
  private lastIndexTimestamp: string = new Date().toISOString();

  constructor() {}

  /**
   * Batch add or update products in the index.
   * Can ingest batches of 500-5000 items smoothly up to 100,000+ items.
   */
  public addProducts(newProducts: Product[]): void {
    for (const product of newProducts) {
      this.addProduct(product);
    }
    this.lastIndexTimestamp = new Date().toISOString();
  }

  public addProduct(product: Product): void {
    const id = product.id;

    // If exists, remove old index mappings
    if (this.products.has(id)) {
      this.removeProduct(id);
    }

    this.products.set(id, product);

    // Index full-text tokens
    const textCorpus = [
      product.name,
      product.brand || '',
      product.categoryName || '',
      product.sellerName || '',
      product.tags.join(' '),
      product.description || '',
      product.sku || '',
      product.color || '',
      product.material || '',
    ].join(' ');

    const tokens = tokenize(textCorpus);
    const uniqueTokens = new Set(tokens);

    for (const token of uniqueTokens) {
      let set = this.invertedIndex.get(token);
      if (!set) {
        set = new Set<string>();
        this.invertedIndex.set(token, set);
      }
      set.add(id);

      // Add prefix indexing for partial words >= 3 chars
      if (token.length >= 3) {
        for (let i = 3; i <= Math.min(token.length, 6); i++) {
          const prefix = token.slice(0, i);
          let pSet = this.invertedIndex.get(prefix);
          if (!pSet) {
            pSet = new Set<string>();
            this.invertedIndex.set(prefix, pSet);
          }
          pSet.add(id);
        }
      }
    }

    // Category Index
    if (product.categoryId) {
      let set = this.categoryIndex.get(product.categoryId);
      if (!set) {
        set = new Set();
        this.categoryIndex.set(product.categoryId, set);
      }
      set.add(id);
    }
    if (product.categoryName) {
      const normCat = product.categoryName.toLowerCase().trim();
      let set = this.categoryIndex.get(normCat);
      if (!set) {
        set = new Set();
        this.categoryIndex.set(normCat, set);
      }
      set.add(id);
    }

    // Brand Index
    if (product.brand) {
      const normBrand = product.brand.toLowerCase().trim();
      let set = this.brandIndex.get(normBrand);
      if (!set) {
        set = new Set();
        this.brandIndex.set(normBrand, set);
      }
      set.add(id);
    }

    // Seller Index
    if (product.sellerName) {
      const normSeller = product.sellerName.toLowerCase().trim();
      let set = this.sellerIndex.get(normSeller);
      if (!set) {
        set = new Set();
        this.sellerIndex.set(normSeller, set);
      }
      set.add(id);
    }

    // Facet sets
    if (product.b2bAvailable) this.b2bIndex.add(id);
    if (product.stockStatus === 'in_stock' || product.stockStatus === 'low_stock') {
      this.inStockIndex.add(id);
    }
    if (product.gender) {
      let set = this.genderIndex.get(product.gender);
      if (!set) {
        set = new Set();
        this.genderIndex.set(product.gender, set);
      }
      set.add(id);
    }
  }

  public removeProduct(id: string): void {
    this.products.delete(id);
    this.b2bIndex.delete(id);
    this.inStockIndex.delete(id);
  }

  public clear(): void {
    this.products.clear();
    this.invertedIndex.clear();
    this.categoryIndex.clear();
    this.brandIndex.clear();
    this.sellerIndex.clear();
    this.b2bIndex.clear();
    this.inStockIndex.clear();
    this.genderIndex.clear();
    this.lastIndexTimestamp = new Date().toISOString();
  }

  public getProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public search(filters: CatalogSearchFilters = {}): CatalogSearchResult {
    const {
      query,
      categoryId,
      categoryName,
      brand,
      seller,
      minPrice,
      maxPrice,
      inStockOnly,
      b2bOnly,
      b2cOnly,
      gender,
      minMoq,
      sortBy = 'relevance',
      page = 1,
      limit = 10,
    } = filters;

    let candidateIds: Set<string> | null = null;
    const scores = new Map<string, number>();

    // 1. Full-text search with token scoring
    if (query && query.trim()) {
      const queryTokens = tokenize(query);
      const queryLower = query.toLowerCase().trim();

      candidateIds = new Set<string>();

      for (const token of queryTokens) {
        const matches = this.invertedIndex.get(token);
        if (matches) {
          for (const id of matches) {
            candidateIds.add(id);
            scores.set(id, (scores.get(id) || 0) + 10);
          }
        }
      }

      // Check for exact ID match
      if (this.products.has(query.trim())) {
        candidateIds.add(query.trim());
        scores.set(query.trim(), (scores.get(query.trim()) || 0) + 1000);
      }

      // Boost scores for exact title matches or brand matches
      for (const id of candidateIds) {
        const p = this.products.get(id);
        if (p) {
          const nameLower = p.name.toLowerCase();
          if (nameLower === queryLower) {
            scores.set(id, (scores.get(id) || 0) + 500);
          } else if (nameLower.includes(queryLower)) {
            scores.set(id, (scores.get(id) || 0) + 150);
          }
          if (p.brand && queryLower.includes(p.brand.toLowerCase())) {
            scores.set(id, (scores.get(id) || 0) + 50);
          }
        }
      }
    }

    // 2. Category Filter
    if (categoryId || categoryName) {
      const catKey = categoryId || categoryName?.toLowerCase().trim() || '';
      const catMatches = this.categoryIndex.get(catKey) || new Set<string>();

      if (candidateIds === null) {
        candidateIds = new Set(catMatches);
      } else {
        candidateIds = new Set([...candidateIds].filter((id) => catMatches.has(id)));
      }
    }

    // 3. Brand Filter
    if (brand) {
      const brandKey = brand.toLowerCase().trim();
      const brandMatches = this.brandIndex.get(brandKey) || new Set<string>();
      if (candidateIds === null) {
        candidateIds = new Set(brandMatches);
      } else {
        candidateIds = new Set([...candidateIds].filter((id) => brandMatches.has(id)));
      }
    }

    // 4. Seller Filter
    if (seller) {
      const sellerKey = seller.toLowerCase().trim();
      const sellerMatches = this.sellerIndex.get(sellerKey) || new Set<string>();
      if (candidateIds === null) {
        candidateIds = new Set(sellerMatches);
      } else {
        candidateIds = new Set([...candidateIds].filter((id) => sellerMatches.has(id)));
      }
    }

    // 5. In-Stock Filter
    if (inStockOnly) {
      if (candidateIds === null) {
        candidateIds = new Set(this.inStockIndex);
      } else {
        candidateIds = new Set([...candidateIds].filter((id) => this.inStockIndex.has(id)));
      }
    }

    // 6. B2B / Wholesale Filter
    if (b2bOnly) {
      if (candidateIds === null) {
        candidateIds = new Set(this.b2bIndex);
      } else {
        candidateIds = new Set([...candidateIds].filter((id) => this.b2bIndex.has(id)));
      }
    }

    // 7. Gender Filter
    if (gender && gender !== 'all') {
      const genderMatches = this.genderIndex.get(gender) || new Set<string>();
      const allGenderMatches = this.genderIndex.get('all') || new Set<string>();
      const unisexMatches = this.genderIndex.get('unisex') || new Set<string>();
      const combinedGender = new Set([...genderMatches, ...allGenderMatches, ...unisexMatches]);

      if (candidateIds === null) {
        candidateIds = combinedGender;
      } else {
        candidateIds = new Set([...candidateIds].filter((id) => combinedGender.has(id)));
      }
    }

    // If no filters were applied, candidates is all products
    const finalIds = candidateIds === null ? Array.from(this.products.keys()) : Array.from(candidateIds);

    // Apply attribute, price and MOQ filtering
    const matchedProducts = finalIds
      .map((id) => this.products.get(id)!)
      .filter((p) => {
        if (!p) return false;
        if (minPrice !== undefined && (p.sellingPrice === null || p.sellingPrice < minPrice)) return false;
        if (maxPrice !== undefined && (p.sellingPrice === null || p.sellingPrice > maxPrice)) return false;
        if (minMoq !== undefined && p.minimumOrderQuantity < minMoq) return false;
        if (b2cOnly && !p.b2cAvailable) return false;
        return true;
      });

    // Sorting
    if (sortBy === 'price_asc') {
      matchedProducts.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
    } else if (sortBy === 'price_desc') {
      matchedProducts.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
    } else if (sortBy === 'newest') {
      matchedProducts.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    } else if (sortBy === 'discount') {
      matchedProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else {
      // Relevance sorting
      matchedProducts.sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
    }

    // Pagination
    const total = matchedProducts.length;
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const offset = (safePage - 1) * safeLimit;
    const paginatedProducts = matchedProducts.slice(offset, offset + safeLimit);

    // Determine aggregate source
    let source: SourceClassification = 'VERIFIED_LIVE_DATA';
    if (paginatedProducts.length > 0) {
      source = paginatedProducts[0].sourceType;
    } else if (total === 0) {
      source = 'UNAVAILABLE';
    }

    return {
      products: paginatedProducts,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      source,
      freshnessTimestamp: this.lastIndexTimestamp,
      appliedFilters: filters,
    };
  }

  public size(): number {
    return this.products.size;
  }

  public getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }
}

// Global Singleton Catalog Indexer
export const globalCatalogIndexer = new CatalogIndexer();
