"use client"

import { useState, useMemo } from "react"
import { useProjects } from "@/hooks/use-items"
import { useDebounce } from "@/hooks/use-debounce"
import { ViewHeader } from "@/components/view-header"
import { DataTable } from "@/components/data-table"
import { KanbanView } from "@/components/kanban-view"
import { CalendarView } from "@/components/calendar-view"
import { NestedSheetView } from "@/components/nested-sheet-view"
import { ItemActionButtons } from "@/components/item-action-buttons"
import { ItemModal } from "@/components/item-modal"
import { Badge } from "@/components/ui/badge"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ColumnDef } from "@tanstack/react-table"
import { Project } from "@/types"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { useItemMutations } from "@/hooks/use-items"

export default function ProjectsPage() {
  const [currentView, setCurrentView] = useState<"table" | "kanban" | "calendar">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)
  const { data: projectsData, isLoading } = useProjects({ search: debouncedSearch })
  const [selectedItem, setSelectedItem] = useState<Project | null>(null)
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: "create" | "edit" | "delete"
    item: Project | null
  }>({ open: false, mode: "create", item: null })
  const { create, update, duplicate, remove } = useItemMutations("project")

  const projects = projectsData?.data || []

  const handleItemMove = (itemId: string, fromColumn: string, toColumn: string) => {
    update.mutate({
      id: itemId,
      data: { status: toColumn as Project["status"] }
    })
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.progress} className="w-20" />
          <span className="text-xs">{row.original.progress}%</span>
        </div>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => row.original.startDate ? format(row.original.startDate, "MMM d, yyyy") : "-",
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => row.original.endDate ? format(row.original.endDate, "MMM d, yyyy") : "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ItemActionButtons
          onEdit={() => setModalState({ open: true, mode: "edit", item: row.original })}
          onDuplicate={() => duplicate.mutate(row.original)}
          onDelete={() => setModalState({ open: true, mode: "delete", item: row.original })}
        />
      ),
    },
  ]

  const kanbanColumns = [
    {
      id: "active",
      title: "Active",
      items: projects.filter((p) => p.status === "active"),
    },
    {
      id: "on_hold",
      title: "On Hold",
      items: projects.filter((p) => p.status === "on_hold"),
    },
    {
      id: "completed",
      title: "Completed",
      items: projects.filter((p) => p.status === "completed"),
    },
    {
      id: "cancelled",
      title: "Cancelled",
      items: projects.filter((p) => p.status === "cancelled"),
    },
  ]

  const renderKanbanItem = (project: Project) => (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        <div className="space-y-1">
          <Progress value={project.progress} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{project.progress}% complete</span>
            <span className="text-xs text-muted-foreground">{project.endDate ? format(project.endDate, "MMM d") : "-"}</span>
          </div>
        </div>
      </CardContent>
    </>
  )

  return (
    <>
      <section className="shrink-0 bg-background border-b px-6 py-6 space-y-4">
        <h1 className="text-3xl font-bold">Projects</h1>
        <ViewHeader
          currentView={currentView}
          onViewChange={setCurrentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateClick={() => setModalState({ open: true, mode: "create", item: null })}
        />
      </section>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-6">
          {currentView === "table" && (
            <DataTable
              columns={columns}
              data={projects}
              onRowClick={setSelectedItem}
            />
          )}

          {currentView === "kanban" && (
            <KanbanView
              columns={kanbanColumns}
              onItemClick={setSelectedItem}
              onItemMove={handleItemMove}
              renderItem={renderKanbanItem}
              renderActions={(project) => (
                <ItemActionButtons
                  variant="overlay"
                  onEdit={() => setModalState({ open: true, mode: "edit", item: project })}
                  onDuplicate={() => duplicate.mutate(project)}
                  onDelete={() => setModalState({ open: true, mode: "delete", item: project })}
                />
              )}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView
              items={projects}
              onItemClick={setSelectedItem}
              getItemDate={(item) => item.endDate}
              getItemTitle={(item) => item.name}
              renderActions={(project) => (
                <ItemActionButtons
                  variant="overlay"
                  onEdit={() => setModalState({ open: true, mode: "edit", item: project })}
                  onDuplicate={() => duplicate.mutate(project)}
                  onDelete={() => setModalState({ open: true, mode: "delete", item: project })}
                />
              )}
            />
          )}
        </div>
      </main>

      {selectedItem && "progress" in selectedItem && (
        <NestedSheetView
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          initialItem={selectedItem}
        />
      )}

      <ItemModal
        open={modalState.open}
        onOpenChange={(open) => setModalState({ ...modalState, open })}
        mode={modalState.mode}
        itemType="project"
        item={modalState.item}
        onSave={(data) => {
          if (modalState.mode === "create") create.mutate(data)
          else if (modalState.mode === "edit") update.mutate({ id: modalState.item!.id, data })
          setModalState({ ...modalState, open: false })
        }}
        onDelete={(id) => {
          remove.mutate(id)
          setModalState({ ...modalState, open: false })
        }}
      />
    </>
  )
}
