import type { StaffRole } from '@shared/infra/auth/actor'

/**
 * Identity repository contract. Two implementations:
 *   - DrizzleIdentityRepo (production / dev with DATABASE_URL)
 *   - InMemoryIdentityRepo (tests + dev fallback)
 *
 * Per ADR 001, contexts depend on this contract — never on Drizzle
 * directly. Lets us test the sync logic without a real DB.
 */

export interface CustomerRecord {
  readonly id: string
  readonly clerkUserId: string
  readonly email: string
  readonly fullName: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface StaffUserRecord {
  readonly id: string
  readonly clerkUserId: string
  readonly role: StaffRole
  readonly name: string
  readonly active: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface UpsertCustomerInput {
  readonly clerkUserId: string
  readonly email: string
  readonly fullName: string | null
}

export interface UpsertStaffUserInput {
  readonly clerkUserId: string
  readonly role: StaffRole
  readonly name: string
}

export interface IdentityRepo {
  upsertCustomer(input: UpsertCustomerInput): Promise<CustomerRecord>
  upsertStaffUser(input: UpsertStaffUserInput): Promise<StaffUserRecord>
  deactivateStaffUser(clerkUserId: string): Promise<void>
  findCustomerByClerkUserId(clerkUserId: string): Promise<CustomerRecord | null>
  /** Primary-key lookup. Used by the data-rights (export + deletion)
   *  services per PRD 10. */
  findCustomerById(customerId: string): Promise<CustomerRecord | null>
  /** Email lookup used by the post-payment workflow to resolve the
   *  buyer's `customerId` when creating their case. Email must match
   *  the value captured by the Clerk `user.created` webhook. */
  findCustomerByEmail(email: string): Promise<CustomerRecord | null>
  findStaffUserByClerkUserId(clerkUserId: string): Promise<StaffUserRecord | null>
  // Listing methods primarily for tests / admin diagnostics.
  listCustomers(): Promise<readonly CustomerRecord[]>
  listStaffUsers(): Promise<readonly StaffUserRecord[]>
  /** Hard-delete a customer row. Used only by the deletion worker
   *  after it has purged owned cases. */
  deleteCustomer(customerId: string): Promise<{ deleted: boolean }>
}
