'use client';

// ===========================================
// Wholesale Inquiry Modal — Safe Demo Flow
// ===========================================

import React, { useState } from 'react';
import { Product, WholesaleInquiryRecord } from '@/lib/products/types';
import { createWholesaleInquiryDraft, saveConfirmedInquiry } from '@/lib/wholesale/inquiry-store';

interface WholesaleInquiryModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onInquiryConfirmed?: (inquiry: WholesaleInquiryRecord) => void;
}

interface InnerDialogProps {
  product: Product;
  onClose: () => void;
  onInquiryConfirmed?: (inquiry: WholesaleInquiryRecord) => void;
}

function WholesaleInquiryDialogInner({
  product,
  onClose,
  onInquiryConfirmed,
}: InnerDialogProps) {
  const [quantity, setQuantity] = useState<number>(product.minimumOrderQuantity || 10);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<WholesaleInquiryRecord | null>(null);

  const estimatedUnitWholesale = product.wholesalePrice || (product.price ? Math.round(product.price * 0.8) : 0);
  const estimatedTotal = estimatedUnitWholesale * quantity;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    const draft = createWholesaleInquiryDraft({
      productId: product.id,
      productName: product.name,
      quantity,
      targetBudget: targetBudget ? parseFloat(targetBudget) : undefined,
      deliveryLocation: deliveryLocation.trim() || undefined,
      customerNotes: customerNotes.trim() || undefined,
    });

    const saved = saveConfirmedInquiry(draft);
    setConfirmedRecord(saved);
    setIsSubmitted(true);
    onInquiryConfirmed?.(saved);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wholesale-modal-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          aria-label="Close wholesale inquiry modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSubmitted ? (
          <div>
            <div className="mb-4">
              <span className="inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                Wholesale Quote Inquiry
              </span>
              <h3 id="wholesale-modal-title" className="mt-1.5 text-lg font-bold text-neutral-900">
                Request Commercial Quotation
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Review and customize your wholesale inquiry for <strong>{product.name}</strong>.
              </p>
            </div>

            {/* Product Summary Box */}
            <div className="mb-4 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3 text-xs">
              <div className="flex justify-between items-center text-neutral-600">
                <span>Category: <strong>{product.category}</strong></span>
                <span>Brand: <strong>{product.brand || 'Dwell Mart'}</strong></span>
              </div>
              <div className="mt-2 flex justify-between items-baseline border-t border-neutral-200 pt-2">
                <div>
                  <span className="text-neutral-500">Retail Unit: </span>
                  <span className="font-semibold text-neutral-800">
                    {typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Est. Wholesale Unit: </span>
                  <span className="font-bold text-primary-700">₹{estimatedUnitWholesale.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirm} className="space-y-3.5">
              <div>
                <label htmlFor="inquiry-quantity" className="block text-xs font-semibold text-neutral-700">
                  Required Order Quantity (Units) *
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="inquiry-quantity"
                    type="number"
                    min={product.minimumOrderQuantity || 1}
                    max={100000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                  />
                  {product.minimumOrderQuantity && (
                    <span className="shrink-0 text-[11px] text-neutral-500">
                      (Min: {product.minimumOrderQuantity})
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="delivery-location" className="block text-xs font-medium text-neutral-700">
                    Delivery City / State (Optional)
                  </label>
                  <input
                    id="delivery-location"
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="target-budget" className="block text-xs font-medium text-neutral-700">
                    Target Budget in ₹ (Optional)
                  </label>
                  <input
                    id="target-budget"
                    type="number"
                    min={0}
                    placeholder="e.g. 50000"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customer-notes" className="block text-xs font-medium text-neutral-700">
                  Business Requirements / Notes (Optional)
                </label>
                <textarea
                  id="customer-notes"
                  rows={2}
                  placeholder="e.g. Need batch dispatch in 2 lots, custom packaging required..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Inquiry Summary Bar */}
              <div className="rounded-lg bg-neutral-100/80 p-2.5 text-xs text-neutral-700">
                <div className="flex justify-between font-semibold">
                  <span>Estimated Total Wholesale Value:</span>
                  <span className="text-primary-700">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">
                  * Final pricing, shipping terms, and GST invoicing will be confirmed upon review.
                </div>
              </div>

              {/* Notice Banner */}
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] text-amber-800">
                <strong>Demonstration Mode:</strong> This inquiry will be recorded in your browser local storage. No external communications or emails will be dispatched.
              </div>

              {/* Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-neutral-150">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition-colors"
                >
                  Confirm & Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="py-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-bold text-neutral-900">Inquiry Confirmed</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Your wholesale inquiry draft has been successfully recorded in your session.
            </p>

            {confirmedRecord && (
              <div className="my-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-left text-xs space-y-1">
                <div>Reference ID: <strong className="font-mono text-[11px]">{confirmedRecord.id}</strong></div>
                <div>Product: <strong>{confirmedRecord.productName}</strong></div>
                <div>Quantity: <strong>{confirmedRecord.quantity} units</strong></div>
                {confirmedRecord.deliveryLocation && (
                  <div>Destination: <strong>{confirmedRecord.deliveryLocation}</strong></div>
                )}
                <div>Status: <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Recorded (Demo)</span></div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Done & Return to Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WholesaleInquiryModal({
  product,
  isOpen,
  onClose,
  onInquiryConfirmed,
}: WholesaleInquiryModalProps) {
  if (!isOpen || !product) return null;

  return (
    <WholesaleInquiryDialogInner
      key={product.id}
      product={product}
      onClose={onClose}
      onInquiryConfirmed={onInquiryConfirmed}
    />
  );
}
