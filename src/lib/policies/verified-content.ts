/**
 * Verified Dwell Mart Policies & FAQ Knowledge Base
 * Sourced directly from official endpoints at https://dwellmart.in/api/pages/*
 * Effective Date: 18/03/2026 | Last Updated: 14/09/2026
 */

export interface VerifiedPolicyItem {
  id: string;
  category: 'shipping' | 'returns' | 'refunds' | 'cancellations' | 'support' | 'faq';
  title: string;
  summary: string;
  details: string;
  officialUrl: string;
  source: 'VERIFIED_OFFICIAL_POLICY';
  lastUpdated: string;
}

export const VERIFIED_POLICIES: VerifiedPolicyItem[] = [
  {
    id: 'shipping_general',
    category: 'shipping',
    title: 'Shipping & Delivery Policy',
    summary: 'Standard delivery is estimated at 1–7 business days after order confirmation. Free shipping applies on eligible orders above ₹999 (calculated after discounts).',
    details: `Official Dwell Mart Shipping & Delivery Policy:
1. Service Areas: Delivery is available to supported postal codes shown at checkout. Enter your delivery address to check availability and estimated delivery time before payment.
2. Delivery Timeframe: Standard delivery is normally estimated at 1–7 business days after order confirmation. Express delivery is available for eligible products via Dwell Mart Express.
3. Shipping Charges: Delivery charges are calculated and shown before payment at checkout. Free shipping applies when the eligible order value is above ₹999 (calculated after discounts). Remote area, heavy-item, or express charges are shown separately before payment.
4. Order Tracking: Once dispatched, a tracking ID and live tracking link will be sent via SMS/Email, and can also be tracked from the 'My Orders' page on https://dwellmart.in.
5. Checkout Price Notice: Final price, shipping charges, taxes, and availability need confirmation at checkout.`,
    officialUrl: 'https://dwellmart.in/shipping',
    source: 'VERIFIED_OFFICIAL_POLICY',
    lastUpdated: '2026-09-14',
  },
  {
    id: 'returns_general',
    category: 'returns',
    title: 'Return Policy',
    summary: 'Eligible products can be returned within 7 days from delivery for change of mind, provided items are unused, complete, and in original packaging with tags intact.',
    details: `Official Dwell Mart Return Policy:
1. Return Window: Eligible products may be returned for change of mind within 7 days from delivery.
2. Condition: Items must be unused, complete, and returned with original accessories, manuals, tags, and packaging where reasonable. Opening packaging does not remove rights if opening was reasonably necessary to inspect the product.
3. Non-Returnable Products: Made-to-order, personalized items, perishable foods, personal hygiene products, or items specifically marked as non-returnable on the product page.
4. Damaged or Defective Items: If a product is delivered damaged, defective, or incorrect, report it immediately from your order page with photographic proof to receive a prompt replacement or refund.
5. Raising a Request: Raise a return request directly from your Dwell Mart order details page at https://dwellmart.in/orders.`,
    officialUrl: 'https://dwellmart.in/returns',
    source: 'VERIFIED_OFFICIAL_POLICY',
    lastUpdated: '2026-09-14',
  },
  {
    id: 'cancellation_general',
    category: 'cancellations',
    title: 'Cancellation Policy',
    summary: 'Orders can be cancelled before the seller dispatches the item from the order page for a full refund. Cancellation after dispatch is subject to eligibility.',
    details: `Official Dwell Mart Cancellation Policy:
1. Cancellation Before Dispatch: A customer may request cancellation from the order page before the seller dispatches the item (unless made-to-order, personalized, or perishable).
2. Seller/Platform Cancellation: If Dwell Mart or the seller cancels an order after payment, Dwell Mart will automatically initiate a full refund including compulsory charges collected.
3. Cancellation After Dispatch: After dispatch, direct cancellation may not be available. Customers may refuse delivery or request a return once delivered under the Return Policy.
4. How to Cancel: Go to My Orders at https://dwellmart.in/orders, select the order, and click 'Cancel Order'.`,
    officialUrl: 'https://dwellmart.in/returns',
    source: 'VERIFIED_OFFICIAL_POLICY',
    lastUpdated: '2026-09-14',
  },
  {
    id: 'refunds_general',
    category: 'refunds',
    title: 'Refund Policy',
    summary: 'Refunds are initiated immediately upon approved cancellation or return inspection. Funds are credited to the original payment method.',
    details: `Official Dwell Mart Refund Policy:
1. Refund Initiation: Initiated automatically once an order is cancelled before dispatch, or within standard verification time after a returned product is received and inspected by the seller.
2. Payment Method: Refunds are credited back to the original payment method used during checkout (Credit/Debit Card, UPI, Net Banking, or Wallet).
3. COD Refunds: For Cash on Delivery orders, refunds are credited to the customer's verified bank account or UPI ID provided during the return process.
4. Processing Time: Bank and payment gateway processing typically takes 5–7 business days after initiation.`,
    officialUrl: 'https://dwellmart.in/returns',
    source: 'VERIFIED_OFFICIAL_POLICY',
    lastUpdated: '2026-09-14',
  },
  {
    id: 'support_marketplace',
    category: 'support',
    title: 'Marketplace & Wholesale Customer Support',
    summary: 'Dwell Mart connects customers, retailers, wholesalers, and business buyers with independent sellers across India.',
    details: `Official Dwell Mart Support & General FAQ:
1. About Dwell Mart: Dwell Mart is an Indian B2C and B2B online marketplace connecting buyers with verified independent sellers.
2. Wholesale & Bulk Purchase: Retailers and bulk buyers can purchase wholesale products directly, request custom quotations, or submit wholesale inquiries.
3. Seller Contact: Independent sellers are identified on product pages, carts, and invoices. Direct private negotiations or unpublished discounts require formal seller quotation.
4. Help Center: Support is accessible via https://dwellmart.in/support or by visiting https://dwellmart.in/contact.`,
    officialUrl: 'https://dwellmart.in/support',
    source: 'VERIFIED_OFFICIAL_POLICY',
    lastUpdated: '2026-09-14',
  },
];
