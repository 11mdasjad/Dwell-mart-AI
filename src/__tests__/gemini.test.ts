import { GeminiProvider } from '@/lib/ai/gemini-provider';
import { AuthenticationError } from '@/lib/ai/errors';

describe('Gemini Provider Tests', () => {
  it('should throw AuthenticationError if API key is missing', () => {
    expect(() => new GeminiProvider({ apiKey: '' })).toThrow(AuthenticationError);
  });

  it('should construct properly with valid API key', () => {
    const provider = new GeminiProvider({
      apiKey: 'test-api-key',
      model: 'gemini-3.6-flash',
    });
    expect(provider.name).toBe('gemini');
  });

  it('should gracefully handle network error', async () => {
    const provider = new GeminiProvider({
      apiKey: 'test-key',
      model: 'gemini-3.6-flash',
      timeoutMs: 50,
    });

    // Mock global fetch to simulate network failure
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

    await expect(
      provider.chat([{ role: 'user', content: 'test message' }])
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
