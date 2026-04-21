import { randomBytes } from 'node:crypto'
import type {
  CustomerRecord,
  IdentityRepo,
  StaffUserRecord,
  UpsertCustomerInput,
  UpsertStaffUserInput,
} from './repo'

/**
 * In-memory IdentityRepo for tests + dev fallback when DATABASE_URL
 * is missing. Mirrors the upsert semantics of the Drizzle repo.
 */

const newId = (prefix: 'cus' | 'stf') =>
  `${prefix}_${randomBytes(8).toString('hex')}`

export function createInMemoryIdentityRepo(): IdentityRepo {
  const customers = new Map<string, CustomerRecord>()
  const staff = new Map<string, StaffUserRecord>()

  return {
    async upsertCustomer(input: UpsertCustomerInput) {
      const now = new Date()
      const existing = customers.get(input.clerkUserId)
      const next: CustomerRecord = existing
        ? { ...existing, ...input, updatedAt: now }
        : {
            id: newId('cus'),
            clerkUserId: input.clerkUserId,
            email: input.email,
            fullName: input.fullName,
            createdAt: now,
            updatedAt: now,
          }
      customers.set(input.clerkUserId, next)
      return next
    },

    async upsertStaffUser(input: UpsertStaffUserInput) {
      const now = new Date()
      const existing = staff.get(input.clerkUserId)
      const next: StaffUserRecord = existing
        ? { ...existing, ...input, active: true, updatedAt: now }
        : {
            id: newId('stf'),
            clerkUserId: input.clerkUserId,
            role: input.role,
            name: input.name,
            active: true,
            createdAt: now,
            updatedAt: now,
          }
      staff.set(input.clerkUserId, next)
      return next
    },

    async deactivateStaffUser(clerkUserId) {
      const existing = staff.get(clerkUserId)
      if (!existing) return
      staff.set(clerkUserId, {
        ...existing,
        active: false,
        updatedAt: new Date(),
      })
    },

    async findCustomerByClerkUserId(clerkUserId) {
      return customers.get(clerkUserId) ?? null
    },

    async findStaffUserByClerkUserId(clerkUserId) {
      return staff.get(clerkUserId) ?? null
    },

    async listCustomers() {
      return [...customers.values()]
    },

    async listStaffUsers() {
      return [...staff.values()]
    },
  }
}
