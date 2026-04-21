import { describe, expect, it, vi } from 'vitest'
import {
  PAYMENT_KINDS,
  computeSuccessFeeInvoiceCents,
  generateSuccessFeeInvoice,
  recordPayment,
  type PaymentRepo,
} from '../payment-aggregate'
import { createInMemoryPaymentRepo } from '../in-memory-payment-repo'

const $50k = 50_000_00

describe('PAYMENT_KINDS', () => {
  it('includes the v1 kinds', () => {
    expect(PAYMENT_KINDS).toEqual(
      expect.arrayContaining(['charge', 'refund', 'credit', 'success_fee_invoice']),
    )
  })
})

describe('computeSuccessFeeInvoiceCents — pure clamping logic', () => {
  it('returns the raw fee when nothing is invoiced or refunded yet', () => {
    // SMB band 10–12%; 11% on $10k refund = $1100 = 110_000 cents.
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.11,
        alreadyInvoicedSuccessFeeCents: 0,
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe(110_000)
  })

  it('subtracts already-invoiced amounts so retried paid events do not double-bill', () => {
    // Same case, second invocation. First call already billed $1100.
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.11,
        alreadyInvoicedSuccessFeeCents: 110_000,
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe(0)
  })

  it('returns the delta when realized refund grows AFTER an initial invoice (CBP true-up)', () => {
    // Started with $5k refund estimate, billed 10% = $500. CBP actually
    // paid out $10k — bill the additional $500.
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.10,
        alreadyInvoicedSuccessFeeCents: 50_000, // $500 already invoiced
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe(50_000) // $500 delta
  })

  it('caps at the per-case ladder maximum (PRD 06: $50k)', () => {
    // $1M refund at 12% would be $120k raw; clamps to $50k.
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 1_000_000_00,
        tier: 'smb',
        rate: 0.12,
        alreadyInvoicedSuccessFeeCents: 0,
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe($50k)
  })

  it('clamps to the remaining refund when we already issued Stripe refunds back to the customer', () => {
    // $10k realized refund, 10% = $1000 fee. We already refunded the
    // customer $9.5k of their SKU charges (risk-reversal). Remaining
    // headroom: $500. Fee clamps to $500.
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.10,
        alreadyInvoicedSuccessFeeCents: 0,
        alreadyRefundedToCustomerCents: 9_500_00,
      }),
    ).toBe(50_000) // $500 remaining
  })

  it('returns 0 when refunded amount fully consumes the refund', () => {
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.10,
        alreadyInvoicedSuccessFeeCents: 0,
        alreadyRefundedToCustomerCents: 10_000_00,
      }),
    ).toBe(0)
  })

  it('returns 0 (not negative) when alreadyInvoiced exceeds the new computation', () => {
    // Edge case: refund estimate dropped (e.g., CBP paid less than expected),
    // but we already billed more. We never claw back via this function;
    // we just stop billing.
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 5_000_00,
        tier: 'smb',
        rate: 0.10,
        alreadyInvoicedSuccessFeeCents: 100_000, // already billed $1000
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe(0)
  })

  it('returns 0 on a zero or negative refund', () => {
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 0,
        tier: 'smb',
        alreadyInvoicedSuccessFeeCents: 0,
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe(0)
  })

  it('uses the mid-market band correctly (8–10%)', () => {
    expect(
      computeSuccessFeeInvoiceCents({
        realizedRefundCents: 10_000_00,
        tier: 'mid_market',
        // No rate → defaults to band min (8%).
        alreadyInvoicedSuccessFeeCents: 0,
        alreadyRefundedToCustomerCents: 0,
      }),
    ).toBe(80_000)
  })
})

describe('recordPayment — idempotency on stripeEventId', () => {
  it('inserts a payment row on first call and returns outcome=created', async () => {
    const repo = createInMemoryPaymentRepo()
    const result = await recordPayment(
      {
        caseId: 'cas_a',
        kind: 'charge',
        stripeEventId: 'evt_123',
        stripeChargeId: 'pi_456',
        sku: 'recovery_kit',
        amountUsdCents: 99_00,
        currency: 'usd',
        status: 'succeeded',
        occurredAt: new Date('2026-04-21T11:00:00Z'),
      },
      { repo },
    )
    expect(result.outcome).toBe('created')
    expect(result.payment.stripeEventId).toBe('evt_123')

    const rows = await repo.listPaymentsForCase('cas_a')
    expect(rows).toHaveLength(1)
  })

  it('returns outcome=duplicate on the same stripeEventId; does NOT insert again', async () => {
    const repo = createInMemoryPaymentRepo()
    const input = {
      caseId: 'cas_a',
      kind: 'charge' as const,
      stripeEventId: 'evt_123',
      stripeChargeId: 'pi_456',
      sku: 'recovery_kit',
      amountUsdCents: 99_00,
      currency: 'usd' as const,
      status: 'succeeded' as const,
      occurredAt: new Date('2026-04-21T11:00:00Z'),
    }
    await recordPayment(input, { repo })
    const second = await recordPayment(input, { repo })
    expect(second.outcome).toBe('duplicate')
    expect(await repo.listPaymentsForCase('cas_a')).toHaveLength(1)
  })

  it('different stripeEventId for the same case → both rows persist', async () => {
    const repo = createInMemoryPaymentRepo()
    await recordPayment(
      {
        caseId: 'cas_a',
        kind: 'charge',
        stripeEventId: 'evt_1',
        stripeChargeId: 'pi_1',
        sku: 'recovery_kit',
        amountUsdCents: 99_00,
        currency: 'usd',
        status: 'succeeded',
        occurredAt: new Date('2026-04-21T10:00:00Z'),
      },
      { repo },
    )
    await recordPayment(
      {
        caseId: 'cas_a',
        kind: 'refund',
        stripeEventId: 'evt_2',
        stripeChargeId: 'pi_1',
        amountUsdCents: -99_00, // refunds carry negative cents
        currency: 'usd',
        status: 'succeeded',
        occurredAt: new Date('2026-04-21T11:00:00Z'),
      },
      { repo },
    )
    expect(await repo.listPaymentsForCase('cas_a')).toHaveLength(2)
  })
})

