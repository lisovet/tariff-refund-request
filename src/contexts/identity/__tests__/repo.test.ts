import { beforeEach, describe, expect, it } from 'vitest'
import { createInMemoryIdentityRepo } from '../in-memory-repo'

describe('InMemoryIdentityRepo — customers', () => {
  let repo: ReturnType<typeof createInMemoryIdentityRepo>
  beforeEach(() => {
    repo = createInMemoryIdentityRepo()
  })

  it('upserts a customer keyed by clerkUserId', async () => {
    await repo.upsertCustomer({
      clerkUserId: 'user_x',
      email: 'a@b.co',
      fullName: 'A. Customer',
    })
    const found = await repo.findCustomerByClerkUserId('user_x')
    expect(found).toMatchObject({
      clerkUserId: 'user_x',
      email: 'a@b.co',
      fullName: 'A. Customer',
    })
    expect(found?.id).toMatch(/^cus_/)
  })

  it('is idempotent — upserting the same clerkUserId twice yields one row with the latest data', async () => {
    await repo.upsertCustomer({
      clerkUserId: 'user_x',
      email: 'old@b.co',
      fullName: 'Old',
    })
    await repo.upsertCustomer({
      clerkUserId: 'user_x',
      email: 'new@b.co',
      fullName: 'New',
    })
    const all = await repo.listCustomers()
    expect(all).toHaveLength(1)
    expect(all[0]?.email).toBe('new@b.co')
    expect(all[0]?.fullName).toBe('New')
  })

  it('returns null when not found', async () => {
    expect(await repo.findCustomerByClerkUserId('nope')).toBeNull()
  })
})

describe('InMemoryIdentityRepo — staff_users', () => {
  let repo: ReturnType<typeof createInMemoryIdentityRepo>
  beforeEach(() => {
    repo = createInMemoryIdentityRepo()
  })

  it('upserts a staff user keyed by clerkUserId with role + name', async () => {
    await repo.upsertStaffUser({
      clerkUserId: 'user_a',
      role: 'analyst',
      name: 'A. Analyst',
    })
    const found = await repo.findStaffUserByClerkUserId('user_a')
    expect(found).toMatchObject({
      clerkUserId: 'user_a',
      role: 'analyst',
      name: 'A. Analyst',
      active: true,
    })
    expect(found?.id).toMatch(/^stf_/)
  })

  it('is idempotent — upserting twice yields one row, role can change', async () => {
    await repo.upsertStaffUser({
      clerkUserId: 'user_a',
      role: 'analyst',
      name: 'A',
    })
    await repo.upsertStaffUser({
      clerkUserId: 'user_a',
      role: 'validator',
      name: 'A',
    })
    const all = await repo.listStaffUsers()
    expect(all).toHaveLength(1)
    expect(all[0]?.role).toBe('validator')
  })

  it('marks staff inactive on deactivate without deleting the row (audit trail)', async () => {
    await repo.upsertStaffUser({
      clerkUserId: 'user_a',
      role: 'analyst',
      name: 'A',
    })
    await repo.deactivateStaffUser('user_a')
    const found = await repo.findStaffUserByClerkUserId('user_a')
    expect(found?.active).toBe(false)
  })
})
