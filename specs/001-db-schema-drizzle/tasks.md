# Tasks: Database Schema & Local Development Environment

**Input**: Design documents from `specs/001-db-schema-drizzle/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Align existing config files with the Neon + Drizzle-only decision before any schema work.

- [x] T001 Remove `POSTGRES_PRISMA_URL` from `server/utils/env.ts` Zod schema — `DATABASE_URL` is the only required DB variable
- [x] T002 Verify `drizzle.config.ts` uses `dialect: 'postgresql'` and points to `server/db/schema.ts` and `server/db/migrations` — no changes needed if already correct
- [x] T003 [P] Update `.env.example` to document local Docker format (`postgresql://sumo:sumo@localhost:5432/sumo_ayce`) vs Neon production format as inline comments

---

## Phase 2: Foundational — Local Database Environment

**Purpose**: Local PostgreSQL instance via Docker Compose. **Blocks US1 validation** — migration cannot be tested without a running database.

**⚠️ CRITICAL**: Complete before starting Phase 3 implementation testing.

- [x] T004 [US2] Create `docker-compose.yml` at project root with PostgreSQL 16 service, named volume `sumo_pg_data`, credentials matching `.env.example` local values, port 5433
- [x] T005 [US2] Add `db:up` (`docker compose up -d`) and `db:down` (`docker compose down`) scripts to `package.json`
- [x] T006 [US2] Create `.env.local` at project root with `DATABASE_URL=postgresql://sumo:sumo@localhost:5433/sumo_ayce` — required for all `pnpm db:*` commands to resolve the connection string
- [x] T007 [US2] Start the container (`pnpm db:up`) and verify connection using `pnpm db:studio` or `psql` — confirm the database is reachable with the credentials from `.env.local`

**Checkpoint**: Local PostgreSQL is running, `.env.local` has `DATABASE_URL`, migration can now be tested.

---

## Phase 3: Full Schema Definition & Migration — [US1] 🎯 MVP

**Goal**: All 8 tables created in the local database via a single migration with correct columns, types, constraints, and indexes.

**Independent Test**: Run `pnpm db:migrate` against local Docker PostgreSQL and verify all 8 tables appear in Drizzle Studio with the correct structure.

- [x] T008 [US1] Define 4 enums in `server/db/schema.ts`: `reservationStatus`, `loyaltyTransactionType`, `redemptionStatus`, `staffRole` using `pgEnum`
- [x] T009 [US1] Define `branches` table in `server/db/schema.ts` — uuid PK, name, address, phone, lat, lng, schedule (jsonb), is_active, created_at, updated_at
- [x] T010 [US1] Define `customers` table in `server/db/schema.ts` — uuid PK, name, phone (unique), whatsapp_opt_in, points_balance, timestamps, deleted_at
- [x] T011 [US1] Define `rewards` table in `server/db/schema.ts` — uuid PK, name, description, points_cost, is_active, timestamps (no branch FK — brand-wide)
- [x] T012 [US1] Define `reservations` table in `server/db/schema.ts` — uuid PK, branch_id FK, contact_name, contact_phone, party_size (check > 0), reservation_date, reservation_time, status enum, notes, timestamps, deleted_at — NO customer_id FK (reservations are fully anonymous from the landing page form)
- [x] T013 [US1] Define `loyalty_transactions` table in `server/db/schema.ts` — uuid PK, customer_id FK, branch_id FK, points_delta (check ≠ 0), transaction_type enum, reference_id nullable, created_at, deleted_at (no updated_at — immutable)
- [x] T014 [US1] Define `staff_users` table in `server/db/schema.ts` — uuid PK, name, email (unique), role enum (staff/manager/admin), branch_id FK nullable (null = all branches for admin only), password_hash, is_active, timestamps
- [x] T015 [US1] Define `redemptions` table in `server/db/schema.ts` — uuid PK, customer_id FK, reward_id FK, branch_id FK, used_by FK nullable → staff_users.id, status enum, used_at nullable, created_at, updated_at
- [x] T016 [US1] Define `staff_sessions` table in `server/db/schema.ts` — uuid PK, staff_user_id FK, token (unique), expires_at, ip_address (inet), created_at (no updated_at — immutable)
- [x] T017 [US1] Add all indexes from `specs/001-db-schema-drizzle/data-model.md` to `server/db/schema.ts`: composite indexes on reservations, loyalty_transactions; unique indexes on customers.phone, staff_users.email, staff_sessions.token
- [x] T018 [US1] Run `pnpm db:generate` — confirm a single migration file is created in `server/db/migrations/` with no errors
- [x] T019 [US1] Run `pnpm db:migrate` against local Docker PostgreSQL — confirm all 8 tables created, zero errors
- [x] T020 [US1] Open `pnpm db:studio` and visually verify: all 8 tables present, FK relationships correct, enums defined, indexes visible

