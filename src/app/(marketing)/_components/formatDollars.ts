/**
 * Shared dollar formatter for the marketing pages. Every stage
 * detail page + the /pricing page reads prices from
 * src/contexts/billing/pricing.ts via priceFor(); this helper
 * renders the cents value as a dollar string with thousands
 * separators, trimming the cents when they're zero.
 */
export function dollars(cents: number): string {
  const whole = Math.trunc(cents / 100)
  const formatted = whole.toLocaleString('en-US')
  if (cents % 100 === 0) return `$${formatted}`
  const fractional = String(cents % 100).padStart(2, '0')
  return `$${formatted}.${fractional}`
}
