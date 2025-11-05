export interface AIThinkingStep {
  id: string;
  type: 'thinking' | 'tool_use' | 'validation' | 'result';
  content: string;
  data?: any;
  timestamp: Date;
  status?: 'pending' | 'in_progress' | 'completed' | 'error';
}

export interface AIToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  result?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  timestamp: Date;
}

export interface AIValidationRequest {
  id: string;
  action: string;
  description: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

export interface AIResponse {
  id: string;
  thinking?: AIThinkingStep[];
  toolCalls?: AIToolCall[];
  validations?: AIValidationRequest[];
  finalResponse?: string;
  status: 'thinking' | 'processing' | 'waiting_validation' | 'completed' | 'error';
}