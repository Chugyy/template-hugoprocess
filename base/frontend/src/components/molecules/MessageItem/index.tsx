'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageItemProps } from '@/types/components';
import { useTheme } from '@/hooks';
import AIResponseContainer from '@/components/organisms/AIResponseContainer';

const MessageItem: React.FC<MessageItemProps> = ({ message, className = '' }) => {
  const { theme } = useTheme();
  const isUser = message.role === 'user';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: `${theme.spacing.values.lg}px`,
    width: '100%'
  };

  const messageWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isUser ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: `${theme.spacing.values.sm}px`,
    maxWidth: isUser ? '80%' : '100%',
    width: isUser ? 'auto' : '100%'
  };

  const avatarStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: isUser 
      ? theme.colors.secondary.main 
      : theme.colors.primary.main,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white'
  };

  const messageContentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0 // Important pour permettre le text-wrap
  };

  const userMessageStyle: React.CSSProperties = {
    backgroundColor: theme.colors.primary.main,
    color: 'white',
    padding: `${theme.spacing.values.sm}px ${theme.spacing.values.md}px`,
    borderRadius: `${theme.components.borderRadius.large}px`,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: '1.5',
    fontFamily: theme.typography.fontFamily,
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'break-word' as const,
    hyphens: 'auto' as const,
  };

  const aiMessageStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    padding: `${theme.spacing.values.md}px 0`,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: '1.6',
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    hyphens: 'auto' as const,
    maxWidth: '100%',
    overflow: 'hidden'
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: '11px',
    color: theme.colors.text.disabled,
    marginTop: `${theme.spacing.values.xs}px`,
    textAlign: isUser ? 'right' : 'left'
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const markdownStyles = {
    h1: { 
      fontSize: '1.5rem', 
      fontWeight: 'bold', 
      margin: '1rem 0 0.5rem 0', 
      color: theme.colors.text.primary,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },
    h2: { 
      fontSize: '1.3rem', 
      fontWeight: 'bold', 
      margin: '1rem 0 0.5rem 0', 
      color: theme.colors.text.primary,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },
    h3: { 
      fontSize: '1.1rem', 
      fontWeight: 'bold', 
      margin: '0.8rem 0 0.4rem 0', 
      color: theme.colors.text.primary,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },
    p: { 
      margin: '0.5rem 0', 
      lineHeight: '1.6',
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const
    },
    code: { 
      backgroundColor: theme.colors.background.default, 
      padding: '2px 4px', 
      borderRadius: '3px',
      fontSize: '0.9em',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      wordBreak: 'break-all' as const,
      overflowWrap: 'break-word' as const
    },
    pre: { 
      backgroundColor: theme.colors.background.default,
      padding: theme.spacing.values.md,
      borderRadius: theme.components.borderRadius.medium,
      overflow: 'auto',
      margin: '0.5rem 0',
      maxWidth: '100%',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const
    },
    blockquote: {
      borderLeft: `3px solid ${theme.colors.primary.main}`,
      paddingLeft: theme.spacing.values.md,
      margin: '0.5rem 0',
      fontStyle: 'italic',
      color: theme.colors.text.secondary,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },
    ul: { 
      paddingLeft: '1.5rem', 
      margin: '0.5rem 0',
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },
    ol: { 
      paddingLeft: '1.5rem', 
      margin: '0.5rem 0',
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },
    li: { 
      margin: '0.2rem 0',
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const
    }
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={messageWrapperStyle}>
        <div style={avatarStyle}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        <div style={messageContentStyle}>
          {isUser ? (
            <div style={userMessageStyle}>
              {String(message.content)}
            </div>
          ) : (
            <>
              {message.aiResponse ? (
                <AIResponseContainer 
                  response={{
                    id: message.id,
                    thinking: message.aiResponse.thinking,
                    toolCalls: message.aiResponse.toolCalls,
                    validations: message.aiResponse.validations,
                    finalResponse: message.content,
                    status: message.aiResponse.status
                  }}
                  onValidationResponse={(validationId, approved) => {
                    // Passer la validation au niveau supérieur
                    if ((window as any).handleValidationResponse) {
                      (window as any).handleValidationResponse(validationId, approved);
                    }
                  }}
                />
              ) : (
                <div style={aiMessageStyle}>
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 style={markdownStyles.h1}>{children}</h1>,
                      h2: ({children}) => <h2 style={markdownStyles.h2}>{children}</h2>,
                      h3: ({children}) => <h3 style={markdownStyles.h3}>{children}</h3>,
                      p: ({children}) => <p style={markdownStyles.p}>{children}</p>,
                      code: ({children}) => <code style={markdownStyles.code}>{children}</code>,
                      pre: ({children}) => <pre style={markdownStyles.pre}>{children}</pre>,
                      blockquote: ({children}) => <blockquote style={markdownStyles.blockquote}>{children}</blockquote>,
                      ul: ({children}) => <ul style={markdownStyles.ul}>{children}</ul>,
                      ol: ({children}) => <ol style={markdownStyles.ol}>{children}</ol>,
                      li: ({children}) => <li style={markdownStyles.li}>{children}</li>
                    }}
                  >
                    {String(message.content)}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
          
          <div style={timestampStyle}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;