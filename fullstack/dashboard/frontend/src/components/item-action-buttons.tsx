import { Pencil, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ItemActionButtonsProps {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  variant?: "table" | "overlay"
}

export function ItemActionButtons({
  onEdit,
  onDuplicate,
  onDelete,
  variant = "table",
}: ItemActionButtonsProps) {
  const size = variant === "overlay" ? "sm" : "sm"
  const className = variant === "overlay" ? "h-7 w-7" : "h-8 w-8"

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className={className}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        )}
        {onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className={className}
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate()
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className={className}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
