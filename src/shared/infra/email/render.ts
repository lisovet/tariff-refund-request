import { render } from '@react-email/render'

/**
 * Render a React Email element to HTML + plaintext.
 * Per ADR 012: every template ships both variants — HTML for inboxes
 * that render rich, text for those that don't (and screen readers).
 */

export interface RenderedEmail {
  readonly html: string
  readonly text: string
}

export async function renderEmail(node: React.ReactElement): Promise<RenderedEmail> {
  const html = await render(node)
  const text = await render(node, { plainText: true })
  return { html, text }
}
