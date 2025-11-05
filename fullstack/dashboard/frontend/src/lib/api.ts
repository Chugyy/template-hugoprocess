import { transformKeysToCamel, transformKeysToSnake } from './transforms'
import type { CRMContact, Task, Project, Exchange, Note, Resource } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_TOKEN_KEY = 'auth_token'

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY)
const setToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token)
const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY)

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  if (response.status === 204 || response.status === 205) {
    return null as T
  }

  const data = await response.json()
  return transformKeysToCamel<T>(data)
}

export interface PaginationInfo {
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

// ============ AUTH ============

export async function login(email: string, password: string) {
  const data = await request<{ accessToken: string; userId: number }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  setToken(data.accessToken)
  return getCurrentUser()
}

export async function register(email: string, password: string) {
  const data = await request<{ accessToken: string; userId: number }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  setToken(data.accessToken)
  return getCurrentUser()
}

export async function getCurrentUser() {
  const userData = await request<Record<string, unknown>>('/api/auth/me')
  return {
    id: String(userData.id),
    email: String(userData.email),
    name: String(userData.username || ''),
    firstName: userData.firstName ? String(userData.firstName) : undefined,
    lastName: userData.lastName ? String(userData.lastName) : undefined,
    role: userData.role ? String(userData.role) : undefined,
  }
}

export function logout() {
  clearToken()
}

// ============ CONTACTS ============

export async function getContacts(filters?: {
  status?: string | string[]
  search?: string
  offset?: number
  limit?: number
}): Promise<PaginatedResponse<CRMContact>> {
  const params = new URLSearchParams()
  if (filters?.status) {
    const statusValue = Array.isArray(filters.status) ? filters.status.join(',') : filters.status
    params.append('status', statusValue)
  }
  if (filters?.search) params.append('search', filters.search)
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset))
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit))

  return request<PaginatedResponse<CRMContact>>(`/api/contacts?${params.toString()}`)
}

export async function getContact(id: string): Promise<CRMContact> {
  return request<CRMContact>(`/api/contacts/${id}`)
}

export async function createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
  const payload = transformKeysToSnake({
    ...contact,
    contactName: contact.contact
  }) as Record<string, unknown>
  delete payload.contact

  return request<CRMContact>('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
  const payload = transformKeysToSnake(contact) as Record<string, unknown>
  if (contact.contact) {
    payload.contact_name = contact.contact
    delete payload.contact
  }

  return request<CRMContact>(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteContact(id: string): Promise<void> {
  return request(`/api/contacts/${id}`, { method: 'DELETE' })
}

// ============ TASKS ============

export async function getTasks(filters?: {
  status?: string | string[]
  contactId?: number
  projectId?: number
  priority?: string | string[]
  search?: string
  offset?: number
  limit?: number
}): Promise<PaginatedResponse<Task>> {
  const params = new URLSearchParams()
  if (filters?.status) {
    const statusValue = Array.isArray(filters.status) ? filters.status.join(',') : filters.status
    params.append('status', statusValue)
  }
  if (filters?.contactId) params.append('contact_id', String(filters.contactId))
  if (filters?.projectId) params.append('project_id', String(filters.projectId))
  if (filters?.priority) {
    const priorityValue = Array.isArray(filters.priority) ? filters.priority.join(',') : filters.priority
    params.append('priority', priorityValue)
  }
  if (filters?.search) params.append('search', filters.search)
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset))
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit))

  return request<PaginatedResponse<Task>>(`/api/tasks?${params.toString()}`)
}

