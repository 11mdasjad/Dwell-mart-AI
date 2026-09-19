// ===========================================
// Wholesale Inquiry Store — Demo & Client Storage
// ===========================================
// Manages draft and confirmed wholesale inquiries.
// Operates strictly in local storage / in-memory demo mode.
// Does NOT send external emails, WhatsApp messages, or API requests.
// ===========================================

import { WholesaleInquiryRequest, WholesaleInquiryRecord } from '@/lib/products/types';
import { generateId } from '@/lib/id';

const STORAGE_KEY = 'dwellmart-wholesale-inquiries';

/**
 * Creates a validated wholesale inquiry record.
 * Status is 'draft' until explicit user confirmation.
 */
export function createWholesaleInquiryDraft(
  request: WholesaleInquiryRequest
): WholesaleInquiryRecord {
  return {
    id: `inq-${generateId()}`,
    productId: request.productId,
    productName: request.productName.trim(),
    quantity: Math.max(1, Math.floor(request.quantity)),
    targetBudget: request.targetBudget ? Math.max(0, request.targetBudget) : undefined,
    deliveryLocation: request.deliveryLocation?.trim(),
    customerNotes: request.customerNotes?.trim(),
    createdAt: Date.now(),
    status: 'draft',
    source: 'demo_flow',
  };
}

/**
 * Save a confirmed wholesale inquiry to client local storage.
 * Only callable upon explicit user action.
 */
export function saveConfirmedInquiry(inquiry: WholesaleInquiryRecord): WholesaleInquiryRecord {
  const confirmed: WholesaleInquiryRecord = {
    ...inquiry,
    status: 'confirmed',
  };

  if (typeof window !== 'undefined') {
    try {
      const stored: WholesaleInquiryRecord[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      stored.unshift(confirmed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(0, 30)));
    } catch {
      // Storage unavailable or quota exceeded — silent fail
    }
  }

  return confirmed;
}

/**
 * Retrieve saved wholesale inquiries from local storage
 */
export function getSavedInquiries(): WholesaleInquiryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
