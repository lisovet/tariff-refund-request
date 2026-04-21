import { Eyebrow, Hairline } from '@/app/_components/ui'

/**
 * /trust/sub-processors — typeset table of every third party that
 * touches customer data, what they do, and where. Per PRD 10:
 * updated within 14 days of any change.
 *
 * The list ships sorted by category. Phase-2 vendors (OCR + LLM)
 * are flagged so a current reader does not assume they receive
 * customer data today.
 */

export const metadata = {
  title: 'Sub-processors',
  description:
    'Every third-party service that touches your data, what it does, and where.',
}

interface SubProcessor {
  readonly vendor: string
  readonly purpose: string
  readonly region: string
  readonly phase: 'v1' | 'Phase 2'
}

const SUB_PROCESSORS: readonly SubProcessor[] = [
  // Infrastructure
  {
    vendor: 'Vercel',
    purpose: 'Application hosting + edge runtime.',
    region: 'Global edge',
    phase: 'v1',
  },
  {
    vendor: 'Neon',
    purpose: 'Postgres database (case + entry + audit data).',
    region: 'US-East (primary)',
    phase: 'v1',
  },
  {
    vendor: 'Cloudflare R2',
    purpose: 'Document storage (uploaded source records + artifacts).',
    region: 'Global, primary US',
    phase: 'v1',
  },
  // Auth + payments
  {
    vendor: 'Clerk',
    purpose: 'Authentication + organization / role management.',
    region: 'US',
    phase: 'v1',
  },
  {
    vendor: 'Stripe',
    purpose: 'Payments + invoicing for the success-fee model.',
    region: 'US',
    phase: 'v1',
  },
  // Workflow + comms
  {
    vendor: 'Inngest',
    purpose: 'Durable workflow execution (lifecycle email, reminders).',
    region: 'US',
    phase: 'v1',
  },
  {
    vendor: 'Resend',
    purpose: 'Transactional + lifecycle email delivery.',
    region: 'US',
    phase: 'v1',
  },
  // Observability
  {
    vendor: 'Sentry',
    purpose: 'Error tracking + performance monitoring.',
    region: 'US',
    phase: 'v1',
  },
  {
    vendor: 'Axiom',
    purpose: 'Structured logs + audit-log mirror.',
    region: 'US',
    phase: 'v1',
  },
  // Phase 2 — explicitly flagged
  {
    vendor: 'AWS Textract / Google Document AI',
    purpose:
      'OCR for 7501s and carrier invoices. Active only when Phase-2 OCR is enabled.',
    region: 'US',
    phase: 'Phase 2',
  },
  {
    vendor: 'Anthropic',
    purpose:
      'LLM-assisted document extraction + Readiness Report drafting. Active only when Phase-2 AI assist is enabled.',
    region: 'US',
    phase: 'Phase 2',
  },
]

export default function SubProcessorsPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Sub-processors</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-6xl">
          Every third party that touches your data.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-ink/80">
          We update this list within{' '}
          <span className="font-mono">14 days</span> of any change. If a
          new sub-processor is added that materially affects how your
          data is handled, you receive a notice via the lifecycle email
          you signed up with.
        </p>
      </header>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
          <table className="w-full border-y border-rule text-left text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Vendor
                </th>
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Purpose
                </th>
                <th className="py-3 pr-6 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Region
                </th>
                <th className="py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
                  Phase
                </th>
              </tr>
            </thead>
            <tbody>
              {SUB_PROCESSORS.map((s) => (
                <tr
                  key={s.vendor}
                  className="border-b border-rule align-top last:border-0"
                >
                  <td className="py-4 pr-6 font-display text-base text-ink">
                    {s.vendor}
                  </td>
                  <td className="py-4 pr-6 text-ink/85">{s.purpose}</td>
                  <td className="py-4 pr-6 font-mono text-xs text-ink/70">
                    {s.region}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-block rounded-card border border-rule px-2 py-0.5 font-mono text-xs uppercase tracking-[0.1em] ${
                        s.phase === 'Phase 2'
                          ? 'text-warning'
                          : 'text-ink/70'
                      }`}
                    >
                      {s.phase}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-paper-2">
        <Hairline />
        <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-ink/70 sm:px-10">
          <p>
            For data-processing terms, sub-processor change notifications,
            or to request the DPA, contact us via the address listed on{' '}
            <a
              href="/trust"
              className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              the trust posture page
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
