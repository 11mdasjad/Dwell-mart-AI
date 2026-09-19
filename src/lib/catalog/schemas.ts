import { z } from 'zod';
import { Product, StockStatus, ProductVariant, WholesalePriceTier } from './types';

export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().nullable().optional(),
  stock: z.number().nullable().optional(),
});

export const WholesalePriceTierSchema = z.object({
  minQuantity: z.number().min(1),
  pricePerUnit: z.number().nonnegative(),
  discountPercentage: z.number().optional(),
});

export const ProductShippingInfoSchema = z.object({
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  dimensionUnit: z.string().optional(),
  deliveryEstimate: z.string().optional(),
  source: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  shortDescription: z.string().nullable().default(null),
  categoryId: z.string().nullable().default(null),
  categoryName: z.string().nullable().default(null),
  subcategoryId: z.string().nullable().default(null),
  subcategoryName: z.string().nullable().default(null),
  brand: z.string().nullable().default(null),
  brandId: z.string().nullable().default(null),
  sellerId: z.string().nullable().default(null),
  sellerName: z.string().nullable().default(null),
  sellingPrice: z.number().nullable().default(null),
  originalPrice: z.number().nullable().default(null),
  discount: z.number().nullable().default(null),
  currency: z.string().default('INR'),
  unit: z.string().default('Piece'),
  variants: z.array(ProductVariantSchema).default([]),
  size: z.string().nullable().default(null),
  color: z.string().nullable().default(null),
  material: z.string().nullable().default(null),
  gender: z.enum(['men', 'women', 'kids', 'unisex', 'all']).nullable().default(null),
  ageGroup: z.string().nullable().default(null),
  images: z.array(z.string()).default([]),
  image: z.string().nullable().default(null),
  video: z.string().nullable().default(null),
  url: z.string(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'unavailable']).default('in_stock'),
  availableQuantity: z.number().nullable().default(null),
  minimumOrderQuantity: z.number().default(1),
  wholesalePrice: z.number().nullable().default(null),
  wholesaleTiers: z.array(WholesalePriceTierSchema).default([]),
  b2bAvailable: z.boolean().default(false),
  b2cAvailable: z.boolean().default(true),
  deliveryInfo: z.string().nullable().default(null),
  shipping: ProductShippingInfoSchema.nullable().default(null),
  warrantyInfo: z.string().nullable().default(null),
  codAllowed: z.boolean().default(true),
  returnable: z.boolean().default(true),
  cancelable: z.boolean().default(true),
  specifications: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  sourceType: z.enum([
    'VERIFIED_LIVE_DATA',
    'VERIFIED_IMPORTED_DATA',
    'VERIFIED_OFFICIAL_POLICY',
    'VERIFIED_PRODUCT_PAGE',
    'UNAVAILABLE',
    'DEVELOPMENT_MOCK'
  ]),
  lastUpdated: z.string(),
  lastSynced: z.string(),
});

export interface IngestionValidationResult {
  valid: Product[];
  failed: Array<{ item: unknown; error: string }>;
}

interface RawProductApi {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  price?: number;
  originalPrice?: number;
  categoryId?: string | { _id?: string; id?: string; name?: string } | null;
  brandId?: string | { _id?: string; id?: string; name?: string } | null;
  vendorId?: string | { _id?: string; id?: string; name?: string; storeName?: string } | null;
  stock?: string;
  stockQuantity?: number;
  minimumOrderQuantity?: number;
  wholesaleEnabled?: boolean;
  retailEnabled?: boolean;
  isActive?: boolean;
  image?: string;
  images?: string[];
  video?: string | null;
  variants?: {
    sizes?: string[];
    colors?: string[];
    materials?: string[];
    prices?: Record<string, number>;
  };
  wholesale?: {
    priceTiers?: Array<{ minQty?: number; price?: number; discount?: number }>;
  };
  shipping?: {
    weight?: number | null;
    weightUnit?: string | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    dimensionUnit?: string | null;
    source?: string | null;
  };
  warrantyPeriod?: string | null;
  codAllowed?: boolean;
  returnable?: boolean;
  cancelable?: boolean;
  hsnCode?: string | null;
  taxRate?: number;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  unit?: string;
  gender?: string;
  ageGroup?: string | null;
  updatedAt?: string;
}

/**
 * Normalizes raw product from Dwell Mart live API into strictly validated Product
 */
