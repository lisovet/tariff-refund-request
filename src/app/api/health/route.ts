/*
 * Health-check endpoint. Used by deploy probes and the loop's smoke test.
 * Keeps the route handler surface alive across waves.
 */

export const dynamic = 'force-static'

export function GET() {
  return Response.json({ status: 'ok' })
}
