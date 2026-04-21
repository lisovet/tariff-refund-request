import { Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * /trust/legal-requests — data-request policy page per PRD 10
 * §"Edge case inventory": "Subpoena / legal request for customer
 * data → handled per published policy at /trust/legal-requests;
 * customer notified unless prohibited."
 */

export const metadata = {
  title: 'How we handle legal requests',
  description:
    'When a subpoena, warrant, or civil-discovery request arrives for your data, here’s exactly what we do — and what we tell you.',
}

interface Step {
  readonly n: '01' | '02' | '03' | '04' | '05'
  readonly label: string
  readonly detail: string
}

const STEPS: readonly Step[] = [
  {
    n: '01',
    label: 'Request received',
    detail:
      'Legal counsel receives the request at the address at the bottom of this page. We do not accept service by ticket, chat, or DM.',
  },
  {
    n: '02',
    label: 'Scope reviewed',
    detail:
      'We review the request for validity (issued by a competent authority), scope (what records are actually being asked for), and any non-disclosure order attached.',
  },
  {
    n: '03',
    label: 'Customer notified',
    detail:
      'Unless the request explicitly prohibits notification, we tell the affected customer in writing before producing records — so they can challenge or narrow the request if they choose.',
  },
  {
    n: '04',
    label: 'Records produced',
    detail:
      'We produce only the records responsive to the specific scope of the request. No fishing expeditions, no adjacent data, no PII we don’t legally have to disclose.',
  },
  {
    n: '05',
    label: 'Audit log entry written',
    detail:
      'Every legal-request response writes an entry in the case audit log with the request id, the responsive records produced, and the date. Append-only. Retained for the life of the audit log.',
  },
] as const

interface DataClass {
  readonly label: string
  readonly examples: string
  readonly retention: string
}

const DATA_CLASSES: readonly DataClass[] = [
  {
    label: 'Identity',
    examples: 'Name, work email, company.',
    retention:
      'Retained for the life of the engagement + 12 months after purge request.',
  },
  {
    label: 'Documents',
    examples:
      '7501 entry summaries, broker spreadsheets, carrier invoices, ACE exports.',
    retention: '7 years (aligns with CBP record retention).',
  },
  {
    label: 'Derived data',
    examples:
      'Validated entry records, Readiness Reports, case state transitions.',
    retention: '7 years.',
  },
  {
    label: 'Payment metadata',
    examples:
      'Stripe customer + charge identifiers. Card numbers never touch our systems.',
    retention: 'Per Stripe + tax / audit obligations.',
  },
  {
    label: 'Audit log',
    examples:
      'Every state transition + reviewer note + deletion event, per case.',
    retention: 'Append-only. Never deleted.',
  },
] as const

export default function LegalRequestsPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Trust</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-7xl">
          How we handle legal requests.
        </h1>
        <p className="mt-10 max-w-2xl text-lg text-ink/80">
          When a subpoena, warrant, or civil-discovery request
          arrives for your data, we honour it — and we tell you what
          happened, unless a non-disclosure order prohibits it. In
          plain language, what we do.
        </p>
      </header>

      <Hairline label="Our process" />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10 sm:py-32">
          <ol className="space-y-10">
            {STEPS.map((s) => (
              <li key={s.n} className="grid gap-6 sm:grid-cols-[80px_1fr]">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                  Step {s.n}
                </span>
                <div>
                  <h2 className="font-display text-2xl tracking-display text-ink">
                    {s.label}
                  </h2>
                  <p className="mt-3 text-base text-ink/80">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Hairline label="What we may produce" />

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Data categories + retention</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            Only what the request covers. Only for as long as we
            keep it.
          </h2>
          <table className="mt-12 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Category
                </th>
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Examples
                </th>
                <th className="py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Retention
                </th>
              </tr>
            </thead>
            <tbody>
              {DATA_CLASSES.map((c) => (
                <tr key={c.label} className="border-b border-rule align-top">
                  <td className="py-5 pr-6 font-display text-lg text-ink">
                    {c.label}
                  </td>
                  <td className="py-5 pr-6 text-base text-ink/80">
                    {c.examples}
                  </td>
                  <td className="py-5 font-mono text-sm text-ink/70">
                    {c.retention}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Hairline label="Sub-processors" />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Third-party data</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            If the request covers a vendor&apos;s records, we forward
            it.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Some customer data lives with our sub-processors (Railway
            for the database and application host, Cloudflare R2 for
            documents, Clerk for identity, Stripe for payments,
            Inngest for workflow execution, Resend for email, Sentry
            and Axiom for observability). When a legal request covers
            data held by a sub-processor, we coordinate with them per
            our Data Processing Addendum.
          </p>
          <p className="mt-6 text-base text-ink/70">
            The full current list lives at{' '}
            <a
              href="/trust/sub-processors"
              className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              /trust/sub-processors
            </a>
            .
          </p>
        </div>
      </section>

      <Hairline label="Transparency" />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <Eyebrow>Transparency report</Eyebrow>
          <h2 className="mt-3 font-display text-3xl tracking-display text-ink sm:text-4xl">
            We&apos;ll publish the numbers, twice a year.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Once we cross a meaningful revenue and request-volume
            threshold, we commit to a biannual transparency report —
            aggregate counts of requests received by type, requests
            complied with, requests rejected, and data volume
            produced. Personal details of any individual request are
            not included.
          </p>
        </div>
      </section>

      <Hairline label="Contact for legal process" />

      <section className="bg-paper-2">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:px-10 sm:py-32">
          <h2 className="font-display text-3xl tracking-display text-ink sm:text-4xl">
            Serve legal process.
          </h2>
          <p className="mt-6 text-lg text-ink/80">
            Legal counsel can send subpoenas, warrants, and other
            discovery requests to:
          </p>
          <p className="mt-6 font-mono text-base text-ink">
            legal@tariffrefundrequest.com
          </p>
          <p className="mt-8 text-sm text-ink/65">
            This is not legal advice. We comply with valid legal
            process; we are not a party to the underlying litigation
            and do not provide legal guidance on it.
          </p>
        </div>
      </section>
    </main>
  )
}
