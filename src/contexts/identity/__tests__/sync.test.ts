import { beforeEach, describe, expect, it } from 'vitest'
import { createInMemoryIdentityRepo } from '../in-memory-repo'
import { handleClerkEvent } from '../sync'

const sampleUserCreated = {
  type: 'user.created',
  data: {
    id: 'user_x',
    email_addresses: [
      { id: 'em_1', email_address: 'a@b.co' },
    ],
    primary_email_address_id: 'em_1',
    first_name: 'Alex',
    last_name: 'Customer',
    organization_memberships: [],
  },
}

const sampleStaffMembershipCreated = {
  type: 'organizationMembership.created',
  data: {
    public_user_data: {
      user_id: 'user_a',
      first_name: 'Alex',
      last_name: 'Analyst',
    },
    role: 'analyst',
    organization: { id: 'org_staff', name: 'Tariff Refund Staff' },
  },
}

describe('handleClerkEvent — user.created', () => {
  let repo: ReturnType<typeof createInMemoryIdentityRepo>
  beforeEach(() => {
    repo = createInMemoryIdentityRepo()
  })

  it('creates a customer row', async () => {
    await handleClerkEvent(sampleUserCreated, { repo })
    const found = await repo.findCustomerByClerkUserId('user_x')
    expect(found?.email).toBe('a@b.co')
    expect(found?.fullName).toBe('Alex Customer')
  })

  it('REPLAY: invoking the handler twice with the same payload yields one row', async () => {
    await handleClerkEvent(sampleUserCreated, { repo })
    await handleClerkEvent(sampleUserCreated, { repo })
    const all = await repo.listCustomers()
    expect(all).toHaveLength(1)
  })

  it('throws when the primary email is missing', async () => {
    const bad = {
      type: 'user.created',
      data: { ...sampleUserCreated.data, email_addresses: [], primary_email_address_id: null },
    }
    await expect(handleClerkEvent(bad, { repo })).rejects.toThrow(/email/i)
  })
})

describe('handleClerkEvent — organizationMembership.created', () => {
  let repo: ReturnType<typeof createInMemoryIdentityRepo>
  beforeEach(() => {
    repo = createInMemoryIdentityRepo()
  })

  it('creates a staff_users row with the named role', async () => {
    await handleClerkEvent(sampleStaffMembershipCreated, { repo })
    const found = await repo.findStaffUserByClerkUserId('user_a')
    expect(found?.role).toBe('analyst')
    expect(found?.name).toBe('Alex Analyst')
  })

  it('REPLAY: idempotent on retry', async () => {
    await handleClerkEvent(sampleStaffMembershipCreated, { repo })
    await handleClerkEvent(sampleStaffMembershipCreated, { repo })
    const all = await repo.listStaffUsers()
    expect(all).toHaveLength(1)
  })

  it('rejects unrecognized roles defensively', async () => {
    const bad = {
      type: 'organizationMembership.created',
      data: {
        ...sampleStaffMembershipCreated.data,
        role: 'spectator',
      },
    }
    await expect(handleClerkEvent(bad, { repo })).rejects.toThrow(/role/i)
  })
})

describe('handleClerkEvent — organizationMembership.deleted', () => {
  it('deactivates the staff_users row but does not delete it (audit trail)', async () => {
    const repo = createInMemoryIdentityRepo()
    await handleClerkEvent(sampleStaffMembershipCreated, { repo })
    await handleClerkEvent(
      {
        type: 'organizationMembership.deleted',
        data: sampleStaffMembershipCreated.data,
      },
      { repo },
    )
    const found = await repo.findStaffUserByClerkUserId('user_a')
    expect(found?.active).toBe(false)
  })
})

describe('handleClerkEvent — unknown event types', () => {
  it('is a silent no-op (so we do not 500 on Clerk events we have not modeled)', async () => {
    const repo = createInMemoryIdentityRepo()
    await handleClerkEvent(
      { type: 'some.other.event', data: {} },
      { repo },
    )
    expect(await repo.listCustomers()).toHaveLength(0)
    expect(await repo.listStaffUsers()).toHaveLength(0)
  })
})