**Checkpoint**: US1 complete — local database has the full schema. All features can now be developed.

---

## Phase 4: Schema Iteration Workflow — [US3]

**Goal**: Validate that incremental schema changes can be applied without data loss.

**Independent Test**: Add a nullable column, migrate, verify it exists; then remove it and verify the revert also works cleanly.

- [x] T021 [US3] Add a nullable `whatsapp_number` varchar column to `branches` table in `server/db/schema.ts` as a test change
- [x] T022 [US3] Run `pnpm db:generate` — confirm a second incremental migration file is generated (not a full reset)
- [x] T023 [US3] Run `pnpm db:migrate` — verify the column was added to the `branches` table without touching any other table or data
- [x] T024 [US3] Remove the test `whatsapp_number` column from `server/db/schema.ts`, run `pnpm db:generate` + `pnpm db:migrate` to restore clean state
- [x] T025 [US3] Update `specs/001-db-schema-drizzle/quickstart.md` if any step in the iteration workflow differs from what was documented

**Checkpoint**: US3 complete — incremental migration workflow validated.

---

## Phase 5: Polish & Cross-Cutting

- [x] T026 [P] Ensure `server/db/schema.ts` exports all tables and enums as named exports so `drizzle.config.ts` and `server/utils/db.ts` can import cleanly
- [x] T027 Manually verify `server/utils/env.ts` startup failure: temporarily remove `DATABASE_URL` from `.env.local`, run `pnpm dev`, confirm error message lists the missing variable, then restore
- [x] T028 [P] Commit all schema files: `server/db/schema.ts`, `server/db/migrations/`, `docker-compose.yml`, updated `package.json`, updated `.env.example`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks US1 testing**
- **US1 (Phase 3)**: Schema writing starts after Phase 1; migration testing requires Phase 2
- **US3 (Phase 4)**: Depends on US1 completion
- **Polish (Phase 5)**: Depends on US1 + US3 completion

### User Story Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Docker / US2)
            └── Phase 3 (Schema / US1) ← MVP
                    └── Phase 4 (Iteration / US3)
                            └── Phase 5 (Polish)
```

### Within Phase 3

- T008–T011 (enums + base tables with no FK): written first, order among themselves is free
- T012–T016 (FK-dependent tables): written after T008–T011
- T017 (indexes): written after all tables are defined
- T018 (generate): after T017
- T019–T020 (migrate + verify): require Docker running (Phase 2 complete)

### Parallel Opportunities

- T003, T004 can start simultaneously once Phase 1 is done
- T008–T011 can be written in the same session in any order (same file, no inter-dependencies)
- T026 and T027 can run in parallel in Phase 5

---

## Parallel Example: Phase 3 (US1)

```bash
# Within a single session, these 4 table definitions have no inter-dependencies:
Task T008: Define 4 enums in server/db/schema.ts
Task T009: Define branches table in server/db/schema.ts
Task T010: Define customers table in server/db/schema.ts
Task T011: Define rewards table in server/db/schema.ts

# Then sequentially (FK dependencies):
Task T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Docker / US2 (T004–T007)
3. Complete Phase 3: Schema / US1 (T008–T020)
4. **STOP and VALIDATE**: All 8 tables visible in Drizzle Studio
5. All other feature branches can now start

### Incremental Delivery

1. Phase 1 + 2 → Local DB running
2. Phase 3 → Full schema migrated (**MVP — unblocks all other features**)
3. Phase 4 → Iteration workflow validated
4. Phase 5 → Polish and commit

---

## Notes

- `server/db/schema.ts` is a single file until it exceeds 200 lines (Constitution VII) — at ~140 lines for 8 tables + 4 enums it stays as one file
- Drizzle `push` mode (`drizzle-kit push`) is NOT used in this project — always use `generate` + `migrate` for an audit trail
- `updated_at` is NOT auto-updated by Drizzle — application code must set it on every UPDATE
- `staff_sessions` and `loyalty_transactions` have no `updated_at` — they are append-only/immutable
- Soft-delete tables (`customers`, `reservations`, `loyalty_transactions`) require `WHERE deleted_at IS NULL` in all queries
