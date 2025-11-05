"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { DetailField } from "@/components/detail-sheet"
import { RelationTabs } from "@/components/relation-tabs"
import { ItemActions } from "@/components/item-actions"
import { ItemModal } from "@/components/item-modal"
import { ItemActionButtons } from "@/components/item-action-buttons"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, PlusIcon, XIcon } from "lucide-react"
import { format } from "date-fns"
import { useRelationMutations, useItemMutations } from "@/hooks/use-items"
import type { AnyItem, CRMContact, Task, Project, Exchange, Note, Resource, ItemType } from "@/types"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { getNestedZIndex, Z_INDEX } from "@/lib/z-index"

interface NestedSheetViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialItem: AnyItem
}

function getItemType(item: AnyItem): ItemType {
  if ("email" in item) return "contact"
  if ("title" in item && "description" in item && "dueDate" in item) return "task"
  if ("name" in item && "progress" in item) return "project"
  if ('contactId' in item && ('type' in item || 'exchangeType' in item) && ('title' in item || 'summary' in item)) return "exchange"
  if ("content" in item) return "note"
  if ("url" in item) return "resource"
  return "contact"
}

export function NestedSheetView({ open, onOpenChange, initialItem }: NestedSheetViewProps) {
  const [itemStack, setItemStack] = useState<AnyItem[]>([initialItem])
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: "create" | "edit" | "duplicate" | "delete"
    itemType: ItemType
    item: AnyItem | null
  }>({ open: false, mode: "create", itemType: "contact", item: null })

  const currentItem = itemStack[itemStack.length - 1]
  const currentItemType = getItemType(currentItem)
  const currentContactId = currentItemType === 'contact' ? currentItem.id :
                           currentItemType === 'exchange' ? (currentItem as Exchange).contactId :
                           undefined

  const { link, unlink } = useRelationMutations()

  const handleAutoTranscribe = async (exchange: any) => {
    console.log('[AUTO-TRANSCRIBE] Exchange created:', {
      id: exchange.id,
      audioUrl: exchange.audioUrl,
      transcript: exchange.transcript,
      contactId: currentContactId
    })

    if (exchange.audioUrl && !exchange.transcript && currentContactId) {
      toast.info('Starting automatic transcription...', { duration: 3000 })
      try {
        await api.transcribeExchange(currentContactId, exchange.id, 'api')
        toast.success('Transcription started successfully')
      } catch (error) {
        console.error('[AUTO-TRANSCRIBE] Error:', error)
        toast.error('Failed to start transcription')
      }
    } else {
      console.log('[AUTO-TRANSCRIBE] Skipped - conditions not met')
    }
  }

  const { create: createExchange, update: updateExchange, remove: removeExchange } = useItemMutations("exchange", {
    contactId: currentContactId,
    onExchangeCreated: handleAutoTranscribe
  })
  const { create: createNote, update: updateNote, remove: removeNote } = useItemMutations("note")
  const { create: createResource, update: updateResource, remove: removeResource } = useItemMutations("resource")
  const { update: updateContact, remove: removeContact } = useItemMutations("contact")
  const { update: updateTask, remove: removeTask } = useItemMutations("task")
  const { update: updateProject, remove: removeProject } = useItemMutations("project")

  // Reset stack when opening with new item
  useEffect(() => {
    if (open) {
      setItemStack([initialItem])
    }
  }, [initialItem, open])

  const handleOpenRelation = (item: AnyItem) => {
    setItemStack((prev) => [...prev, item])
  }

  const handleBack = () => {
    setItemStack((prev) => prev.slice(0, -1))
  }

  const handleModalSave = (item: AnyItem) => {
    if (modalState.mode === "create") {
      if (modalState.itemType === 'exchange') createExchange.mutate(item)
      else if (modalState.itemType === 'note') createNote.mutate(item)
      else if (modalState.itemType === 'resource') createResource.mutate(item)
    } else if (modalState.mode === "edit") {
      const id = item.id
      if (modalState.itemType === 'exchange') updateExchange.mutate({ id, data: item })
      else if (modalState.itemType === 'note') updateNote.mutate({ id, data: item })
      else if (modalState.itemType === 'resource') updateResource.mutate({ id, data: item })
      else if (modalState.itemType === 'contact') updateContact.mutate({ id, data: item })
      else if (modalState.itemType === 'task') updateTask.mutate({ id, data: item })
      else if (modalState.itemType === 'project') updateProject.mutate({ id, data: item })
    }
    setModalState({ ...modalState, open: false })
  }

  const handleModalDelete = (itemId: string) => {
    if (modalState.itemType === 'exchange') removeExchange.mutate(itemId)
    else if (modalState.itemType === 'note') removeNote.mutate(itemId)
    else if (modalState.itemType === 'resource') removeResource.mutate(itemId)
    else if (modalState.itemType === 'contact') removeContact.mutate(itemId)
    else if (modalState.itemType === 'task') removeTask.mutate(itemId)
    else if (modalState.itemType === 'project') removeProject.mutate(itemId)
    setModalState({ ...modalState, open: false })
  }

  const handleCreateNew = (relationType: string) => {
    const itemTypeMap: Record<string, ItemType> = {
      exchanges: "exchange",
      notes: "note",
      resources: "resource",
      tasks: "task",
      projects: "project",
    }

    setModalState({
      open: true,
      mode: "create",
      itemType: itemTypeMap[relationType] || "contact",
      item: null,
    })
  }

  const handleRemoveRelation = (itemId: string, relationType: string) => {
    const currentItemType = getItemType(currentItem)

    if (relationType === 'tasks') {
      const field = currentItemType === 'contact' ? 'contactId' : 'projectId'
      unlink.mutate({ itemId, itemType: 'task', field })
    }
  }

  const handleLinkExisting = (itemId: string, relationType: string) => {
    const currentItemType = getItemType(currentItem)
    const currentItemId = currentItem.id

    if (relationType === 'tasks') {
      link.mutate({
        itemId,
        itemType: 'task',
        targetId: currentItemId,
        targetType: currentItemType,
      })
    } else if (relationType === 'projects') {
      link.mutate({
        itemId,
        itemType: 'project',
        targetId: currentItemId,
        targetType: 'contact',
      })
    }
  }

  const itemType = getItemType(currentItem)
  const depth = itemStack.length - 1

  return (
    <>
      {itemStack.map((item, index) => {
        const isActive = index === itemStack.length - 1
        const stackItemType = getItemType(item)

        return (
          <Sheet
            key={`${item.id}-${index}`}
            open={isActive && open}
            onOpenChange={(newOpen) => {
              if (!newOpen && index === 0) {
                onOpenChange(false)
              } else if (!newOpen && index > 0) {
                handleBack()
              }
            }}
          >
            <SheetContent
              className="w-full sm:max-w-xl overflow-y-auto p-0"
              style={{ zIndex: getNestedZIndex(Z_INDEX.SIDEBAR, index) }}
            >
              <SheetTitle className="sr-only">{getItemTitle(item)}</SheetTitle>
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index > 0 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBack}
                      className="size-8"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                  ) : (
                    <div className="size-8" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ItemActionButtons
                    onEdit={() => setModalState({ open: true, mode: "edit", itemType: stackItemType, item })}
                    onDelete={() => setModalState({ open: true, mode: "delete", itemType: stackItemType, item })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => index === 0 ? onOpenChange(false) : handleBack()}
                    className="size-8"
                  >
                    <PlusIcon className="size-4 rotate-45" />
                  </Button>
                </div>
              </div>

              <div className="px-6 pt-4">
                <div className="space-y-6 px-1">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
                    <div className="text-sm">{getItemTitle(item)}</div>
                  </div>
                  {renderItemDetails(item)}

                  {stackItemType !== "exchange" && stackItemType !== "note" && stackItemType !== "resource" && (
                    <>
                      <Separator className="my-6" />

                      <div>
                        <h3 className="font-semibold mb-4">Related Items</h3>
                        <RelationTabs
                          itemId={item.id}
                          itemType={stackItemType}
                          visibleTabs={
                            stackItemType === "contact" ? ["exchanges", "projects", "tasks", "notes", "resources"] :
                            stackItemType === "task" ? ["contacts", "projects", "notes", "resources"] :
                            stackItemType === "project" ? ["contacts", "tasks", "notes", "resources"] :
                            undefined
                          }
                          onOpenRelation={handleOpenRelation}
                          onCreateNew={handleCreateNew}
                          onLinkExisting={handleLinkExisting}
                          onRemoveRelation={handleRemoveRelation}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )
      })}

      <ItemModal
        open={modalState.open}
        onOpenChange={(open) => setModalState({ ...modalState, open })}
        mode={modalState.mode}
        itemType={modalState.itemType}
        item={modalState.item}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        contextEntityType={itemType}
        contextEntityId={currentItem.id}
      />
    </>
  )
}

