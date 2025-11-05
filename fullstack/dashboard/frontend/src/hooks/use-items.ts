import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import * as api from "@/lib/api"
import type { ItemType, AnyItem, CRMContact, Task, Project } from "@/types"

// ============ CONFIGURATION CENTRALISÉE ============

const ITEM_CONFIG = {
  contact: {
    getAll: api.getContacts,
    getOne: api.getContact,
    create: api.createContact,
    update: api.updateContact,
    delete: api.deleteContact,
    label: "Contact",
  },
  task: {
    getAll: api.getTasks,
    getOne: api.getTask,
    create: api.createTask,
    update: api.updateTask,
    delete: api.deleteTask,
    label: "Task",
  },
  project: {
    getAll: api.getProjects,
    getOne: api.getProject,
    create: api.createProject,
    update: api.updateProject,
    delete: api.deleteProject,
    label: "Project",
  },
  note: {
    getAll: (params?: any) => api.getNotes(params?.entityType, params?.entityId),
    create: api.createNote,
    update: api.updateNote,
    delete: api.deleteNote,
    label: "Note",
  },
  resource: {
    getAll: (params?: any) => api.getResources(params?.entityType, params?.entityId),
    create: api.createResource,
    update: api.updateResource,
    delete: api.deleteResource,
    label: "Resource",
  },
  exchange: {
    getAll: (params?: any) => api.getExchanges(params?.contactId),
    getOne: (id: string, contactId?: string) => {
      if (!contactId) throw new Error("contactId is required to fetch an exchange")
      return api.getExchange(contactId, id)
    },
    create: (data: any) => {
      if (!data.contactId) throw new Error("contactId is required to create an exchange")
      return api.createExchange(data.contactId, data)
    },
    update: (id: string, data: any) => {
      if (!data.contactId) throw new Error("contactId is required to update an exchange")
      return api.updateExchange(data.contactId, id, data)
    },
    delete: (id: string, contactId?: string) => {
      if (!contactId) throw new Error("contactId is required to delete an exchange")
      return api.deleteExchange(contactId, id)
    },
    label: "Exchange",
  },
} as const

// ============ HOOK GÉNÉRIQUE POUR QUERIES (LISTES) ============

export function useItems<T = any>(
  itemType: ItemType,
  filters?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, Error, T>, 'queryKey' | 'queryFn'>
) {
  const config = ITEM_CONFIG[itemType]

  return useQuery({
    queryKey: [itemType, filters],
    queryFn: () => config.getAll?.(filters),
    ...options,
  })
}

// ============ HOOK GÉNÉRIQUE POUR QUERIES (ITEM UNIQUE) ============

export function useItem<T = any>(
  itemType: ItemType,
  id?: string,
  options?: Omit<UseQueryOptions<any, Error, T>, 'queryKey' | 'queryFn'>
) {
  const config = ITEM_CONFIG[itemType] as any

  return useQuery({
    queryKey: [itemType, id],
    queryFn: () => {
      if (!config.getOne) {
        throw new Error(`getOne not implemented for ${itemType}`)
      }
      return config.getOne(id!)
    },
    enabled: !!id && !!config.getOne,
    ...options,
  })
}

// ============ HOOK GÉNÉRIQUE POUR MUTATIONS ============

export function useItemMutations(
  itemType: ItemType,
  context?: { contactId?: string; onExchangeCreated?: (exchange: any) => void }
) {
  const queryClient = useQueryClient()
  const config = ITEM_CONFIG[itemType]

  const create = useMutation({
    mutationFn: (data: Partial<AnyItem>): Promise<any> => {
      if (itemType === 'exchange' && context?.contactId) {
        return config.create({ ...data, contactId: context.contactId })
      }
      return config.create(data)
    },
    onSuccess: (createdItem) => {
      queryClient.invalidateQueries({ queryKey: [itemType] })
      if (itemType === 'exchange' && context?.contactId) {
        queryClient.invalidateQueries({ queryKey: ['exchange', { contactId: context.contactId }] })
        context.onExchangeCreated?.(createdItem)
      }
      toast.success(`${config.label} created`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnyItem> }): Promise<any> => {
      if (itemType === 'exchange' && context?.contactId) {
        return config.update!(id, { ...data, contactId: context.contactId })
      }
      return config.update!(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [itemType] })
      toast.success(`${config.label} updated`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => {
      if (itemType === 'exchange' && !context?.contactId) {
        throw new Error("contactId is required to delete an exchange")
      }
      return config.delete(id, context?.contactId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [itemType] })
      toast.success(`${config.label} deleted`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const duplicate = useMutation({
    mutationFn: (item: AnyItem): Promise<any> => {
      const { id, createdAt, updatedAt, ...rest } = item as any
      let duplicatedData = { ...rest }

      if ('contact' in item) duplicatedData.contact = `${(item as CRMContact).contact} (Copy)`
      else if ('title' in item && 'dueDate' in item) duplicatedData.title = `${(item as Task).title} (Copy)`
      else if ('name' in item && 'progress' in item) duplicatedData.name = `${(item as Project).name} (Copy)`
      else if ('title' in item && itemType === 'exchange') duplicatedData.title = `${rest.title} (Copy)`

      return config.create(duplicatedData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [itemType] })
      toast.success(`${config.label} duplicated`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return {
    create,
    update,
    remove,
    duplicate,
    isLoading: create.isPending || update.isPending || remove.isPending || duplicate.isPending,
  }
}

// ============ HOOK POUR LIER/DÉLIER DES RELATIONS ============

export function useRelationMutations() {
  const queryClient = useQueryClient()

  const link = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      targetId,
      targetType
    }: {
      itemId: string
      itemType: ItemType
      targetId: string
      targetType: ItemType
    }) => {
      if (itemType === 'task') {
        if (targetType === 'contact') {
          return api.updateTask(itemId, { contactId: targetId })
        }
        if (targetType === 'project') {
          return api.updateTask(itemId, { projectId: targetId })
        }
      }
      if (itemType === 'project' && targetType === 'contact') {
        return api.updateProject(itemId, { contactId: targetId })
      }
      throw new Error('Unsupported relation')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.itemType] })
      queryClient.invalidateQueries({ queryKey: [variables.targetType] })
      toast.success('Linked successfully')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const unlink = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      field
    }: {
      itemId: string
      itemType: ItemType
      field: 'contactId' | 'projectId'
    }) => {
      if (itemType === 'task') {
        return api.updateTask(itemId, { [field]: null })
      }
      throw new Error('Unsupported unlink operation')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.itemType] })
      toast.success('Unlinked successfully')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return { link, unlink }
}

