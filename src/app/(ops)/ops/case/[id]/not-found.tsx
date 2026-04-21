import Link from 'next/link'

export default function OpsCaseNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
        404
      </p>
      <h1 className="font-display text-3xl tracking-display text-ink">
        Case not found
      </h1>
      <p className="text-base text-ink/75">
        No case with that id exists, or the case has no resolvable
        recovery path. If you expected a case here, check the queue
        list for the correct id.
      </p>
      <p>
        <Link
          href="/ops"
          className="underline decoration-accent decoration-2 underline-offset-4"
        >
          Back to the ops console
        </Link>
      </p>
    </main>
  )
}
