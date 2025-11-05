'use client';
import React, { useState, useEffect } from 'react';
import { ChatSidebarProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  conversations, 
  activeConversationId, 
  onConversationSelect, 
  onNewChat, 
  className = '' 
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const collapsed = internalCollapsed;

  const handleToggle = () => {
    setInternalCollapsed(!collapsed);
  };

  const getWidth = () => {
    if (collapsed) return '60px';
    return '280px';
  };

  const sidebarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: isMobile ? '60px' : getWidth(),
    height: '100%',
    backgroundColor: theme.colors.background.paper,
    borderRight: 'none',
    borderRadius: '0',
    boxShadow: theme.shadows.elevation['8'],
    position: 'relative',
    transition: isMobile ? 'none' : 'width 0.3s ease',
    overflow: 'hidden',
    flexShrink: 0
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing.values.sm
  };

  const defaultHeader = (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: collapsed ? 'center' : 'space-between',
      padding: theme.spacing.values.sm
    }}>
      {!collapsed && !isMobile && (
        <Text variant="h3" style={{ margin: 0, color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily, fontWeight: 600 }}>
          Chats
        </Text>
      )}
      {!isMobile && (
        <Button
          variant="ghost"
          icon={collapsed ? 'menu' : 'chevron-left'}
          size="small"
          onClick={handleToggle}
          style={{ color: theme.colors.text.primary }}
        />
      )}
      {!collapsed && !isMobile && (
        <Button
          variant="primary"
          icon="plus"
          size="small"
          onClick={onNewChat}
        />
      )}
    </div>
  );

  const defaultFooter = (null);

  const formatDate = (date: Date) => {
    if (!isClient) {
      return '--:--'; // Placeholder pendant l'hydration
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <aside className={className} style={sidebarStyle}>
      {defaultHeader}
      <div style={contentStyle}>
        {conversations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: theme.spacing.values.sm,
            color: theme.colors.text.disabled 
          }}>
            {!collapsed && (
              <Text variant="body2">
                No conversations yet.
                <br />
                Start a new chat!
              </Text>
            )}
          </div>
        ) : (
          <>
            {collapsed || isMobile ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                padding: theme.spacing.values.sm
              }}>
                <Button
                  variant="primary"
                  icon="plus"
                  size="small"
                  onClick={onNewChat}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  
                  const conversationItemStyle: React.CSSProperties = {
                    padding: theme.spacing.values.sm,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isActive 
                      ? theme.colors.primary.light 
                      : 'transparent',
                    border: isActive 
                      ? `1px solid ${theme.colors.primary.main}` 
                      : '1px solid transparent',
                    transition: 'all 0.2s ease'
                  };
                  
                  return (
                    <div
                      key={conversation.id}
                      style={conversationItemStyle}
                      onClick={() => onConversationSelect(conversation.id)}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = theme.colors.background.default;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '2px'
                      }}>
                        <Text 
                          variant="body1" 
                          style={{ 
                            fontWeight: 500,
                            color: theme.colors.text.primary,
                            lineHeight: '1.4'
                          }}
                        >
                          {conversation.title}
                        </Text>
                        <Text 
                          variant="caption" 
                          style={{ 
                            color: theme.colors.text.disabled,
                            fontSize: '11px',
                            flexShrink: 0,
                            marginLeft: '4px'
                          }}
                        >
                          {formatDate(conversation.lastActivity)}
                        </Text>
                      </div>
                      
                      {conversation.preview && (
                        <Text 
                          variant="body2" 
                          style={{ 
                            color: theme.colors.text.secondary,
                            fontSize: '13px',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {conversation.preview}
                        </Text>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {defaultFooter}
    </aside>
  );
};

export default ChatSidebar;