// ===========================================
// Product Catalog Adapter Factory
// ===========================================

import { ProductCatalogAdapter } from './types';
import { MockProductAdapter } from './mock-adapter';

let cachedAdapter: ProductCatalogAdapter | null = null;

/**
 * Returns the configured product catalog adapter instance.
 * Defaults to MockProductAdapter when live integration credentials are not configured.
 */
export function getProductCatalogAdapter(): ProductCatalogAdapter {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  // Future check for live Dwell Mart API adapter:
  // if (process.env.PRODUCT_DATA_SOURCE === 'live' && process.env.DWELLMART_API_KEY) {
  //   cachedAdapter = new DwellMartApiAdapter({ ... });
  //   return cachedAdapter;
  // }

  cachedAdapter = new MockProductAdapter();
  return cachedAdapter;
}

/**
 * Reset adapter cache (primarily for unit tests)
 */
export function resetProductCatalogAdapter(): void {
  cachedAdapter = null;
}
