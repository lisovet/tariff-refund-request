import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import {
  customers,
  staffUsers,
  type CustomerRow,
  type StaffUserRow,
  type Schema,
} from '@shared/infra/db/schema'
import type { StaffRole } from '@shared/infra/auth/actor'
import type {
  CustomerRecord,
  IdentityRepo,
  StaffUserRecord,
  UpsertCustomerInput,
  UpsertStaffUserInput,
} from './repo'

/**
 * Drizzle-backed IdentityRepo. Used in production / when DATABASE_URL
 * is configured. The DB-row → record mapping happens here so the rest
 * of the context only sees CustomerRecord / StaffUserRecord.
 */

// PostgresJsDatabase is the concrete handle our client.ts builds.
// Other drivers (neon-serverless) expose a structurally compatible
// shape; if we add one, this alias becomes a union.
type Db = PostgresJsDatabase<Schema>


function toCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    email: row.email,
    fullName: row.fullName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toStaff(row: StaffUserRow): StaffUserRecord {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    role: row.role as StaffRole,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createDrizzleIdentityRepo(db: Db): IdentityRepo {
  return {
    async upsertCustomer(input: UpsertCustomerInput) {
      const rows = await db
        .insert(customers)
        .values({
          clerkUserId: input.clerkUserId,
          email: input.email,
          fullName: input.fullName,
        })
        .onConflictDoUpdate({
          target: customers.clerkUserId,
          set: {
            email: input.email,
            fullName: input.fullName,
            updatedAt: sql`NOW()`,
          },
        })
        .returning()
      return toCustomer(rows[0] as CustomerRow)
    },

    async upsertStaffUser(input: UpsertStaffUserInput) {
      const rows = await db
        .insert(staffUsers)
        .values({
          clerkUserId: input.clerkUserId,
          role: input.role,
          name: input.name,
          active: true,
        })
        .onConflictDoUpdate({
          target: staffUsers.clerkUserId,
          set: {
            role: input.role,
            name: input.name,
            active: true,
            updatedAt: sql`NOW()`,
          },
        })
        .returning()
      return toStaff(rows[0] as StaffUserRow)
    },

    async deactivateStaffUser(clerkUserId) {
      await db
        .update(staffUsers)
        .set({ active: false, updatedAt: sql`NOW()` })
        .where(eq(staffUsers.clerkUserId, clerkUserId))
        .returning()
    },

    async findCustomerByClerkUserId(clerkUserId) {
      const rows = (await db
        .select()
        .from(customers)
        .where(eq(customers.clerkUserId, clerkUserId))
        .limit(1)) as CustomerRow[]
      return rows[0] ? toCustomer(rows[0]) : null
    },

    async findCustomerById(customerId) {
      const rows = (await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1)) as CustomerRow[]
      return rows[0] ? toCustomer(rows[0]) : null
    },

    async findCustomerByEmail(email) {
      // Email matching is case-insensitive — Clerk normalizes, we
      // defensively lower() on the DB side too.
      const rows = (await db
        .select()
        .from(customers)
        .where(sql`lower(${customers.email}) = lower(${email})`)
        .limit(1)) as CustomerRow[]
      return rows[0] ? toCustomer(rows[0]) : null
    },

    async findStaffUserByClerkUserId(clerkUserId) {
      const rows = (await db
        .select()
        .from(staffUsers)
        .where(eq(staffUsers.clerkUserId, clerkUserId))
        .limit(1)) as StaffUserRow[]
      return rows[0] ? toStaff(rows[0]) : null
    },

    async listCustomers() {
      const rows = (await db.select().from(customers)) as CustomerRow[]
      return rows.map(toCustomer)
    },

    async listStaffUsers() {
      const rows = (await db.select().from(staffUsers)) as StaffUserRow[]
      return rows.map(toStaff)
    },

    async deleteCustomer(customerId) {
      const rows = (await db
        .delete(customers)
        .where(eq(customers.id, customerId))
        .returning({ id: customers.id })) as { id: string }[]
      return { deleted: rows.length > 0 }
    },
  }
}
