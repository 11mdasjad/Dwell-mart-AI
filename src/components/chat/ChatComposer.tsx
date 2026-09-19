'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatComposerProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatComposer({ onSend, isLoading, disabled }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmitting = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled || isSubmitting.current) return;

    isSubmitting.current = true;
    onSend(trimmed);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Debounce to prevent double submission
    setTimeout(() => {
      isSubmitting.current = false;
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-neutral-150 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-3 rounded-2xl border border-neutral-200 bg-neutral-25 p-2 transition-colors focus-within:border-primary-300 focus-within:bg-white focus-within:shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, wholesale pricing, or categories..."
            aria-label="Chat message input"
            rows={1}
            disabled={isLoading || disabled}
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
          >
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-neutral-400">
          Press <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">Enter</kbd> to send · <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
