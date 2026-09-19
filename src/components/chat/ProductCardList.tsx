'use client';

// ===========================================
// Product Card List — Multi-product container
// ===========================================

import React, { useState } from 'react';
import { Product } from '@/lib/products/types';
import { ProductCard } from './ProductCard';

interface ProductCardListProps {
  products: Product[];
  totalCount?: number;
  dataSource?: 'mock' | 'live';
  onInquireWholesale?: (product: Product) => void;
  title?: string;
}

export function ProductCardList({
  products,
  totalCount,
  dataSource = 'mock',
  onInquireWholesale,
  title,
}: ProductCardListProps) {
  const [showAll, setShowAll] = useState(false);

  if (!products || products.length === 0) {
    return (
      <div className="my-3 rounded-xl border border-dashed border-neutral-250 bg-neutral-50/70 p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200/60 text-neutral-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h4 className="mt-2 text-sm font-semibold text-neutral-800">No products found</h4>
        <p className="mt-1 text-xs text-neutral-500">
          Try adjusting your search terms, price boundaries, or explore other wholesale categories.
        </p>
      </div>
    );
  }

  const initialLimit = 4;
  const displayedProducts = showAll ? products : products.slice(0, initialLimit);
  const hasMore = products.length > initialLimit;

  return (
    <div className="my-3 space-y-3">
      {/* List Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-150 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-800">
            {title || 'Matching Products'}
          </span>
          <span className="rounded-full bg-neutral-150 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {totalCount ?? products.length} found
          </span>
        </div>

        <span className="text-[11px] text-neutral-400">
          {dataSource === 'live' ? '● Live Inventory' : '○ Demo Catalog Data'}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {displayedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onInquireWholesale={onInquireWholesale}
          />
        ))}
      </div>

      {/* Show More toggle */}
      {hasMore && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <span>{showAll ? 'Show fewer products' : `Show all ${products.length} matching products`}</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
