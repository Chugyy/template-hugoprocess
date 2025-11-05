export type ViewType = "table" | "kanban" | "calendar"

export interface CRMContact {
  id: string
  company: string
  contact: string
  email?: string
  phone?: string
  status: "Uncategorized" | "Lead" | "Prospect" | "Client" | "Lost"
  source?: string
  dealValue?: number
  lastContactDate?: string
  linkedin?: string
  instagram?: string
  twitter?: string
  website?: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: string
  completedAt?: string
  contactId?: string
  projectId?: string
  exchangeId?: string
  assignee?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: "active" | "on_hold" | "completed" | "cancelled"
  startDate?: string
  endDate?: string
  budget?: number
  contactId: string
  progress?: number
  team?: string[]
  createdAt: string
  updatedAt: string
}

export interface Exchange {
  id: string
  contactId: string
  type: "email" | "call" | "meeting" | "audio" | "loom" | "fathom" | "other"
  date: Date
  title: string
  description?: string
  notes?: string
  audioUrl?: string
  transcript?: string
  duration?: number
  externalUrl?: string
  attachments?: string[]
  summary?: string
  participants?: string[]
}

export interface ExchangeSummary {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  suggestedTasks: Array<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: string
  }>
  sentiment?: string
  processingTime?: number
}

export interface TranscriptionStatus {
  status: 'idle' | 'processing' | 'completed' | 'error'
  progress: number
  transcript?: string
  error?: string
}

export interface Note {
  id: string
  entityType: "contact" | "project" | "task" | "exchange"
  entityId: string
  content: string
  title?: string
  createdAt: string
  updatedAt: string
}

export interface Resource {
  id: string
  entityType: "contact" | "project" | "task"
  entityId: string
  resourceType: "file" | "url"
  title: string
  url: string | null
  filePath: string | null
  fileSize: number | null
  mimeType: string | null
  description?: string
  type?: string
  uploadedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ItemRelations {
  exchanges: string[]
  projects: string[]
  tasks: string[]
  notes: string[]
  resources: string[]
  contacts: string[]
}

export type ItemType = "contact" | "task" | "project" | "exchange" | "note" | "resource"
export type AnyItem = CRMContact | Task | Project | Exchange | Note | Resource
