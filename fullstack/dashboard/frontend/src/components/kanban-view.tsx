"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverEvent, useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"

interface KanbanColumn {
  id: string
  title: string
  items: any[]
}

interface KanbanViewProps {
  columns: KanbanColumn[]
  onItemClick: (item: any) => void
  onItemMove: (itemId: string, fromColumn: string, toColumn: string) => void
  renderItem: (item: any) => React.ReactNode
  renderActions?: (item: any) => React.ReactNode
}

function SortableCard({
  item,
  renderItem,
  onItemClick,
  renderActions
}: {
  item: any
  renderItem: (item: any) => React.ReactNode
  onItemClick: (item: any) => void
  renderActions?: (item: any) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [isHovered, setIsHovered] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md mb-2 relative"
      onClick={() => onItemClick(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderItem(item)}
      {renderActions && isHovered && (
        <div className="absolute top-2 right-2 bg-background/95 rounded-md shadow-sm backdrop-blur-sm">
          {renderActions(item)}
        </div>
      )}
    </Card>
  )
}

function DroppableColumn({ column, children }: { column: KanbanColumn; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 w-[320px] flex-shrink-0 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{column.title}</h3>
        <Badge variant="secondary">{column.items.length}</Badge>
      </div>
      {children}
    </div>
  )
}

export function KanbanView({ columns, onItemClick, onItemMove, renderItem, renderActions }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    let fromColumn = ""
    let toColumn = overId

    columns.forEach((col) => {
      if (col.items.find((item) => item.id === activeId)) {
        fromColumn = col.id
      }
      const itemInColumn = col.items.find((item) => item.id === overId)
      if (itemInColumn) {
        toColumn = col.id
      }
    })

    if (fromColumn && toColumn && fromColumn !== toColumn) {
      onItemMove(activeId, fromColumn, toColumn)
    }
  }

  const activeItem = columns.flatMap((col) => col.items).find((item) => item.id === activeId)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto">
        <div className="flex gap-4 pb-4 min-w-min">
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column}>
              <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="pr-4 min-h-[100px]">
                    {column.items.map((item) => (
                      <SortableCard key={item.id} item={item} renderItem={renderItem} onItemClick={onItemClick} renderActions={renderActions} />
                    ))}
                    {column.items.length === 0 && (
                      <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                        Drop items here
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>
      </div>
      <DragOverlay>{activeItem ? <Card className="rotate-3 cursor-grabbing opacity-90 w-[320px]">{renderItem(activeItem)}</Card> : null}</DragOverlay>
    </DndContext>
  )
}
