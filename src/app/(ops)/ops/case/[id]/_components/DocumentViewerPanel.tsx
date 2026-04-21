'use client'

import { useCallback, useEffect, useState, type KeyboardEvent, type ReactElement } from 'react'
import { DocumentViewer } from '@/app/_components/document-viewer/DocumentViewer'

/**
 * Right pane: PDF document viewer + a small selectable doc list per
 * PRD 04. v1 lists the case's documents and exposes the existing
 * DocumentViewer for the focused doc; signed read URLs land with the
 * full ops console (#82+).
 *
 * Keyboard: j / k step through documents (PRD 04 ops shortcuts —
 * the standard analyst nav). ArrowRight / ArrowLeft inside the
 * viewer page through the focused document.
 */

export interface CaseDocumentSummary {
  readonly id: string
  readonly filename: string
  readonly storageKey: string
  /** Pre-signed read URL for the PDF, valid for the next ~10 minutes. */
  readonly previewUrl?: string
}

export interface DocumentViewerPanelProps {
  readonly documents: readonly CaseDocumentSummary[]
}

export function DocumentViewerPanel({
  documents,
}: DocumentViewerPanelProps): ReactElement {
  const [activeIndex, setActiveIndex] = useState<number>(0)

  // Reset selection when the document list shrinks below the active
  // index (e.g., a doc was archived elsewhere).
  useEffect(() => {
    if (activeIndex >= documents.length) {
      setActiveIndex(documents.length === 0 ? 0 : documents.length - 1)
    }
  }, [activeIndex, documents.length])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (documents.length === 0) return
      if (event.key === 'j') {
        event.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, documents.length - 1))
      } else if (event.key === 'k') {
        event.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
    },
    [documents.length],
  )

  const active = documents[activeIndex]

  return (
    <section
      aria-label="Document viewer"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="grid grid-rows-[auto_1fr_auto] outline-none"
      data-testid="ops-doc-viewer-pane"
    >
      <header className="border-b border-rule p-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
          Documents
        </h2>
      </header>

      {active ? (
        <DocumentViewer
          src={active.previewUrl ?? `/__noop?key=${encodeURIComponent(active.storageKey)}`}
          className="min-h-[420px]"
        />
      ) : (
        <div
          className="flex min-h-[420px] items-center justify-center p-6"
          data-testid="ops-doc-viewer-empty"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
            No documents on this case yet.
          </p>
        </div>
      )}

      <footer className="border-t border-rule">
        <ol
          aria-label="Document list"
          data-testid="ops-doc-list"
          className="divide-y divide-rule"
        >
          {documents.map((doc, i) => (
            <li
              key={doc.id}
              data-testid={`ops-doc-row-${doc.id}`}
              data-active={i === activeIndex}
              className={`flex items-baseline justify-between gap-4 px-4 py-3 font-mono text-xs ${
                i === activeIndex ? 'bg-paper-2' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className="truncate text-left text-ink hover:underline"
              >
                {doc.filename}
              </button>
              <span className="text-ink/45">{i + 1}</span>
            </li>
          ))}
        </ol>
        {documents.length > 0 && (
          <p className="border-t border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
            <kbd>j</kbd> next · <kbd>k</kbd> previous · <kbd>↑↓</kbd> page within doc
          </p>
        )}
      </footer>
    </section>
  )
}
