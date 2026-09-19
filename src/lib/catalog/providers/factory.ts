import { CatalogProvider } from './interface';
import { LiveDwellMartProvider } from './live-provider';
import { ImportCatalogProvider } from './import-provider';
import { MockCatalogProvider } from './mock-provider';
import { globalCatalogIndexer } from '../indexer';
import { logger } from '../../logger';

let cachedProvider: CatalogProvider | null = null;

export function getCatalogProvider(): CatalogProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const enableMockMode = isTest ? true : process.env.ENABLE_MOCK_MODE === 'true';
  const dataSource = (process.env.DATA_SOURCE || (isTest ? 'mock' : 'live')).toLowerCase();

  logger.info(`Resolving Catalog Provider: DATA_SOURCE=${dataSource}, ENABLE_MOCK_MODE=${enableMockMode}, NODE_ENV=${process.env.NODE_ENV}`);

  // CRITICAL RULE: Never allow mock provider in production mode or when ENABLE_MOCK_MODE is false
  if (!isTest && (!enableMockMode || isProduction)) {
    if (dataSource === 'mock') {
      const errorMsg = 'CRITICAL SECURITY VIOLATION: Mock mode requested while ENABLE_MOCK_MODE=false or in production. Mock data is forbidden.';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // Explicit test in mock-isolation.test.ts testing production protection
  if (process.env.ENABLE_MOCK_MODE === 'false' && dataSource === 'mock') {
    const errorMsg = 'CRITICAL SECURITY VIOLATION: Mock mode requested while ENABLE_MOCK_MODE=false or in production. Mock data is forbidden.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  if (isProduction && dataSource === 'mock') {
    const errorMsg = 'CRITICAL SECURITY VIOLATION: Mock mode requested while ENABLE_MOCK_MODE=false or in production. Mock data is forbidden.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (dataSource === 'import') {
    cachedProvider = new ImportCatalogProvider(globalCatalogIndexer);
    return cachedProvider;
  }

  if (dataSource === 'mock') {
    if (enableMockMode && !isProduction) {
      logger.warn('WARNING: Running in DEVELOPMENT_MOCK mode. This data must never be used in production.');
      cachedProvider = new MockCatalogProvider(globalCatalogIndexer);
      return cachedProvider;
    }
  }

  // Default: Live Dwell Mart Provider
  cachedProvider = new LiveDwellMartProvider(globalCatalogIndexer);
  return cachedProvider;
}

export function resetCatalogProvider(): void {
  cachedProvider = null;
}
