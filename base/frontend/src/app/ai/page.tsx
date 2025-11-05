'use client';
import React from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import ChatContainer from '@/components/organisms/ChatContainer';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import { useChat, useChatHistory } from '@/hooks';
import { useTheme } from '@/hooks';

function AIContent() {
  const { theme } = useTheme();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    updateConversation,
    getActiveConversation
  } = useChatHistory();

  const { 
    sendMessage, 
    stopGeneration,
    handleValidation,
    isLoading, 
    isGenerating,
    currentMessage, 
    currentStep,
    hasPendingValidation,
    lastCompletedMessage
  } = useChat();

  // Exposer la fonction de validation globalement pour les composants
  React.useEffect(() => {
    (window as any).handleValidationResponse = handleValidation;
    return () => {
      delete (window as any).handleValidationResponse;
    };
  }, [handleValidation]);

  const handleNewChat = () => {
    createNewConversation();
  };

  const handleConversationSelect = (id: string) => {
    setActiveConversationId(id);
  };

  const handleSendMessage = async (data: {
    message: string;
    attachments?: any[];
    tools?: any[];
    agent?: any;
    model?: any;
  }) => {
    const activeConversation = getActiveConversation();
    if (!activeConversation) return;

    // Ajouter immédiatement le message utilisateur
    const userMessage = {
      id: Date.now().toString(),
      content: data.message.trim(),
      role: 'user' as const,
      timestamp: new Date()
    };

    const messagesWithUser = [...activeConversation.messages, userMessage];
    updateConversation(activeConversationId!, { 
      messages: messagesWithUser 
    });

    // Puis envoyer et recevoir la réponse IA
    const updatedMessages = await sendMessage(data.message, {
      ...activeConversation,
      messages: messagesWithUser
    });
    updateConversation(activeConversationId!, { 
      messages: updatedMessages 
    });
  };

  // Mock data for models and tools
  const availableModels = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      description: 'Most capable model for complex tasks',
      maxTokens: 8192
    },
    {
      id: 'gpt-3.5',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      description: 'Fast and cost-effective for most tasks',
      maxTokens: 4096
    },
    {
      id: 'claude-3',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      description: 'Balanced performance and capability',
      maxTokens: 200000
    }
  ];

  const availableTools = [
    {
      id: 'web-search',
      label: 'Web Search',
      icon: 'search',
      description: 'Search the web for current information',
      type: 'tool' as const,
      color: 'primary' as const,
      action: () => console.log('Web search activated')
    },
    {
      id: 'code-review',
      label: 'Code Review',
      icon: 'eye',
      description: 'Review and analyze code',
      type: 'tool' as const,
      color: 'info' as const,
      action: () => console.log('Code review activated')
    },
    {
      id: 'creative-writing',
      label: 'Creative Writing',
      icon: 'edit',
      description: 'Creative writing assistance',
      type: 'prompt' as const,
      color: 'warning' as const,
      action: () => console.log('Creative writing activated')
    },
    {
      id: 'data-analysis',
      label: 'Data Analysis',
      icon: 'bar-chart',
      description: 'Analyze and visualize data',
      type: 'tool' as const,
      color: 'success' as const,
      action: () => console.log('Data analysis activated')
    }
  ];

  const availableAgents = [
    {
      id: 'assistant',
      name: 'General Assistant',
      description: 'Helpful AI assistant for general tasks',
      capabilities: ['writing', 'analysis', 'coding']
    },
    {
      id: 'coder',
      name: 'Code Expert',
      description: 'Specialized in programming and development',
      capabilities: ['coding', 'debugging', 'architecture']
    },
    {
      id: 'analyst',
      name: 'Data Analyst',
      description: 'Expert in data analysis and visualization',
      capabilities: ['data-analysis', 'statistics', 'reporting']
    }
  ];

  const activeConversation = getActiveConversation();
  
  // Add current message to display for real-time updates
  let displayConversation = activeConversation;
  
  if (activeConversation) {
    if (currentMessage) {
      // Pendant la génération, afficher le message en cours
      displayConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, currentMessage]
      };
    } else if (lastCompletedMessage) {
      // Après validation, mettre à jour le dernier message
      const lastMessageIndex = activeConversation.messages.length - 1;
      if (lastMessageIndex >= 0 && activeConversation.messages[lastMessageIndex].id === lastCompletedMessage.id) {
        const updatedMessages = [...activeConversation.messages];
        updatedMessages[lastMessageIndex] = lastCompletedMessage;
        displayConversation = {
          ...activeConversation,
          messages: updatedMessages
        };
      }
    }
  }

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    height: 'calc(100vh - 80px)',
    gap: `${theme.spacing.values.lg}px`,
    padding: `${theme.spacing.values.lg}px`,
    backgroundColor: theme.colors.background.default,
    boxSizing: 'border-box'
  };

  return (
    <div style={contentStyle}>
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatContainer
          conversation={displayConversation}
          onSendMessage={handleSendMessage}
          availableModels={availableModels}
          availableTools={availableTools}
          availableAgents={availableAgents}
          defaultModel={availableModels[0]}
          defaultAgent={availableAgents[0]}
          isLoading={isLoading}
          isGenerating={isGenerating}
          hasPendingValidation={hasPendingValidation}
          onStopGeneration={stopGeneration}
          onValidationResponse={handleValidation}
        />
      </div>
    </div>
  );
}

export default function AIPage() {
  return (
    <DashboardTemplate
      header={<Header />}
      sidebar={<Sidebar />}
      scrollable={false}
    >
      <AIContent />
    </DashboardTemplate>
  );
}