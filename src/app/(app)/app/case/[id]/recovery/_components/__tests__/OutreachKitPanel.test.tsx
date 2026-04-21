// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderOutreachKit } from '@contexts/recovery'
import { OutreachKitPanel } from '../OutreachKitPanel'

const SAMPLE_TOKENS = {
  brokerName: 'Flexport Inc.',
  importerName: 'Acme Imports LLC',
  windowStart: '2024-04-01',
  windowEnd: '2024-12-31',
}

describe('OutreachKitPanel', () => {
  it('renders the rendered subject + body verbatim', () => {
    const kit = renderOutreachKit('broker', SAMPLE_TOKENS)
    render(
      <OutreachKitPanel
        kit={kit}
        attachmentsNeeded={['Broker 7501', 'Broker spreadsheet']}
      />,
    )
    expect(screen.getByTestId('email-subject').textContent).toBe(kit.subject)
    expect(screen.getByTestId('email-body').textContent?.trim()).toBe(
      kit.body.trim(),
    )
  })

  it('renders one attachment row per item in attachmentsNeeded', () => {
    const kit = renderOutreachKit('broker', SAMPLE_TOKENS)
    render(
      <OutreachKitPanel
        kit={kit}
        attachmentsNeeded={['Broker 7501', 'Broker spreadsheet', 'Other']}
      />,
    )
    const list = screen.getByRole('list', { name: /attachments to request/i })
    expect(list.children.length).toBe(3)
  })

  it('shows the template version footer', () => {
    const kit = renderOutreachKit('carrier', SAMPLE_TOKENS)
    render(
      <OutreachKitPanel kit={kit} attachmentsNeeded={['Carrier invoice']} />,
    )
    expect(screen.getByText(/template version v1/i)).toBeInTheDocument()
  })

  it('copy-to-clipboard button writes "Subject: …\\n\\n<body>" to navigator.clipboard', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })
    const kit = renderOutreachKit('broker', SAMPLE_TOKENS)
    render(<OutreachKitPanel kit={kit} attachmentsNeeded={[]} />)

    fireEvent.click(screen.getByTestId('copy-button'))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const firstCall = writeText.mock.calls[0] as unknown[] | undefined
    const arg = String(firstCall?.[0] ?? '')
    expect(arg.startsWith(`Subject: ${kit.subject}`)).toBe(true)
    expect(arg.includes(kit.body)).toBe(true)
  })

  it('copy button shows "Copied" feedback after a successful copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true,
      writable: true,
    })
    const kit = renderOutreachKit('broker', SAMPLE_TOKENS)
    render(<OutreachKitPanel kit={kit} attachmentsNeeded={[]} />)
    fireEvent.click(screen.getByTestId('copy-button'))
    await waitFor(() => {
      expect(screen.getByTestId('copy-button').textContent).toBe('Copied')
    })
  })
})
