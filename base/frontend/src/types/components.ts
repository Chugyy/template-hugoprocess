export interface ButtonProps {
  label?: string;
  icon?: string;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'icon';
  size?: 'small' | 'medium' | 'large';
  tag?: TagProps;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface TagProps {
  label?: string | number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'custom';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  onDelete?: () => void;
  clickable?: boolean;
  animate?: 'pulse' | 'bounce' | 'none';
  variant?: 'filled' | 'outlined' | 'dot' | 'status';
  className?: string;
  style?: React.CSSProperties;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  disableBackdropClick?: boolean;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export interface DropdownProps {
  trigger: 'click' | 'hover' | 'contextMenu';
  placement?: 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end' | 'left' | 'right';
  offset?: number;
  closeOnItemClick?: boolean;
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export interface ToastProps {
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  action?: React.ReactNode;
  onClose: () => void;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface NavigationItemProps {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  icon?: string;
  tag?: TagProps;
  children?: NavigationItemProps[];
  depth?: number;
}

export interface SidebarProps {
  width?: string;
  collapsible?: boolean;
  resizable?: boolean;
  variant?: 'default' | 'mini' | 'overlay';
  collapsed?: boolean;
  onToggle?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface HeaderProps {
  height?: string;
  sticky?: boolean;
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

// TableView & SearchEngine Types
export interface SearchEngineState<T = any> {
  query: string;
  filters: Record<string, any>;
  sort: { field: string; direction: 'asc' | 'desc' } | null;
  pagination: { page: number; size: number };
  selection: Set<string>;
  processedData: T[];
}

export interface SearchEngineConfig {
  searchableFields: string[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  pageSize?: number;
  showPagination?: boolean;
  maxVisiblePages?: number;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'tag' | 'avatar' | 'date' | 'number' | 'actions' | 'custom' | 'checkbox' | 'boolean' | 'dropdown' | 'select' | 'input' | 'button';
  width?: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  options?: { 
    value: any; 
    label: string;
    icon?: string;
    tag?: string | number;
    tagColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  }[];
  sizing?: { 
    minWidth?: number;
    maxWidth?: number;
    autoSize?: boolean;
  };
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'range';
  options?: { value: any; label: string }[];
}

export interface ActionConfig {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (item: any) => void;
}

export interface TableViewConfig<T = any> {
  fields: FieldConfig[];
  layout: 'table' | 'kanban' | 'list';
  searchEngine: SearchEngineConfig;
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  groupBy?: string;
  selectable?: boolean;
  batchActions?: ActionConfig[];
}

export interface TableToolbarConfig {
  search?: boolean;
  filters?: boolean;
  viewSwitcher?: boolean;
  export?: boolean;
  actions?: ActionConfig[];
}

export interface TableViewProps<T = any> {
  config: TableViewConfig<T>;
  data: T[];
  toolbar?: TableToolbarConfig;
  loading?: boolean;
  onLayoutChange?: (layout: 'table' | 'kanban' | 'list') => void;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onBatchAction?: (action: ActionConfig, selectedIds: Set<string>) => void;
  onDataUpdate?: (updatedData: T[]) => void;
  className?: string;
}

// DataView Types for Chart Visualizations
export interface ChartDataConfig {
  xAxis: string;
  yAxis: string[];
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface DataViewConfig<T = any> {
  chart: 'line' | 'bar' | 'pie' | 'area' | 'metrics' | 'scatter';
  title?: string;
  data: ChartDataConfig;
  searchEngine: SearchEngineConfig;
  responsive?: boolean;
  interactive?: boolean;
  colors?: string[];
  height?: number;
}

export interface DataToolbarConfig {
  search?: boolean;
  filters?: boolean;
  chartSwitcher?: boolean;
  export?: boolean;
  refresh?: boolean;
}

export interface DataViewProps<T = any> {
  config: DataViewConfig<T>;
  data: T[];
  toolbar?: DataToolbarConfig;
  loading?: boolean;
  onChartChange?: (chart: DataViewConfig['chart']) => void;
  onRefresh?: () => void;
  className?: string;
}

export interface ChartProps<T = any> {
  data: T[];
  config: DataViewConfig<T>;
  loading?: boolean;
  width?: number;
  height?: number;
}

export interface MetricConfig {
  key: string;
  label: string;
  value: number | string;
  format?: 'number' | 'currency' | 'percentage';
  icon?: string;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
}

// AI Chat Types
export interface ThinkingStep {
  content: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  thinking?: ThinkingStep[];
  isThinking?: boolean;
  aiResponse?: {
    thinking?: Array<{
      id: string;
      type: 'thinking' | 'tool_use' | 'validation' | 'result';
      content: string;
      data?: any;
      timestamp: Date;
      status?: 'pending' | 'in_progress' | 'completed' | 'error';
    }>;
    toolCalls?: Array<{
      id: string;
      tool: string;
      parameters: Record<string, any>;
      result?: any;
      status: 'pending' | 'in_progress' | 'completed' | 'error';
      timestamp: Date;
    }>;
    validations?: Array<{
      id: string;
      action: string;
      description: string;
      parameters?: Record<string, any>;
      status: 'pending' | 'approved' | 'rejected';
      timestamp: Date;
    }>;
    status: 'thinking' | 'processing' | 'waiting_validation' | 'completed' | 'error';
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: Date;
  preview?: string;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface ChatTool {
  id: string;
  label: string;
  icon: string;
  description?: string;
  type: 'tool' | 'prompt' | 'template';
  action: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export interface ChatAgent {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
  icon?: string;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxTokens?: number;
  capabilities?: string[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'audio' | 'video';
  size: number;
  url?: string;
  data?: string | ArrayBuffer;
}

export interface AdvancedChatInputProps {
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
  className?: string;
}

export interface MessageItemProps {
  message: ChatMessage;
  className?: string;
}

export interface ThinkingBubbleProps {
  steps?: ThinkingStep[];
  visible: boolean;
  className?: string;
}

export interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}

export interface ChatContainerProps {
  conversation?: ChatConversation;
  onSendMessage: (data: {
    message: string;
    attachments?: ChatAttachment[];
    tools?: ChatTool[];
    agent?: ChatAgent;
    model?: ChatModel;
  }) => void;
  availableModels?: ChatModel[];
  availableTools?: ChatTool[];
  availableAgents?: ChatAgent[];
  defaultModel?: ChatModel;
  defaultAgent?: ChatAgent;
  isLoading?: boolean;
  isGenerating?: boolean;
  hasPendingValidation?: boolean;
  onStopGeneration?: () => void;
  onValidationResponse?: (validationId: string, approved: boolean) => void;
  className?: string;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export interface ChatInputMode {
  type: 'default' | 'voice' | 'file' | 'tool';
  data?: any;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob?: Blob;
}