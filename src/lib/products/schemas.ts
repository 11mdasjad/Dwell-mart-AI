// ===========================================
// Product Layer — Zod Runtime Validation Schemas
// ===========================================

import { z } from 'zod';

export const productStockStatusSchema = z.enum([
  'in_stock',
  'low_stock',
  'out_of_stock',
  'unknown',
]);

export const wholesalePriceTierSchema = z.object({
  minQty: z.number().int().positive(),
  maxQty: z.number().int().positive().nullable(),
  pricePerUnit: z.number().nonnegative(),
  discount: z.number().min(0).max(100),
});

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(250),
  slug: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().nonnegative().optional(),
  wholesalePrice: z.number().nonnegative().optional(),
  currency: z.string().default('INR'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  productUrl: z.string().url().optional(),
  stockStatus: productStockStatusSchema,
  availableQuantity: z.number().int().nonnegative().optional(),
  minimumOrderQuantity: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  source: z.enum(['mock', 'live']),
  lastUpdated: z.string().optional(),
});

export const productSearchParamsSchema = z.object({
  query: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  stockStatus: productStockStatusSchema.optional(),
  inStockOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).default(10).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
});

export const wholesaleInquiryRequestSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required').max(200),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  targetBudget: z.number().nonnegative('Budget cannot be negative').optional(),
  deliveryLocation: z.string().max(200).optional(),
  customerNotes: z.string().max(1000).optional(),
});
