import { Eyebrow, Hairline } from '@/app/_components/ui'
import {
  SUB_PROCESSORS,
  SUB_PROCESSORS_LIST_VERSION,
} from '@/shared/trust/sub-processors'

/**
 * /trust/sub-processors — typeset table of every third party that
 * touches customer data, what they do, and where. Per PRD 10:
 * updated within 14 days of any change.
 *
 * The list is sourced from `@/shared/trust/sub-processors` — the
 * single module that feeds this page, the /trust summary table,
 * and the Phase-1 lifecycle notification workflow.
 */

export const metadata = {
  title: 'Sub-processors',
  description:
    'Every third-party service that touches your data, what it does, and where.',
}

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
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-ink/50">
            List version v{SUB_PROCESSORS_LIST_VERSION}
          </p>
        </div>
      </section>
    </main>
  )
}
