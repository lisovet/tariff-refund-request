import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button, Eyebrow, Hairline } from '@/app/_components/ui'
import { isAnonymous, isCustomer } from '@shared/infra/auth/actor'
import { resolveCurrentActor } from '@shared/infra/auth/resolver'
import { getIdentityRepo } from '@contexts/identity'
import { getCaseRepo } from '@contexts/ops/server'
import { STATE_COPY, type CaseRecord } from '@contexts/ops'

export const metadata = {
  title: 'Your cases',
  description: 'Your IEEPA refund cases and their current status.',
}

export default async function CustomerHome() {
  const actor = await resolveCurrentActor()

  if (isAnonymous(actor)) {
    redirect('/sign-in')
  }

  const customer = isCustomer(actor)
    ? await getIdentityRepo().findCustomerByClerkUserId(actor.clerkUserId)
    : null
  const cases = customer
    ? await getCaseRepo().listCasesByCustomer(customer.id)
    : []

  const fallbackName = isCustomer(actor)
    ? actor.email.split('@')[0]
    : actor.name.split(' ')[0]
  const displayName = customer?.fullName?.split(' ')[0] ?? fallbackName

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-20 sm:px-10 sm:pt-28">
      <Eyebrow>Your cases</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-display text-ink sm:text-5xl">
        {cases.length === 0 ? 'Welcome' : `Welcome back, ${displayName}`}
      </h1>

      <Hairline className="my-12" />

      {cases.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-8">
          {cases.map((c) => (
            <li key={c.id}>
              <CaseCard record={c} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function EmptyState() {
  return (
    <section>
      <p className="max-w-2xl text-lg text-ink/80">
        You don&apos;t have a case yet. Run the eligibility screener —
        ten questions, three minutes — and you&apos;ll get a refund
        estimate plus a recommended next step. If it looks like a fit,
        you can open a case from there.
      </p>
      <div className="mt-10">
        <Button as="a" href="/screener" variant="solid" size="lg">
          Check eligibility
        </Button>
      </div>
      <p className="mt-12 max-w-2xl text-sm text-ink/60">
        Already purchased? Check the inbox of the email you used — the
        receipt includes a link directly into the case workspace.
      </p>
    </section>
  )
}

function CaseCard({ record }: { readonly record: CaseRecord }) {
  const { customerLabel, customerDescription } = STATE_COPY[record.state]
  const shortId = record.id.slice(0, 10)
  const canEnterRecovery = record.state === 'awaiting_docs' || record.state === 'entry_recovery_in_progress'
  const workspaceHref = canEnterRecovery ? `/app/case/${record.id}/recovery` : null

  return (
    <article className="border border-rule p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Case {shortId}
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {customerLabel}
        </p>
      </div>
      <p className="mt-6 text-lg text-ink/85">{customerDescription}</p>

      {workspaceHref ? (
        <div className="mt-8">
          <Link
            href={workspaceHref}
            className="font-mono text-sm text-accent underline underline-offset-[6px] decoration-accent/40 hover:decoration-accent"
          >
            Open recovery workspace →
          </Link>
        </div>
      ) : null}
    </article>
  )
}
