import { VERIFIED_POLICIES, VerifiedPolicyItem } from './verified-content';
import { SourceClassification } from '../catalog/types';

export interface PolicyLookupResult {
  found: boolean;
  topic: string;
  title: string;
  answer: string;
  source: SourceClassification;
  officialUrl: string;
  lastUpdated?: string;
  isOutOfScope: boolean;
}

const OFFICIAL_STORE_URL = 'https://dwellmart.in';

export class PolicyStore {
  private policies: VerifiedPolicyItem[] = VERIFIED_POLICIES;

  public lookup(query: string, language: 'en' | 'hi' | 'hinglish' = 'hinglish'): PolicyLookupResult {
    const q = query.toLowerCase().trim();

    // 0. Explicit Out-of-Scope Detection (Private info, unpublished discounts, secret negotiations)
    if (
      q.includes('private phone') ||
      q.includes('secret discount') ||
      q.includes('private number') ||
      q.includes('personal number') ||
      q.includes('internal roadmap') ||
      q.includes('unreleased roadmap') ||
      q.includes('negotiate price') ||
      q.includes('unpublished')
    ) {
      const isEnglish = language === 'en' || !/hai|karein|aap|mein|kya|nahi|batao|do/i.test(q);
      return {
        found: false,
        topic: 'Out of Scope / Unverified',
        title: 'Information Not Available',
        answer: isEnglish
          ? 'Verified information for this inquiry is not available in our current Dwell Mart catalog records. Please verify directly on the official Dwell Mart website: https://dwellmart.in'
          : 'Is question ka verified information mere available Dwell Mart data mein nahi hai. Aap official website par check kar sakte hain: https://dwellmart.in',
        source: 'UNAVAILABLE',
        officialUrl: OFFICIAL_STORE_URL,
        isOutOfScope: true,
      };
    }

    // 1. Return Queries (prioritized over generic 'kitne din')
    if (
      q.includes('return') ||
      q.includes('returns') ||
      q.includes('vapas') ||
      q.includes('wapas') ||
      q.includes('exchange') ||
      q.includes('damaged') ||
      q.includes('defective') ||
      q.includes('wrong product') ||
      q.includes('kharaab')
    ) {
      const item = this.policies.find((p) => p.category === 'returns')!;
      return {
        found: true,
        topic: 'Return Policy',
        title: item.title,
        answer: item.details,
        source: 'VERIFIED_OFFICIAL_POLICY',
        officialUrl: item.officialUrl,
        lastUpdated: item.lastUpdated,
        isOutOfScope: false,
      };
    }

    // 2. Cancellation Queries
    if (
      q.includes('cancel') ||
      q.includes('cancellation') ||
      q.includes('order radd') ||
      q.includes('cancel karna')
    ) {
      const item = this.policies.find((p) => p.category === 'cancellations')!;
      return {
        found: true,
        topic: 'Cancellation Policy',
        title: item.title,
        answer: item.details,
        source: 'VERIFIED_OFFICIAL_POLICY',
        officialUrl: item.officialUrl,
        lastUpdated: item.lastUpdated,
        isOutOfScope: false,
      };
    }

    // 3. Refund Queries
    if (
      q.includes('refund') ||
      q.includes('refunds') ||
      q.includes('paisa') ||
      q.includes('paise wapas') ||
      q.includes('money back') ||
      q.includes('payment return')
    ) {
      const item = this.policies.find((p) => p.category === 'refunds')!;
      return {
        found: true,
        topic: 'Refund Policy',
        title: item.title,
        answer: item.details,
        source: 'VERIFIED_OFFICIAL_POLICY',
        officialUrl: item.officialUrl,
        lastUpdated: item.lastUpdated,
        isOutOfScope: false,
      };
    }

    // 4. Shipping & Delivery Queries
    if (
      q.includes('shipping') ||
      q.includes('delivery') ||
      q.includes('deliver') ||
      q.includes('ship') ||
      q.includes('kab aayega') ||
      q.includes('kab tak') ||
      q.includes('free shipping') ||
      q.includes('charge') ||
      q.includes('postal code') ||
      q.includes('pincode') ||
      (q.includes('kitne din') && (q.includes('deliver') || q.includes('order') || q.includes('aayega')))
    ) {
      const item = this.policies.find((p) => p.category === 'shipping')!;
      return {
        found: true,
        topic: 'Shipping & Delivery',
        title: item.title,
        answer: item.details,
        source: 'VERIFIED_OFFICIAL_POLICY',
        officialUrl: item.officialUrl,
        lastUpdated: item.lastUpdated,
        isOutOfScope: false,
      };
    }

    // 5. General Support / Account / Marketplace
    if (
      q.includes('support') ||
      q.includes('help') ||
      q.includes('contact') ||
      q.includes('madad') ||
      q.includes('customer care') ||
      q.includes('helpline')
    ) {
      const item = this.policies.find((p) => p.category === 'support')!;
      return {
        found: true,
        topic: 'Customer Support',
        title: item.title,
        answer: item.details,
        source: 'VERIFIED_OFFICIAL_POLICY',
        officialUrl: item.officialUrl,
        lastUpdated: item.lastUpdated,
        isOutOfScope: false,
      };
    }

    // 6. Out-of-Scope Fallback (Strict Non-Hallucination)
    const isEnglishOnly = language === 'en' || !/[^\x00-\x7F]|hai|karein|aap|mein|kya|nahi/i.test(q);
    const fallbackMessage = isEnglishOnly
      ? 'Verified information for this inquiry is not available in our current Dwell Mart catalog records. Please verify directly on the official Dwell Mart website: https://dwellmart.in'
      : 'Is question ka verified information mere available Dwell Mart data mein nahi hai. Aap official website par check kar sakte hain: https://dwellmart.in';

    return {
      found: false,
      topic: 'Out of Scope / Unverified',
      title: 'Information Not Available',
      answer: fallbackMessage,
      source: 'UNAVAILABLE',
      officialUrl: OFFICIAL_STORE_URL,
      isOutOfScope: true,
    };
  }
}

export const globalPolicyStore = new PolicyStore();
