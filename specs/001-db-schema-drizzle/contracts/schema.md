# Schema Contract

**Version**: 1.0.0 | **Date**: 2026-05-22

This document is the authoritative contract for the database schema. Any change to table names, column names, types, or constraints constitutes a breaking change and requires a new migration file plus a version bump here.

---

## Tables

| Table | Description |
|-------|-------------|
| `branches` | Physical restaurant locations |
| `customers` | Loyalty program registered users |
| `reservations` | Bookings (anonymous or linked to customer) |
| `loyalty_transactions` | Immutable ledger of point earn/redeem events |
| `rewards` | Brand-wide redeemable reward catalog |
| `redemptions` | Customer reward redemption records |
| `staff_users` | Staff and admin accounts |
| `staff_sessions` | Active staff login sessions |

## Enums

| Enum | Values |
|------|--------|
| `reservation_status` | `pending`, `confirmed`, `cancelled` |
| `loyalty_transaction_type` | `earn`, `redeem` |
| `redemption_status` | `pending`, `used`, `expired` |
| `staff_role` | `staff`, `manager`, `admin` |

## Soft-Delete Tables

Only these tables support soft-delete via `deleted_at`:

- `customers`
- `reservations`
- `loyalty_transactions`

All queries against these tables MUST filter `WHERE deleted_at IS NULL` unless explicitly fetching deleted records for audit.

## Immutable Tables

These tables are append-only once a row is created:

- `loyalty_transactions` — no `updated_at`, no soft-delete update allowed
- `staff_sessions` — no `updated_at`, expiry enforced by `expires_at`

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (HTTP-based) |

The application MUST NOT start if `DATABASE_URL` is missing or empty (validated by `server/utils/env.ts`).
