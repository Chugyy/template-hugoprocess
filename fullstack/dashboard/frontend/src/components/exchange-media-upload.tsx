"use client"

import { useState } from "react"
import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import {
  formatBytes,
  useFileUpload,
  type FileWithPreview,
} from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"


const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  const iconMap = {
    pdf: {
      icon: FileTextIcon,
      conditions: (type: string, name: string) =>
        type.includes("pdf") ||
        name.endsWith(".pdf") ||
        type.includes("word") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx"),
    },
    archive: {
      icon: FileArchiveIcon,
      conditions: (type: string, name: string) =>
        type.includes("zip") ||
        type.includes("archive") ||
        name.endsWith(".zip") ||
        name.endsWith(".rar"),
    },
    excel: {
      icon: FileSpreadsheetIcon,
      conditions: (type: string, name: string) =>
        type.includes("excel") ||
        name.endsWith(".xls") ||
        name.endsWith(".xlsx"),
    },
    video: {
      icon: VideoIcon,
      conditions: (type: string) => type.includes("video/"),
    },
    audio: {
      icon: HeadphonesIcon,
      conditions: (type: string) => type.includes("audio/"),
    },
    image: {
      icon: ImageIcon,
      conditions: (type: string) => type.startsWith("image/"),
    },
  }

  for (const { icon: Icon, conditions } of Object.values(iconMap)) {
    if (conditions(fileType, fileName)) {
      return <Icon className="size-5 opacity-60" />
    }
  }

  return <FileIcon className="size-5 opacity-60" />
}

const getFilePreview = (file: {
  file: File | { type: string; name: string; url?: string }
}) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  const renderImage = (src: string) => (
    <img
      src={src}
      alt={fileName}
      className="size-full rounded-t-[inherit] object-cover"
    />
  )

  return (
    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-t-[inherit] bg-accent">
      {fileType.startsWith("image/") ? (
        file.file instanceof File ? (
          (() => {
            const previewUrl = URL.createObjectURL(file.file)
            return renderImage(previewUrl)
          })()
        ) : file.file.url ? (
          renderImage(file.file.url)
        ) : (
          <ImageIcon className="size-5 opacity-60" />
        )
      ) : (
        getFileIcon(file)
      )}
    </div>
  )
}

// Type for tracking upload progress
type UploadProgress = {
  fileId: string
  progress: number
  completed: boolean
}

