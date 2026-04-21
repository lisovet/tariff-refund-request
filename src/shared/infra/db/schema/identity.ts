import { sql } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Identity tables — customers + staff_users. Each is keyed by
 * clerkUserId (UNIQUE) so the Clerk webhook handler can upsert
 * idempotently without distributed-locking gymnastics.
 *
 * Per ADR 003 + ADR 004 + PRD 04. Provenance + audit columns added.
 */

export const customers = pgTable('customers', {
  id: text('id')
    .primaryKey()
    .default(sql`'cus_' || encode(gen_random_bytes(12), 'hex')`),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const staffUsers = pgTable('staff_users', {
  id: text('id')
    .primaryKey()
    .default(sql`'stf_' || encode(gen_random_bytes(12), 'hex')`),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  role: text('role', {
    enum: ['coordinator', 'analyst', 'validator', 'admin'],
  }).notNull(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type CustomerRow = typeof customers.$inferSelect
export type StaffUserRow = typeof staffUsers.$inferSelect