describe('generateSuccessFeeInvoice — composition', () => {
  it('inserts a success_fee_invoice row when nothing has been invoiced yet', async () => {
    const repo = createInMemoryPaymentRepo()
    const publish = vi.fn(async () => {})

    const result = await generateSuccessFeeInvoice(
      {
        caseId: 'cas_a',
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.11,
      },
      {
        repo,
        publishInvoiceCreated: publish,
        clock: () => new Date('2026-04-21T12:00:00Z'),
        newInvoiceId: () => 'inv_test_one',
      },
    )

    expect(result.outcome).toBe('created')
    if (result.outcome !== 'created') throw new Error('unreachable')
    expect(result.payment.amountUsdCents).toBe(110_000)
    expect(result.payment.kind).toBe('success_fee_invoice')

    expect(publish).toHaveBeenCalledTimes(1)
  })

  it('returns outcome=skipped (no row) when computed amount is zero', async () => {
    const repo = createInMemoryPaymentRepo()
    // Pre-record an existing invoice that already covered the full fee.
    await repo.insertPayment({
      id: 'pay_first',
      caseId: 'cas_a',
      kind: 'success_fee_invoice',
      stripeEventId: null,
      stripeChargeId: null,
      stripeInvoiceId: 'inv_existing',
      sku: null,
      amountUsdCents: 110_000,
      currency: 'usd',
      status: 'pending',
      metadata: {},
      occurredAt: new Date('2026-04-21T11:00:00Z'),
    })
    const publish = vi.fn(async () => {})

    const result = await generateSuccessFeeInvoice(
      {
        caseId: 'cas_a',
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.11,
      },
      {
        repo,
        publishInvoiceCreated: publish,
        clock: () => new Date('2026-04-21T12:00:00Z'),
      },
    )
    expect(result.outcome).toBe('skipped')
    if (result.outcome !== 'skipped') throw new Error('unreachable')
    expect(result.reason).toBe('no_remaining_fee')
    expect(publish).not.toHaveBeenCalled()
  })

  it('clamps against alreadyInvoiced + alreadyRefundedToCustomer in the same call', async () => {
    const repo = createInMemoryPaymentRepo()
    // Customer was already refunded $5k of their SKU charges.
    await repo.insertPayment({
      id: 'pay_refund',
      caseId: 'cas_a',
      kind: 'refund',
      stripeEventId: 'evt_r',
      stripeChargeId: 'pi_r',
      stripeInvoiceId: null,
      sku: 'recovery_service',
      amountUsdCents: -5_000_00, // refunds are negative
      currency: 'usd',
      status: 'succeeded',
      metadata: {},
      occurredAt: new Date('2026-04-21T10:00:00Z'),
    })

    // Refund is $10k, 10% = $1000 raw fee. But customer was refunded
    // $5k of payments. So fee clamped to remaining = $5k. Headroom
    // exceeds raw fee → keep $1000.
    const result = await generateSuccessFeeInvoice(
      {
        caseId: 'cas_a',
        realizedRefundCents: 10_000_00,
        tier: 'smb',
        rate: 0.10,
      },
      {
        repo,
        publishInvoiceCreated: vi.fn(async () => {}),
        clock: () => new Date(),
      },
    )
    expect(result.outcome).toBe('created')
    if (result.outcome !== 'created') throw new Error('unreachable')
    expect(result.payment.amountUsdCents).toBe(100_000) // $1000 — full fee, headroom intact
  })

  it('publishInvoiceCreated payload carries caseId + amount + tier', async () => {
    const repo: PaymentRepo = createInMemoryPaymentRepo()
    const publish = vi.fn(async () => {})

    await generateSuccessFeeInvoice(
      {
        caseId: 'cas_xyz',
        realizedRefundCents: 5_000_00,
        tier: 'mid_market',
      },
      {
        repo,
        publishInvoiceCreated: publish,
        clock: () => new Date('2026-04-21T11:00:00Z'),
        newInvoiceId: () => 'inv_test',
      },
    )

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'cas_xyz',
        amountUsdCents: 40_000, // 8% of $5k
        tier: 'mid_market',
      }),
    )
  })

  it('returns outcome=skipped when the realized refund is zero (nothing to bill)', async () => {
    const result = await generateSuccessFeeInvoice(
      {
        caseId: 'cas_a',
        realizedRefundCents: 0,
        tier: 'smb',
      },
      {
        repo: createInMemoryPaymentRepo(),
        publishInvoiceCreated: vi.fn(async () => {}),
        clock: () => new Date(),
      },
    )
    expect(result.outcome).toBe('skipped')
  })
})
