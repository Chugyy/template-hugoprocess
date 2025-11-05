'use client';
import React, { useState } from 'react';
import { useTheme } from '@/hooks';
import { AIResponse, AIThinkingStep, AIToolCall, AIValidationRequest } from '@/types/ai';
import Button from '@/components/atoms/Button';
import ReactMarkdown from 'react-markdown';

interface AIResponseContainerProps {
  response: AIResponse;
  onValidationResponse?: (validationId: string, approved: boolean) => void;
  className?: string;
}

const AIResponseContainer: React.FC<AIResponseContainerProps> = ({ 
  response, 
  onValidationResponse,
  className = '' 
}) => {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thinking: false,
    tools: false,
    validations: false,
    response: true // La réponse finale est ouverte par défaut
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: `${theme.spacing.values.lg}px`
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: `${theme.spacing.values.md}px`,
    backgroundColor: theme.colors.background.paper,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: `1px solid ${theme.colors.background.default}`
  };

  const headerStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.sm}px ${theme.spacing.values.md}px`,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderBottom: `1px solid rgba(0,0,0,0.05)`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease'
  };

  const contentStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.md}px`,
    backgroundColor: theme.colors.background.paper
  };

  const jsonStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.default,
    padding: `${theme.spacing.values.sm}px`,
    borderRadius: `${theme.components.borderRadius.small}px`,
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '12px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap'
  };

  const statusDotStyle = (status: string): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 
      status === 'completed' ? theme.colors.success.main :
      status === 'in_progress' ? theme.colors.warning.main :
      status === 'error' ? theme.colors.error.main :
      theme.colors.info.main,
    marginRight: `${theme.spacing.values.xs}px`
  });

  const validationStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.md}px`,
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.warning.main}`,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    marginBottom: `${theme.spacing.values.md}px`,
    boxShadow: `0 2px 8px rgba(255, 193, 7, 0.2)`
  };

  const finalResponseStyle: React.CSSProperties = {
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: '1.6',
    fontFamily: theme.typography.fontFamily,
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  };

  const getAnimatedHeaderStyle = (isActive: boolean) => ({
    ...headerStyle,
    background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)' : headerStyle.backgroundColor,
    backgroundSize: isActive ? '200% 100%' : '100% 100%',
    animation: isActive ? 'shimmer 2s ease-in-out infinite' : 'none'
  });

  const renderThinkingSteps = () => {
    if (!response.thinking?.length) return null;

    const isActive = response.status === 'thinking';

    return (
      <div style={sectionStyle}>
        <div 
          style={getAnimatedHeaderStyle(isActive)}
          onClick={() => toggleSection('thinking')}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={statusDotStyle(response.status)} />
            🧠 Réflexion IA ({response.thinking.length} étapes)
          </div>
          <span>{expandedSections.thinking ? '▼' : '▶'}</span>
        </div>
        {expandedSections.thinking && (
          <div style={contentStyle}>
            {response.thinking.map((step, index) => (
              <div key={step.id} style={{ marginBottom: `${theme.spacing.values.md}px` }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: `${theme.spacing.values.xs}px`,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={statusDotStyle(step.status || 'completed')} />
                  Étape {index + 1}: {step.type}
                </div>
                <div style={{ marginBottom: `${theme.spacing.values.sm}px` }}>
                  {step.content}
                </div>
                {step.data && (
                  <div style={jsonStyle}>
                    {JSON.stringify(step.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderToolCalls = () => {
    if (!response.toolCalls?.length) return null;

    const isActive = response.status === 'processing';

    return (
      <div style={sectionStyle}>
        <div 
          style={getAnimatedHeaderStyle(isActive)}
          onClick={() => toggleSection('tools')}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={statusDotStyle('in_progress')} />
            🔧 Utilisation d'outils ({response.toolCalls.length})
          </div>
          <span>{expandedSections.tools ? '▼' : '▶'}</span>
        </div>
        {expandedSections.tools && (
          <div style={contentStyle}>
            {response.toolCalls.map((toolCall) => (
              <div key={toolCall.id} style={{ marginBottom: `${theme.spacing.values.md}px` }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: `${theme.spacing.values.xs}px`,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={statusDotStyle(toolCall.status)} />
                  {toolCall.tool}
                </div>
                
                <div style={{ marginBottom: `${theme.spacing.values.sm}px` }}>
                  <strong>Paramètres:</strong>
                  <div style={jsonStyle}>
                    {JSON.stringify(toolCall.parameters, null, 2)}
                  </div>
                </div>

                {toolCall.result && (
                  <div>
                    <strong>Résultat:</strong>
                    <div style={jsonStyle}>
                      {JSON.stringify(toolCall.result, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderValidations = () => {
    if (!response.validations?.length) return null;

    const isActive = response.status === 'waiting_validation';
    const hasCompletedValidations = response.validations.some(v => v.status !== 'pending');

    // Si toutes les validations sont terminées, les afficher dans une section repliable
    if (hasCompletedValidations && !isActive) {
      return (
        <div style={sectionStyle}>
          <div 
            style={headerStyle}
            onClick={() => toggleSection('validations')}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={statusDotStyle('completed')} />
              {response.validations.some(v => v.status === 'approved') ? '✅' : '❌'} Validations ({response.validations.length})
            </div>
            <span>{expandedSections.validations ? '▼' : '▶'}</span>
          </div>
          {expandedSections.validations && (
            <div style={contentStyle}>
              {response.validations.map((validation, index) => (
                <div key={validation.id} style={{ marginBottom: `${theme.spacing.values.md}px` }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: `${theme.spacing.values.xs}px`,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={statusDotStyle(validation.status === 'approved' ? 'completed' : 'error')} />
                    Validation {index + 1}: {validation.action}
                  </div>
                  <div style={{ marginBottom: `${theme.spacing.values.sm}px`, fontSize: '12px', color: theme.colors.text.secondary }}>
                    {validation.description}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: validation.status === 'approved' ? theme.colors.success.main : theme.colors.error.main,
                    fontWeight: 600,
                    marginBottom: `${theme.spacing.values.xs}px`
                  }}>
                    {validation.status === 'approved' ? '✓ Approuvé par l\'utilisateur' : '✗ Refusé par l\'utilisateur'}
                  </div>
                  {validation.parameters && (
                    <div style={jsonStyle}>
                      {JSON.stringify(validation.parameters, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Sinon, afficher les validations en attente normalement
    return response.validations.map((validation) => (
      <div key={validation.id} style={validationStyle}>
        <div style={{ marginBottom: `${theme.spacing.values.md}px` }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: `${theme.spacing.values.xs}px`,
            background: isActive ? 'linear-gradient(90deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 193, 7, 0.1) 50%, rgba(255, 193, 7, 0.2) 100%)' : 'transparent',
            backgroundSize: isActive ? '200% 100%' : '100% 100%',
            animation: isActive ? 'shimmer 2s ease-in-out infinite' : 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            ⚠️ Validation requise: {validation.action}
          </div>
          <div style={{ marginBottom: `${theme.spacing.values.sm}px` }}>
            {validation.description}
          </div>
          {validation.parameters && (
            <div style={jsonStyle}>
              {JSON.stringify(validation.parameters, null, 2)}
            </div>
          )}
        </div>

        {validation.status === 'pending' && onValidationResponse && (
          <div style={{ display: 'flex', gap: `${theme.spacing.values.sm}px` }}>
            <Button
              variant="primary"
              onClick={() => onValidationResponse(validation.id, true)}
              style={{ fontSize: '12px' }}
            >
              ✓ Approuver
            </Button>
            <Button
              variant="tertiary"
              onClick={() => onValidationResponse(validation.id, false)}
              style={{ fontSize: '12px' }}
            >
              ✗ Refuser
            </Button>
          </div>
        )}
      </div>
    ));
  };

  const renderFinalResponse = () => {
    if (!response.finalResponse) return null;

    return (
      <div style={{ 
        marginTop: `${theme.spacing.values.lg}px`,
        ...finalResponseStyle 
      }}>
        <ReactMarkdown>{response.finalResponse}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={className} style={containerStyle}>
      {renderThinkingSteps()}
      {renderToolCalls()}
      {renderValidations()}
      {renderFinalResponse()}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default AIResponseContainer;