export async function getTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`)
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const payload = transformKeysToSnake(task)
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task> {
  const payload = transformKeysToSnake(task)
  return request<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteTask(id: string): Promise<void> {
  return request(`/api/tasks/${id}`, { method: 'DELETE' })
}

export async function getContactTasks(contactId: string): Promise<Task[]> {
  return request<Task[]>(`/api/tasks/contacts/${contactId}/tasks`)
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  return request<Task[]>(`/api/tasks/projects/${projectId}/tasks`)
}

export async function getExchangeTasks(exchangeId: string): Promise<Task[]> {
  return request<Task[]>(`/api/tasks/exchanges/${exchangeId}/tasks`)
}

export async function getTaskStats() {
  return request<{
    overdue: number
    upcoming: number
    completedThisWeek: number
  }>('/api/tasks/stats')
}

// ============ PROJECTS ============

export async function getProjects(filters?: {
  status?: string | string[]
  contactId?: number
  search?: string
  offset?: number
  limit?: number
}): Promise<PaginatedResponse<Project>> {
  const params = new URLSearchParams()
  if (filters?.status) {
    const statusValue = Array.isArray(filters.status) ? filters.status.join(',') : filters.status
    params.append('status', statusValue)
  }
  if (filters?.contactId) params.append('contact_id', String(filters.contactId))
  if (filters?.search) params.append('search', filters.search)
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset))
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit))

  return request<PaginatedResponse<Project>>(`/api/projects?${params.toString()}`)
}

export async function getProject(id: string): Promise<Project> {
  return request<Project>(`/api/projects/${id}`)
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const payload = transformKeysToSnake(project)
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project> {
  const payload = transformKeysToSnake(project)
  return request<Project>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteProject(id: string): Promise<void> {
  return request(`/api/projects/${id}`, { method: 'DELETE' })
}

export async function getContactProjects(contactId: string): Promise<Project[]> {
  return request<Project[]>(`/api/projects/contacts/${contactId}/projects`)
}

// ============ EXCHANGES ============

export async function getExchanges(contactId: string): Promise<Exchange[]> {
  const response = await fetch(`${API_URL}/api/contacts/${contactId}/exchanges`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch exchanges')
  }

  const rawData = await response.json()

  return rawData.map((ex: any) => ({
    id: String(ex.id),
    contactId: String(ex.contact_id),
    type: ex.exchange_type,
    date: new Date(ex.exchange_date),
    title: ex.summary || '',
    description: ex.outcome || '',
    notes: ex.next_steps || '',
    audioUrl: ex.audio_file_url,
    transcript: ex.transcription,
    duration: ex.metadata?.duration,
    externalUrl: ex.metadata?.externalUrl || ex.metadata?.external_url,
    attachments: ex.metadata?.attachments || [],
    participants: ex.participants ? ex.participants.split(',').map((p: string) => p.trim()) : [],
    summary: ex.ai_analysis,
  }))
}

export async function getExchange(contactId: string, exchangeId: string): Promise<Exchange> {
  const response = await fetch(`${API_URL}/api/contacts/${contactId}/exchanges/${exchangeId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch exchange')
  }

  const ex = await response.json()

  return {
    id: String(ex.id),
    contactId: String(ex.contact_id),
    type: ex.exchange_type,
    date: new Date(ex.exchange_date),
    title: ex.summary || '',
    description: ex.outcome || '',
    notes: ex.next_steps || '',
    audioUrl: ex.audio_file_url,
    transcript: ex.transcription,
    duration: ex.metadata?.duration,
    externalUrl: ex.metadata?.externalUrl || ex.metadata?.external_url,
    attachments: ex.metadata?.attachments || [],
    participants: ex.participants ? ex.participants.split(',').map((p: string) => p.trim()) : [],
    summary: ex.ai_analysis,
  }
}

export async function createExchange(contactId: string, exchange: Partial<Exchange>): Promise<Exchange> {
  const payload = transformKeysToSnake({
    exchangeType: exchange.type,
    exchangeDate: exchange.date,
    exchangeContext: 'discovery',
    summary: exchange.title,
    outcome: exchange.description,
    nextSteps: exchange.notes,
    audioFileUrl: exchange.audioUrl,
    transcription: exchange.transcript,
    metadata: {
      duration: exchange.duration,
      externalUrl: exchange.externalUrl,
      attachments: exchange.attachments,
    },
  })

  const response = await fetch(`${API_URL}/api/contacts/${contactId}/exchanges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Failed to create exchange')
  }

  const ex = await response.json()

  return {
    id: String(ex.id),
    contactId: String(ex.contact_id),
    type: ex.exchange_type,
    date: new Date(ex.exchange_date),
    title: ex.summary || '',
    description: ex.outcome || '',
    notes: ex.next_steps || '',
    audioUrl: ex.audio_file_url,
    transcript: ex.transcription,
    duration: ex.metadata?.duration,
    externalUrl: ex.metadata?.externalUrl || ex.metadata?.external_url,
    attachments: ex.metadata?.attachments || [],
    participants: ex.participants ? ex.participants.split(',').map((p: string) => p.trim()) : [],
    summary: ex.ai_analysis,
  }
}

export async function updateExchange(
  contactId: string,
  exchangeId: string,
  exchange: Partial<Exchange>
): Promise<Exchange> {
  const payload = transformKeysToSnake({
    exchangeType: exchange.type,
    exchangeDate: exchange.date,
    exchangeContext: 'discovery',
    summary: exchange.title,
    outcome: exchange.description,
    nextSteps: exchange.notes,
    audioFileUrl: exchange.audioUrl,
    transcription: exchange.transcript,
    metadata: {
      duration: exchange.duration,
      externalUrl: exchange.externalUrl,
      attachments: exchange.attachments,
    },
  })

  const response = await fetch(`${API_URL}/api/contacts/${contactId}/exchanges/${exchangeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Failed to update exchange')
  }

  const ex = await response.json()

  return {
    id: String(ex.id),
    contactId: String(ex.contact_id),
    type: ex.exchange_type,
    date: new Date(ex.exchange_date),
    title: ex.summary || '',
    description: ex.outcome || '',
    notes: ex.next_steps || '',
    audioUrl: ex.audio_file_url,
    transcript: ex.transcription,
    duration: ex.metadata?.duration,
    externalUrl: ex.metadata?.externalUrl || ex.metadata?.external_url,
    attachments: ex.metadata?.attachments || [],
    participants: ex.participants ? ex.participants.split(',').map((p: string) => p.trim()) : [],
    summary: ex.ai_analysis,
  }
}

export async function deleteExchange(contactId: string, exchangeId: string): Promise<void> {
  return request(`/api/contacts/${contactId}/exchanges/${exchangeId}`, { method: 'DELETE' })
}

export async function transcribeExchange(
  contactId: string,
  exchangeId: string,
  mode: 'api' | 'local'
): Promise<{ taskId: string }> {
  return request(`/api/contacts/${contactId}/exchanges/${exchangeId}/transcribe`, {
    method: 'POST',
    body: JSON.stringify({ mode }),
  })
}

export async function getTranscriptionStatus(
  exchangeId: string
): Promise<{ status: 'processing' | 'completed' | 'error'; progress: number; transcript?: string }> {
  return request(`/api/exchanges/${exchangeId}/transcription/status`)
}

export async function summarizeExchange(
  contactId: string,
  exchangeId: string,
  customInstruction?: string
) {
  const body = customInstruction ? { custom_instruction: customInstruction } : undefined
  return request(`/api/contacts/${contactId}/exchanges/${exchangeId}/summarize`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function uploadAudio(file: File): Promise<{ url: string; duration?: number }> {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File size exceeds 50MB limit')
  }

  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/api/upload/audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || 'Upload failed')
  }

  const result = await response.json()
  return {
    url: result.url.startsWith('http') ? result.url : `${API_URL}${result.url}`,
    duration: result.duration
  }
}

