import { SignIn } from '@clerk/nextjs'

/**
 * Sign-in page. Per docs/DESIGN-LANGUAGE.md: ink-on-paper canvas,
 * editorial header, no SaaS friendliness. Clerk's appearance prop
 * re-skins their primitives to our token system; the magazine
 * underline CTA pattern is mirrored on the primary action.
 *
 * Real Clerk theming hooks land in a follow-up once the dev keys
 * are configured (task #8 lays the surface; task #12 finishes the
 * design-system primitives).
 */

export default function SignInPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-paper">
      <div className="w-full max-w-md px-8 py-16">
        <h1 className="mb-10 font-display text-4xl tracking-display text-ink">
          Sign in
        </h1>
        <SignIn
          appearance={{
            elements: {
              card: 'bg-paper-2 border border-rule shadow-none rounded-card',
              headerTitle: 'font-display text-2xl text-ink',
              headerSubtitle: 'text-ink/70',
              formButtonPrimary:
                'bg-ink text-paper hover:bg-ink/90 rounded-card transition-colors duration-160 ease-paper',
              footerActionLink: 'text-accent underline underline-offset-4',
            },
          }}
        />
      </div>
    </main>
  )
}
