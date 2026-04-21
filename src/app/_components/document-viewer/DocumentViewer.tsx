'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react'
import {
  createPdfjsLoader,
  type PdfDocumentHandle,
  type PdfLoader,
} from './pdf-loader'

/**
 * PDF document viewer for the ops side-by-side workflow per PRD 04.
 *
 *   - Page nav (prev / next + arrow keys when the viewer has focus).
 *   - Zoom (in / out, clamped to MIN_SCALE / MAX_SCALE).
 *   - Live page indicator with `aria-live=polite`.
 *
 * The pdf-loader is dependency-injected so tests can stub the runtime
 * (jsdom can't render real PDFs to canvas). Production uses
 * createPdfjsLoader which lazy-imports pdfjs-dist + points the worker
 * at /pdf-worker.mjs (copied into public/ at deploy time).
 *
 * Highlight + copy-to-form interaction (PRD 04, recovery workspace)
 * lands in task #51+; this component is the preview surface only.
 */

export const MIN_SCALE = 0.5
export const MAX_SCALE = 4.0
const SCALE_STEP = 0.25

export interface DocumentViewerProps {
  readonly src: string
  readonly initialScale?: number
  readonly loader?: PdfLoader
  readonly className?: string
}

export function DocumentViewer({
  src,
  initialScale = 1,
  loader,
  className,
}: DocumentViewerProps): ReactElement {
  const headingId = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<PdfDocumentHandle | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(clampScale(initialScale))
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | undefined>(undefined)

  const effectiveLoader = loader ?? defaultLoader()

  // Load the PDF when src changes.
  useEffect(() => {
    let cancelled = false
    let handle: PdfDocumentHandle | undefined
    setStatus('loading')
    setError(undefined)
    effectiveLoader
      .load(src)
      .then((h) => {
        if (cancelled) {
          h.destroy()
          return
        }
        handle = h
        setPdf(h)
        setPage(1)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(String((err as Error)?.message ?? err))
        setStatus('error')
      })
    return () => {
      cancelled = true
      handle?.destroy()
    }
    // effectiveLoader stable per render; the test stub passes a fixed
    // loader, the production createPdfjsLoader is also memoized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Render the current page whenever pdf / page / scale changes.
  useEffect(() => {
    if (status !== 'ready' || !pdf || !canvasRef.current) return
    let cancelled = false
    void pdf
      .renderPageToCanvas(canvasRef.current, page, scale)
      .then(() => {
        if (cancelled) return
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(String((err as Error)?.message ?? err))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [pdf, page, scale, status])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (status !== 'ready' || !pdf) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setPage((p) => Math.min(p + 1, pdf.numPages))
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setPage((p) => Math.max(p - 1, 1))
      }
    },
    [pdf, status],
  )

  const numPages = pdf?.numPages ?? 0
  const canPrev = status === 'ready' && page > 1
  const canNext = status === 'ready' && page < numPages
  const canZoomIn = status === 'ready' && scale + SCALE_STEP <= MAX_SCALE + 0.0001
  const canZoomOut = status === 'ready' && scale - SCALE_STEP >= MIN_SCALE - 0.0001

  return (
    <section
      role="region"
      aria-labelledby={headingId}
      aria-label="Document viewer"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`bg-paper outline-none ${className ?? ''}`.trim()}
    >
      <header className="flex items-center justify-between gap-4 border-b border-rule px-4 py-3">
        <h3
          id={headingId}
          className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60"
        >
          Document
        </h3>
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em]">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={!canPrev}
            aria-label="Previous page"
            className="border border-rule px-2 py-1 disabled:opacity-30"
          >
            ←
          </button>
          <span data-testid="page-indicator" aria-live="polite">
            {status === 'ready' ? `${page} / ${numPages}` : '—'}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, numPages))}
            disabled={!canNext}
            aria-label="Next page"
            className="border border-rule px-2 py-1 disabled:opacity-30"
          >
            →
          </button>
          <span aria-hidden="true" className="text-ink/40">
            ·
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => clampScale(s - SCALE_STEP))}
            disabled={!canZoomOut}
            aria-label="Zoom out"
            className="border border-rule px-2 py-1 disabled:opacity-30"
          >
            −
          </button>
          <span data-testid="zoom-indicator" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => clampScale(s + SCALE_STEP))}
            disabled={!canZoomIn}
            aria-label="Zoom in"
            className="border border-rule px-2 py-1 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </header>

      <div className="relative overflow-auto p-4">
        {status === 'loading' && (
          <p className="font-mono text-sm text-ink/70">Loading document…</p>
        )}
        {status === 'error' && (
          <p role="alert" className="font-mono text-sm text-ink/85">
            Couldn&rsquo;t load the document{error ? ` (${error})` : ''}.
          </p>
        )}
        <canvas
          ref={canvasRef}
          data-testid="pdf-canvas"
          className={`block ${status === 'ready' ? '' : 'sr-only'}`}
        />
      </div>
    </section>
  )
}

function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1
  if (scale < MIN_SCALE) return MIN_SCALE
  if (scale > MAX_SCALE) return MAX_SCALE
  return scale
}

let cachedLoader: PdfLoader | undefined
function defaultLoader(): PdfLoader {
  if (!cachedLoader) cachedLoader = createPdfjsLoader()
  return cachedLoader
}
