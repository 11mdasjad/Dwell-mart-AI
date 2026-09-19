import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Dwell Mart AI',
  description: 'Agent configuration and information.',
};

import { getSafeAgentConfig } from '@/lib/ai/config';

export const dynamic = 'force-dynamic';

function getSettingSections() {
  const config = getSafeAgentConfig();

  return [
    {
      title: 'Active AI Configuration',
      items: [
        { label: 'Application', value: 'Dwell Mart AI Agent' },
        {
          label: 'AI Provider',
          value:
            config.provider === 'gemini'
              ? 'Google Gemini (Production)'
              : config.provider === 'openai'
              ? 'OpenAI (Production)'
              : 'Mock (Offline Mode)',
          badge: config.provider === 'mock' ? 'Mock' : 'Live',
        },
        { label: 'Model', value: config.model },
        {
          label: 'API Key Status',
          value: config.hasApiKey ? 'Configured (Server-Side Secret)' : 'Not Configured',
          badge: config.hasApiKey ? 'Active' : 'Pending',
        },
        {
          label: 'Mode',
          value: config.mockMode ? 'Mock Data (No live AI billing)' : 'Live AI Agent',
          badge: config.mockMode ? 'Mock' : 'Live',
        },
      ],
    },
    {
      title: 'Data Source',
      items: [
        { label: 'Catalog', value: 'Demo Catalog (20 products)', badge: 'Demo' },
        { label: 'Categories', value: '5 categories' },
        { label: 'Wholesale Pricing', value: 'Mock tiered pricing' },
        { label: 'Inventory', value: 'Simulated stock levels' },
      ],
    },
    {
      title: 'Capabilities',
      items: [
        { label: 'Product Search', value: 'Available', badge: 'Active' },
        { label: 'Product Details', value: 'Available', badge: 'Active' },
        { label: 'Inventory Check', value: 'Available', badge: 'Active' },
        { label: 'Wholesale Pricing', value: 'Available', badge: 'Active' },
        { label: 'Order Placement', value: 'Coming Soon', badge: 'Pending' },
        { label: 'Live Catalog', value: 'Integration Pending', badge: 'Pending' },
      ],
    },
    {
      title: 'Security',
      items: [
        { label: 'API Key Storage', value: 'Server-side only (Redacted)' },
        { label: 'Rate Limiting', value: '20 requests/minute' },
        { label: 'Input Validation', value: 'Strict Zod schemas' },
        { label: 'Prompt Injection Defense', value: 'System prompt guarded' },
        { label: 'Request Size Limit', value: '64 KB' },
      ],
    },
  ];
}

function getBadgeColor(badge: string): string {
  switch (badge) {
    case 'Active':
      return 'bg-success-50 text-success-600 border-success-500/20';
    case 'Mock':
    case 'Demo':
      return 'bg-warning-50 text-warning-500 border-warning-500/20';
    case 'Pending':
      return 'bg-neutral-100 text-neutral-500 border-neutral-200';
    default:
      return 'bg-neutral-100 text-neutral-500 border-neutral-200';
  }
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-neutral-150 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="Go back to home"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-neutral-900">Settings</h1>
          </div>

          <Link
            href="/chat"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md active:scale-[0.98]"
          >
            Open Chat
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {getSettingSections().map((section) => (
            <section
              key={section.title}
              className="overflow-hidden rounded-2xl border border-neutral-150 bg-white shadow-xs"
            >
              <div className="border-b border-neutral-150 bg-neutral-25 px-6 py-4">
                <h2 className="text-sm font-semibold text-neutral-900">
                  {section.title}
                </h2>
              </div>

              <div className="divide-y divide-neutral-100">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <span className="text-sm text-neutral-500">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800">
                        {item.value}
                      </span>
                      {item.badge && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getBadgeColor(item.badge)}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Environment Variables Guide */}
          <section className="overflow-hidden rounded-2xl border border-neutral-150 bg-white shadow-xs">
            <div className="border-b border-neutral-150 bg-neutral-25 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">
                Environment Configuration
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="mb-4 text-sm text-neutral-500">
                To switch from mock mode to a real AI provider, configure these
                environment variables in your <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-700">.env.local</code> file:
              </p>

              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 p-4">
                <pre className="text-xs leading-relaxed text-neutral-300">
                  <code>{`# Switch to OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o`}</code>
                </pre>
              </div>

              <p className="mt-4 text-xs text-neutral-400">
                After updating, restart the development server. Never commit API keys to version control.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-neutral-400">
          <p>Dwell Mart AI Agent v0.1.0 · Demo Application</p>
          <p className="mt-1">
            This application is not connected to the live Dwell Mart backend.
          </p>
        </div>
      </main>
    </div>
  );
}
