'use client';
import React, { useEffect, useRef } from 'react';
import { MessageListProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import MessageItem from '@/components/molecules/MessageItem';

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading = false, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const containerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing.values.md,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.values.sm,
    minWidth: 0,
    maxWidth: '100%',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: theme.colors.text.disabled,
    textAlign: 'center',
    gap: theme.spacing.values.md
  };

  if (messages.length === 0) {
    return (
      <div className={className} style={containerStyle}>
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '48px' }}>🤖</div>
          <div>
            <Text 
              variant="h3" 
              style={{ 
                margin: 0, 
                marginBottom: theme.spacing.values.sm,
                color: theme.colors.text.primary
              }}
            >
              Start a conversation
            </Text>
            <Text 
              variant="body1" 
              style={{ 
                margin: 0,
                color: theme.colors.text.secondary
              }}
            >
              Ask me anything and I'll help you find the answers.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      {messages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;