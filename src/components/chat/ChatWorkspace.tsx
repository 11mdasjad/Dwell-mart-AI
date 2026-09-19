'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Product, WholesaleInquiryRecord } from '@/lib/products/types';
import { Sidebar } from './Sidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { WelcomeScreen } from './WelcomeScreen';
import { WholesaleInquiryModal } from './WholesaleInquiryModal';

export function ChatWorkspace() {
  const { messages, isLoading, sendMessage, clearMessages, conversationId } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const handleNewChat = () => {
    clearMessages();
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleInquireWholesale = (product: Product) => {
    setSelectedProduct(product);
    setIsInquiryModalOpen(true);
  };

  const handleInquiryConfirmed = (inquiry: WholesaleInquiryRecord) => {
    // Automatically trigger conversational follow-up quote
    const prompt = `I have submitted a wholesale quotation inquiry for ${inquiry.quantity} units of ${inquiry.productName}${
      inquiry.deliveryLocation ? ` to be delivered to ${inquiry.deliveryLocation}` : ''
    }. Please provide the wholesale price tier breakdown and stock availability.`;
    sendMessage(prompt);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        currentConversationId={conversationId}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onClearChat={clearMessages}
          hasMessages={messages.length > 0}
        />

        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onInquireWholesale={handleInquireWholesale}
          />
        )}

        <ChatComposer onSend={sendMessage} isLoading={isLoading} />
      </div>

      {/* Wholesale Inquiry Dialog */}
      <WholesaleInquiryModal
        product={selectedProduct}
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        onInquiryConfirmed={handleInquiryConfirmed}
      />
    </div>
  );
}
