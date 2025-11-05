'use client';
import { useState, useCallback } from 'react';
import { ChatConversation, ChatMessage } from '@/types/components';

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasPendingValidation, setHasPendingValidation] = useState(false);
  const [lastCompletedMessage, setLastCompletedMessage] = useState<ChatMessage | null>(null);

  const sendMessage = useCallback(async (content: string, conversation: ChatConversation): Promise<ChatMessage[]> => {
    if (!content.trim()) return conversation.messages;

    setIsLoading(true);
    setIsGenerating(true);
    setCurrentStep(0);

    // Préparer le message de base
    const baseMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      aiResponse: {
        thinking: [],
        toolCalls: [],
        validations: [],
        status: 'thinking'
      }
    };

    // Animation étape par étape
    const steps = [
      {
        type: 'thinking',
        content: 'Analyzing the user query to understand the intent',
        data: {
          query: content,
          intent: 'information_request',
          confidence: 0.87,
          context: 'user_wants_help'
        },
        delay: 1500
      },
      {
        type: 'thinking',
        content: 'Determining which tools might be needed',
        data: {
          available_tools: ['web_search', 'code_analyzer', 'file_reader'],
          recommended_tools: ['web_search'],
          reasoning: 'Query requires current information'
        },
        delay: 2000
      },
      {
        type: 'tool_use',
        content: 'Executing web search',
        tool: 'web_search',
        parameters: {
          query: content,
          max_results: 5,
          filter: 'recent'
        },
        delay: 2500
      },
      {
        type: 'validation',
        content: 'Requesting permission for file operation',
        action: 'Execute File Operation',
        description: 'The AI wants to create a new file based on your request. This will write to your filesystem.',
        parameters: {
          file_path: './example.txt',
          operation: 'create',
          content_preview: 'Sample content...'
        },
        delay: 1000
      }
    ];

    let currentMessage = { ...baseMessage };
    
    // Simuler les étapes une par une
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      const step = steps[i];
      
      await new Promise(resolve => setTimeout(resolve, step.delay));

      if (step.type === 'thinking') {
        currentMessage.aiResponse!.thinking!.push({
          id: `think-${i}`,
          type: 'thinking',
          content: step.content,
          data: step.data,
          timestamp: new Date(),
          status: 'completed'
        });
        currentMessage.aiResponse!.status = 'thinking';
      } else if (step.type === 'tool_use') {
        currentMessage.aiResponse!.toolCalls!.push({
          id: `tool-${i}`,
          tool: step.tool!,
          parameters: step.parameters!,
          result: {
            results: [
              { title: 'Example Result 1', url: 'https://example.com/1', snippet: 'Relevant information found' },
              { title: 'Example Result 2', url: 'https://example.com/2', snippet: 'Additional context here' }
            ],
            total_found: 2
          },
          status: 'completed',
          timestamp: new Date()
        });
        currentMessage.aiResponse!.status = 'processing';
      } else if (step.type === 'validation') {
        currentMessage.aiResponse!.validations!.push({
          id: `valid-${i}`,
          action: step.action!,
          description: step.description!,
          parameters: step.parameters,
          status: 'pending',
          timestamp: new Date()
        });
        currentMessage.aiResponse!.status = 'waiting_validation';
        setHasPendingValidation(true);
      }

      // Mettre à jour le message actuel pour l'affichage en temps réel
      setCurrentMessage({ ...currentMessage });
    }

    // Finaliser la réponse
    currentMessage.content = `I understand your question about "${content}". This is a simulated AI response with advanced capabilities.`;
    
    // Stocker le message complété pour pouvoir le mettre à jour plus tard
    setLastCompletedMessage({ ...currentMessage });
    
    setIsGenerating(false);
    setIsLoading(false);
    setCurrentMessage(null);

    return [...conversation.messages, currentMessage];
  }, []);

  const stopGeneration = useCallback(() => {
    setIsGenerating(false);
    setIsLoading(false);
    setCurrentMessage(null);
    setCurrentStep(0);
  }, []);

  const handleValidation = useCallback((validationId: string, approved: boolean) => {
    console.log('Validation handled:', validationId, approved);
    
    if (approved) {
      // Simulation de l'exécution de l'action approuvée
      setHasPendingValidation(false);
      setIsGenerating(true);
      
      // Mettre à jour le statut de la validation dans le message
      if (lastCompletedMessage?.aiResponse?.validations) {
        const updatedMessage = { ...lastCompletedMessage };
        const validationIndex = updatedMessage.aiResponse.validations.findIndex(v => v.id === validationId);
        if (validationIndex !== -1) {
          updatedMessage.aiResponse.validations[validationIndex].status = 'approved';
          updatedMessage.aiResponse.status = 'processing';
          setLastCompletedMessage(updatedMessage);
        }
      }
      
      // Simuler l'exécution de l'action
      setTimeout(() => {
        console.log('Action executed successfully');
        setIsGenerating(false);
        
        // Marquer l'action comme terminée
        if (lastCompletedMessage?.aiResponse) {
          const updatedMessage = { ...lastCompletedMessage };
          updatedMessage.aiResponse.status = 'completed';
          updatedMessage.content += '\n\n✅ **Action exécutée avec succès !** Le fichier `./example.txt` a été créé.';
          setLastCompletedMessage(updatedMessage);
        }
      }, 2000);
    } else {
      // Action refusée
      setHasPendingValidation(false);
      console.log('Action cancelled by user');
      
      // Mettre à jour le statut de la validation dans le message
      if (lastCompletedMessage?.aiResponse?.validations) {
        const updatedMessage = { ...lastCompletedMessage };
        const validationIndex = updatedMessage.aiResponse.validations.findIndex(v => v.id === validationId);
        if (validationIndex !== -1) {
          updatedMessage.aiResponse.validations[validationIndex].status = 'rejected';
          updatedMessage.aiResponse.status = 'completed';
          updatedMessage.content += '\n\n❌ **Action annulée** par l\'utilisateur.';
          setLastCompletedMessage(updatedMessage);
        }
      }
    }
  }, [lastCompletedMessage]);

  return {
    sendMessage,
    stopGeneration,
    handleValidation,
    isLoading,
    isGenerating,
    currentMessage,
    currentStep,
    hasPendingValidation,
    lastCompletedMessage
  };
};