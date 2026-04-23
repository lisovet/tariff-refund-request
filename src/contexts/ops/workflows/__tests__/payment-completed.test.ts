import { describe, expect, it, vi } from 'vitest'
import { createConsoleTransport } from '@shared/infra/email/console-transport'
import { createInMemoryIdentityRepo } from '@contexts/identity'
import { createInMemoryCaseRepo } from '../../in-memory-repo'
import { paymentCompletedHandler } from '../payment-completed'

/**
 * Tests for the post-payment case-creation workflow handler. The
 * handler is pure (no Inngest imports), so we wire in-memory
 * replacements for every dep and walk the happy path + the three
 * `skipped` branches.
 */

interface StepStub {
  readonly runCalls: string[]
}

function makeStep(): StepStub & {
  readonly api: {
    run<T>(name: string, fn: () => T | Promise<T>): Promise<T>
  }
} {
  const stub: StepStub = { runCalls: [] }
  return {
    ...stub,
    api: {
      async run<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        stub.runCalls.push(name)
        return fn()
      },
    },
  }
}

const EVENT = {
  id: 'evt_payment_completed',
  data: {
    sessionId: 'sess_x',
    sku: 'recovery_kit',
    tier: 'smb',
    stripeChargeId: 'ch_1',
    amountUsdCents: 9900,
    email: 'buyer@acme.test',
  },
}

async function makeDeps(opts: {
  withCustomer?: boolean
} = {}) {
  const caseRepo = createInMemoryCaseRepo()
  const identityRepo = createInMemoryIdentityRepo()
  if (opts.withCustomer !== false) {
    await identityRepo.upsertCustomer({
      clerkUserId: 'user_clerk_1',
      email: 'buyer@acme.test',
      fullName: 'Pat Buyer',
    })
  }
  const email = createConsoleTransport()
  const sendSpy = vi.spyOn(email, 'send')
  const publish = vi.fn(async () => {})
  return {
    deps: {
      caseRepo,
      identityRepo,
      email,
      fromAddress: 'noreply@example.test',
      appOrigin: 'https://app.example.test',
      publishCaseTransitioned: publish,
    },
    sendSpy,
    publish,
  }
}

describe('paymentCompletedHandler — happy path', () => {
  it('creates a case, transitions it to awaiting_docs, sends the email', async () => {
    const { deps, sendSpy, publish } = await makeDeps()
    const step = makeStep()

    const result = await paymentCompletedHandler(
      { event: EVENT, step: step.api },
      deps,
    )

    expect(result.outcome).toBe('ok')
    if (result.outcome === 'ok') {
      const record = await deps.caseRepo.findCase(result.caseId)
      expect(record?.state).toBe('awaiting_docs')
      expect(record?.tier).toBe('smb')
      expect(record?.screenerSessionId).toBe('sess_x')
    }
    expect(step.runCalls).toEqual([
      'resolve-customer',
      'create-case',
      'transition-to-qualified',
      'transition-to-awaiting-purchase',
      'transition-to-awaiting-docs',
      'send-purchase-email',
    ])
    // Three state transitions — one publish per hop.
    expect(publish).toHaveBeenCalledTimes(3)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    const sent = sendSpy.mock.calls[0]?.[0]
    expect(sent?.to).toBe('buyer@acme.test')
    expect(sent?.html).toMatch(/app\.example\.test\/app\/case\//)
  })
})

describe('paymentCompletedHandler — skip branches', () => {
  it('skips with unknown_tier when the metadata tier is not in the enum', async () => {
    const { deps, publish, sendSpy } = await makeDeps()
    const step = makeStep()

    const result = await paymentCompletedHandler(
      {
        event: { ...EVENT, data: { ...EVENT.data, tier: 'bogus' } },
        step: step.api,
      },
      deps,
    )

    expect(result).toEqual({
      outcome: 'skipped',
      reason: 'unknown_tier',
      detail: 'bogus',
    })
    expect(publish).not.toHaveBeenCalled()
    expect(sendSpy).not.toHaveBeenCalled()
  })

  it('skips with customer_not_found when no customer row matches the email', async () => {
    const { deps, publish, sendSpy } = await makeDeps({ withCustomer: false })
    const step = makeStep()

    const result = await paymentCompletedHandler(
      { event: EVENT, step: step.api },
      deps,
    )

    expect(result.outcome).toBe('skipped')
    if (result.outcome === 'skipped') {
      expect(result.reason).toBe('customer_not_found')
      expect(result.detail).toBe('buyer@acme.test')
    }
    expect(publish).not.toHaveBeenCalled()
    expect(sendSpy).not.toHaveBeenCalled()
  })
})

describe('paymentCompletedHandler — email matching', () => {
  it('resolves customers case-insensitively and with whitespace trimmed', async () => {
    const { deps } = await makeDeps()
    const step = makeStep()

    const result = await paymentCompletedHandler(
      {
        event: {
          ...EVENT,
          data: { ...EVENT.data, email: '  BUYER@acme.test  ' },
        },
        step: step.api,
      },
      deps,
    )
    expect(result.outcome).toBe('ok')
  })
})