export function mapLiveApiProductToProduct(rawInput: Record<string, unknown>, syncTimestamp: string): Product {
  const raw = rawInput as unknown as RawProductApi;
  const id = String(raw._id || raw.id || '');
  const name = String(raw.name || '').trim();
  const slug = String(raw.slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : id));

  const price = typeof rawInput.price === 'number' ? rawInput.price : null;
  const originalPrice = typeof rawInput.originalPrice === 'number' ? rawInput.originalPrice : price;
  const discount = price && originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  // Extract Category
  let categoryId: string | null = null;
  let categoryName: string | null = null;
  if (rawInput.categoryId) {
    if (typeof rawInput.categoryId === 'object') {
      const c = rawInput.categoryId as Record<string, unknown>;
      categoryId = String(c._id || c.id || '');
      categoryName = (c.name as string) || null;
    } else {
      categoryId = String(rawInput.categoryId);
    }
  }

  // Extract Brand
  let brandId: string | null = null;
  let brandName: string | null = null;
  if (rawInput.brandId) {
    if (typeof rawInput.brandId === 'object') {
      const b = rawInput.brandId as Record<string, unknown>;
      brandId = String(b._id || b.id || '');
      brandName = (b.name as string) || null;
    } else {
      brandId = String(rawInput.brandId);
    }
  }

  // Extract Vendor / Seller
  let sellerId: string | null = null;
  let sellerName: string | null = null;
  if (rawInput.vendorId) {
    if (typeof rawInput.vendorId === 'object') {
      const v = rawInput.vendorId as Record<string, unknown>;
      sellerId = String(v._id || v.id || '');
      sellerName = (v.storeName as string) || (v.name as string) || null;
    } else {
      sellerId = String(rawInput.vendorId);
    }
  }

  // Map stock status
  let stockStatus: StockStatus = 'in_stock';
  if (rawInput.stock === 'low_stock') stockStatus = 'low_stock';
  else if (rawInput.stock === 'out_of_stock' || (rawInput.stockQuantity === 0)) stockStatus = 'out_of_stock';
  else if (rawInput.isActive === false) stockStatus = 'unavailable';

  // Map images
  const images = Array.isArray(rawInput.images) ? rawInput.images.filter((img: unknown) => typeof img === 'string' && img.length > 0) as string[] : [];
  const image = (rawInput.image as string) || (images.length > 0 ? images[0] : null);

  // Map variants
  const variants: ProductVariant[] = [];
  const rawVariants = rawInput.variants as Record<string, unknown> | undefined;
  if (rawVariants) {
    const sizes = Array.isArray(rawVariants.sizes) ? rawVariants.sizes : [];
    const colors = Array.isArray(rawVariants.colors) ? rawVariants.colors : [];
    const prices = (rawVariants.prices as Record<string, number>) || {};

    if (sizes.length > 0 || colors.length > 0) {
      for (const s of (sizes.length > 0 ? sizes : [''])) {
        for (const c of (colors.length > 0 ? colors : [''])) {
          const key = `${s}|${c}`.toLowerCase();
          variants.push({
            size: s || undefined,
            color: c || undefined,
            price: prices[key] || price || undefined,
          });
        }
      }
    }
  }

  // Wholesale tiers
  const wholesaleTiers: WholesalePriceTier[] = [];
  const rawWholesale = rawInput.wholesale as Record<string, unknown> | undefined;
  if (rawWholesale && Array.isArray(rawWholesale.priceTiers)) {
    for (const item of rawWholesale.priceTiers) {
      const t = item as Record<string, unknown>;
      if (typeof t.minQty === 'number' && typeof t.price === 'number') {
        wholesaleTiers.push({
          minQuantity: t.minQty,
          pricePerUnit: t.price,
          discountPercentage: typeof t.discount === 'number' ? t.discount : undefined,
        });
      }
    }
  }

  return {
    id,
    name,
    slug,
    sku: raw.sku || null,
    description: raw.description ? String(raw.description).trim() : null,
    shortDescription: raw.shortDescription ? String(raw.shortDescription).trim() : null,
    categoryId,
    categoryName,
    subcategoryId: null,
    subcategoryName: null,
    brand: brandName,
    brandId,
    sellerId,
    sellerName,
    sellingPrice: price,
    originalPrice,
    discount,
    currency: 'INR',
    unit: raw.unit || 'Piece',
    variants,
    size: Array.isArray(raw.variants?.sizes) && raw.variants.sizes.length > 0 ? raw.variants.sizes.join(', ') : null,
    color: Array.isArray(raw.variants?.colors) && raw.variants.colors.length > 0 ? raw.variants.colors.join(', ') : null,
    material: Array.isArray(raw.variants?.materials) && raw.variants.materials.length > 0 ? raw.variants.materials.join(', ') : null,
    gender: (raw.gender && ['men', 'women', 'kids', 'unisex', 'all'].includes(raw.gender))
      ? (raw.gender as 'men' | 'women' | 'kids' | 'unisex' | 'all')
      : 'all',
    ageGroup: raw.ageGroup || null,
    images,
    image,
    video: raw.video || null,
    url: `https://dwellmart.in/product/${raw.slug || id}`,
    stockStatus,
    availableQuantity: typeof raw.stockQuantity === 'number' ? raw.stockQuantity : null,
    minimumOrderQuantity: typeof raw.minimumOrderQuantity === 'number' ? raw.minimumOrderQuantity : 1,
    wholesalePrice: wholesaleTiers.length > 0 ? wholesaleTiers[0].pricePerUnit : null,
    wholesaleTiers,
    b2bAvailable: Boolean(raw.wholesaleEnabled || wholesaleTiers.length > 0),
    b2cAvailable: raw.retailEnabled !== false,
    deliveryInfo: raw.shipping ? `Shipping weight: ${raw.shipping.weight || 'N/A'} ${raw.shipping.weightUnit || ''}` : null,
    shipping: raw.shipping ? {
      weight: raw.shipping.weight ?? undefined,
      weightUnit: raw.shipping.weightUnit ?? undefined,
      length: raw.shipping.length ?? undefined,
      width: raw.shipping.width ?? undefined,
      height: raw.shipping.height ?? undefined,
      dimensionUnit: raw.shipping.dimensionUnit ?? undefined,
      source: raw.shipping.source ?? undefined,
    } : null,
    warrantyInfo: raw.warrantyPeriod ? `Warranty: ${raw.warrantyPeriod}` : null,
    codAllowed: raw.codAllowed !== false,
    returnable: raw.returnable !== false,
    cancelable: raw.cancelable !== false,
    specifications: {
      hsnCode: raw.hsnCode || 'N/A',
      taxRate: raw.taxRate !== undefined ? `${raw.taxRate}%` : 'N/A',
      isNewArrival: Boolean(raw.isNewArrival),
      isFeatured: Boolean(raw.isFeatured),
    },
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.isActive ? 'active' : 'inactive',
    sourceType: 'VERIFIED_LIVE_DATA',
    lastUpdated: raw.updatedAt || new Date().toISOString(),
    lastSynced: syncTimestamp,
  };
}
