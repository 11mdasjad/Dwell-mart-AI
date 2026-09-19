import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: "🔍",
    title: "Smart Product Search",
    description:
      "Find exactly what you need with natural language search across our entire catalog.",
  },
  {
    icon: "📦",
    title: "Wholesale Pricing",
    description:
      "Get tiered wholesale quotes instantly. The more you order, the more you save.",
  },
  {
    icon: "✅",
    title: "Inventory Checks",
    description:
      "Verify product availability and stock levels in real-time before placing orders.",
  },
  {
    icon: "💬",
    title: "AI Assistant",
    description:
      "Your intelligent shopping companion that understands your needs and guides your decisions.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-neutral-150 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Dwell Mart"
              width={160}
              height={52}
              className="h-9 sm:h-10 w-auto object-contain"
              priority
            />
            <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold tracking-wider text-amber-800">
              AI
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/data-quality"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            >
              Data Quality
            </Link>
            <Link
              href="/settings"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            >
              Settings
            </Link>
            <Link
              href="/chat"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md active:scale-[0.98]"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-white to-neutral-50" />
            <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-primary-100/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/3 -translate-x-1/4 rounded-full bg-primary-50/40 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 md:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse-soft" />
                AI-Powered Shopping Assistant
              </div>

              <h1 className="animate-slide-up text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
                Your Intelligent{" "}
                <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  Shopping
                </span>{" "}
                & Wholesale Partner
              </h1>

              <p className="animate-slide-up mt-6 text-lg leading-relaxed text-neutral-500 sm:text-xl" style={{ animationDelay: "0.1s" }}>
                Discover products, get wholesale quotes, check availability, and
                make smarter purchasing decisions — all through a natural
                conversation.
              </p>

              <div className="animate-slide-up mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: "0.2s" }}>
                <Link
                  href="/chat"
                  className="group flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/25 active:scale-[0.98]"
                >
                  Start Chatting
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/settings"
                  className="rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-base font-semibold text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md active:scale-[0.98]"
                >
                  View Settings
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-neutral-150 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                Everything you need, in one conversation
              </h2>
              <p className="mt-3 text-neutral-500">
                Powered by AI to make wholesale shopping effortless.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-neutral-150 bg-neutral-25 p-6 transition-all duration-300 hover:border-primary-200 hover:bg-white hover:shadow-lg"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-neutral-150 bg-neutral-50 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-neutral-500">
              Our AI assistant is ready to help you find products and get the
              best wholesale prices.
            </p>
            <Link
              href="/chat"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-xl active:scale-[0.98]"
            >
              Launch AI Chat
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-150 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-neutral-500 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Dwell Mart"
              width={110}
              height={36}
              className="h-6 w-auto object-contain opacity-85"
            />
            <span className="text-xs text-neutral-400">© {new Date().getFullYear()} Dwell Mart AI. Grounded in dwellmart.in</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live Catalog Grounded
          </div>
        </div>
      </footer>
    </div>
  );
}
