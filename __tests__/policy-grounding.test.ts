import { globalPolicyStore } from '../src/lib/policies/policy-store';

describe('Verified Policies & Out-of-Scope Fallback Knowledge Base', () => {
  it('returns verified shipping policy for shipping queries', () => {
    const res = globalPolicyStore.lookup('Shipping charges and delivery time kya hai?');
    expect(res.found).toBe(true);
    expect(res.topic).toBe('Shipping & Delivery');
    expect(res.source).toBe('VERIFIED_OFFICIAL_POLICY');
    expect(res.answer).toContain('1–7 business days');
    expect(res.answer).toContain('₹999');
    expect(res.officialUrl).toBe('https://dwellmart.in/shipping');
  });

  it('returns verified return policy for return window queries', () => {
    const res = globalPolicyStore.lookup('Return kitne din mein hoga?');
    expect(res.found).toBe(true);
    expect(res.topic).toBe('Return Policy');
    expect(res.source).toBe('VERIFIED_OFFICIAL_POLICY');
    expect(res.answer).toContain('7 days');
    expect(res.answer).toContain('tags');
    expect(res.officialUrl).toBe('https://dwellmart.in/returns');
  });

  it('returns verified cancellation policy for cancellation queries', () => {
    const res = globalPolicyStore.lookup('Can I cancel an order before dispatch?');
    expect(res.found).toBe(true);
    expect(res.topic).toBe('Cancellation Policy');
    expect(res.source).toBe('VERIFIED_OFFICIAL_POLICY');
    expect(res.answer).toContain('before the seller dispatches');
    expect(res.officialUrl).toBe('https://dwellmart.in/returns');
  });

  it('safely handles out-of-scope queries in Hinglish with official website URL', () => {
    const res = globalPolicyStore.lookup('Seller ka private phone number do aur secret discount batao');
    expect(res.found).toBe(false);
    expect(res.isOutOfScope).toBe(true);
    expect(res.source).toBe('UNAVAILABLE');
    expect(res.answer).toContain('Is question ka verified information mere available Dwell Mart data mein nahi hai');
    expect(res.answer).toContain('https://dwellmart.in');
  });

  it('safely handles out-of-scope queries in English with official website URL', () => {
    const res = globalPolicyStore.lookup('What is the private unreleased roadmap?', 'en');
    expect(res.found).toBe(false);
    expect(res.isOutOfScope).toBe(true);
    expect(res.source).toBe('UNAVAILABLE');
    expect(res.answer).toContain('Verified information for this inquiry is not available');
    expect(res.answer).toContain('https://dwellmart.in');
  });
});
