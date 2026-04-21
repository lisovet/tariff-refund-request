import { ClerkProvider } from '@clerk/nextjs'

/**
 * /sign-in route-group-like layout. ClerkProvider mounts only here +
 * inside (app) and (ops) so marketing + screener pages don't depend
 * on Clerk JS.
 */

export default function SignInLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
}
