'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChatAttachment, ChatTool, ChatModel, ChatAgent, VoiceRecordingState } from '@/types/components';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Tag from '@/components/atoms/Tag';
import Input from '@/components/atoms/Input';
import Dropdown from '@/components/molecules/Dropdown';

interface ChatInputProps {
  onSend: (data: {
    message: string;
    attachments?: ChatAttachment[];
    tools?: ChatTool[];
    agent?: ChatAgent;
    model?: ChatModel;
  }) => void;
  disabled?: boolean;
  placeholder?: string;
  availableModels?: ChatModel[];
  availableTools?: ChatTool[];
  availableAgents?: ChatAgent[];
  defaultModel?: ChatModel;
  defaultAgent?: ChatAgent;
  maxAttachments?: number;
  maxAttachmentSize?: number;
  supportedFileTypes?: string[];
  enableVoiceRecording?: boolean;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  availableModels = [],
  availableTools = [],
  availableAgents = [],
  defaultModel,
  defaultAgent,
  maxAttachments = 5,
  maxAttachmentSize = 10 * 1024 * 1024,
  supportedFileTypes = ['image/*', 'text/*', 'application/pdf'],
  enableVoiceRecording = true,
  isGenerating = false,
  onStopGeneration,
  className = ''
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<ChatModel | undefined>(defaultModel);
  const [selectedAgent, setSelectedAgent] = useState<ChatAgent | undefined>(defaultAgent);
  const [selectedTools, setSelectedTools] = useState<ChatTool[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>({ isRecording: false, duration: 0 });
  const [toolsSearch, setToolsSearch] = useState('');
  const [agentsSearch, setAgentsSearch] = useState('');
  const [maxVisibleTools, setMaxVisibleTools] = useState(3);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const topBarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSend({
        message: message.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        tools: selectedTools.length > 0 ? selectedTools : undefined,
        agent: selectedAgent,
        model: selectedModel
      });
      
      setMessage('');
      setAttachments([]);
      setSelectedTools([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments: ChatAttachment[] = files
      .slice(0, maxAttachments - attachments.length)
      .filter(file => file.size <= maxAttachmentSize)
      .map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
        data: file as any
      }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const toggleTool = (tool: ChatTool) => {
    setSelectedTools(prev => 
      prev.some(t => t.id === tool.id) 
        ? prev.filter(t => t.id !== tool.id)
        : [...prev, tool]
    );
  };

  const filteredTools = availableTools.filter(tool => 
    tool.label.toLowerCase().includes(toolsSearch.toLowerCase()) ||
    tool.description?.toLowerCase().includes(toolsSearch.toLowerCase())
  );

  const filteredAgents = availableAgents.filter(agent => 
    agent.name.toLowerCase().includes(agentsSearch.toLowerCase()) ||
    agent.description?.toLowerCase().includes(agentsSearch.toLowerCase())
  );

  const startVoiceRecording = async () => {
    if (!enableVoiceRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setVoiceState(prev => ({ ...prev, audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setVoiceState({ isRecording: true, duration: 0 });
      
      voiceTimerRef.current = setInterval(() => {
        setVoiceState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && voiceTimerRef.current) {
      mediaRecorderRef.current.stop();
      clearInterval(voiceTimerRef.current);
      setVoiceState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const calculateMaxVisibleTools = () => {
    if (!topBarRef.current) return;
    
    const topBarWidth = topBarRef.current.offsetWidth;
    const gap = parseInt(theme.components.gaps.standard);
    const modelButtonWidth = 150; // Largeur approximative du bouton de modèle
    const agentTagWidth = selectedAgent ? 120 : 0; // Largeur approximative du tag agent
    const toolTagWidth = 100; // Largeur approximative d'un tag outil
    const counterTagWidth = 80; // Largeur approximative du tag compteur
    const padding = parseInt(theme.spacing.values.md) * 2;
    
    const availableWidth = topBarWidth - modelButtonWidth - agentTagWidth - padding - gap * 3;
    
    if (selectedTools.length <= 1) {
      setMaxVisibleTools(selectedTools.length);
      return;
    }
    
    // Calculer combien de tags peuvent tenir
    let maxTools = Math.floor(availableWidth / (toolTagWidth + gap));
    
    // Si on doit afficher un compteur, réserver de la place
    if (selectedTools.length > maxTools && maxTools > 0) {
      const widthWithCounter = maxTools * (toolTagWidth + gap) + counterTagWidth;
      if (widthWithCounter > availableWidth) {
        maxTools = Math.max(1, maxTools - 1);
      }
    }
    
    setMaxVisibleTools(Math.min(maxTools, selectedTools.length));
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  useEffect(() => {
    calculateMaxVisibleTools();
  }, [selectedTools, selectedAgent, theme]);

  useEffect(() => {
    const handleResize = () => {
      calculateMaxVisibleTools();
    };

    window.addEventListener('resize', handleResize);
    // Calculer au premier rendu
    setTimeout(calculateMaxVisibleTools, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
      }
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.sm}px`,
    position: 'relative',
    flexShrink: 0
  };

  const modalContainerStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: theme.colors.background.paper,
    borderRadius: `${theme.layout.modal.radius}px`,
    boxShadow: theme.shadows.elevation['2'],
    border: `1px solid ${theme.colors.divider}`,
    margin: `0 auto`,
    maxWidth: `${theme.layout.modal.maxWidth.large}px`,
    width: '100%',
    overflow: 'visible'
  };

  const topBarStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.sm}px ${theme.spacing.values.md}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
    gap: `${theme.components.gaps.standard}px`
  };

  const inputSectionStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.sm}px`,
    backgroundColor: theme.colors.background.paper
  };

  const attachmentsStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.sm}px ${theme.spacing.values.lg}px`,
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${theme.components.gaps.standard}px`,
    backgroundColor: theme.colors.background.default,
    borderTop: `1px solid ${theme.colors.divider}`,
    borderBottom: `1px solid ${theme.colors.divider}`
  };

  const bottomBarStyle: React.CSSProperties = {
    padding: `${theme.spacing.values.sm}px ${theme.spacing.values.md}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent'
  };

  const leftActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.components.gaps.standard}px`
  };

  const rightActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.components.gaps.standard}px`
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    maxHeight: '200px',
    padding: `${theme.spacing.values.md}px`,
    border: 'none',
    borderRadius: `${theme.components.borderRadius.medium}px`,
    outline: 'none',
    backgroundColor: theme.colors.background.paper,
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.body1.lineHeight,
    resize: 'none',
    overflow: 'auto',
    transition: theme.layout.transitions.default
  };

  const actionButtonStyle: React.CSSProperties = {
    minWidth: `${theme.components.heights.medium}px`,
    height: `${theme.components.heights.medium}px`,
    borderRadius: `${theme.components.borderRadius.medium}px`
  };

  const sendButtonStyle: React.CSSProperties = {
    minWidth: `${theme.components.heights.large}px`,
    height: `${theme.components.heights.large}px`,
    borderRadius: `${theme.components.borderRadius.pill}px`
  };

  const hasContent = message.trim() || attachments.length > 0;

  return (
    <div className={className} style={containerStyle}>
      <div style={modalContainerStyle}>
        {/* Top Bar - Model Selection + Selected Tags */}
        <div ref={topBarRef} style={topBarStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${theme.components.gaps.standard}px`, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {(() => {
              const visibleTools = selectedTools.slice(0, maxVisibleTools);
              const hiddenToolsCount = selectedTools.length - maxVisibleTools;

              return (
                <>
                  {visibleTools.map(tool => (
                    <Tag
                      key={tool.id}
                      label={tool.label}
                      color={tool.color || "primary"}
                      onDelete={() => toggleTool(tool)}
                      size="medium"
                    />
                  ))}
                  {hiddenToolsCount > 0 && (
                    <Tag
                      label={`+${hiddenToolsCount} outil${hiddenToolsCount > 1 ? 's' : ''}`}
                      color="primary"
                      variant="outlined"
                      size="medium"
                    />
                  )}
                </>
              );
            })()}
            {selectedAgent && (
              <Tag
                label={selectedAgent.name}
                color="secondary"
                onDelete={() => setSelectedAgent(undefined)}
                size="medium"
              />
            )}
          </div>
          
          <Dropdown
            trigger="click"
            placement="top-end"
            content={
              <div style={{
                backgroundColor: theme.colors.background.paper,
                borderRadius: `${theme.components.borderRadius.medium}px`,
                boxShadow: theme.shadows.elevation['3'],
                border: `1px solid ${theme.colors.divider}`,
                padding: `${theme.spacing.values.md}px`,
                minWidth: '250px',
                maxHeight: '300px',
                overflowY: 'auto',
                margin: `${theme.spacing.values.sm}px`
              }}>
                {availableModels.map(model => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    style={{
                      padding: `${theme.spacing.values.md}px`,
                      cursor: 'pointer',
                      borderRadius: `${theme.components.borderRadius.small}px`,
                      backgroundColor: selectedModel?.id === model.id ? theme.colors.primary.light : 'transparent',
                      color: selectedModel?.id === model.id ? theme.colors.primary.contrastText : theme.colors.text.primary,
                      fontSize: '14px',
                      transition: 'background-color 0.2s ease',
                      marginBottom: `${theme.spacing.values.xs}px`
                    }}
                    onMouseEnter={(e) => {
                      if (selectedModel?.id !== model.id) {
                        e.currentTarget.style.backgroundColor = theme.colors.background.default;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedModel?.id !== model.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{model.name}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>{model.provider}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{model.description}</div>
                  </div>
                ))}
              </div>
            }
          >
            <Button
              variant="tertiary"
              icon="chevron-down"
              style={{ 
                fontSize: '12px', 
                padding: `${theme.components.padding.medium.vertical}px ${theme.components.padding.medium.horizontal}px`,
                height: `${theme.components.heights.medium}px`,
                minWidth: 'auto'
              }}
              disabled={disabled}
            >
              {selectedModel?.name || 'Select Model'}
            </Button>
          </Dropdown>
        </div>

        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div style={attachmentsStyle}>
            {attachments.map(attachment => (
              <Tag
                key={attachment.id}
                label={attachment.name}
                color="info"
                icon="file-text"
                onDelete={() => removeAttachment(attachment.id)}
                size="medium"
              />
            ))}
          </div>
        )}

        {/* Input Section */}
        <div style={inputSectionStyle}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={textareaStyle}
            rows={1}
          />
        </div>

        {/* Bottom Bar - Actions */}
        <div style={bottomBarStyle}>
          <div style={leftActionsStyle}>
            <Button
              variant="icon"
              icon="upload"
              onClick={() => fileInputRef.current?.click()}
              style={actionButtonStyle}
              disabled={disabled || attachments.length >= maxAttachments}
            />
            
            <Dropdown
              trigger="click"
              placement="top-start"
              content={
                <div 
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderRadius: `${theme.components.borderRadius.medium}px`,
                    boxShadow: theme.shadows.elevation['3'],
                    border: `1px solid ${theme.colors.divider}`,
                    padding: `${theme.spacing.values.md}px`,
                    minWidth: '280px',
                    maxHeight: '350px',
                    overflowY: 'auto',
                    margin: `${theme.spacing.values.sm}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: `${theme.spacing.values.md}px` }}>
                    <Input
                      type="text"
                      placeholder="Rechercher des outils..."
                      value={toolsSearch}
                      onChange={(e) => setToolsSearch(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </div>
                  {filteredTools.map(tool => (
                    <div
                      key={tool.id}
                      style={{
                        padding: `${theme.spacing.values.md}px`,
                        cursor: 'pointer',
                        borderRadius: `${theme.components.borderRadius.small}px`,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: `${theme.components.gaps.standard}px`,
                        transition: 'background-color 0.2s ease',
                        marginBottom: `${theme.spacing.values.xs}px`,
                        backgroundColor: 'transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTool(tool);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.background.default;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Input
                        type="checkbox"
                        value=""
                        onChange={() => {}}
                        style={{
                          width: '16px',
                          height: '16px',
                          margin: '2px 0 0 0',
                          accentColor: theme.colors.primary.main,
                          pointerEvents: 'none'
                        }}
                        {...({checked: selectedTools.some(t => t.id === tool.id)} as any)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{tool.label}</div>
                        {tool.description && (
                          <div style={{ fontSize: '12px', opacity: 0.7, lineHeight: 1.4 }}>{tool.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <Button
                variant="icon"
                icon="settings"
                style={{
                  ...actionButtonStyle,
                  backgroundColor: selectedTools.length > 0 ? theme.colors.primary.main : undefined,
                  color: selectedTools.length > 0 ? theme.colors.primary.contrastText : undefined
                }}
                disabled={disabled}
              />
            </Dropdown>

            <Dropdown
              trigger="click"
              placement="top-start"
              content={
                <div 
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderRadius: `${theme.components.borderRadius.medium}px`,
                    boxShadow: theme.shadows.elevation['3'],
                    border: `1px solid ${theme.colors.divider}`,
                    padding: `${theme.spacing.values.md}px`,
                    minWidth: '300px',
                    maxHeight: '350px',
                    overflowY: 'auto',
                    margin: `${theme.spacing.values.sm}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: `${theme.spacing.values.md}px` }}>
                    <Input
                      type="text"
                      placeholder="Rechercher des agents..."
                      value={agentsSearch}
                      onChange={(e) => setAgentsSearch(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </div>
                  {filteredAgents.map(agent => (
                    <div
                      key={agent.id}
                      style={{
                        padding: `${theme.spacing.values.md}px`,
                        cursor: 'pointer',
                        borderRadius: `${theme.components.borderRadius.small}px`,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: `${theme.components.gaps.standard}px`,
                        transition: 'background-color 0.2s ease',
                        marginBottom: `${theme.spacing.values.xs}px`,
                        backgroundColor: 'transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgent(selectedAgent?.id === agent.id ? undefined : agent);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.background.default;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Input
                        type="checkbox"
                        value=""
                        onChange={() => {}}
                        style={{
                          width: '16px',
                          height: '16px',
                          margin: '2px 0 0 0',
                          accentColor: theme.colors.primary.main,
                          pointerEvents: 'none'
                        }}
                        {...({checked: selectedAgent?.id === agent.id} as any)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{agent.name}</div>
                        {agent.description && (
                          <div style={{ fontSize: '12px', opacity: 0.7, lineHeight: 1.4, marginBottom: '4px' }}>{agent.description}</div>
                        )}
                        {agent.capabilities && (
                          <div style={{ fontSize: '11px', opacity: 0.6 }}>
                            {agent.capabilities.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <Button
                variant="icon"
                icon="user"
                style={{
                  ...actionButtonStyle,
                  backgroundColor: selectedAgent ? theme.colors.primary.main : undefined,
                  color: selectedAgent ? theme.colors.primary.contrastText : undefined
                }}
                disabled={disabled}
              />
            </Dropdown>
          </div>

          <div style={rightActionsStyle}>
            {enableVoiceRecording && (
              <Button
                variant="icon"
                icon={voiceState.isRecording ? "x" : "message-circle"}
                onClick={voiceState.isRecording ? stopVoiceRecording : startVoiceRecording}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: voiceState.isRecording ? theme.colors.error.main : undefined,
                  color: voiceState.isRecording ? 'white' : undefined
                }}
                disabled={disabled}
              />
            )}
            
            <Button
              variant={isGenerating ? "danger" : "primary"}
              icon={isGenerating ? "x" : "chevron-right"}
              onClick={isGenerating ? onStopGeneration : () => handleSubmit()}
              disabled={!isGenerating && (!hasContent || disabled)}
              style={sendButtonStyle}
            />
          </div>
        </div>

      </div>

      {voiceState.isRecording && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: theme.spacing.values.sm,
          padding: theme.spacing.values.sm,
          backgroundColor: theme.colors.error.main,
          color: 'white',
          borderRadius: `${theme.components.borderRadius.medium}px`,
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}>
          Recording... {Math.floor(voiceState.duration / 60)}:{(voiceState.duration % 60).toString().padStart(2, '0')}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={supportedFileTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <style jsx>{`
        textarea::placeholder {
          color: ${theme.colors.text.disabled} !important;
          opacity: 1 !important;
        }
      `}</style>

    </div>
  );
};

export default ChatInput;