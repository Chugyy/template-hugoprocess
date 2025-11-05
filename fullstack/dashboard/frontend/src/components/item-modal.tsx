"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnyItem, CRMContact, Task, Project, Exchange, Note, Resource, ItemType } from "@/types"
import { useContacts, useProjects } from "@/hooks/use-items"
import { toast } from "sonner"
import ExchangeMediaUpload from "@/components/exchange-media-upload"
import { Badge } from "@/components/ui/badge"

interface ItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "duplicate" | "delete"
  itemType: ItemType
  item?: AnyItem | null
  onSave: (item: AnyItem) => void
  onDelete?: (itemId: string) => void
  contextEntityType?: ItemType
  contextEntityId?: string
}

export function ItemModal({
  open,
  onOpenChange,
  mode,
  itemType,
  item,
  onSave,
  onDelete,
  contextEntityType,
  contextEntityId
}: ItemModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const { data: contacts = [] } = useContacts()
  const { data: projects = [] } = useProjects()

  useEffect(() => {
    if (item && (mode === "edit" || mode === "duplicate")) {
      setFormData(mode === "duplicate" ? { ...item, id: crypto.randomUUID() } : { ...item })
    } else if (mode === "create") {
      const defaultData = getDefaultFormData(itemType)
      // Auto-assign entityId for notes and resources based on context
      if ((itemType === "note" || itemType === "resource") && contextEntityType && contextEntityId) {
        defaultData.entityType = contextEntityType
        defaultData.entityId = contextEntityId
      }
      setFormData(defaultData)
    }
  }, [item, mode, itemType, contextEntityType, contextEntityId])

  const handleSave = () => {
    if (itemType === 'exchange') {
      // Validate type
      if (!formData.type) {
        toast.error('Type is required')
        return
      }
      // Validate title
      if (!formData.title?.trim()) {
        toast.error('Title is required')
        return
      }
      // Validate transcription (required unless media file uploaded)
      if (!formData.audioUrl && !formData.transcript?.trim()) {
        toast.error('Transcription is required when no media file is provided')
        return
      }
    }
    onSave(formData as AnyItem)
    onOpenChange(false)
    setFormData({})
  }

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id)
      onOpenChange(false)
    }
  }

  if (mode === "delete") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemType}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && `Create ${itemType}`}
            {mode === "edit" && `Edit ${itemType}`}
            {mode === "duplicate" && `Duplicate ${itemType}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {itemType === "contact" && renderContactForm(formData, setFormData)}
          {itemType === "task" && renderTaskForm(formData, setFormData, contacts, projects)}
          {itemType === "project" && renderProjectForm(formData, setFormData, contacts)}
          {itemType === "exchange" && renderExchangeForm(formData, setFormData, mode)}
          {itemType === "note" && renderNoteForm(formData, setFormData)}
          {itemType === "resource" && renderResourceForm(formData, setFormData)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultFormData(itemType: ItemType): Record<string, any> {
  const now = new Date().toISOString()
  const defaults: Record<ItemType, Record<string, any>> = {
    contact: {
      id: crypto.randomUUID(),
      company: "",
      contact: "",
      email: "",
      phone: "",
      status: "Uncategorized",
      source: "",
      dealValue: 0,
      lastContactDate: "",
      linkedin: "",
      instagram: "",
      twitter: "",
      website: "",
      youtube: "",
      tiktok: "",
      facebook: "",
      createdAt: now,
      updatedAt: now
    },
    task: {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      dueDate: "",
      contactId: "",
      projectId: "",
      createdAt: now,
      updatedAt: now
    },
    project: {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      status: "active",
      startDate: "",
      endDate: "",
      budget: 0,
      contactId: "",
      createdAt: now,
      updatedAt: now
    },
    exchange: {
      id: crypto.randomUUID(),
      type: "email",
      date: new Date(),
      title: "",
      transcript: "",
      audioUrl: "",
      externalUrl: "",
      _uploadType: "url" // Internal state for UI
    },
    note: {
      id: crypto.randomUUID(),
      entityType: "contact",
      entityId: "", // Will be auto-assigned from context
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now
    },
    resource: {
      id: crypto.randomUUID(),
      entityType: "contact",
      entityId: "", // Will be auto-assigned from context
      resourceType: "url",
      title: "",
      url: "",
      filePath: null,
      fileSize: null,
      mimeType: null,
      createdAt: now,
      updatedAt: now
    },
  }
  return defaults[itemType]
}

function renderContactForm(formData: Record<string, any>, setFormData: (data: Record<string, any>) => void) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact Name</Label>
        <Input
          id="contact"
          value={formData.contact || ""}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company || ""}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            <SelectItem value="Uncategorized">Uncategorized</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Prospect">Prospect</SelectItem>
            <SelectItem value="Client">Client</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={formData.source || ""}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="Referral, Website, etc."
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dealValue">Deal Value</Label>
          <Input
            id="dealValue"
            type="number"
            value={formData.dealValue || 0}
            onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastContactDate">Last Contact Date</Label>
        <Input
          id="lastContactDate"
          type="date"
          value={formData.lastContactDate ? new Date(formData.lastContactDate).toISOString().split('T')[0] : ""}
          onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value ? new Date(e.target.value).toISOString() : "" })}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.linkedin || ""}
            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/..."
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter</Label>
          <Input
            id="twitter"
            value={formData.twitter || ""}
            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            placeholder="https://twitter.com/..."
            className="w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={formData.instagram || ""}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            placeholder="https://instagram.com/..."
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website || ""}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://..."
            className="w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="youtube">YouTube</Label>
          <Input
            id="youtube"
            value={formData.youtube || ""}
            onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
            placeholder="https://youtube.com/@..."
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiktok">TikTok</Label>
          <Input
            id="tiktok"
            value={formData.tiktok || ""}
            onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
            placeholder="https://tiktok.com/@..."
            className="w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            value={formData.facebook || ""}
            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            placeholder="https://facebook.com/..."
            className="w-full"
          />
        </div>
        <div className="space-y-2"></div>
      </div>
    </>
  )
}

function renderTaskForm(
  formData: Record<string, any>,
  setFormData: (data: Record<string, any>) => void,
  contacts: any[],
  projects: any[]
) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800">
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ""}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : "" })}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactId">
            Contact (optional)
            <span className="text-xs text-muted-foreground ml-2">(max 1)</span>
          </Label>
          <Select value={formData.contactId || "none"} onValueChange={(value) => setFormData({ ...formData, contactId: value === "none" ? "" : value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select contact" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800">
              <SelectItem value="none">None</SelectItem>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.contact} - {contact.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">Project (optional)</Label>
          <Select value={formData.projectId || "none"} onValueChange={(value) => setFormData({ ...formData, projectId: value === "none" ? "" : value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800">
              <SelectItem value="none">None</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}

function renderProjectForm(
  formData: Record<string, any>,
  setFormData: (data: Record<string, any>) => void,
  contacts: any[]
) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ""}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value).toISOString() : "" })}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ""}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value).toISOString() : "" })}
            className="w-full"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          value={formData.budget || 0}
          onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactId">Contact</Label>
        <Select value={formData.contactId || "none"} onValueChange={(value) => setFormData({ ...formData, contactId: value === "none" ? "" : value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select contact" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            <SelectItem value="none">None</SelectItem>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.contact} - {contact.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function renderExchangeForm(formData: Record<string, any>, setFormData: (data: Record<string, any>) => void, mode: "create" | "edit" | "duplicate" | "delete") {
  const hasUploadedFile = !!formData._uploadedFile || !!formData.audioUrl
  const isEditMode = mode === "edit"

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="loom">Loom</SelectItem>
            <SelectItem value="fathom">Fathom</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="transcript">
          Transcription {!hasUploadedFile && <span className="text-destructive">*</span>}
        </Label>
        {hasUploadedFile && !isEditMode && (
          <Badge variant="secondary" className="mb-2 text-xs">
            ⚠️ Cannot pre-fill transcript when extracting from media
          </Badge>
        )}
        <Textarea
          id="transcript"
          value={formData.transcript || ""}
          onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
          rows={4}
          className="w-full max-h-60 resize-none"
          disabled={hasUploadedFile || isEditMode}
        />
      </div>

      {/* Media Upload */}
      <div className="space-y-3 border-t pt-4">
        <Label>Upload Media File</Label>
        <ExchangeMediaUpload
          onFileUploaded={(file) => {
            setFormData({
              ...formData,
              audioUrl: file.url,
              _uploadedFile: file,
              duration: file.duration,
            })
          }}
          onFileRemoved={() => {
            setFormData({
              ...formData,
              audioUrl: "",
              _uploadedFile: null,
              duration: undefined,
            })
          }}
          initialFile={formData._uploadedFile || (formData.audioUrl ? {
            name: "media-file",
            size: 0,
            type: "audio/mpeg",
            url: formData.audioUrl
          } : undefined)}
          disabled={isEditMode}
        />
      </div>

      {/* External URL */}
      <div className="space-y-2">
        <Label htmlFor="externalUrl">External URL (optional)</Label>
        <Input
          id="externalUrl"
          placeholder="https://app.fathom.video/... or other URL"
          value={formData.externalUrl || ""}
          onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
          className="w-full"
          disabled={isEditMode}
        />
      </div>
    </>
  )
}

function renderNoteForm(formData: Record<string, any>, setFormData: (data: Record<string, any>) => void) {
  // entityId is auto-assigned from context (see useEffect in ItemModal)
  // entityType is also pre-filled but can be changed if needed

  return (
    <>
      {/* Hidden comment: entityId will be auto-assigned based on where the note is created (contextEntityId) */}
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          rows={6}
          value={formData.content || ""}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full"
        />
      </div>
    </>
  )
}

function renderResourceForm(formData: Record<string, any>, setFormData: (data: Record<string, any>) => void) {
  // entityId is auto-assigned from context (see useEffect in ItemModal)
  const resourceType = formData.resourceType || "url"

  return (
    <>
      {/* Hidden comment: entityId will be auto-assigned based on where the resource is created (contextEntityId) */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full"
        />
      </div>

      {/* Resource Type Selection */}
      <div className="space-y-3 border-t pt-4">
        <Label>Resource Type</Label>
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="resource-url"
              checked={resourceType === "url"}
              onCheckedChange={(checked) => {
                if (checked) setFormData({ ...formData, resourceType: "url" })
              }}
            />
            <label htmlFor="resource-url" className="text-sm cursor-pointer">
              URL
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="resource-file"
              checked={resourceType === "file"}
              onCheckedChange={(checked) => {
                if (checked) setFormData({ ...formData, resourceType: "file" })
              }}
            />
            <label htmlFor="resource-file" className="text-sm cursor-pointer">
              File Upload
            </label>
          </div>
        </div>

        {resourceType === "url" && (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={formData.url || ""}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="w-full"
            />
          </div>
        )}

        {resourceType === "file" && (
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Store file info (in real app, would upload to server)
                  setFormData({
                    ...formData,
                    filePath: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    _file: file
                  })
                }
              }}
              className="w-full"
            />
            {formData.filePath && (
              <p className="text-xs text-gray-500">
                {formData.filePath} ({Math.round(formData.fileSize / 1024)} KB)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full"
        />
      </div>
    </>
  )
}
