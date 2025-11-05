"use client"

import { useState } from "react"
import {
  DialogStack,
  DialogStackOverlay,
  DialogStackBody,
  DialogStackContent,
  DialogStackFooter,
  DialogStackPrevious,
} from "@/components/ui/dialog-stack"
import { DetailField } from "@/components/detail-sheet"
import { RelationTabs } from "@/components/relation-tabs"
import { ItemActions } from "@/components/item-actions"
import { ItemModal } from "@/components/item-modal"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import type { AnyItem, CRMContact, Task, Project, Exchange, Note, Resource, ItemType } from "@/types"

interface NestedDetailViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialItem: AnyItem
}

export function NestedDetailView({ open, onOpenChange, initialItem }: NestedDetailViewProps) {
  const [itemStack, setItemStack] = useState<AnyItem[]>([initialItem])
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: "create" | "edit" | "duplicate" | "delete"
    itemType: ItemType
    item: AnyItem | null
  }>({ open: false, mode: "create", itemType: "contact", item: null })

  const handleOpenRelation = (item: AnyItem) => {
    setItemStack((prev) => [...prev, item])
  }

  const handleCreateNew = (relationType: string) => {
    console.log("Create new relation:", relationType)
    // TODO: Implémenter la création/liaison d'item
  }

  const handleRemoveRelation = (itemId: string, relationType: string) => {
    console.log("Remove relation:", itemId, relationType)
    // TODO: Implémenter la suppression de relation
  }

  const handleModalSave = (item: AnyItem) => {
    console.log("Save item:", item)
    setModalState({ ...modalState, open: false })
  }

  const handleModalDelete = (itemId: string) => {
    console.log("Delete item:", itemId)
    setModalState({ ...modalState, open: false })
  }

  const getItemType = (item: AnyItem): ItemType => {
    if ("email" in item) return "contact"
    if ("title" in item && "description" in item && "dueDate" in item) return "task"
    if ("name" in item && "progress" in item) return "project"
    if ("type" in item && "summary" in item) return "exchange"
    if ("content" in item) return "note"
    if ("url" in item) return "resource"
    return "contact"
  }

  return (
    <>
      <DialogStack open={open} onOpenChange={onOpenChange} clickable>
        <DialogStackOverlay />
        <DialogStackBody>
          {itemStack.map((item, index) => {
            const itemType = getItemType(item)
            return (
              <DialogStackContent key={item.id} index={index}>
                <div className="flex items-start justify-end mb-4">
                  <ItemActions
                    item={item}
                    onEdit={(item) => setModalState({ open: true, mode: "edit", itemType, item })}
                    onDuplicate={(item) => setModalState({ open: true, mode: "duplicate", itemType, item })}
                    onDelete={(item) => setModalState({ open: true, mode: "delete", itemType, item })}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{getItemTitle(item)}</h2>
                    {getItemDescription(item) && (
                      <p className="text-sm text-muted-foreground">{getItemDescription(item)}</p>
                    )}
                  </div>

                  <Separator />

                  {renderItemDetails(item)}

                  <Separator className="my-6" />

                  <div>
                    <h3 className="font-semibold mb-4">Related Items</h3>
                    <RelationTabs
                      itemId={item.id}
                      itemType={itemType}
                      onOpenRelation={handleOpenRelation}
                      onCreateNew={handleCreateNew}
                      onRemoveRelation={handleRemoveRelation}
                    />
                  </div>
                </div>

                {index > 0 && (
                  <DialogStackFooter>
                    <DialogStackPrevious
                      onClick={() => setItemStack((prev) => prev.slice(0, -1))}
                    />
                  </DialogStackFooter>
                )}
              </DialogStackContent>
            )
          })}
        </DialogStackBody>
      </DialogStack>

      <ItemModal
        open={modalState.open}
        onOpenChange={(open) => setModalState({ ...modalState, open })}
        mode={modalState.mode}
        itemType={modalState.itemType}
        item={modalState.item}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </>
  )
}

function getItemTitle(item: AnyItem): string {
  if ("contact" in item && item.contact) return String(item.contact)
  if ("name" in item && item.name) return String(item.name)
  if ("title" in item && item.title) return String(item.title)
  if ("email" in item && (item as CRMContact).email) return (item as CRMContact).email
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
        <DetailField label="Company" value={contact.company} />
        <DetailField label="Email" value={contact.email} />
        <DetailField label="Phone" value={contact.phone} />
        <DetailField
          label="Status"
          value={<Badge variant="secondary">{contact.status}</Badge>}
        />
        <DetailField label="Source" value={contact.source || "-"} />
        <DetailField label="Deal Value" value={`$${(contact.dealValue ?? 0).toLocaleString()}`} />
        <DetailField label="Last Contact" value={contact.lastContactDate ? format(contact.lastContactDate, "MMMM d, yyyy") : "-"} />
        <DetailField label="LinkedIn" value={contact.linkedin || "-"} />
        <DetailField label="Instagram" value={contact.instagram || "-"} />
        <DetailField label="Twitter" value={contact.twitter || "-"} />
        <DetailField label="Website" value={contact.website || "-"} />
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
        <DetailField label="Progress" value={`${project.progress}%`} />
        <DetailField label="Start Date" value={project.startDate ? format(project.startDate, "MMMM d, yyyy") : "-"} />
        <DetailField label="End Date" value={project.endDate ? format(project.endDate, "MMMM d, yyyy") : "-"} />
        <DetailField label="Team" value={project.team.join(", ")} />
      </>
    )
  }

  if ("summary" in item && "type" in item) {
    const exchange = item as Exchange
    return (
      <>
        <DetailField
          label="Type"
          value={<Badge variant="secondary">{exchange.type}</Badge>}
        />
        <DetailField label="Date" value={exchange.date ? format(exchange.date, "MMMM d, yyyy") : "-"} />
        <DetailField label="Summary" value={exchange.summary} />
        {exchange.participants && exchange.participants.length > 0 && (
          <DetailField label="Participants" value={exchange.participants.join(", ")} />
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
          value={<Badge variant="secondary">{resource.type}</Badge>}
        />
        <DetailField label="Uploaded" value={resource.uploadedAt ? format(resource.uploadedAt, "MMMM d, yyyy") : "-"} />
      </>
    )
  }

  return null
}
