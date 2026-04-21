import { SignUp } from '@clerk/nextjs'

/**
 * Sign-up page. Same design-language treatment as sign-in.
 */

export default function SignUpPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-paper">
      <div className="w-full max-w-md px-8 py-16">
        <h1 className="mb-10 font-display text-4xl tracking-display text-ink">
          Create your account
        </h1>
        <SignUp
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
