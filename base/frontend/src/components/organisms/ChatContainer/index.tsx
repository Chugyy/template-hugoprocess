'use client';
import React from 'react';
import { ChatContainerProps } from '@/types/components';
import { useTheme } from '@/hooks';
import MessageList from '@/components/organisms/MessageList';
import ChatInput from '@/components/molecules/ChatInput';
import Text from '@/components/atoms/Text';

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  conversation, 
  onSendMessage, 
  availableModels = [],
  availableTools = [],
  availableAgents = [],
  defaultModel,
  defaultAgent,
  isLoading = false,
  isGenerating = false,
  hasPendingValidation = false,
  onStopGeneration,
  onValidationResponse,
  className = '' 
}) => {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.background.paper,
    borderRadius: `${theme.layout.modal.radius}px`,
    boxShadow: theme.shadows.elevation['2'],
    border: `1px solid ${theme.colors.divider}`,
    overflow: 'hidden',
    minWidth: 0
  };

  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.values.lg,
    borderBottom: `1px solid ${theme.colors.divider}`,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: theme.colors.text.disabled,
    textAlign: 'center',
    gap: `${theme.spacing.values.md}px`,
    padding: `${theme.spacing.values.xl}px`,
    backgroundColor: theme.colors.background.default,
    borderRadius: `${theme.layout.modal.radius}px`,
    margin: `${theme.spacing.values.lg}px`
  };

  if (!conversation) {
    return (
      <div className={className} style={containerStyle}>
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '64px', marginBottom: theme.spacing.values.md }}>
            🤖
          </div>
          <div>
            <Text 
              variant="h2" 
              style={{ 
                margin: 0, 
                marginBottom: theme.spacing.values.sm,
                color: theme.colors.text.primary 
              }}
            >
              Welcome to AI Chat
            </Text>
            <Text 
              variant="body1" 
              style={{ 
                margin: 0,
                color: theme.colors.text.secondary 
              }}
            >
              Select a conversation or start a new one to begin chatting.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <Text 
            variant="h3" 
            style={{ 
              margin: 0, 
              color: theme.colors.text.primary,
              fontWeight: 600 
            }}
          >
            {conversation.title}
          </Text>
          <Text 
            variant="caption" 
            style={{ 
              color: theme.colors.text.disabled,
              marginTop: '2px',
              display: 'block' 
            }}
          >
            {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
          </Text>
        </div>
        
      </div>
      
      <MessageList 
        messages={conversation.messages} 
        isLoading={isLoading}
      />
      
      <ChatInput 
        onSend={onSendMessage}
        disabled={isLoading || hasPendingValidation}
        placeholder={hasPendingValidation ? "Waiting for validation..." : isGenerating ? "AI is generating..." : "Type your message..."}
        availableModels={availableModels}
        availableTools={availableTools}
        availableAgents={availableAgents}
        defaultModel={defaultModel}
        defaultAgent={defaultAgent}
        enableVoiceRecording={true}
        isGenerating={isGenerating}
        onStopGeneration={onStopGeneration}
      />

    </div>
  );
};

export default ChatContainer;