import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Search, Table, LayoutGrid, Calendar, Plus } from "lucide-react"
import type { ViewType } from "@/types"

interface ViewHeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateClick?: () => void
}

export function ViewHeader({ currentView, onViewChange, searchQuery, onSearchChange, onCreateClick }: ViewHeaderProps) {
  const viewButtons = [
    { view: "table" as ViewType, icon: Table, label: "Table" },
    { view: "kanban" as ViewType, icon: LayoutGrid, label: "Kanban" },
    { view: "calendar" as ViewType, icon: Calendar, label: "Calendar" },
  ]

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {viewButtons.map(({ view, icon: Icon, label }) => (
            <Button
              key={view}
              variant={currentView === view ? "default" : "ghost"}
              size="icon"
              onClick={() => onViewChange(view)}
              title={label}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
        {onCreateClick && <Separator orientation="vertical" className="h-6" />}
        {onCreateClick && (
          <Button onClick={onCreateClick} size="icon" variant="ghost" title="Create">
            <Plus className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
