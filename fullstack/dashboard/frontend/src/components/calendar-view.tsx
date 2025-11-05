"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { format, isSameDay } from "date-fns"

interface CalendarViewProps {
  items: any[]
  onItemClick: (item: any) => void
  getItemDate: (item: any) => Date
  getItemTitle: (item: any) => string
  renderActions?: (item: any) => React.ReactNode
}

export function CalendarView({ items, onItemClick, getItemDate, getItemTitle, renderActions }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)

  const itemsOnDate = items.filter((item) =>
    selectedDate && isSameDay(getItemDate(item), selectedDate)
  )

  const datesWithItems = items.map((item) => getItemDate(item))

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Date</CardTitle>
          <p className="text-xs text-muted-foreground">Dates with items are highlighted</p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasItems: datesWithItems,
            }}
            modifiersClassNames={{
              hasItems: "relative font-bold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
            </CardTitle>
            {itemsOnDate.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {itemsOnDate.length} {itemsOnDate.length === 1 ? "item" : "items"} scheduled
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-base">
            {itemsOnDate.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {itemsOnDate.length > 0 ? (
              <div className="space-y-3">
                {itemsOnDate.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors relative"
                    onClick={() => onItemClick(item)}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{getItemTitle(item)}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                      {item.company && (
                        <p className="text-sm text-muted-foreground">{item.company}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {item.status && (
                          <Badge variant="secondary" className="text-xs">
                            {item.status}
                          </Badge>
                        )}
                        {item.priority && (
                          <Badge
                            variant={item.priority === "high" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {renderActions && hoveredItemId === item.id && (
                      <div className="absolute top-2 right-2 bg-background/95 rounded-md shadow-sm backdrop-blur-sm">
                        {renderActions(item)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-lg font-medium text-muted-foreground">No items scheduled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a date with a dot indicator to view items
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
