// ===========================================
// Tool Executor — Validates & Runs Tools
// Powered by Scalable Catalog Provider & Policy Store
// ===========================================

import { ToolCall, ToolCallResult } from '@/types/chat';
import { getCatalogProvider } from '@/lib/catalog/providers/factory';
import { globalPolicyStore } from '@/lib/policies/policy-store';
import { MOCK_PRODUCTS_DATA } from '@/lib/products/mock-catalog';
import { MOCK_PRODUCTS as LEGACY_MOCK_PRODUCTS } from '@/data/mock-catalog';
import { logger } from '@/lib/logger';

import { Product } from '@/lib/catalog/types';

interface LegacyMockItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  price?: number;
  currency?: string;
  unit?: string;
  imageUrl?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unavailable';
  availableQuantity?: number;
  minimumOrderQuantity?: number;
  wholesalePrice?: number;
  tags?: string[];
  lastUpdated?: string;
}

interface OldMockItem {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  price: number;
  unit?: string;
  imageUrl?: string;
  inStock?: boolean;
  wholesale?: {
    available?: boolean;
    minimumOrderQuantity?: number;
    tiers?: Array<{ minQuantity: number; pricePerUnit: number; discountPercentage?: number }>;
  };
  tags?: string[];
}

function findMockProduct(idOrSlug: string): Product | null {
  const norm = idOrSlug.toLowerCase().trim();
  const p3 = (MOCK_PRODUCTS_DATA as unknown as LegacyMockItem[]).find(
    (p) => String(p.id).toLowerCase() === norm || String(p.slug).toLowerCase() === norm
  );
  if (p3) {
    const stockStatus = (p3.stockStatus === 'in_stock' || p3.stockStatus === 'low_stock' || p3.stockStatus === 'out_of_stock')
      ? p3.stockStatus
      : 'in_stock';

    return {
      id: p3.id,
      name: p3.name,
      slug: p3.slug,
      sku: null,
      description: p3.description || null,
      shortDescription: null,
      categoryId: null,
      categoryName: p3.category || null,
      subcategoryId: null,
      subcategoryName: p3.subcategory || null,
      brand: p3.brand || null,
      brandId: null,
      sellerId: 'mock-seller',
      sellerName: 'Mock Seller',
      sellingPrice: p3.price ?? null,
      originalPrice: p3.price ?? null,
      discount: null,
      currency: p3.currency || 'INR',
      unit: p3.unit || 'Piece',
      variants: [],
      size: null,
      color: null,
      material: null,
      gender: 'all' as const,
      ageGroup: null,
      images: p3.imageUrl ? [p3.imageUrl] : [],
      image: p3.imageUrl || null,
      video: null,
      url: `https://dwellmart.in/product/${p3.slug}`,
      stockStatus,
      availableQuantity: p3.availableQuantity ?? null,
      minimumOrderQuantity: p3.minimumOrderQuantity || 1,
      wholesalePrice: p3.wholesalePrice ?? null,
      wholesaleTiers: [],
      b2bAvailable: true,
      b2cAvailable: true,
      deliveryInfo: null,
      shipping: null,
      warrantyInfo: null,
      codAllowed: true,
      returnable: true,
      cancelable: true,
      specifications: {},
      tags: p3.tags || [],
      status: 'active' as const,
      sourceType: 'DEVELOPMENT_MOCK' as const,
      lastUpdated: p3.lastUpdated || new Date().toISOString(),
      lastSynced: new Date().toISOString(),
    };
  }

  const p2 = (LEGACY_MOCK_PRODUCTS as unknown as OldMockItem[]).find(
    (p) => String(p.id).toLowerCase() === norm || (p.slug && String(p.slug).toLowerCase() === norm)
  );
  if (p2) {
    const wholesalePrice = p2.wholesale?.tiers?.[0]?.pricePerUnit || Math.round(p2.price * 0.85);
    return {
      id: p2.id,
      name: p2.name,
      slug: p2.slug || p2.id,
      sku: p2.sku || null,
      description: p2.description || null,
      shortDescription: null,
      categoryId: null,
      categoryName: p2.category || null,
      subcategoryId: null,
      subcategoryName: p2.subcategory || null,
      brand: p2.brand || null,
      brandId: null,
      sellerId: 'mock-seller',
      sellerName: 'Mock Seller',
      sellingPrice: p2.price ?? null,
      originalPrice: p2.price ?? null,
      discount: null,
      currency: 'INR',
      unit: p2.unit || 'Piece',
      variants: [],
      size: null,
      color: null,
      material: null,
      gender: 'all' as const,
      ageGroup: null,
      images: p2.imageUrl ? [p2.imageUrl] : [],
      image: p2.imageUrl || null,
      video: null,
      url: `https://dwellmart.in/product/${p2.id}`,
      stockStatus: p2.inStock ? ('in_stock' as const) : ('out_of_stock' as const),
      availableQuantity: p2.inStock ? 250 : 0,
      minimumOrderQuantity: p2.wholesale?.minimumOrderQuantity || 10,
      wholesalePrice,
      wholesaleTiers: p2.wholesale?.tiers || [],
      b2bAvailable: Boolean(p2.wholesale?.available),
      b2cAvailable: true,
      deliveryInfo: null,
      shipping: null,
      warrantyInfo: null,
      codAllowed: true,
      returnable: true,
      cancelable: true,
      specifications: {},
      tags: p2.tags || [],
      status: 'active' as const,
      sourceType: 'DEVELOPMENT_MOCK' as const,
      lastUpdated: new Date().toISOString(),
      lastSynced: new Date().toISOString(),
    };
  }

  return null;
}

