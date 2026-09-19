'use client';

// ===========================================
// Welcome Screen — Phase 3 Discovery Prompts
// ===========================================

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: '⚡',
    title: 'Inverters under ₹10,000',
    prompt: 'Show me inverter under 10000 with pure sine wave backup',
  },
  {
    icon: '🌾',
    title: 'Wholesale Rice & Staples',
    prompt: 'Mujhe 10 kg rice chahiye wholesale ke liye with prices',
  },
  {
    icon: '🛵',
    title: 'Electric Scooters & Fleet',
    prompt: 'Do you have electric scooters available for commercial delivery?',
  },
  {
    icon: '🏢',
    title: 'Ergonomic Office Chairs',
    prompt: 'What is the wholesale price for 25 units of Ergonomic Mesh Office Chair?',
  },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="mx-auto max-w-xl text-center">
        {/* Logo */}
        <div className="animate-scale-in mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            DM
          </div>
        </div>

        <h1 className="animate-slide-up text-2xl font-bold text-neutral-900 sm:text-3xl">
          Welcome to Dwell Mart AI
        </h1>

        <p className="animate-slide-up mt-3 text-base text-neutral-500">
          Your AI shopping & wholesale discovery assistant.
          <br />
          <span className="text-sm">Search by keyword, category, or budget in English, Hindi, or Hinglish.</span>
        </p>

        {/* Suggestion cards */}
        <div className="animate-slide-up mt-8 grid gap-3 sm:grid-cols-2 text-left">
          {suggestions.map((s) => (
            <button
              key={s.title}
              type="button"
              onClick={() => onSuggestionClick(s.prompt)}
              className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-md active:scale-[0.98]"
            >
              <span className="text-xl shrink-0">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700">
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{s.prompt}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Mode badge */}
        <div className="animate-fade-in mt-8 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/80 px-3 py-1.5 text-xs text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Phase 3 Catalog Discovery Active · Demonstration Mode
        </div>
      </div>
    </div>
  );
}
