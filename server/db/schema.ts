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
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ─── Branch schedule type ─────────────────────────────────────────────────────

type DayHours = { open: string; close: string }
export type BranchSchedule = {
  mon: DayHours | null
  tue: DayHours | null
  wed: DayHours | null
  thu: DayHours | null
  fri: DayHours | null
  sat: DayHours | null
  sun: DayHours | null
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export const reservationStatus = pgEnum('reservation_status', [
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'escalated',
  'cancelled_auto',
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

export const staffRole = pgEnum('staff_role', ['staff', 'admin', 'owner'])

// branch location type — whether the branch operates as AYCE or Express
export const branchType = pgEnum('branch_type', ['ayce', 'express'])

// location-type applicability of a dish (AYCE-only, Express-only, or both)
export const menuLocationType = pgEnum('menu_location_type', [
  'ayce',
  'express',
  'both',
])

// fixed, code-referenced category keys (17) — English identifiers
export const menuCategoryKey = pgEnum('menu_category_key', [
  'appetizers',
  'salads',
  'rice',
  'ramen',
  'burgers',
  'sandwiches',
  'burritos',
  'hot_dogs',
  'cold_rolls',
  'hot_rolls',
  'sweet_rolls',
  'desserts',
  'wings',
  'sauces',
  'extras',
  'drinks',
  'kids',
])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    address: text('address').notNull(),
    lat: decimal('lat', { precision: 10, scale: 8 }),
    lng: decimal('lng', { precision: 11, scale: 8 }),
    whatsappReservaciones: varchar('whatsapp_reservaciones', { length: 20 }),
    whatsappReservacionesBackup: varchar('whatsapp_reservaciones_backup', {
      length: 20,
    }),
    managerPhone: varchar('manager_phone', { length: 20 }),
    code: varchar('code', { length: 60 }).unique(),
    state: varchar('state', { length: 100 }),
    schedule: jsonb('schedule').$type<BranchSchedule>(),
    type: branchType('type').notNull().default('ayce'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [
    index('branches_active_idx').on(t.isActive).where(sql`is_active = true`),
    index('branches_coords_idx').on(t.lat, t.lng),
    index('branches_type_idx').on(t.type),
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
    folio: varchar('folio', { length: 8 }).notNull().unique(),
    notes: text('notes'),
    firstReminderAt: timestamp('first_reminder_at'),
    escalatedAt: timestamp('escalated_at'),
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
    ticketId: varchar('ticket_id', { length: 100 }),
    createdBy: uuid('created_by').references(() => staffUsers.id),
    voidedBy: uuid('voided_by').references(() => staffUsers.id),
    voidedAt: timestamp('voided_at'),
    voidReason: text('void_reason'),
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
    uniqueIndex('loyalty_transactions_ticket_earn_idx')
      .on(t.ticketId)
      .where(sql`transaction_type = 'earn'`),
  ]
)

export const staffUsers = pgTable('staff_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  role: staffRole('role').notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const redemptions = pgTable(
  'redemptions',
  {
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
    ticketId: varchar('ticket_id', { length: 100 }).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => staffUsers.id),
    usedBy: uuid('used_by').references(() => staffUsers.id),
    status: redemptionStatus('status').notNull().default('used'),
    usedAt: timestamp('used_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [uniqueIndex('redemptions_ticket_id_idx').on(t.ticketId)]
)

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

// ─── Menu tables (food + drinks) ───────────────────────────────────────────────

export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: menuCategoryKey('key').notNull().unique(),
    nameEs: varchar('name_es', { length: 80 }).notNull(),
    nameEn: varchar('name_en', { length: 80 }).notNull(),
    displayOrder: integer('display_order').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    fileName: text('file_name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [
    uniqueIndex('menu_categories_key_idx').on(t.key),
    index('menu_categories_order_idx').on(t.displayOrder),
    check('menu_categories_order_nonnegative', sql`${t.displayOrder} >= 0`),
  ]
)

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id),
    nameEs: varchar('name_es', { length: 120 }).notNull(),
    nameEn: varchar('name_en', { length: 120 }).notNull(),
    descriptionEs: text('description_es').notNull().default(''),
    descriptionEn: text('description_en').notNull().default(''),
    locationType: menuLocationType('location_type').notNull().default('both'),
    price: decimal('price', { precision: 8, scale: 2 }),
    includedInAyce: boolean('included_in_ayce').notNull().default(true),
    fileName: text('file_name'),
    badgeEs: varchar('badge_es', { length: 40 }),
    badgeEn: varchar('badge_en', { length: 40 }),
    featured: boolean('featured').notNull().default(false),
    drinkGroupId: uuid('drink_group_id').references(() => drinkGroups.id),
    drinkSubGroupId: uuid('drink_sub_group_id').references(
      () => drinkSubGroups.id
    ),
    requiresSauce: boolean('requires_sauce').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [
    index('menu_items_featured_active_idx')
      .on(t.featured, t.isActive)
      .where(sql`featured = true AND is_active = true`),
    index('menu_items_category_order_idx').on(t.categoryId, t.displayOrder),
    index('menu_items_location_type_idx').on(t.locationType),
    check('menu_items_price_nonnegative', sql`price IS NULL OR price >= 0`),
    check('menu_items_order_nonnegative', sql`${t.displayOrder} >= 0`),
  ]
)

export const sauces = pgTable(
  'sauces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nameEs: varchar('name_es', { length: 60 }).notNull(),
    nameEn: varchar('name_en', { length: 60 }).notNull(),
    // 0 = no heat, 1 = mild, 2 = medium, 3 = hot, 4 = extra hot
    spiceLevel: integer('spice_level').notNull().default(0),
    fileName: text('file_name'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [check('sauces_spice_level_nonnegative', sql`${t.spiceLevel} >= 0`)]
)

export const drinkGroups = pgTable('drink_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupKey: varchar('group_key', { length: 60 }).notNull().unique(),
  subtitleEs: text('subtitle_es'),
  subtitleEn: text('subtitle_en'),
  promoEs: text('promo_es'),
  promoEn: text('promo_en'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const drinkSubGroups = pgTable(
  'drink_sub_group',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    drinkGroupId: uuid('drink_group_id')
      .notNull()
      .references(() => drinkGroups.id),
    key: varchar('key', { length: 60 }).notNull().unique(),
    nameEs: text('name_es').notNull(),
    nameEn: text('name_en').notNull(),
    subtitleEs: text('subtitle_es'),
    subtitleEn: text('subtitle_en'),
    promoEs: text('promo_es'),
    promoEn: text('promo_en'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  t => [
    index('drink_sub_group_group_order_idx').on(t.drinkGroupId, t.displayOrder),
  ]
)
