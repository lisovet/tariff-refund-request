import type { RenderedOutreachKit } from '@contexts/recovery'
import { CopyButton } from './CopyButton'

/**
 * Center pane: the outreach kit. One large copy-to-clipboard email
 * template per PRD 02 — sender expectations, subject, body,
 * attachments-needed list. Rendered as static text so the customer
 * can see the exact wording before they send it.
 */

export interface OutreachKitPanelProps {
  readonly kit: RenderedOutreachKit
  readonly attachmentsNeeded: readonly string[]
}

export function OutreachKitPanel({
  kit,
  attachmentsNeeded,
}: OutreachKitPanelProps) {
  const fullEmail = `Subject: ${kit.subject}\n\n${kit.body}`

  return (
    <section
      aria-label="Outreach kit"
      className="border-r border-rule p-6 sm:p-8"
    >
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
            Outreach kit
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Send this to the records source for your case
          </h2>
        </div>
        <CopyButton text={fullEmail} label="Copy email" />
      </header>

      <div className="mt-8 border border-rule p-6">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 font-mono text-sm">
          <dt className="text-ink/55">Subject</dt>
          <dd
            className="text-ink"
            data-testid="email-subject"
          >
            {kit.subject}
          </dd>
        </dl>
        <pre
          data-testid="email-body"
          className="mt-6 whitespace-pre-wrap font-sans text-base leading-relaxed text-ink/85"
        >
{kit.body}
        </pre>
      </div>

      {attachmentsNeeded.length > 0 && (
        <div className="mt-10">
          <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
            Attachments to ask for
          </h3>
          <ul
            aria-label="Attachments to request"
            className="mt-4 list-none space-y-2"
          >
            {attachmentsNeeded.map((label) => (
              <li
                key={label}
                className="flex items-baseline gap-3 text-sm text-ink/85"
              >
                <span aria-hidden="true" className="font-mono text-accent">
                  →
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 max-w-prose text-sm text-ink/65">
        Edit the wording before you send if you want — these are starting
        points, not legal requirements. The placeholders are filled with
        what we know about your case; replace anything that&rsquo;s wrong.
      </p>

      <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-ink/45">
        Template version {kit.version}
      </p>
    </section>
  )
}

