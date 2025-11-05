"use client"

import { useState, useMemo } from "react"
import { useContacts } from "@/hooks/use-items"
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
import { CRMContact } from "@/types"
import { format } from "date-fns"
import { useItemMutations } from "@/hooks/use-items"

const statusColors = {
  Lead: "bg-blue-500",
  Prospect: "bg-yellow-500",
  Client: "bg-green-500",
  Uncategorized: "bg-gray-500",
  Lost: "bg-red-500",
}

export default function CRMPage() {
  const [currentView, setCurrentView] = useState<"table" | "kanban" | "calendar">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)
  const { data: contactsData, isLoading } = useContacts({ search: debouncedSearch })
  const [selectedItem, setSelectedItem] = useState<CRMContact | null>(null)
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: "create" | "edit" | "delete"
    item: CRMContact | null
  }>({ open: false, mode: "create", item: null })
  const { create, update, duplicate, remove } = useItemMutations("contact")

  const crmContacts = contactsData?.data || []

  const handleItemMove = (itemId: string, fromColumn: string, toColumn: string) => {
    update.mutate({
      id: itemId,
      data: { status: toColumn as CRMContact["status"] }
    })
  }

  const columns: ColumnDef<CRMContact>[] = [
    {
      accessorKey: "contact",
      header: "Name",
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
    },
    {
      accessorKey: "dealValue",
      header: "Deal Value",
      cell: ({ row }) => `$${(row.original.dealValue ?? 0).toLocaleString()}`,
    },
    {
      accessorKey: "lastContactDate",
      header: "Last Contact",
      cell: ({ row }) => row.original.lastContactDate ? format(row.original.lastContactDate, "MMM d, yyyy") : "-",
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => row.original.website ? (
        <a href={row.original.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
          Link
        </a>
      ) : "-",
    },
    {
      accessorKey: "linkedin",
      header: "LinkedIn",
      cell: ({ row }) => row.original.linkedin ? (
        <a href={row.original.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
          Profile
        </a>
      ) : "-",
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
      id: "Uncategorized",
      title: "Uncategorized",
      items: crmContacts.filter((c) => c.status === "Uncategorized"),
    },
    {
      id: "Lead",
      title: "Leads",
      items: crmContacts.filter((c) => c.status === "Lead"),
    },
    {
      id: "Prospect",
      title: "Prospects",
      items: crmContacts.filter((c) => c.status === "Prospect"),
    },
    {
      id: "Client",
      title: "Clients",
      items: crmContacts.filter((c) => c.status === "Client"),
    },
  ]

  const renderKanbanItem = (contact: CRMContact) => (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{contact.contact}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-xs text-muted-foreground">{contact.company}</p>
        <p className="text-xs font-medium">${(contact.dealValue ?? 0).toLocaleString()}</p>
      </CardContent>
    </>
  )

  return (
    <>
      <section className="shrink-0 bg-background border-b px-6 py-6 space-y-4">
        <h1 className="text-3xl font-bold">CRM</h1>
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
              data={crmContacts}
              onRowClick={setSelectedItem}
            />
          )}

          {currentView === "kanban" && (
            <KanbanView
              columns={kanbanColumns}
              onItemClick={setSelectedItem}
              onItemMove={handleItemMove}
              renderItem={renderKanbanItem}
              renderActions={(contact) => (
                <ItemActionButtons
                  variant="overlay"
                  onEdit={() => setModalState({ open: true, mode: "edit", item: contact })}
                  onDuplicate={() => duplicate.mutate(contact)}
                  onDelete={() => setModalState({ open: true, mode: "delete", item: contact })}
                />
              )}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView
              items={crmContacts}
              onItemClick={setSelectedItem}
              getItemDate={(item) => item.lastContact}
              getItemTitle={(item) => item.contact}
              renderActions={(contact) => (
                <ItemActionButtons
                  variant="overlay"
                  onEdit={() => setModalState({ open: true, mode: "edit", item: contact })}
                  onDuplicate={() => duplicate.mutate(contact)}
                  onDelete={() => setModalState({ open: true, mode: "delete", item: contact })}
                />
              )}
            />
          )}
        </div>
      </main>

      {selectedItem && "email" in selectedItem && (
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
        itemType="contact"
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
