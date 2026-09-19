// ===========================================
// Tool Definitions for AI Function Calling — Production Dwell Mart Agent
// ===========================================

import { ToolDefinition } from '@/types/chat';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'searchProducts',
    description:
      'Search the verified Dwell Mart catalog by query, category, subcategory, brand, seller, or price filters. Returns top matching products.',
    parameters: {
      query: {
        type: 'string',
        description: 'Search keyword, product name, or phrase (e.g., "bangles", "inverter", "men shirt", "atta")',
      },
      category: {
        type: 'string',
        description: 'Product category name or ID',
      },
      subcategory: {
        type: 'string',
        description: 'Subcategory filter',
      },
      brand: {
        type: 'string',
        description: 'Brand name (e.g. "Sharmazone", "Welish Cosmetics", "Luminous")',
      },
      seller: {
        type: 'string',
        description: 'Vendor / seller store name',
      },
      minPrice: {
        type: 'number',
        description: 'Minimum price in INR',
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price in INR (e.g. 1500 for "under 1500")',
      },
      inStockOnly: {
        type: 'boolean',
        description: 'Set to true to only return items currently in stock',
      },
      b2bOnly: {
        type: 'boolean',
        description: 'Set to true to only return items with wholesale/B2B availability',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 6, max 10)',
      },
    },
    required: [],
  },
  {
    name: 'getProductById',
    description:
      'Look up comprehensive verified details for a single product by its exact ID or slug. Returns full description, verified price, stock status, MOQ, and seller.',
    parameters: {
      productId: {
        type: 'string',
        description: 'The unique product ID or slug',
      },
    },
    required: ['productId'],
  },
  {
    name: 'getProductsByCategory',
    description:
      'Browse verified products within a specific category or subcategory.',
    parameters: {
      category: {
        type: 'string',
        description: 'Category name or ID',
      },
      subcategory: {
        type: 'string',
        description: 'Optional subcategory',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of items to return (default 6)',
      },
    },
    required: ['category'],
  },
  {
    name: 'filterProducts',
    description:
      'Multi-faceted product filter combining category, price range, brand, seller, and stock status.',
    parameters: {
      category: {
        type: 'string',
        description: 'Category name',
      },
      minPrice: {
        type: 'number',
        description: 'Minimum price in INR',
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price in INR',
      },
      brand: {
        type: 'string',
        description: 'Brand name',
      },
      stockStatus: {
        type: 'string',
        description: 'Stock status filter',
        enum: ['in_stock', 'low_stock', 'out_of_stock'],
      },
      limit: {
        type: 'number',
        description: 'Maximum results limit',
      },
    },
    required: [],
  },
  {
    name: 'getProductCategories',
    description:
      'List verified product categories available on Dwell Mart.',
    parameters: {},
    required: [],
  },
  {
    name: 'checkInventory',
    description:
      'Check if a verified product has sufficient stock for a given quantity. Returns stock status and availability.',
    parameters: {
      productId: {
        type: 'string',
        description: 'The product ID to check inventory for',
      },
      quantity: {
        type: 'number',
        description: 'The number of units requested',
      },
    },
    required: ['productId', 'quantity'],
  },
  {
    name: 'getWholesalePrice',
    description:
      'Retrieve verified wholesale pricing for a product at a given quantity. Checks MOQ and returns verified tier pricing or flags that seller confirmation is needed.',
    parameters: {
      productId: {
        type: 'string',
        description: 'The product ID to check wholesale pricing for',
      },
      quantity: {
        type: 'number',
        description: 'The number of units for the wholesale request',
      },
    },
    required: ['productId', 'quantity'],
  },
  {
    name: 'lookupStorePolicy',
    description:
      'Look up official, verified Dwell Mart policies regarding shipping, delivery, order cancellation, returns, refunds, payment methods, or marketplace FAQs.',
    parameters: {
      query: {
        type: 'string',
        description: 'The policy question or topic (e.g. "delivery charges", "return window", "cancel order", "refund time", "free shipping")',
      },
    },
    required: ['query'],
  },
];
