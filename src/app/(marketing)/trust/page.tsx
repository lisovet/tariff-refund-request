import {
  Eyebrow,
  Footnote,
  FootnoteContent,
  Hairline,
  NOT_A_CUSTOMS_BROKER_CLAUSE,
} from '@/app/_components/ui'

/**
 * /trust — the long-form page PRD 10 calls the "trust posture"
 * internally. Customer-facing copy uses plainer language
 * ("How we handle your data") so the page is legible to a
 * non-legal reader on first visit. Real footnotes (per
 * .claude/rules/disclosure-language-required.md), no banners
 * hiding required text, no collapsed accordions.
 */

export const metadata = {
  title: 'How we handle your data',
  description:
    'What we collect, how long we keep it, and exactly what we will not do with it.',
}

const NON_GOALS: readonly string[] = [
  NOT_A_CUSTOMS_BROKER_CLAUSE,
  'Not a law firm. Nothing here is legal advice.',
  'We do not auto-submit to CBP. You (or your authorized broker) control the filing.',
  'Not a financing product. We do not advance refunds.',
  'Not insurance. We do not indemnify CBP outcomes.',
]

const COLLECTED: ReadonlyArray<{
  readonly category: string
  readonly examples: string
}> = [
  {
    category: 'Identity',
    examples: 'Name, work email, company.',
  },
  {
    category: 'Documents',
    examples:
      '7501 entry summaries, broker spreadsheets, carrier invoices, ACE exports, and supporting correspondence.',
  },
  {
    category: 'Derived data',
    examples:
      'Validated entry records, batches, Readiness Reports, and the case audit log.',
  },
  {
    category: 'Payment metadata',
    examples:
      'Stripe customer + charge identifiers. Card numbers never touch our systems.',
  },
]

const RETENTION: ReadonlyArray<{
  readonly kind: string
  readonly window: string
  readonly note: string
}> = [
  {
    kind: 'Pre-results screener data',
    window: '30 days',
    note: 'Auto-deleted if you do not complete the screener.',
  },
  {
    kind: 'Lead data (post-screener, no purchase)',
    window: '12 months',
    note: 'Then anonymized.',
  },
  {
    kind: 'Customer documents',
    window: '7 years',
    note: 'Aligns with CBP record retention.',
  },
  {
    kind: 'Audit log',
    window: '7 years',
    note: 'Append-only. Never deleted.',
  },
  {
    kind: 'Anonymized aggregate metrics',
    window: 'Indefinite',
    note: 'No PII. Used to improve the platform.',
  },
]

export default function TrustPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-3xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Trust</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          How we handle your data.
        </h1>
        <p className="mt-8 text-lg text-ink/80">
          What we collect, how long we keep it, and what we will
          not do with it — in plain language. Anything that matters
          legally is written as real text, not an accordion.
        </p>
      </header>

      <Hairline />

      {/* Canonical promise */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>The promise</Eyebrow>
          <blockquote className="mt-8 font-display text-3xl leading-snug text-ink sm:text-4xl">
            We help prepare your refund file. We do not guarantee CBP will
            approve it. We do not provide legal advice in this product.
            Every artifact you receive has been reviewed by a real person
            before it reaches you.
          </blockquote>
        </div>
      </section>

      <Hairline label="What we are not" />

      {/* Non-goals */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            What we are not.
          </h2>
          <ul className="mt-8 divide-y divide-rule border-y border-rule">
            {NON_GOALS.map((line) => (
              <li
                key={line}
                className="flex items-baseline gap-4 py-5 text-base text-ink"
              >
                <span aria-hidden="true" className="font-mono text-accent">
                  —
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Hairline label="Data" />

      {/* Data collection */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            What we collect.
          </h2>
          <dl className="mt-8 divide-y divide-rule border-y border-rule">
            {COLLECTED.map((item) => (
              <div
                key={item.category}
                className="grid grid-cols-3 gap-6 py-5 text-base text-ink"
              >
                <dt className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  {item.category}
                </dt>
                <dd className="col-span-2 text-ink/85">{item.examples}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Retention */}
      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            Retention.
          </h2>
          <table className="mt-8 w-full border-y border-rule text-left text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Class
                </th>
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Window
                </th>
                <th className="py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {RETENTION.map((row) => (
                <tr key={row.kind} className="border-b border-rule last:border-0">
                  <td className="py-4 pr-6 text-ink">{row.kind}</td>
                  <td className="py-4 pr-6 font-mono text-ink">{row.window}</td>
                  <td className="py-4 text-ink/85">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customer rights */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            Your rights.
          </h2>
          <ul className="mt-8 space-y-6 text-base text-ink/85">
            <li>
              <strong className="text-ink">Access.</strong> Export every
              record we hold about you as JSON, on demand, from the
              customer app.
            </li>
            <li>
              <strong className="text-ink">Correction.</strong> Request
              corrections in-app; staff applies them via the case
              workspace, with the change recorded in the audit log.
            </li>
            <li>
              <strong className="text-ink">Deletion.</strong> On request,
              we purge your data within 30 days, excluding records we
              must retain by law or for refund-fee accounting. The audit
              log records the deletion event without retaining content.
            </li>
            <li>
              <strong className="text-ink">Portability.</strong> Full
              JSON export available on request.
            </li>
          </ul>
        </div>
      </section>

      {/* Security */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            Security posture.
          </h2>
          <ul className="mt-8 space-y-3 text-base text-ink/85">
            <li>Clerk-managed auth with MFA required for staff.</li>
            <li>
              Role-based access enforced inside contexts — not only at
              the route boundary.
            </li>
            <li>
              All transit TLS 1.3. All storage encrypted at rest
              (AES-256).
            </li>
            <li>
              Pre-signed upload URLs expire after 15 minutes
              <Footnote id="fn-15min">
                Per ADR 006 — caps the blast radius of an intercepted URL.
              </Footnote>
              .
            </li>
            <li>Quarterly access review. No shared accounts.</li>
            <li>
              Annual third-party penetration test (post-revenue
              threshold).
            </li>
            <li>
              See the{' '}
              <a
                href="/trust/sub-processors"
                className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
              >
                sub-processor list
              </a>{' '}
              for every third-party that touches your data.
            </li>
          </ul>
        </div>
      </section>

      {/* Compliance */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            Compliance.
          </h2>
          <ul className="mt-8 space-y-3 text-base text-ink/85">
            <li>
              <strong className="text-ink">GDPR.</strong> Standard data-
              processing terms for EU residents. DPA available on
              request.
            </li>
            <li>
              <strong className="text-ink">CCPA / CPRA.</strong> Access +
              deletion supported for California residents.
            </li>
            <li>
              <strong className="text-ink">SOC 2 Type I.</strong> Targeted
              within 12 months.
            </li>
            <li>
              <strong className="text-ink">CBP regulations.</strong> We
              operate as a service preparing files. We do not act as a
              licensed customs broker. Customers needing brokered
              submission are routed through partner brokers (Phase 3) or
              self-submit.
            </li>
          </ul>
        </div>
      </section>

      {/* Footnotes */}
      <section className="bg-paper-2">
        <Hairline />
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
          <Eyebrow>Footnotes</Eyebrow>
          <ol className="mt-6 space-y-3">
            <FootnoteContent id="fn-15min">
              Per ADR 006 — caps the blast radius of an intercepted URL.
            </FootnoteContent>
          </ol>
        </div>
      </section>
    </main>
  )
}
