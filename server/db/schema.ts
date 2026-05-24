import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const reservationStatus = pgEnum('reservation_status', [
  'pending',
  'confirmed',
  'cancelled',
])

export const loyaltyTransactionType = pgEnum('loyalty_transaction_type', [
  'earn',
  'redeem',
])

export const redemptionStatus = pgEnum('redemption_status', [
  'pending',
  'used',
  'expired',
])

export const staffRole = pgEnum('staff_role', ['staff', 'manager', 'admin'])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    address: text('address').notNull(),
    postalCode: varchar('postal_code', { length: 10 }),
    phone: varchar('phone', { length: 20 }),
    lat: decimal('lat', { precision: 10, scale: 8 }),
    lng: decimal('lng', { precision: 11, scale: 8 }),
    schedule: jsonb('schedule'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [
    index('branches_active_idx').on(t.isActive).where(sql`is_active = true`),
    index('branches_postal_code_idx').on(t.postalCode),
    index('branches_coords_idx').on(t.lat, t.lng),
  ]
)

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  whatsappOptIn: boolean('whatsapp_opt_in').notNull().default(false),
  pointsBalance: integer('points_balance').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    pointsCost: integer('points_cost').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [check('rewards_points_cost_positive', sql`${t.pointsCost} > 0`)]
)

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    contactName: varchar('contact_name', { length: 100 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 20 }).notNull(),
    partySize: integer('party_size').notNull(),
    reservationDate: date('reservation_date').notNull(),
    reservationTime: time('reservation_time').notNull(),
    status: reservationStatus('status').notNull().default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  t => [
    check('reservations_party_size_positive', sql`${t.partySize} > 0`),
    index('reservations_branch_date_idx').on(t.branchId, t.reservationDate),
  ]
)

export const loyaltyTransactions = pgTable(
  'loyalty_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    pointsDelta: integer('points_delta').notNull(),
    transactionType: loyaltyTransactionType('transaction_type').notNull(),
    referenceId: uuid('reference_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  t => [
    check('loyalty_transactions_delta_nonzero', sql`${t.pointsDelta} <> 0`),
    index('loyalty_transactions_customer_idx').on(t.customerId),
    index('loyalty_transactions_branch_created_idx').on(
      t.branchId,
      t.createdAt
    ),
  ]
)

export const staffUsers = pgTable('staff_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: staffRole('role').notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const redemptions = pgTable('redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => rewards.id),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),
  usedBy: uuid('used_by').references(() => staffUsers.id),
  status: redemptionStatus('status').notNull().default('pending'),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const staffSessions = pgTable('staff_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffUserId: uuid('staff_user_id')
    .notNull()
    .references(() => staffUsers.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
