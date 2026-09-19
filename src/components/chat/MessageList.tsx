'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { Product } from '@/lib/products/types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onInquireWholesale?: (product: Product) => void;
}

export function MessageList({ messages, isLoading, onInquireWholesale }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onInquireWholesale={onInquireWholesale}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
              AI
            </div>
            <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-md border border-neutral-150 bg-white px-5 py-4 shadow-xs">
              <span className="typing-dot h-2 w-2 rounded-full bg-neutral-400" />
              <span className="typing-dot h-2 w-2 rounded-full bg-neutral-400" />
              <span className="typing-dot h-2 w-2 rounded-full bg-neutral-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