// ============ HOOKS DE COMPATIBILITÉ (pour ne pas casser le code existant) ============

export const useContacts = (filters?: any) => useItems('contact', filters)
export const useContact = (id: string) => useItem('contact', id)
export const useTasks = (filters?: any) => useItems('task', filters)
export const useTask = (id: string) => useItem('task', id)
export const useProjects = (filters?: any) => useItems('project', filters)
export const useProject = (id: string) => useItem('project', id)
export const useNotes = (entityType: string, entityId: string) =>
  useItems('note', { entityType, entityId }, { enabled: !!entityType && !!entityId })
export const useResources = (entityType?: string, entityId?: string) =>
  useItems('resource', { entityType, entityId })
export const useExchanges = (contactId: string, options?: Omit<UseQueryOptions<any, Error, any>, 'queryKey' | 'queryFn'>) =>
  useItems('exchange', { contactId }, { enabled: !!contactId, ...options })

export const useExchange = (exchangeId: string, contactId: string) =>
  useQuery({
    queryKey: ['exchange', exchangeId],
    queryFn: () => api.getExchange(contactId, exchangeId),
    enabled: !!exchangeId && !!contactId,
  })

export function useContactTasks(contactId: string) {
  return useQuery({
    queryKey: ['contact', contactId, 'tasks'],
    queryFn: () => api.getContactTasks(contactId),
    enabled: !!contactId,
  })
}

export function useContactProjects(contactId: string) {
  return useQuery({
    queryKey: ['contact', contactId, 'projects'],
    queryFn: () => api.getContactProjects(contactId),
    enabled: !!contactId,
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'tasks'],
    queryFn: () => api.getProjectTasks(projectId),
    enabled: !!projectId,
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: ['task-stats'],
    queryFn: () => api.getTaskStats(),
  })
}

export function useTranscription(contactId: string, exchangeId: string) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTranscription = useMutation({
    mutationFn: ({ mode }: { mode: 'api' | 'local' }) =>
      api.transcribeExchange(contactId, exchangeId, mode),
    onSuccess: () => {
      setStatus('processing')
      setProgress(0)

      intervalRef.current = setInterval(async () => {
        try {
          const result = await api.getTranscriptionStatus(exchangeId)
          setProgress(result.progress)

          if (result.status === 'completed') {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setStatus('completed')
            queryClient.invalidateQueries({ queryKey: ['exchange', exchangeId] })
            queryClient.invalidateQueries({ queryKey: ['exchange', { contactId }] })
            toast.success('Transcription completed')
          } else if (result.status === 'error') {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setStatus('error')
            toast.error('Transcription failed')
          }
        } catch (error) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setStatus('error')
          toast.error('Failed to check transcription status')
        }
      }, 2000)
    },
    onError: () => {
      setStatus('error')
      toast.error('Failed to start transcription')
    },
  })

  const cancelTranscription = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStatus('idle')
    setProgress(0)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    status,
    progress,
    startTranscription: startTranscription.mutate,
    cancelTranscription,
    isTranscribing: status === 'processing',
  }
}

export function useSummarize(contactId: string, exchangeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ customInstruction }: { customInstruction?: string } = {}) =>
      api.summarizeExchange(contactId, exchangeId, customInstruction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange', exchangeId] })
      toast.success('Summary generated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate summary: ${error.message}`)
    },
  })
}