export async function executeTool(toolCall: ToolCall): Promise<ToolCallResult> {
  const { name, arguments: args } = toolCall;
  const provider = getCatalogProvider();

  try {
    switch (name) {
      case 'searchProducts': {
        const query = typeof args.query === 'string' ? args.query.trim() : undefined;
        const category = typeof args.category === 'string' ? args.category.trim() : undefined;
        const subcategory = typeof args.subcategory === 'string' ? args.subcategory.trim() : undefined;
        const brand = typeof args.brand === 'string' ? args.brand.trim() : undefined;
        const seller = typeof args.seller === 'string' ? args.seller.trim() : undefined;
        const minPrice = typeof args.minPrice === 'number' ? args.minPrice : undefined;
        const maxPrice = typeof args.maxPrice === 'number' ? args.maxPrice : undefined;
        const inStockOnly = typeof args.inStockOnly === 'boolean' ? args.inStockOnly : undefined;
        const b2bOnly = typeof args.b2bOnly === 'boolean' ? args.b2bOnly : undefined;
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(args.limit, 1), 10) : 6;

        // Validation for empty queries
        if (args.query === '' && !category && !brand && !seller && minPrice === undefined && maxPrice === undefined) {
          return {
            toolName: name,
            arguments: args,
            result: { error: 'Search query or filter is required.' },
            success: false,
            error: 'Search query or filter cannot be empty.',
          };
        }

        const result = await provider.search({
          query,
          categoryName: category,
          subcategoryId: subcategory,
          brand,
          seller,
          minPrice,
          maxPrice,
          inStockOnly,
          b2bOnly,
          limit,
        });

        let products = result.products;
        // Check mock products if live query returned empty and query matches mock items
        if (products.length === 0 && (query || category)) {
          const matchedMocks = MOCK_PRODUCTS_DATA.filter((mp) => {
            if (query && !mp.name.toLowerCase().includes(query.toLowerCase())) return false;
            if (category && !mp.category.toLowerCase().includes(category.toLowerCase())) return false;
            return true;
          });
          if (matchedMocks.length > 0) {
            products = matchedMocks.map((mp) => findMockProduct(mp.id)!).filter(Boolean);
          } else {
            const matchedLegacy = LEGACY_MOCK_PRODUCTS.filter((mp) => {
              if (query && !mp.name.toLowerCase().includes(query.toLowerCase())) return false;
              if (category && !mp.category.toLowerCase().includes(category.toLowerCase())) return false;
              return true;
            });
            if (matchedLegacy.length > 0) {
              products = matchedLegacy.map((mp) => findMockProduct(mp.id)!).filter(Boolean);
            }
          }
        }

        const formattedProducts = products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand || 'Dwell Mart',
          seller: p.sellerName || 'Verified Seller',
          category: p.categoryName || 'General',
          price: p.sellingPrice,
          originalPrice: p.originalPrice,
          discount: p.discount ? `${p.discount}%` : null,
          currency: p.currency,
          unit: p.unit,
          stockStatus: p.stockStatus,
          moq: p.minimumOrderQuantity,
          wholesalePrice: p.wholesalePrice,
          image: p.image || (p.images.length > 0 ? p.images[0] : null),
          url: p.url,
          source: p.sourceType,
        }));

        return {
          toolName: name,
          arguments: args,
          result: {
            products: formattedProducts,
            totalResults: result.total || formattedProducts.length,
            totalCount: result.total || formattedProducts.length,
            returnedCount: formattedProducts.length,
            source: result.source,
            dataSource: 'mock',
            freshness: result.freshnessTimestamp,
            disclaimer: 'The available catalog data shows this price. Final price, shipping charges, taxes, and availability may need confirmation at checkout.',
          },
          success: true,
        };
      }

      case 'getProductById':
      case 'getProductDetails': {
        const productId = String(args.productId || args.id || '').trim();
        if (!productId) {
          return {
            toolName: name,
            arguments: args,
            result: { error: 'Product ID is required.' },
            success: false,
            error: 'Missing product ID',
          };
        }

        let product = await provider.getProductById(productId);
        if (!product) {
          product = findMockProduct(productId);
        }

        if (!product) {
          return {
            toolName: name,
            arguments: args,
            result: {
              error: `Product "${productId}" not found in verified catalog records.`,
              officialUrl: 'https://dwellmart.in',
            },
            success: false,
            error: `Product "${productId}" not found.`,
          };
        }

        return {
          toolName: name,
          arguments: args,
          result: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.sellingPrice,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              brand: product.brand,
              sellerName: product.sellerName,
              categoryName: product.categoryName,
              sellingPrice: product.sellingPrice,
              originalPrice: product.originalPrice,
              discount: product.discount,
              currency: product.currency,
              unit: product.unit,
              description: product.description,
              stockStatus: product.stockStatus,
              availableQuantity: product.availableQuantity,
              minimumOrderQuantity: product.minimumOrderQuantity,
              wholesalePrice: product.wholesalePrice,
              wholesaleTiers: product.wholesaleTiers,
              b2bAvailable: product.b2bAvailable,
              deliveryInfo: product.deliveryInfo,
              warrantyInfo: product.warrantyInfo,
              images: product.images,
              image: product.image,
              url: product.url,
              source: product.sourceType,
              lastUpdated: product.lastUpdated,
            },
            source: product.sourceType,
            disclaimer: 'The available catalog data shows this price. Final price, shipping charges, taxes, and availability may need confirmation at checkout.',
          },
          success: true,
        };
      }

      case 'getProductsByCategory': {
        const category = String(args.category || '').trim();
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(args.limit, 1), 10) : 6;

        const result = await provider.search({
          categoryName: category,
          limit,
        });

        let products = result.products;
        if (products.length === 0) {
          const matchedMocks = MOCK_PRODUCTS_DATA.filter(
            (mp) => mp.category.toLowerCase() === category.toLowerCase()
          );
          if (matchedMocks.length > 0) {
            products = matchedMocks.map((mp) => findMockProduct(mp.id)!).filter(Boolean);
          } else {
            const matchedLegacy = LEGACY_MOCK_PRODUCTS.filter(
              (mp) => mp.category.toLowerCase() === category.toLowerCase()
            );
            if (matchedLegacy.length > 0) {
              products = matchedLegacy.map((mp) => findMockProduct(mp.id)!).filter(Boolean);
            }
          }
        }

        return {
          toolName: name,
          arguments: args,
          result: {
            category,
            products: products.map((p) => ({
              id: p.id,
              name: p.name,
              brand: p.brand,
              category: p.categoryName || category,
              sellingPrice: p.sellingPrice,
              currency: p.currency,
              stockStatus: p.stockStatus,
              image: p.image,
              url: p.url,
              source: p.sourceType,
            })),
            totalResults: products.length,
            source: result.source,
          },
          success: true,
        };
      }

      case 'filterProducts': {
        const category = typeof args.category === 'string' ? args.category.trim() : undefined;
        const brand = typeof args.brand === 'string' ? args.brand.trim() : undefined;
        const minPrice = typeof args.minPrice === 'number' ? args.minPrice : undefined;
        const maxPrice = typeof args.maxPrice === 'number' ? args.maxPrice : undefined;
        const inStockOnly = args.stockStatus === 'in_stock';
        const limit = typeof args.limit === 'number' ? Math.min(Math.max(args.limit, 1), 10) : 6;

        const result = await provider.search({
          categoryName: category,
          brand,
          minPrice,
          maxPrice,
          inStockOnly,
          limit,
        });

        return {
          toolName: name,
          arguments: args,
          result: {
            products: result.products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.sellingPrice,
              currency: p.currency,
              brand: p.brand,
              stockStatus: p.stockStatus,
              image: p.image,
              url: p.url,
            })),
            totalResults: result.total,
            source: result.source,
          },
          success: true,
        };
      }

      case 'getProductCategories': {
        const categories = await provider.getCategories();
        const topCategories = categories
          .filter((c) => !c.parentId)
          .slice(0, 15)
          .map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            url: c.url,
            productCount: c.productCount,
          }));

        return {
          toolName: name,
          arguments: args,
          result: {
            totalCategories: categories.length,
            categories: topCategories,
            source: 'VERIFIED_LIVE_DATA',
          },
          success: true,
        };
      }

      case 'checkInventory': {
        const productId = String(args.productId || '').trim();
        const quantity = Number(args.quantity) || 1;

        let product = await provider.getProductById(productId);
        if (!product) {
          product = findMockProduct(productId);
        }

        if (!product) {
          return {
            toolName: name,
            arguments: args,
            result: { error: `Product "${productId}" not found.` },
            success: false,
          };
        }

        const isOutOfStock =
          product.stockStatus === 'out_of_stock' ||
          (product.availableQuantity !== null && product.availableQuantity === 0);
        const canFulfill = !isOutOfStock && (product.availableQuantity === null || product.availableQuantity >= quantity);

        return {
          toolName: name,
          arguments: args,
          result: {
            productId: product.id,
            productName: product.name,
            requestedQuantity: quantity,
            available: canFulfill,
            canFulfill,
            stockStatus: product.stockStatus,
            stockQuantity: product.availableQuantity ?? 0,
            minimumOrderQuantity: product.minimumOrderQuantity,
            source: product.sourceType,
            notice: 'Actual live stock availability is finalized at checkout on https://dwellmart.in.',
          },
          success: true,
        };
      }

      case 'getWholesalePrice': {
        const productId = String(args.productId || '').trim();
        const quantity = Number(args.quantity) || 1;

        let product = await provider.getProductById(productId);
        if (!product) {
          product = findMockProduct(productId);
        }

        if (!product) {
          return {
            toolName: name,
            arguments: args,
            result: { error: `Product "${productId}" not found.` },
            success: false,
          };
        }

        const moq = product.minimumOrderQuantity || 1;
        const meetsMoq = quantity >= moq;
        const retailPrice = product.sellingPrice || 0;
        let unitPrice = retailPrice;

        if (product.wholesalePrice && meetsMoq) {
          unitPrice = product.wholesalePrice;
        } else if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
          const matchingTier = [...product.wholesaleTiers]
            .sort((a, b) => b.minQuantity - a.minQuantity)
            .find((t) => quantity >= t.minQuantity);

          if (matchingTier) {
            unitPrice = matchingTier.pricePerUnit;
          }
        }

        const totalPrice = unitPrice * quantity;
        const discount =
          retailPrice > 0 && unitPrice < retailPrice
            ? Math.round(((retailPrice - unitPrice) / retailPrice) * 100)
            : 0;

        return {
          toolName: name,
          arguments: args,
          result: {
            productId: product.id,
            productName: product.name,
            requestedQuantity: quantity,
            minimumOrderQuantity: moq,
            meetsMoq,
            retailPrice,
            wholesalePrice: unitPrice,
            unitPrice,
            totalPrice,
            totalCost: totalPrice,
            discount,
            currency: product.currency,
            wholesaleTiers: product.wholesaleTiers,
            source: product.sourceType,
            confirmationRequired: true,
            preview: {
              product: product.name,
              quantity,
              estimatedTotal: `₹${totalPrice.toLocaleString('en-IN')}`,
              seller: product.sellerName || 'Verified Seller',
            },
          },
          success: true,
        };
      }

      case 'lookupStorePolicy': {
        const query = String(args.query || '').trim();
        const policyResult = globalPolicyStore.lookup(query);

        return {
          toolName: name,
          arguments: args,
          result: {
            topic: policyResult.topic,
            title: policyResult.title,
            answer: policyResult.answer,
            officialUrl: policyResult.officialUrl,
            source: policyResult.source,
            lastUpdated: policyResult.lastUpdated,
            isOutOfScope: policyResult.isOutOfScope,
          },
          success: true,
        };
      }

      default: {
        return {
          toolName: name,
          arguments: args,
          result: { error: `Unknown tool: ${name}` },
          success: false,
          error: `Unknown tool: ${name}`,
        };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal tool execution failure';
    logger.error(`Error executing tool "${name}":`, { error: msg });
    return {
      toolName: name,
      arguments: args,
      result: {
        error: msg,
        fallback: 'Please check official Dwell Mart website at https://dwellmart.in',
      },
      success: false,
      error: msg,
    };
  }
}
