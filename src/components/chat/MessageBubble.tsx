'use client';

// ===========================================
// Message Bubble — Renders Markdown & Product Cards
// ===========================================

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '@/types/chat';
import { Product } from '@/lib/products/types';
import { ProductCardList } from './ProductCardList';

interface MessageBubbleProps {
  message: ChatMessage;
  onInquireWholesale?: (product: Product) => void;
}

export function MessageBubble({ message, onInquireWholesale }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Extract products from tool calls if present
  const productResults: Product[] = [];
  let totalCount = 0;
  let dataSource: 'mock' | 'live' = 'mock';

  if (!isUser && message.toolCalls) {
    for (const tc of message.toolCalls) {
      if (tc.success && tc.result && typeof tc.result === 'object') {
        const res = tc.result as Record<string, unknown>;
        if (Array.isArray(res.products) && res.products.length > 0) {
          for (const item of res.products) {
            if (item && typeof item === 'object' && 'id' in item && 'name' in item) {
              productResults.push(item as Product);
            }
          }
          if (typeof res.totalResults === 'number') totalCount = res.totalResults;
          if (res.dataSource === 'live') dataSource = 'live';
        } else if (res.product && typeof res.product === 'object' && 'id' in res.product) {
          productResults.push(res.product as Product);
          totalCount = 1;
          if (res.dataSource === 'live') dataSource = 'live';
        }
      }
    }
  }

  return (
    <div
      className={`flex gap-3 animate-slide-up ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isUser
            ? 'bg-primary-100 text-primary-700'
            : isError
            ? 'bg-error-50 text-error-600'
            : 'bg-neutral-100 text-neutral-600'
        }`}
      >
        {isUser ? 'You' : isError ? '!' : 'AI'}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-md bg-primary-600 text-white'
              : isError
              ? 'rounded-tl-md border border-error-200 bg-error-50 text-error-800'
              : 'rounded-tl-md border border-neutral-150 bg-white text-neutral-800 shadow-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-headings:text-neutral-900 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-table:my-2 prose-strong:text-neutral-900 prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Prevent rendering of dangerous elements
                  script: () => null,
                  iframe: () => null,
                  style: () => null,
                  table: ({ children, ...props }) => (
                    <div className="my-2.5 overflow-x-auto rounded-lg border border-neutral-200 shadow-xs">
                      <table className="min-w-full divide-y divide-neutral-200 text-left text-xs" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th className="bg-neutral-50 px-3 py-2 font-semibold text-neutral-900 border-b border-neutral-200" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="px-3 py-2 text-neutral-700 border-b border-neutral-100" {...props}>
                      {children}
                    </td>
                  ),
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 underline hover:text-primary-700"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Render Rich Product Cards if tool execution found products */}
              {productResults.length > 0 && (
                <ProductCardList
                  products={productResults}
                  totalCount={totalCount || productResults.length}
                  dataSource={dataSource}
                  onInquireWholesale={onInquireWholesale}
                />
              )}
            </div>
          )}
        </div>

        {/* Timestamp & Tool badges */}
        <div className={`mt-1 flex items-center gap-2 text-[11px] text-neutral-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{timestamp}</span>
          {message.toolCalls && message.toolCalls.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.25-5.25m0 0L12 4.17m-5.83 5.75H21" />
              </svg>
              {message.toolCalls.map((tc) => tc.toolName).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
