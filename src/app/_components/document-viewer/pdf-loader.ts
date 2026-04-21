/**
 * pdf-loader — narrow surface around pdfjs-dist so the DocumentViewer
 * component is testable without a real PDF runtime.
 *
 * Tests pass a fake PdfLoader; production wires the real one via
 * createPdfjsLoader(), which lazy-imports pdfjs-dist so the worker
 * setup only happens in the browser.
 */

export interface PdfDocumentHandle {
  readonly numPages: number
  renderPageToCanvas(
    canvas: HTMLCanvasElement,
    pageNumber: number,
    scale: number,
  ): Promise<void>
  destroy(): void
}

export interface PdfLoader {
  load(src: string): Promise<PdfDocumentHandle>
}

/**
 * Real pdfjs-dist loader. Lazy-imports the lib + sets up the worker
 * URL on first use; the worker is hosted at /pdf-worker (a static
 * file copied into public/ at deploy time — see TODO below).
 *
 * TODO(human-action): copy node_modules/pdfjs-dist/build/pdf.worker.min.mjs
 * into public/pdf-worker.mjs as part of the build (or wire a postinstall
 * script). v1 ships without the worker so the viewer falls back to a
 * "couldn't load" state — fine for the ops console because it doesn't
 * exist yet (lands in #82). Once the worker is in place, this loader
 * just works.
 */
export function createPdfjsLoader(): PdfLoader {
  return {
    async load(src) {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker.mjs'
      const loadingTask = pdfjs.getDocument({ url: src })
      const pdf = await loadingTask.promise
      return {
        numPages: pdf.numPages,
        async renderPageToCanvas(canvas, pageNumber, scale) {
          const page = await pdf.getPage(pageNumber)
          const viewport = page.getViewport({ scale })
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const context = canvas.getContext('2d')
          if (!context) throw new Error('canvas 2d context unavailable')
          await page.render({ canvasContext: context, viewport }).promise
        },
        destroy() {
          void pdf.destroy()
        },
      }
    },
  }
}
