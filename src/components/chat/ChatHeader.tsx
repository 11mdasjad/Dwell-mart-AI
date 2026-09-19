'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
}

export function ChatHeader({ onToggleSidebar, onClearChat, hasMessages }: ChatHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-150 bg-white/80 px-4 backdrop-blur-md sm:h-16 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Dwell Mart"
            width={130}
            height={44}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
          <div className="hidden xs:flex items-center gap-1.5 border-l border-neutral-200 pl-3">
            <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800">
              AI
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-neutral-500">Live Verified</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/admin/data-quality"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          title="Admin Data Quality Dashboard"
        >
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden sm:inline">Data Quality</span>
        </a>

        {hasMessages && (
          <button
            onClick={onClearChat}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Clear conversation"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>
    </header>
  );
}
