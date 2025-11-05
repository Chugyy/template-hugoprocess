"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useTranscription } from "@/hooks/use-items"

interface TranscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  exchangeId: string
}

export function TranscriptionModal({ open, onOpenChange, contactId, exchangeId }: TranscriptionModalProps) {
  const [mode, setMode] = useState<'api' | 'local'>('api')
  const { status, progress, startTranscription, cancelTranscription, isTranscribing } = useTranscription(contactId, exchangeId)

  const handleStart = () => {
    startTranscription({ mode })
  }

  const handleCancel = () => {
    cancelTranscription()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transcribe Audio</DialogTitle>
        </DialogHeader>

        {!isTranscribing && status !== 'completed' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose transcription method:</p>
            <div className="flex gap-2">
              <Button
                variant={mode === 'api' ? 'default' : 'outline'}
                onClick={() => setMode('api')}
              >
                Cloud API (Fast)
              </Button>
              <Button
                variant={mode === 'local' ? 'default' : 'outline'}
                onClick={() => setMode('local')}
              >
                Local Whisper (Private)
              </Button>
            </div>
            <Button onClick={handleStart} className="w-full">Start Transcription</Button>
          </div>
        )}

        {isTranscribing && (
          <div className="space-y-4">
            <p className="text-sm">Transcribing audio...</p>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
            <Button onClick={handleCancel} variant="outline" className="w-full">Cancel</Button>
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-4">
            <p className="text-sm text-green-600">✅ Transcription completed!</p>
            <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-red-600">❌ Transcription failed</p>
            <Button onClick={() => setMode('api')} variant="outline" className="w-full">Retry</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
