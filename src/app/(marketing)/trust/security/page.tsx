import { Eyebrow, Hairline } from '@/app/_components/ui'
import { getActiveV1SubProcessors } from '@/shared/trust/sub-processors'

/**
 * /trust/security — detailed security + retention posture per
 * PRD 10 §Security posture. This is the page customers (and their
 * security teams) land on when they ask "how do you handle our
 * data?" before purchasing.
 *
 * Every claim on this page is backed by either a code path
 * (authentication gates via Clerk middleware, R2 15-min pre-signed
 * URLs) or a runbook (incident response). Changes to the posture
 * here are a PRD 10 concern — update the PRD first, land the code,
 * then update this page.
 */

export const metadata = {
  title: 'Security',
  description:
    'Authentication, storage, retention, and access controls — the exact security posture your team can audit.',
}

const STAFF_ROLE_DESCRIPTIONS: readonly { readonly role: string; readonly scope: string }[] = [
  {
    role: 'Coordinator',
    scope:
      'Triage inbound recovery workspaces, assign cases, run customer outreach. No direct access to Stripe billing or Clerk org admin.',
  },
  {
    role: 'Analyst',
    scope:
      'Work inside a case workspace — run validator, edit entry records, draft Readiness Report notes. Cannot finalize submission_ready.',
  },
  {
    role: 'Validator',
    scope:
      'Only role permitted to sign off a batch as submission_ready. Every sign-off records the validator name + timestamp on the artifact.',
  },
  {
    role: 'Admin',
    scope:
      'Manage staff membership + sub-processor roster + pricing catalog. Destructive actions require two-person sign-off (Phase 1).',
  },
]

export default function SecurityPage() {
  const activeSubProcessors = getActiveV1SubProcessors()
  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-6 pb-16 pt-32 sm:px-10 sm:pb-24 sm:pt-40">
        <Eyebrow>Security</Eyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-display text-ink sm:text-6xl">
          How we secure your data.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-ink/80">
          A plain description of the authentication, storage, retention, and
          access posture behind the product. Every claim here is backed by a
          code path or a runbook — not marketing language.
        </p>
      </header>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
          <h2 className="font-display text-3xl tracking-display text-ink">
            Authentication
          </h2>
          <p className="mt-4 text-ink/85">
            User identity is managed by{' '}
            <span className="font-mono text-ink">Clerk</span>. Customers sign in
            via email + passkey, SSO, or a short-lived magic link scoped to a
            single screener result. Staff accounts require MFA (hardware key or
            authenticator app) and are scoped to a Clerk organization.
          </p>
          <p className="mt-4 text-ink/85">
            The middleware at <span className="font-mono">/app/**</span> and{' '}
            <span className="font-mono">/ops/**</span> rejects any request that
            is missing an authenticated session. Role enforcement (below) is a
            second gate applied inside route handlers and the XState
            case-state machine.
          </p>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
          <h2 className="font-display text-3xl tracking-display text-ink">
            Storage &amp; encryption
          </h2>
          <p className="mt-4 text-ink/85">
            Case data + audit log + entry records live in a dedicated Railway
            Postgres cluster, encrypted <em>at rest</em>. Uploaded documents
            (7501s, carrier invoices, ACE print-outs) land in Cloudflare R2
            under case-scoped keys (
            <span className="font-mono">
              cases/&lbrace;caseId&rbrace;/&lbrace;documentId&rbrace;/&lbrace;filename&rbrace;
            </span>
            ) — encrypted <em>at rest</em> and never co-located across
            customers.
          </p>
          <p className="mt-4 text-ink/85">
            Uploads use pre-signed URLs that expire in{' '}
            <span className="font-mono">15 minutes</span>. Read URLs default to{' '}
            <span className="font-mono">10 minutes</span>, with a hard ceiling
            of 60 minutes. Every object put / get is logged to the audit
            mirror.
          </p>
          <p className="mt-6 border-t border-rule pt-4 text-sm text-ink/70">
            Pre-signed URL expiry is enforced in code, not by policy —{' '}
            <span className="font-mono">MAX_UPLOAD_URL_EXPIRY_SECONDS</span>{' '}
            clamps every request.
          </p>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
          <h2 className="font-display text-3xl tracking-display text-ink">
            Retention
          </h2>
          <ul className="mt-6 space-y-3 text-ink/85">
            <li>
              <span className="font-mono text-ink">Case data &amp; audit log —</span>{' '}
              retained for the life of the engagement plus seven years to
              satisfy CBP recordkeeping obligations. Signed agreements are kept
              permanently.
            </li>
            <li>
              <span className="font-mono text-ink">Uploaded documents —</span>{' '}
              retained for the life of the engagement plus two years. After
              that the object is deleted; the provenance record pointing to
              the former object is kept.
            </li>
            <li>
              <span className="font-mono text-ink">Marketing screener sessions —</span>{' '}
              retained for twelve months, then purged. Email addresses
              disassociated from the session survive under your marketing
              opt-in preference.
            </li>
            <li>
              <span className="font-mono text-ink">Deletion requests —</span>{' '}
              processed within thirty days. In-scope records are purged,
              Stripe invoices are retained per legal obligation.
            </li>
          </ul>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
          <h2 className="font-display text-3xl tracking-display text-ink">
            Access control
          </h2>
          <p className="mt-4 text-ink/85">
            Staff operate under least-privilege roles enforced by Clerk org
            claims. The four v1 roles:
          </p>
          <ul className="mt-6 space-y-4">
            {STAFF_ROLE_DESCRIPTIONS.map((r) => (
              <li key={r.role} className="border-t border-rule pt-4">
                <span className="font-display text-lg text-ink">{r.role}</span>
                <p className="mt-1 text-sm text-ink/80">{r.scope}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
          <h2 className="font-display text-3xl tracking-display text-ink">
            Incident response
          </h2>
          <p className="mt-4 text-ink/85">
            Exceptions surface through Sentry + Axiom within minutes. On any
            confirmed exposure of customer data we notify affected customers
            in writing within{' '}
            <span className="font-mono">72 hours</span>, consistent with PRD 10.
            Sub-processor breaches trigger the same notification path.
          </p>
          <p className="mt-4 text-ink/85">
            Backup restoration is rehearsed quarterly. Restore time objective
            is under four hours for the case database.
          </p>
        </div>
      </section>

      <Hairline />

      <section className="bg-paper-2">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
          <h2 className="font-display text-3xl tracking-display text-ink">
            Sub-processors
          </h2>
          <p className="mt-4 text-ink/85">
            We currently use{' '}
            <span className="font-mono">
              {activeSubProcessors.length} active sub-processors
            </span>{' '}
            to operate the product. The full list, regions, and category for
            each lives at{' '}
            <a
              href="/trust/sub-processors"
              className="text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent decoration-1"
            >
              /trust/sub-processors
            </a>
            . We publish updates within fourteen days of any change and notify
            active customers via the lifecycle email they opted into.
          </p>
        </div>
      </section>
    </main>
  )
}