function getItemTitle(item: AnyItem): string {
  if ("contact" in item && item.contact) return String(item.contact)
  if ("name" in item && item.name) return String(item.name)
  if ("title" in item && item.title) return String(item.title)
  if ("email" in item && (item as CRMContact).email) return (item as CRMContact).email!
  return "Untitled"
}

function getItemDescription(item: AnyItem): string {
  if ("contact" in item && "email" in item) return (item as CRMContact).email || ""
  if ("type" in item && "date" in item) {
    const exchange = item as Exchange
    return `${exchange.type} · ${exchange.date ? format(exchange.date, "MMM d, yyyy") : "-"}`
  }
  if ("description" in item && typeof item.description === "string") return item.description
  if ("resourceType" in item && "title" in item) return `${(item as Resource).resourceType} · ${(item as Resource).title}`
  return ""
}

function renderItemDetails(item: AnyItem) {
  if ("email" in item) {
    const contact = item as CRMContact
    return (
      <>
        <DetailField label="Email" value={contact.email} />
        <DetailField label="Phone" value={contact.phone} />
        <DetailField label="Company" value={contact.company} />
        <DetailField
          label="Status"
          value={<Badge variant="secondary">{contact.status}</Badge>}
        />
        <DetailField label="Source" value={contact.source} />
        <DetailField label="Deal Value" value={contact.dealValue != null ? `$${contact.dealValue.toLocaleString()}` : "-"} />
        <DetailField label="Last Contact" value={contact.lastContactDate ? format(new Date(contact.lastContactDate), "MMMM d, yyyy") : "-"} />

        {(contact.linkedin || contact.instagram || contact.twitter || contact.website || contact.youtube || contact.tiktok || contact.facebook) && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social Links</p>
              <div className="space-y-1">
                {contact.website && (
                  <DetailField label="Website" value={
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.website}
                    </a>
                  } />
                )}
                {contact.linkedin && (
                  <DetailField label="LinkedIn" value={
                    <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.linkedin}
                    </a>
                  } />
                )}
                {contact.twitter && (
                  <DetailField label="Twitter" value={
                    <a href={contact.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.twitter}
                    </a>
                  } />
                )}
                {contact.instagram && (
                  <DetailField label="Instagram" value={
                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.instagram}
                    </a>
                  } />
                )}
                {contact.youtube && (
                  <DetailField label="YouTube" value={
                    <a href={contact.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.youtube}
                    </a>
                  } />
                )}
                {contact.tiktok && (
                  <DetailField label="TikTok" value={
                    <a href={contact.tiktok} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.tiktok}
                    </a>
                  } />
                )}
                {contact.facebook && (
                  <DetailField label="Facebook" value={
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.facebook}
                    </a>
                  } />
                )}
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  if ("dueDate" in item) {
    const task = item as Task
    return (
      <>
        <DetailField label="Description" value={task.description} />
        <DetailField
          label="Status"
          value={<Badge variant="secondary">{task.status}</Badge>}
        />
        <DetailField
          label="Priority"
          value={<Badge variant="secondary">{task.priority}</Badge>}
        />
        <DetailField label="Due Date" value={task.dueDate ? format(task.dueDate, "MMMM d, yyyy") : "-"} />
        {task.assignee && <DetailField label="Assignee" value={task.assignee} />}
      </>
    )
  }

  if ("progress" in item) {
    const project = item as Project
    return (
      <>
        <DetailField label="Description" value={project.description} />
        <DetailField
          label="Status"
          value={<Badge variant="secondary">{project.status}</Badge>}
        />
        <DetailField label="Progress" value={project.progress !== undefined ? `${project.progress}%` : "-"} />
        <DetailField label="Start Date" value={project.startDate ? format(project.startDate, "MMMM d, yyyy") : "-"} />
        <DetailField label="End Date" value={project.endDate ? format(project.endDate, "MMMM d, yyyy") : "-"} />
        <DetailField label="Team" value={project.team && project.team.length > 0 ? project.team.join(", ") : "-"} />
      </>
    )
  }

  if ('contactId' in item && ('type' in item || 'exchangeType' in item)) {
    const exchange = item as Exchange
    return (
      <>
        <DetailField
          label="Type"
          value={<Badge variant="secondary">{exchange.type}</Badge>}
        />
        <DetailField label="Date" value={exchange.date ? format(new Date(exchange.date), "MMMM d, yyyy") : "-"} />

        {exchange.description && (
          <DetailField label="Description" value={exchange.description} />
        )}

        {exchange.summary && (
          <DetailField label="Summary" value={exchange.summary} />
        )}

        {exchange.participants && exchange.participants.length > 0 && (
          <DetailField label="Participants" value={exchange.participants.join(", ")} />
        )}

        {exchange.audioUrl && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Audio Recording {exchange.duration && `(${Math.floor(exchange.duration / 60)}:${(exchange.duration % 60).toString().padStart(2, '0')})`}
            </p>
            <audio controls src={exchange.audioUrl} className="w-full" />
          </div>
        )}

        {exchange.transcript && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transcript</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(exchange.transcript!)}
              >
                Copy
              </Button>
            </div>
            <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
              {exchange.transcript}
            </div>
          </div>
        )}

        {exchange.notes && (
          <DetailField label="Notes" value={exchange.notes} />
        )}

        {exchange.externalUrl && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External Link</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(exchange.externalUrl, '_blank')}
            >
              Open in {exchange.type === 'fathom' ? 'Fathom' : exchange.type === 'loom' ? 'Loom' : 'External App'}
            </Button>
          </div>
        )}
      </>
    )
  }

  if ("content" in item) {
    const note = item as Note
    return (
      <>
        <DetailField label="Content" value={note.content} />
        <DetailField label="Created" value={note.createdAt ? format(note.createdAt, "MMMM d, yyyy") : "-"} />
        <DetailField label="Updated" value={note.updatedAt ? format(note.updatedAt, "MMMM d, yyyy") : "-"} />
      </>
    )
  }

  if ("url" in item) {
    const resource = item as Resource
    return (
      <>
        <DetailField label="URL" value={resource.url} />
        <DetailField
          label="Type"
          value={resource.type ? <Badge variant="secondary">{resource.type}</Badge> : "-"}
        />
        <DetailField label="Uploaded" value={resource.uploadedAt ? format(resource.uploadedAt, "MMMM d, yyyy") : "-"} />
      </>
    )
  }

  return null
}
