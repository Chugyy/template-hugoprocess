import type { ItemType, CRMContact, Task, Project, Exchange, Note, Resource } from "@/types"

interface RelationsData {
  exchanges: Exchange[]
  notes: Note[]
  resources: Resource[]
  tasks: Task[]
  projects: Project[]
  crmContacts: CRMContact[]
}

export interface Relations {
  exchanges: string[]
  notes: string[]
  resources: string[]
  tasks: string[]
  projects: string[]
  contacts?: string[]
}

export function getRelationsForItem(
  itemId: string,
  itemType: ItemType,
  data: RelationsData
): Relations {
  // Exchanges linked via contactId
  const exchanges = data.exchanges.filter(e => String(e.contactId) === String(itemId)).map(e => e.id)

  // Notes and resources linked via entityId
  const notes = data.notes.filter(n => n.entityId === itemId).map(n => n.id)
  const resources = data.resources.filter(r => r.entityId === itemId).map(r => r.id)

  // Tasks linked via contactId or projectId
  const tasks = data.tasks.filter(t =>
    t.contactId === itemId || t.projectId === itemId
  ).map(t => t.id)

  // Projects linked via contactId
  const projects = data.projects.filter(p => p.contactId === itemId).map(p => p.id)

  // Contacts linked inversely via tasks or projects
  const contacts = data.crmContacts.filter(c =>
    data.tasks.some(t => t.contactId === c.id && (t.projectId === itemId || t.id === itemId)) ||
    data.projects.some(p => p.contactId === c.id && p.id === itemId)
  ).map(c => c.id)

  return {
    exchanges,
    notes,
    resources,
    tasks,
    projects,
    contacts
  }
}
