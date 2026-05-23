# Data Model: Database Schema

**Date**: 2026-05-22 | **Branch**: `feat/001-db-schema-drizzle`

---

## Entity Relationship Overview

```
branches ──────────────────────────────────────────┐
   │                                               │
   ├── reservations (branch_id)                    │
   │       (no customer FK — fully anonymous)      │
   │                                               │
   ├── loyalty_transactions (branch_id)            │
   │       └── customers (customer_id)             │
   │                                               │
   ├── redemptions (branch_id)                     │
   │       ├── customers (customer_id)             │
   │       ├── rewards (reward_id)                 │
   │       └── staff_users (used_by, nullable)     │
   │                                               │
   └── staff_users (branch_id, nullable)           │
           └── staff_sessions (staff_user_id)      │
                                                   │
rewards ────────────────────────────────────────── ┘
  (brand-wide, no branch FK)

customers  (created by staff only — no public registration)
```

**Reservations are fully anonymous**: Created from the public landing page form. No customer account required or linked. `contact_name` and `contact_phone` are collected directly in the form.

**Loyalty is brand-wide**: A customer earns and redeems points across all branches. `branch_id` in `loyalty_transactions` and `redemptions` records WHERE the event happened — it does not scope the balance. Customers are registered by staff, never self-registered.

---

## Enums

```ts
// reservation status
pgEnum('reservation_status', ['pending', 'confirmed', 'cancelled'])

// loyalty transaction type
pgEnum('loyalty_transaction_type', ['earn', 'redeem'])

// redemption status
pgEnum('redemption_status', ['pending', 'used', 'expired'])

// staff role
pgEnum('staff_role', ['staff', 'manager', 'admin'])
```

---

## Tables

### `branches`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar(100)` | NOT NULL |
| `address` | `text` | NOT NULL |
| `phone` | `varchar(20)` | nullable |
| `lat` | `decimal(10,8)` | nullable |
| `lng` | `decimal(11,8)` | nullable |
| `schedule` | `jsonb` | nullable (hours per weekday) |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `updated_at` | `timestamp` | NOT NULL, default `now()` |

No soft-delete — deactivation via `is_active`.

---

### `customers`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar(100)` | NOT NULL |
| `phone` | `varchar(20)` | NOT NULL, UNIQUE |
| `whatsapp_opt_in` | `boolean` | NOT NULL, default `false` |
| `points_balance` | `integer` | NOT NULL, default `0` |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `updated_at` | `timestamp` | NOT NULL, default `now()` |
| `deleted_at` | `timestamp` | nullable (soft-delete) |

`phone` is the unique identifier — customers register via WhatsApp number, no email required.

---

### `reservations`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `branch_id` | `uuid` | NOT NULL, FK → `branches.id` |
| `contact_name` | `varchar(100)` | NOT NULL |
| `contact_phone` | `varchar(20)` | NOT NULL |
| `party_size` | `integer` | NOT NULL, CHECK > 0 |
| `reservation_date` | `date` | NOT NULL |
| `reservation_time` | `time` | NOT NULL |
| `status` | `reservation_status` | NOT NULL, default `'pending'` |
| `notes` | `text` | nullable |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `updated_at` | `timestamp` | NOT NULL, default `now()` |
| `deleted_at` | `timestamp` | nullable (soft-delete) |

No `customer_id` — reservations are fully anonymous, created from the public landing page form. There is no link between a reservation and a loyalty account.

---

### `loyalty_transactions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `customer_id` | `uuid` | NOT NULL, FK → `customers.id` |
| `branch_id` | `uuid` | NOT NULL, FK → `branches.id` |
| `points_delta` | `integer` | NOT NULL (positive = earn, negative = redeem) |
| `transaction_type` | `loyalty_transaction_type` | NOT NULL |
| `reference_id` | `uuid` | nullable (FK → `redemptions.id` when type = redeem) |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `deleted_at` | `timestamp` | nullable (soft-delete for audit) |

No `updated_at` — transactions are immutable once created.

---

### `rewards`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar(100)` | NOT NULL |
| `description` | `text` | nullable |
| `points_cost` | `integer` | NOT NULL, CHECK > 0 |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `updated_at` | `timestamp` | NOT NULL, default `now()` |

Brand-wide catalog — no branch FK. No soft-delete; deactivated via `is_active`.

---

### `redemptions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `customer_id` | `uuid` | NOT NULL, FK → `customers.id` |
| `reward_id` | `uuid` | NOT NULL, FK → `rewards.id` |
| `branch_id` | `uuid` | NOT NULL, FK → `branches.id` |
| `used_by` | `uuid` | nullable, FK → `staff_users.id` |
| `status` | `redemption_status` | NOT NULL, default `'pending'` |
| `used_at` | `timestamp` | nullable |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `updated_at` | `timestamp` | NOT NULL, default `now()` |

`branch_id` records WHERE the reward was used. `used_by` is nullable — populated when the staff member marks the reward as used in the dashboard.

---

### `staff_users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar(100)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `role` | `staff_role` | NOT NULL |
| `branch_id` | `uuid` | nullable, FK → `branches.id` |
| `password_hash` | `varchar(255)` | NOT NULL |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamp` | NOT NULL, default `now()` |
| `updated_at` | `timestamp` | NOT NULL, default `now()` |

`branch_id` is nullable — `admin` role has access to all branches (null = no restriction). `staff` and `manager` roles MUST have a branch assigned. `manager` receives WhatsApp reservation notifications and can view branch reports.

---

### `staff_sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `staff_user_id` | `uuid` | NOT NULL, FK → `staff_users.id` |
| `token` | `varchar(255)` | NOT NULL, UNIQUE |
| `expires_at` | `timestamp` | NOT NULL |
| `ip_address` | `inet` | nullable |
| `created_at` | `timestamp` | NOT NULL, default `now()` |

No `updated_at` — sessions are immutable. Expiry is enforced by `expires_at` check, not soft-delete.

---

## Indexes (beyond PKs)

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| `customers` | `phone` | UNIQUE | Login lookup by phone |
| `reservations` | `branch_id, reservation_date` | COMPOSITE | Daily reservation queries per branch |
| `loyalty_transactions` | `customer_id` | INDEX | Balance recalculation |
| `loyalty_transactions` | `branch_id, created_at` | COMPOSITE | Daily CSV report |
| `staff_users` | `email` | UNIQUE | Login lookup |
| `staff_sessions` | `token` | UNIQUE | Auth token lookup |

---

## Validation Rules (enforced at DB level)

- `reservations.party_size` > 0
- `rewards.points_cost` > 0
- `loyalty_transactions.points_delta` ≠ 0
- `staff_sessions.expires_at` > `created_at` (enforced at application level on insert)
