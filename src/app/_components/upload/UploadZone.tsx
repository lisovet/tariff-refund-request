'use client'

import { useCallback, useId, useRef, useState, type ReactElement } from 'react'
import {
  ACCEPTED_CONTENT_TYPES,
  MAX_UPLOAD_BYTES,
  isAcceptedContentType,
} from '@contexts/recovery'
import {
  defaultHashFile,
  defaultPutToBucket,
  type UploadDeps,
  type UploadProgress,
  type UploadResult,
  type UploadedDocument,
  uploadFile,
} from './upload-client'

/**
 * Reusable upload component for the recovery workspace per PRD 02 +
 * task #46.
 *
 *   - Drag-drop zone OR browse button (hidden file input).
 *   - Per-file preview row: filename + size in mono, status pill,
 *     accent-colored slim progress bar.
 *   - Pre-validates content type + size before any network call so
 *     the user sees the rejection immediately.
 *   - Retry button on failure.
 *   - Restraint per design language: no progress confetti, no
 *     pop animations, no big colored badges.
 *
 * The heavy lifting (hash + prepare + PUT + complete) lives in
 * `upload-client.ts`; this component is the React surface plus a
 * little drag-drop state.
 */

interface QueueEntry {
  readonly id: string
  readonly file: File
  status: 'pending' | 'uploading' | 'completed' | 'duplicate' | 'failed'
  fraction: number
  error?: string
  document?: UploadedDocument
}

export interface UploadZoneProps {
  readonly caseId: string
  readonly onUploaded?: (doc: UploadedDocument) => void
  /** For tests — inject deps so we can stub fetch + hash + PUT. */
  readonly client?: Partial<UploadDeps>
  readonly className?: string
}

export function UploadZone({
  caseId,
  onUploaded,
  client,
  className,
}: UploadZoneProps): ReactElement {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const deps: UploadDeps = {
    fetchFn: client?.fetchFn ?? ((url, init) => fetch(url, init)),
    hashFile: client?.hashFile ?? defaultHashFile,
    putToBucket: client?.putToBucket ?? defaultPutToBucket,
  }

  const startUpload = useCallback(
    async (entry: QueueEntry): Promise<void> => {
      const onProgress = (event: UploadProgress) => {
        setQueue((q) =>
          q.map((row) =>
            row.id === entry.id
              ? {
                  ...row,
                  status:
                    event.stage === 'failed'
                      ? 'failed'
                      : event.stage === 'completed'
                        ? row.status
                        : 'uploading',
                  fraction: event.fraction ?? row.fraction,
                  error: event.stage === 'failed' ? event.error : undefined,
                }
              : row,
          ),
        )
      }

      const result: UploadResult = await uploadFile(
        { caseId, file: entry.file },
        deps,
        onProgress,
      )

      setQueue((q) =>
        q.map((row) => {
          if (row.id !== entry.id) return row
          if (!result.ok) {
            return {
              ...row,
              status: 'failed',
              fraction: 0,
              error: result.error,
            }
          }
          return {
            ...row,
            status: result.outcome === 'duplicate_sha256' ? 'duplicate' : 'completed',
            fraction: 1,
            document: result.document,
          }
        }),
      )

      if (result.ok && onUploaded) onUploaded(result.document)
    },
    // deps changes per render but stable in practice — stub set in tests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseId, onUploaded],
  )

  const acceptFiles = useCallback(
    (files: FileList | File[]): void => {
      const entries: QueueEntry[] = []
      for (const file of Array.from(files)) {
        const id = `${file.name}__${file.size}__${file.lastModified}__${entries.length}`
        const reason = preValidate(file)
        if (reason) {
          entries.push({
            id,
            file,
            status: 'failed',
            fraction: 0,
            error: reason,
          })
        } else {
          entries.push({ id, file, status: 'pending', fraction: 0 })
        }
      }
      setQueue((prev) => [...prev, ...entries])
      for (const entry of entries) {
        if (entry.status === 'pending') void startUpload(entry)
      }
    },
    [startUpload],
  )

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault()
      setIsDragging(false)
      if (event.dataTransfer.files.length > 0) {
        acceptFiles(event.dataTransfer.files)
      }
    },
    [acceptFiles],
  )

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (event.target.files && event.target.files.length > 0) {
        acceptFiles(event.target.files)
      }
      event.target.value = ''
    },
    [acceptFiles],
  )

  const retry = useCallback(
    (entryId: string): void => {
      const entry = queue.find((q) => q.id === entryId)
      if (!entry) return
      setQueue((q) =>
        q.map((row) =>
          row.id === entryId
            ? { ...row, status: 'pending', fraction: 0, error: undefined }
            : row,
        ),
      )
      void startUpload({
        ...entry,
        status: 'pending',
        fraction: 0,
        error: undefined,
      })
    },
    [queue, startUpload],
  )

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className={`bg-paper ${className ?? ''}`.trim()}
    >
      <h3
        id={`${inputId}-heading`}
        className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60"
      >
        Upload documents
      </h3>

      <div
        role="region"
        aria-label="Drop files here or browse"
        data-testid="upload-dropzone"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`mt-4 border border-rule p-10 text-center transition-colors ${
          isDragging ? 'bg-paper-2' : ''
        }`}
      >
        <p className="font-display text-2xl text-ink">
          Drop files here, or{' '}
          <label
            htmlFor={inputId}
            className="cursor-pointer underline decoration-accent decoration-2 underline-offset-4"
          >
            browse
          </label>
          .
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-ink/55">
          PDF · XLSX · XLS · CSV · EML — up to {Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB each
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_CONTENT_TYPES.join(',')}
          onChange={onInputChange}
          className="sr-only"
          data-testid="upload-input"
        />
      </div>

      {queue.length > 0 && (
        <ol
          aria-label="Upload queue"
          data-testid="upload-queue"
          className="mt-6 divide-y divide-rule border-y border-rule"
        >
          {queue.map((entry) => (
            <li
              key={entry.id}
              data-testid="upload-row"
              data-status={entry.status}
              className="grid grid-cols-[1fr_auto] items-center gap-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-ink">
                  {entry.file.name}
                </p>
                <p className="font-mono text-xs text-ink/55">
                  {formatBytes(entry.file.size)}
                  {entry.error ? ` · ${entry.error}` : ''}
                </p>
                {entry.status === 'uploading' && (
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(entry.fraction * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mt-2 h-px bg-rule"
                  >
                    <div
                      className="h-full bg-accent transition-[width]"
                      style={{ width: `${Math.round(entry.fraction * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em]">
                <span data-testid="upload-status">{statusLabel(entry.status)}</span>
                {entry.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => retry(entry.id)}
                    className="underline decoration-accent decoration-2 underline-offset-4"
                  >
                    Retry
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function preValidate(file: File): string | undefined {
  if (!isAcceptedContentType(file.type)) return 'content_type_unsupported'
  if (file.size <= 0) return 'byte_size_invalid'
  if (file.size > MAX_UPLOAD_BYTES) return 'byte_size_too_large'
  return undefined
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function statusLabel(status: QueueEntry['status']): string {
  switch (status) {
    case 'pending':
      return 'Queued'
    case 'uploading':
      return 'Uploading'
    case 'completed':
      return 'Uploaded'
    case 'duplicate':
      return 'Duplicate'
    case 'failed':
      return 'Failed'
  }
}