// Function to simulate file upload with more realistic timing and progress
const simulateUpload = (
  totalBytes: number,
  onProgress: (progress: number) => void,
  onComplete: () => void
) => {
  let timeoutId: NodeJS.Timeout
  let uploadedBytes = 0
  let lastProgressReport = 0

  const simulateChunk = () => {
    // Simulate variable network conditions with random chunk sizes
    const chunkSize = Math.floor(Math.random() * 300000) + 2000
    uploadedBytes = Math.min(totalBytes, uploadedBytes + chunkSize)

    // Calculate progress percentage (0-100)
    const progressPercent = Math.floor((uploadedBytes / totalBytes) * 100)

    // Only report progress if it's changed by at least 1%
    if (progressPercent > lastProgressReport) {
      lastProgressReport = progressPercent
      onProgress(progressPercent)
    }

    // Continue simulation if not complete
    if (uploadedBytes < totalBytes) {
      // Variable delay between 50ms and 500ms to simulate network fluctuations (reduced for faster uploads)
      const delay = Math.floor(Math.random() * 450) + 50

      // Occasionally add a longer pause to simulate network congestion (5% chance, shorter duration)
      const extraDelay = Math.random() < 0.05 ? 500 : 0

      timeoutId = setTimeout(simulateChunk, delay + extraDelay)
    } else {
      // Upload complete
      onComplete()
    }
  }

  // Start the simulation
  timeoutId = setTimeout(simulateChunk, 100)

  // Return a cleanup function to cancel the simulation
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

interface ExchangeMediaUploadProps {
  onFileUploaded?: (file: { name: string; size: number; type: string; url: string; duration?: number }) => void
  onFileRemoved?: () => void
  initialFile?: { name: string; size: number; type: string; url: string }
  disabled?: boolean
}

export default function ExchangeMediaUpload({
  onFileUploaded,
  onFileRemoved,
  initialFile,
  disabled = false
}: ExchangeMediaUploadProps) {
  const maxSizeMB = 50
  const maxSize = maxSizeMB * 1024 * 1024 // 50MB
  const maxFiles = 1

  // State to track upload progress for each file
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  // Function to handle newly added files
  const handleFilesAdded = async (addedFiles: FileWithPreview[]) => {
    if (addedFiles.length === 0) return

    const file = addedFiles[0]
    const fileObj = file.file instanceof File ? file.file : null

    if (!fileObj) return

    // Initialize progress tracking
    setUploadProgress([{
      fileId: file.id,
      progress: 0,
      completed: false,
    }])

    try {
      // Real upload via API
      const { uploadAudio } = await import("@/lib/api")
      const { toast } = await import("sonner")

      // Track progress (simulate for now since fetch doesn't support progress natively)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((item) =>
            item.fileId === file.id && item.progress < 90
              ? { ...item, progress: item.progress + 10 }
              : item
          )
        )
      }, 200)

      const result = await uploadAudio(fileObj)

      clearInterval(progressInterval)

      // Complete progress
      setUploadProgress((prev) =>
        prev.map((item) =>
          item.fileId === file.id ? { ...item, progress: 100, completed: true } : item
        )
      )

      // Call callback
      onFileUploaded?.({
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type,
        url: result.url,
      })

      toast.success('Media uploaded successfully')
    } catch (error) {
      setUploadProgress([])
      const { toast } = await import("sonner")
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  // Remove the progress tracking for the file
  const handleFileRemoved = (fileId: string) => {
    setUploadProgress((prev) => prev.filter((item) => item.fileId !== fileId))
    onFileRemoved?.()
  }

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: false,
    maxFiles,
    maxSize,
    accept: "audio/*,video/*",
    initialFiles: initialFile ? [{ ...initialFile, id: initialFile.url }] : [],
    onFilesAdded: handleFilesAdded,
  })

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        data-disabled={disabled || undefined}
        className="relative flex min-h-32 flex-col items-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload media file"
          disabled={disabled}
        />
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                Media File
              </h3>
            </div>

            <div className="w-full space-y-2">
              {files.map((file) => {
                // Find the upload progress for this file once to avoid repeated lookups
                const fileProgress = uploadProgress.find(
                  (p) => p.fileId === file.id
                )
                const isUploading = fileProgress && !fileProgress.completed

                return (
                  <div
                    key={file.id}
                    data-uploading={isUploading || undefined}
                    className="flex flex-col gap-1 rounded-lg border bg-background p-2 pe-3 transition-opacity duration-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 overflow-hidden in-data-[uploading=true]:opacity-50">
                        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="truncate text-[13px] font-medium">
                            {file.file instanceof File
                              ? file.file.name
                              : file.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(
                              file.file instanceof File
                                ? file.file.size
                                : file.file.size
                            )}
                          </p>
                        </div>
                      </div>
                      {!disabled && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                          onClick={() => {
                            handleFileRemoved(file.id)
                            removeFile(file.id)
                          }}
                          aria-label="Remove file"
                        >
                          <XIcon className="size-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>

                    {/* Upload progress bar */}
                    {fileProgress &&
                      (() => {
                        const progress = fileProgress.progress || 0
                        const completed = fileProgress.completed || false

                        if (completed) return null

                        return (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="w-10 text-xs text-muted-foreground tabular-nums">
                              {progress}%
                            </span>
                          </div>
                        )
                      })()}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              aria-hidden="true"
            >
              <VideoIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your media file here</p>
            <p className="text-xs text-muted-foreground">
              Audio or Video ∙ Up to {maxSizeMB}MB
            </p>
            <Button variant="outline" className="mt-4" onClick={openFileDialog} disabled={disabled}>
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              Select media
            </Button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  )
}

export { formatBytes, getFileIcon }
