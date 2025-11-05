"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useContacts, useProjects, useTasks, useExchanges, useNotes, useResources } from "@/hooks/use-items"
import { getRelationsForItem } from "@/lib/relations"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { PlusIcon, ExternalLinkIcon, LinkIcon } from "lucide-react"
import { format } from "date-fns"
import type { ItemType, Exchange, Note, Resource, Task, Project, CRMContact } from "@/types"

interface RelationTabsProps {
  itemId: string
  itemType: ItemType
  visibleTabs?: string[]
  onOpenRelation?: (item: any) => void
  onCreateNew?: (relationType: string) => void
  onLinkExisting?: (itemId: string, relationType: string) => void
  onRemoveRelation?: (itemId: string, relationType: string) => void
}

export function RelationTabs({ itemId, itemType, visibleTabs, onOpenRelation, onCreateNew, onLinkExisting, onRemoveRelation }: RelationTabsProps) {
  const shouldFetchExchanges = itemType === 'contact'
  const { data: exchangesData } = useExchanges(shouldFetchExchanges ? itemId : '', { enabled: shouldFetchExchanges })
  const { data: notesData } = useNotes(itemType, itemId)
  const { data: resourcesData } = useResources(itemType, itemId)
  const { data: tasksData } = useTasks()
  const { data: projectsData } = useProjects()
  const { data: contactsData } = useContacts()

  const exchanges = exchangesData || []
  const notes = notesData || []
  const resources = resourcesData || []
  const tasks = tasksData?.data || []
  const projects = projectsData?.data || []
  const crmContacts = contactsData?.data || []

  const relations = getRelationsForItem(itemId, itemType, { exchanges, notes, resources, tasks, projects, crmContacts })

  const allTabs = ["exchanges", "projects", "tasks", "notes", "resources", "contacts"]
  const tabs = visibleTabs || allTabs
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDialogType, setLinkDialogType] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const relatedExchanges = exchanges.filter((e: Exchange) => relations.exchanges.includes(e.id))
  const relatedNotes = notes.filter((n: Note) => relations.notes.includes(n.id))
  const relatedResources = resources.filter((r: Resource) => relations.resources.includes(r.id))
  const relatedTasks = tasks.filter((t: Task) => relations.tasks.includes(t.id))
  const relatedProjects = projects.filter((p: Project) => relations.projects.includes(p.id))
  const relatedContacts = crmContacts.filter((c: CRMContact) => relations.contacts?.includes(c.id))

  const handleOpenLinkDialog = (relationType: string) => {
    if (itemType === 'task' && relationType === 'contacts' && relatedContacts.length >= 1) {
      toast.error("A task can only be linked to 1 contact maximum")
      return
    }

    setLinkDialogType(relationType)
    setSearchQuery("")
    setSelectedItemId(null)
    setLinkDialogOpen(true)
  }

  const handleLinkItem = () => {
    if (selectedItemId && onLinkExisting) {
      onLinkExisting(selectedItemId, linkDialogType)
      setLinkDialogOpen(false)
      setSearchQuery("")
      setSelectedItemId(null)
    }
  }

  const getAvailableItems = (relationType: string) => {
    const allItems = {
      exchanges,
      notes,
      resources,
      tasks,
      projects,
      contacts: crmContacts,
    }[relationType] || []

    const relatedIds = relations[relationType as keyof typeof relations] || []
    return allItems.filter((item: any) => !relatedIds.includes(item.id))
  }

  const getFilteredItems = () => {
    const available = getAvailableItems(linkDialogType)
    if (!searchQuery) return available

    return available.filter((item: any) => {
      const searchLower = searchQuery.toLowerCase()
      if ("summary" in item) return item.summary.toLowerCase().includes(searchLower)
      if ("title" in item) return item.title.toLowerCase().includes(searchLower)
      if ("name" in item) return item.name.toLowerCase().includes(searchLower)
      return false
    })
  }

  const getItemLabel = (item: any) => {
    if ("contact" in item && item.contact) return String(item.contact)
    if ("title" in item && item.title) return item.title
    if ("name" in item && item.name) return item.name
    if ("email" in item && item.email) return item.email
    return "Untitled"
  }

  const renderAddButton = (relationType: string) => {
    if (itemType === 'task' && relationType === 'contacts' && relatedContacts.length >= 1) {
      return (
        <div className="text-xs text-muted-foreground px-2 py-1.5 text-right">
          Max 1 contact per task
        </div>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" className="size-8">
            <PlusIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOpenLinkDialog(relationType)}>
            <LinkIcon className="size-4" />
            Link existing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCreateNew?.(relationType)}>
            <PlusIcon className="size-4" />
            Create new
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const tabConfig = {
    exchanges: { label: "Exchanges" },
    projects: { label: "Projects" },
    tasks: { label: "Tasks" },
    notes: { label: "Notes" },
    resources: { label: "Resources" },
    contacts: { label: "Contacts" },
  }

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  }[tabs.length] || "grid-cols-6"

  return (
    <>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={`w-full grid ${gridColsClass}`}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-col gap-0 h-auto py-1">
            <span className="text-xs">{tabConfig[tab as keyof typeof tabConfig]?.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.includes("exchanges") && (
      <TabsContent value="exchanges" className="space-y-3 mt-4">
        <div className="flex justify-end">
          {renderAddButton("exchanges")}
        </div>
        {relatedExchanges.map((exchange: Exchange) => (
          <Card
            key={exchange.id}
            className="cursor-pointer hover:bg-accent transition-colors relative group gap-0 py-0"
            onClick={() => onOpenRelation?.(exchange)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exchange.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{exchange.type}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {exchange.date ? format(new Date(exchange.date), "MMM d, yyyy") : "-"}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRelation?.(exchange.id, "exchanges")
                  }}
                >
                  <PlusIcon className="size-4 rotate-45" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {relatedExchanges.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No exchanges yet</p>
        )}
      </TabsContent>
      )}

      {tabs.includes("projects") && (
      <TabsContent value="projects" className="space-y-3 mt-4">
        <div className="flex justify-end">
          {renderAddButton("projects")}
        </div>
        {relatedProjects.map((project: Project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:bg-accent transition-colors relative group gap-0 py-0"
            onClick={() => onOpenRelation?.(project)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{project.status}</Badge>
                    <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRelation?.(project.id, "projects")
                  }}
                >
                  <PlusIcon className="size-4 rotate-45" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {relatedProjects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No projects linked</p>
        )}
      </TabsContent>
      )}

      {tabs.includes("tasks") && (
      <TabsContent value="tasks" className="space-y-3 mt-4">
        <div className="flex justify-end">
          {renderAddButton("tasks")}
        </div>
        {relatedTasks.map((task: Task) => (
          <Card
            key={task.id}
            className="cursor-pointer hover:bg-accent transition-colors relative group gap-0 py-0"
            onClick={() => onOpenRelation?.(task)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{task.status}</Badge>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "-"}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRelation?.(task.id, "tasks")
                  }}
                >
                  <PlusIcon className="size-4 rotate-45" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {relatedTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks linked</p>
        )}
      </TabsContent>
      )}

      {tabs.includes("notes") && (
      <TabsContent value="notes" className="space-y-3 mt-4">
        <div className="flex justify-end">
          {renderAddButton("notes")}
        </div>
        {relatedNotes.map((note: Note) => (
          <Card
            key={note.id}
            className="cursor-pointer hover:bg-accent transition-colors relative group gap-0 py-0"
            onClick={() => onOpenRelation?.(note)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{note.title || "Untitled Note"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground truncate">{note.content}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(note.updatedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRelation?.(note.id, "notes")
                  }}
                >
                  <PlusIcon className="size-4 rotate-45" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {relatedNotes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No notes yet</p>
        )}
      </TabsContent>
      )}

      {tabs.includes("resources") && (
      <TabsContent value="resources" className="space-y-3 mt-4">
        <div className="flex justify-end">
          {renderAddButton("resources")}
        </div>
        {relatedResources.map((resource: Resource) => (
          <Card
            key={resource.id}
            className="cursor-pointer hover:bg-accent transition-colors relative group gap-0 py-0"
            onClick={() => onOpenRelation?.(resource)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{resource.title}</p>
                    <ExternalLinkIcon className="size-3 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{resource.resourceType}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {resource.createdAt ? format(resource.createdAt, "MMM d, yyyy") : "-"}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRelation?.(resource.id, "resources")
                  }}
                >
                  <PlusIcon className="size-4 rotate-45" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {relatedResources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No resources yet</p>
        )}
      </TabsContent>
      )}

      {tabs.includes("contacts") && (
      <TabsContent value="contacts" className="space-y-3 mt-4">
        <div className="flex justify-end">
          {renderAddButton("contacts")}
        </div>
        {relatedContacts.map((contact: CRMContact) => (
          <Card
            key={contact.id}
            className="cursor-pointer hover:bg-accent transition-colors relative group gap-0 py-0"
            onClick={() => onOpenRelation?.(contact)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contact.contact}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{contact.status}</Badge>
                    <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRelation?.(contact.id, "contacts")
                  }}
                >
                  <PlusIcon className="size-4 rotate-45" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {relatedContacts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No contacts linked</p>
        )}
      </TabsContent>
      )}
    </Tabs>

    <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link existing {linkDialogType.slice(0, -1)}</DialogTitle>
          <DialogDescription>
            Search and select an item to link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {getFilteredItems().map((item: any) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors ${
                  selectedItemId === item.id
                    ? "bg-accent border-primary"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedItemId(item.id)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{getItemLabel(item)}</p>
                </CardContent>
              </Card>
            ))}
            {getFilteredItems().length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items available
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLinkItem} disabled={!selectedItemId}>
            Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
