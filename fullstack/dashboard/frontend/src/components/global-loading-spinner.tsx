"use client"

import { useGlobalLoading } from "@/hooks/use-global-loading"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { Z_INDEX } from "@/lib/z-index"

export function GlobalLoadingSpinner() {
  const isLoading = useGlobalLoading()

  useEffect(() => {
    if (!isLoading) return

    const blockEvent = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    }

    const events = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup', 'submit']

    events.forEach(event => {
      document.addEventListener(event, blockEvent, { capture: true, passive: false })
    })

    document.body.style.pointerEvents = 'none'
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'wait'

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, blockEvent, { capture: true })
      })
      document.body.style.pointerEvents = ''
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      style={{ pointerEvents: 'all', cursor: 'wait', zIndex: Z_INDEX.TOAST }}
    >
      <Loader2 className="size-12 animate-spin text-primary" />
    </div>
  )
}
