import Link from 'next/link'

export default function RecoveryNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
        404
      </p>
      <h1 className="font-display text-4xl tracking-display text-ink">
        Recovery workspace not found
      </h1>
      <p className="text-base text-ink/75">
        We couldn&rsquo;t find a recovery workspace for that case. It may not
        have been created yet, or the case is at a stage that doesn&rsquo;t
        have a recovery surface.
      </p>
      <p>
        <Link
          href="/app"
          className="underline decoration-accent decoration-2 underline-offset-4"
        >
          Back to your dashboard
        </Link>
      </p>
    </main>
  )
}
