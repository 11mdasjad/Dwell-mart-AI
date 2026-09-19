'use client';

// ===========================================
// Product Card — Premium Light UI Component
// ===========================================

import React, { useState } from 'react';
import { Product } from '@/lib/products/types';

interface ProductCardProps {
  product: Product;
  onInquireWholesale?: (product: Product) => void;
}

export function ProductCard({ product, onInquireWholesale }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Stock status styles & labels
  const stockConfig = {
    in_stock: {
      label: 'In Stock',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      dotClass: 'bg-emerald-500',
    },
    low_stock: {
      label: 'Low Stock',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
      dotClass: 'bg-amber-500',
    },
    out_of_stock: {
      label: 'Out of Stock',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
      dotClass: 'bg-rose-500',
    },
    unknown: {
      label: 'Check Availability',
      badgeClass: 'bg-neutral-50 text-neutral-600 border-neutral-200',
      dotClass: 'bg-neutral-400',
    },
  }[product.stockStatus || 'in_stock'];

  const formattedPrice = product.price !== undefined
    ? `₹${product.price.toLocaleString('en-IN')}`
    : 'Price unavailable';

  const formattedWholesale = product.wholesalePrice !== undefined
    ? `₹${product.wholesalePrice.toLocaleString('en-IN')}`
    : null;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
      {/* Top Media / Category Bar */}
      <div>
        <div className="relative mb-3 flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-100/70">
          {product.imageUrl && !imageError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            // Graceful category-themed placeholder icon
            <div className="flex flex-col items-center justify-center p-3 text-neutral-400">
              <svg className="h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span className="mt-1 text-xs font-medium tracking-tight text-neutral-400">
                {product.category}
              </span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${stockConfig.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${stockConfig.dotClass}`} />
              {stockConfig.label}
            </span>
          </div>

          <div className="absolute top-2 right-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                product.source === 'live'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
              }`}
            >
              {product.source === 'live' ? 'Live Store' : 'Mock Demo'}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-1 flex items-center justify-between gap-2 text-xs text-neutral-500">
          <span className="truncate font-medium text-neutral-600">{product.brand || 'Dwell Mart'}</span>
          {product.subcategory && (
            <span className="shrink-0 text-[11px] text-neutral-400">{product.subcategory}</span>
          )}
        </div>

        {/* Product Title */}
        <h4 className="line-clamp-2 text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors" title={product.name}>
          {product.name}
        </h4>

        {/* Short Description */}
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
          {product.description}
        </p>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="mt-3 pt-3 border-t border-neutral-150/70">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-neutral-400">Retail Price</div>
            <div className="text-base font-bold text-neutral-900">{formattedPrice}</div>
          </div>

          {formattedWholesale && (
            <div className="text-right">
              <div className="text-[11px] font-medium text-primary-600">Wholesale Tier</div>
              <div className="text-sm font-semibold text-primary-700">{formattedWholesale}</div>
            </div>
          )}
        </div>

        {product.minimumOrderQuantity && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-neutral-500">
            <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>MOQ: <strong>{product.minimumOrderQuantity} units</strong></span>
            {product.unit && <span className="text-neutral-400">({product.unit})</span>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onInquireWholesale?.(product)}
            className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-700 focus:outline-hidden focus:ring-2 focus:ring-primary-500/30"
          >
            Inquire Wholesale
          </button>

          {product.productUrl && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              title="View Product on Store"
              aria-label={`View ${product.name} on store`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-xs animate-pulse">
      <div>
        <div className="mb-3 h-36 w-full rounded-lg bg-neutral-200" />
        <div className="mb-2 h-3 w-1/3 rounded bg-neutral-200" />
        <div className="mb-1 h-4 w-4/5 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-200" />
      </div>
      <div className="mt-4 pt-3 border-t border-neutral-100">
        <div className="h-5 w-1/2 rounded bg-neutral-200" />
        <div className="mt-3 h-8 w-full rounded bg-neutral-200" />
      </div>
    </div>
  );
}
