"use client"

import { useState, useMemo } from "react"
import { useTasks } from "@/hooks/use-items"
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
import { Task } from "@/types"
import { format } from "date-fns"
import { useItemMutations } from "@/hooks/use-items"

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-orange-500",
  high: "bg-red-500",
  urgent: "bg-red-600",
}

export default function TasksPage() {
  const [currentView, setCurrentView] = useState<"table" | "kanban" | "calendar">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)
  const { data: tasksData, isLoading } = useTasks({ search: debouncedSearch })
  const [selectedItem, setSelectedItem] = useState<Task | null>(null)
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: "create" | "edit" | "delete"
    item: Task | null
  }>({ open: false, mode: "create", item: null })
  const { create, update, duplicate, remove } = useItemMutations("task")

  const tasks = tasksData?.data || []

  const handleItemMove = (itemId: string, fromColumn: string, toColumn: string) => {
    update.mutate({
      id: itemId,
      data: { status: toColumn as Task["status"] }
    })
  }

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Title",
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
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => row.original.dueDate ? format(row.original.dueDate, "MMM d, yyyy") : "-",
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
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
      id: "pending",
      title: "To Do",
      items: tasks.filter((t) => t.status === "pending"),
    },
    {
      id: "in_progress",
      title: "In Progress",
      items: tasks.filter((t) => t.status === "in_progress"),
    },
    {
      id: "completed",
      title: "Completed",
      items: tasks.filter((t) => t.status === "completed"),
    },
  ]

  const renderKanbanItem = (task: Task) => (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">{task.priority}</Badge>
          <span className="text-xs text-muted-foreground">{task.dueDate ? format(task.dueDate, "MMM d") : "-"}</span>
        </div>
      </CardContent>
    </>
  )

  return (
    <>
      <section className="shrink-0 bg-background border-b px-6 py-6 space-y-4">
        <h1 className="text-3xl font-bold">Tasks</h1>
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
              data={tasks}
              onRowClick={setSelectedItem}
            />
          )}

          {currentView === "kanban" && (
            <KanbanView
              columns={kanbanColumns}
              onItemClick={setSelectedItem}
              onItemMove={handleItemMove}
              renderItem={renderKanbanItem}
              renderActions={(task) => (
                <ItemActionButtons
                  variant="overlay"
                  onEdit={() => setModalState({ open: true, mode: "edit", item: task })}
                  onDuplicate={() => duplicate.mutate(task)}
                  onDelete={() => setModalState({ open: true, mode: "delete", item: task })}
                />
              )}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView
              items={tasks}
              onItemClick={setSelectedItem}
              getItemDate={(item) => item.dueDate}
              getItemTitle={(item) => item.title}
              renderActions={(task) => (
                <ItemActionButtons
                  variant="overlay"
                  onEdit={() => setModalState({ open: true, mode: "edit", item: task })}
                  onDuplicate={() => duplicate.mutate(task)}
                  onDelete={() => setModalState({ open: true, mode: "delete", item: task })}
                />
              )}
            />
          )}
        </div>
      </main>

      {selectedItem && "dueDate" in selectedItem && (
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
        itemType="task"
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
