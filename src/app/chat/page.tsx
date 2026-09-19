import { ChatWorkspace } from '@/components/chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat — Dwell Mart AI',
  description: 'Chat with the Dwell Mart AI Shopping & Wholesale Assistant.',
};

export default function ChatPage() {
  return <ChatWorkspace />;
}
