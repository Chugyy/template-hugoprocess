'use client';
import { useState, useCallback } from 'react';
import { ChatConversation } from '@/types/components';

const mockConversations: ChatConversation[] = [
  {
    id: '1',
    title: 'Getting Started with AI',
    messages: [
      {
        id: '1',
        content: 'Hello! How can I help you today?',
        role: 'assistant',
        timestamp: new Date(Date.now() - 3600000)
      }
    ],
    lastActivity: new Date(Date.now() - 3600000),
    preview: 'Hello! How can I help you today?'
  },
  {
    id: '2',
    title: 'Code Review Help',
    messages: [
      {
        id: '2',
        content: 'Can you help me review this React component?',
        role: 'user',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        id: '3',
        content: 'Of course! Please share the component code.',
        role: 'assistant',
        timestamp: new Date(Date.now() - 7180000)
      }
    ],
    lastActivity: new Date(Date.now() - 7180000),
    preview: 'Of course! Please share the component code.'
  }
];

export const useChatHistory = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>('1');

  const createNewConversation = useCallback((): string => {
    const newId = Date.now().toString();
    const newConversation: ChatConversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      lastActivity: new Date(),
      preview: ''
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    return newId;
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<ChatConversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { 
              ...conv, 
              ...updates, 
              lastActivity: new Date(),
              title: updates.messages && updates.messages.length > 0 && conv.title === 'New Chat'
                ? updates.messages[0].content.slice(0, 30) + '...'
                : conv.title,
              preview: updates.messages && updates.messages.length > 0
                ? updates.messages[updates.messages.length - 1].content.slice(0, 100)
                : conv.preview
            }
          : conv
      ).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    );
  }, []);

  const getActiveConversation = useCallback(() => {
    return conversations.find(conv => conv.id === activeConversationId);
  }, [conversations, activeConversationId]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    updateConversation,
    getActiveConversation
  };
};