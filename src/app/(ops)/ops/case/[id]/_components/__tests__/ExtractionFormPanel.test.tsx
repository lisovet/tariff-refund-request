// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtractionFormPanel } from '../ExtractionFormPanel'

describe('ExtractionFormPanel', () => {
  it('renders the v1 entry-extraction fields', () => {
    render(<ExtractionFormPanel caseId="cas_x" />)
    expect(screen.getByTestId('extraction-field-entry-number')).toBeInTheDocument()
    expect(screen.getByTestId('extraction-field-entry-date')).toBeInTheDocument()
    expect(screen.getByTestId('extraction-field-ior')).toBeInTheDocument()
    expect(screen.getByTestId('extraction-field-duty')).toBeInTheDocument()
    expect(screen.getByTestId('extraction-field-hts')).toBeInTheDocument()
  })

  it('binds the case id into a visible label', () => {
    render(<ExtractionFormPanel caseId="cas_xyz_42" />)
    expect(screen.getByTestId('extraction-case-id').textContent).toBe('cas_xyz_42')
  })

  it('save button calls onSave with the current draft', async () => {
    const onSave = vi.fn(async () => {})
    render(<ExtractionFormPanel caseId="cas_x" onSave={onSave} />)

    fireEvent.change(screen.getByTestId('extraction-field-entry-number'), {
      target: { value: 'EI-2024-12345' },
    })
    fireEvent.change(screen.getByTestId('extraction-field-duty'), {
      target: { value: '250000' },
    })
    fireEvent.click(screen.getByTestId('extraction-save'))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        entryNumber: 'EI-2024-12345',
        dutyAmountUsdCents: '250000',
      }),
    )
  })

  it('shows the saved-at indicator after a successful onSave', async () => {
    render(<ExtractionFormPanel caseId="cas_x" onSave={async () => {}} />)
    fireEvent.click(screen.getByTestId('extraction-save'))
    await waitFor(() =>
      expect(screen.getByTestId('extraction-saved-at')).toBeInTheDocument(),
    )
  })

  it('shows an error when no recoverySourceId is supplied and onSave is undefined', async () => {
    render(<ExtractionFormPanel caseId="cas_x" />)
    fireEvent.click(screen.getByTestId('extraction-save'))
    await waitFor(() => {
      const err = screen.getByTestId('extraction-error')
      expect(err.textContent).toMatch(/no source document selected/i)
    })
  })

  it('initial values seed the form', () => {
    render(
      <ExtractionFormPanel
        caseId="cas_x"
        initial={{ entryNumber: 'EI-PREVIOUSLY-SAVED' }}
      />,
    )
    const input = screen.getByTestId('extraction-field-entry-number') as HTMLInputElement
    expect(input.value).toBe('EI-PREVIOUSLY-SAVED')
  })
})
