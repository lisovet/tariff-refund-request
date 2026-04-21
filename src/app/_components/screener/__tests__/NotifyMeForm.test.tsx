// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NotifyMeForm } from '../NotifyMeForm'

describe('<NotifyMeForm>', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }))) as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('blocks submit without consent and surfaces an inline error', async () => {
    render(<NotifyMeForm sessionId="sess_test" />)
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'a@b.co' },
    })
    fireEvent.click(screen.getByRole('button', { name: /keep me posted/i }))
    await waitFor(() => {
      expect(screen.getByText(/confirm you want to hear/i)).toBeTruthy()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('blocks submit on an invalid email', async () => {
    render(<NotifyMeForm sessionId="sess_test" />)
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.click(screen.getByLabelText(/eligibility rules change/i))
    fireEvent.click(screen.getByRole('button', { name: /keep me posted/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeTruthy()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('POSTs email + sessionId + consent on valid submit and swaps to confirmation', async () => {
    render(<NotifyMeForm sessionId="sess_test" />)
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'founder@acme.test' },
    })
    fireEvent.click(screen.getByLabelText(/eligibility rules change/i))
    fireEvent.click(screen.getByRole('button', { name: /keep me posted/i }))

    await waitFor(() => {
      expect(screen.getByText(/we'll be in touch/i)).toBeTruthy()
    })

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call?.[0]).toBe('/api/screener/notify-me')
    const body = JSON.parse((call?.[1] as RequestInit).body as string)
    expect(body).toEqual({
      sessionId: 'sess_test',
      email: 'founder@acme.test',
      consent: true,
    })
  })

  it('shows an error state when the server returns non-ok', async () => {
    global.fetch = vi.fn(
      async () => new Response('', { status: 500 }),
    ) as typeof fetch
    render(<NotifyMeForm sessionId="sess_test" />)
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'a@b.co' },
    })
    fireEvent.click(screen.getByLabelText(/eligibility rules change/i))
    fireEvent.click(screen.getByRole('button', { name: /keep me posted/i }))
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeTruthy()
    })
  })
})