// ============ NOTES ============

export async function getNotes(entityType: string, entityId: string): Promise<Note[]> {
  const response = await request<{ data: Note[] }>(
    `/api/notes?entity_type=${entityType}&entity_id=${entityId}`
  )
  return response.data
}

export async function createNote(noteData: {
  entityType: string
  entityId: string
  content: string
  title?: string
}): Promise<Note> {
  return request<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(transformKeysToSnake(noteData)),
  })
}

export async function updateNote(noteId: string, noteData: { content?: string; title?: string }): Promise<Note> {
  return request<Note>(`/api/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  })
}

export async function deleteNote(noteId: string): Promise<void> {
  return request(`/api/notes/${noteId}`, { method: 'DELETE' })
}

// ============ RESOURCES ============

export async function getResources(entityType?: string, entityId?: string): Promise<Resource[]> {
  let endpoint = '/api/resources'
  const params: string[] = []

  if (entityType) params.push(`entity_type=${entityType}`)
  if (entityId) params.push(`entity_id=${entityId}`)

  if (params.length > 0) {
    endpoint += `?${params.join('&')}`
  }

  const response = await request<{ data: Resource[] }>(endpoint)
  return response.data
}

export async function createResource(data: {
  entityType: string
  entityId: string
  resourceType: 'file' | 'url'
  title: string
  url?: string
  file?: File
}): Promise<Resource> {
  const token = getToken()
  const formData = new FormData()

  formData.append('entity_type', data.entityType)
  formData.append('entity_id', data.entityId)
  formData.append('resource_type', data.resourceType)
  formData.append('title', data.title)

  if (data.url) formData.append('url', data.url)
  if (data.file) formData.append('file', data.file)

  const response = await fetch(`${API_URL}/api/resources`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || 'Upload failed')
  }

  const result = await response.json()
  return transformKeysToCamel<Resource>(result)
}

export async function updateResource(id: string, data: { title?: string; url?: string; description?: string }): Promise<Resource> {
  const token = getToken()
  const formData = new FormData()

  if (data.title !== undefined) formData.append('title', data.title)
  if (data.url !== undefined) formData.append('url', data.url)
  if (data.description !== undefined) formData.append('description', data.description)

  const response = await fetch(`${API_URL}/api/resources/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Update failed' }))
    throw new Error(error.detail || 'Update failed')
  }

  const result = await response.json()
  return transformKeysToCamel<Resource>(result)
}

export async function downloadResource(id: string): Promise<void> {
  const token = getToken()
  const response = await fetch(`${API_URL}/api/resources/${id}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) throw new Error('Download failed')

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition')
  let filename = 'download'

  if (contentDisposition) {
    const matches = /filename="?([^"]+)"?/.exec(contentDisposition)
    if (matches?.[1]) filename = matches[1]
  }

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function deleteResource(id: string): Promise<void> {
  return request(`/api/resources/${id}`, { method: 'DELETE' })
}
