import { ClerkProvider } from '@clerk/nextjs'

/**
 * /sign-up route-group-like layout. ClerkProvider mounts only here +
 * inside (app) and (ops) so marketing + screener pages don't depend
 * on Clerk JS.
 */

export default function SignUpLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
}
