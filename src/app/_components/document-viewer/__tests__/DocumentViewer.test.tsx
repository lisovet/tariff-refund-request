// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DocumentViewer } from '../DocumentViewer'
import type { PdfDocumentHandle, PdfLoader } from '../pdf-loader'

function makeLoader(numPages = 5): {
  loader: PdfLoader
  renderCalls: Array<{ page: number; scale: number }>
} {
  const renderCalls: Array<{ page: number; scale: number }> = []
  const handle: PdfDocumentHandle = {
    numPages,
    async renderPageToCanvas(canvas, pageNumber, scale) {
      renderCalls.push({ page: pageNumber, scale })
      // Simulate dimensions for the rendered canvas.
      canvas.width = Math.round(800 * scale)
      canvas.height = Math.round(1000 * scale)
    },
    destroy() {},
  }
  return {
    renderCalls,
    loader: {
      load: vi.fn(async (_src: string) => handle),
    },
  }
}

describe('DocumentViewer — render', () => {
  it('shows a loading state, then renders page 1 of N', async () => {
    const { loader, renderCalls } = makeLoader(5)
    render(<DocumentViewer src="https://r2/cases/x/y/z.pdf" loader={loader} />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 5')
    })
    expect(renderCalls.at(-1)).toEqual({ page: 1, scale: 1 })
  })

  it('surfaces a friendly error if the loader throws', async () => {
    const loader: PdfLoader = {
      load: vi.fn(async () => {
        throw new Error('worker missing')
      }),
    }
    render(<DocumentViewer src="https://r2/cases/x/y/z.pdf" loader={loader} />)
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/couldn[’']?t load/i)
    })
  })
})

describe('DocumentViewer — page navigation', () => {
  it('next + previous buttons advance / retreat by one page', async () => {
    const { loader } = makeLoader(3)
    render(<DocumentViewer src="x" loader={loader} />)

    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 3'),
    )

    fireEvent.click(screen.getByRole('button', { name: /next page/i }))
    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('2 / 3'),
    )

    fireEvent.click(screen.getByRole('button', { name: /previous page/i }))
    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 3'),
    )
  })

  it('disables previous on page 1 and next on the last page', async () => {
    const { loader } = makeLoader(2)
    render(<DocumentViewer src="x" loader={loader} />)

    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 2'),
    )

    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /next page/i }))
    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('2 / 2'),
    )
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('arrow keys advance / retreat page when the viewer has focus', async () => {
    const { loader } = makeLoader(3)
    render(<DocumentViewer src="x" loader={loader} />)

    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 3'),
    )

    const region = screen.getByRole('region', { name: /^document$/i })
    region.focus()
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('2 / 3'),
    )
    fireEvent.keyDown(region, { key: 'ArrowLeft' })
    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 3'),
    )
  })
})

describe('DocumentViewer — zoom', () => {
  it('zoom-in / zoom-out adjust the render scale and re-render the current page', async () => {
    const { loader, renderCalls } = makeLoader(3)
    render(<DocumentViewer src="x" loader={loader} />)

    // Wait for BOTH the page indicator AND the first render call —
    // rendering happens in a useEffect that fires after the state
    // update that flips the indicator, so we can't assume both have
    // landed together.
    await waitFor(() => {
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 3')
      expect(renderCalls.length).toBeGreaterThan(0)
    })
    const initialCallCount = renderCalls.length
    expect(renderCalls.at(-1)?.scale).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }))
    await waitFor(() => expect(renderCalls.length).toBeGreaterThan(initialCallCount))
    expect(renderCalls.at(-1)?.scale).toBeGreaterThan(1)

    const afterZoomIn = renderCalls.length
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }))
    await waitFor(() => expect(renderCalls.length).toBeGreaterThan(afterZoomIn))
    expect(renderCalls.at(-1)?.scale).toBeCloseTo(1, 3)
  })

  it('clamps zoom between MIN and MAX', async () => {
    const { loader, renderCalls } = makeLoader(1)
    render(<DocumentViewer src="x" loader={loader} initialScale={0.25} />)

    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 1'),
    )

    // Hit min.
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }))
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }))
    await waitFor(() => {
      const last = renderCalls.at(-1)
      expect(last?.scale).toBeGreaterThanOrEqual(0.25)
    })
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeDisabled()

    // Hit max.
    for (let i = 0; i < 20; i++) {
      const btn = screen.getByRole('button', { name: /zoom in/i }) as HTMLButtonElement
      if (btn.disabled) break
      fireEvent.click(btn)
    }
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeDisabled()
  })
})

describe('DocumentViewer — accessibility', () => {
  it('announces the page indicator via an aria-live region', async () => {
    const { loader } = makeLoader(3)
    render(<DocumentViewer src="x" loader={loader} />)
    await waitFor(() =>
      expect(screen.getByTestId('page-indicator').textContent).toBe('1 / 3'),
    )
    const indicator = screen.getByTestId('page-indicator')
    expect(indicator.getAttribute('aria-live')).toBe('polite')
  })
})
