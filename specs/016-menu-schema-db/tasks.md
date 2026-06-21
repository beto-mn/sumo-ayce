---
description: "Task list for feature 016 — Menu Database Schema & Migration"
---

# Tasks: Menu Database Schema & Migration

**Input**: `specs/016-menu-schema-db/spec.md` + `specs/016-menu-schema-db/plan.md`  
**Prerequisites**: Migration 0007 applied to Neon DB; `DATABASE_URL` in `.env`

---

## Phase 1: Schema (Blocking Prerequisite)

**Purpose**: Apply the stash + add `file_name` + generate migration. MUST complete before any other task.

- [ ] T001 Apply `git stash@{0}` to restore schema additions (3 enums + 3 tables without `file_name`) into `server/db/schema.ts`
- [ ] T002 Add `fileName: text('file_name')` (nullable) to `menuCategories` table in `server/db/schema.ts`
- [ ] T003 [P] Add `fileName: text('file_name')` (nullable) to `dishes` table in `server/db/schema.ts`
- [ ] T004 [P] Add `fileName: text('file_name')` (nullable) to `sauces` table in `server/db/schema.ts`
- [ ] T005 Run `pnpm db:generate` — produces `server/db/migrations/0008_flat_blindfold.sql` (depends on T002–T004)

**Checkpoint**: `server/db/migrations/0008_flat_blindfold.sql` exists and contains `CREATE TYPE`, `CREATE TABLE menu_categories`, `CREATE TABLE dishes`, `CREATE TABLE sauces` — each with `file_name text` column.

---

## Phase 2: Migration

**Purpose**: Apply migration to production Neon DB.

- [ ] T006 Run `pnpm db:migrate` against Neon production DB (depends on T005; credentials from `.env`)
- [ ] T007 Verify migration: query DB to confirm `menu_categories`, `dishes`, `sauces` tables exist with correct columns (use `drizzle-kit studio` or direct SQL)

**Checkpoint**: Three new tables present in production DB. Existing tables (branches, reservations, loyalty, staff) have unchanged row counts.

---

## Phase 3: Query Helpers — Tests first, then Implementation

**Purpose**: `getFeaturedDishes()` and `getFullMenu()` with type-safe return values.

- [ ] T008 [P] Write failing Vitest test for `getFeaturedDishes()` in `tests/db/menu-queries.test.ts` — assert it returns only dishes where `featured = true AND is_active = true`, each with category join fields
- [ ] T009 [P] Write failing Vitest test for `getFullMenu({ locationType: 'ayce' })` in `tests/db/menu-queries.test.ts` — assert Express-only dishes are excluded
- [ ] T010 Implement `server/db/queries/menu.ts` — `getFeaturedDishes()` using Drizzle `select().from(dishes).where(...).innerJoin(menuCategories, ...)` (depends on T008, T009)
- [ ] T011 Implement `getFullMenu(options?)` in `server/db/queries/menu.ts` — filter `is_active = true`, optional `locationType` filter ('ayce' returns ayce+both; 'express' returns express+both) (depends on T010)
- [ ] T012 Run `pnpm test` — all new tests pass, no regressions (depends on T010, T011)

**Checkpoint**: `pnpm test` green. Query helpers are fully typed (return type inferred from Drizzle, no `any`).

---

## Phase 4: Seed

**Purpose**: Populate production DB with initial menu data.

- [ ] T013 Implement `server/db/seed.ts` — 13 `menuCategories` rows with `key`, `nameEs`, `nameEn`, `displayOrder` (matching enum order: entradas=0, burgers=1, sandwich=2, burritos=3, hotdogs=4, frio=5, caliente=6, dulce=7, postres=8, alitas=9, salsas=10, extras=11, bebidas=12); upsert via `onConflictDoNothing()` on `key`
- [ ] T014 Add `dishes` rows to seed — at minimum one per category; flag `featured = true` for at least 4 dishes used on the homepage rail; set `requiresSauce = true` for alitas/boneless dishes; set `locationType` per SUMO rules (burritos/postres = express, sandwich = ayce, others = both)
- [ ] T015 Add `sauces` rows to seed — 12 sauces (bilingual names); upsert via `onConflictDoNothing()` on `nameEs`
- [ ] T016 Run `pnpm db:seed` — confirm 13 categories, ≥13 dishes, 12 sauces inserted
- [ ] T017 Run `pnpm db:seed` a second time — confirm no duplicate rows (idempotency check)

**Checkpoint**: DB has 13 categories, ≥13 dishes (≥4 featured), 12 sauces. Second seed run changes 0 rows.

---

## Phase 5: GitHub Actions migration step

**Purpose**: Aplicar migraciones pendientes automáticamente en cada deploy a producción, antes de que Vercel despliegue el código.

- [ ] T018 Leer `.github/workflows/production.yml` para entender su estructura actual
- [ ] T019 Agregar step "Run DB migrations" en `production.yml` **antes** del primer step de Vercel, usando `DATABASE_URL: ${{ secrets.DATABASE_URL }}`:
  ```yaml
  - name: Run DB migrations
    run: pnpm db:migrate
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
  ```
- [ ] T020 Documentar en `docs/harness/ci-cd.md` que `DATABASE_URL` debe agregarse como GitHub Secret (Settings → Secrets and variables → Actions → New repository secret)

**Checkpoint**: `production.yml` tiene el step de migración antes de los steps de Vercel. El step usa `secrets.DATABASE_URL`.

---

## Phase 6: Final Verification

- [ ] T021 Run `./init.sh` — all checks green (typecheck + tests)
- [ ] T022 [P] Update `feature_list.json` — set `"status": "done"` for feature 016
- [ ] T023 [P] Update `progress/current.md` — record feature 016 as done; set next feature to 011

---

## Dependencies & Execution Order

- **T001 → T002–T004 (parallel) → T005 → T006 → T007**: Schema pipeline; strictly sequential.
- **T008–T009 (parallel, write tests) → T010 → T011 → T012**: Query helpers; tests before code.
- **T013 → T014 → T015 → T016 → T017**: Seed pipeline; strictly sequential.
- **T018 → T019 → T020**: GitHub Actions step; secuencial.
- **T021 → T022–T023 (parallel)**: Final gate; depends on all phases complete.
- Phases 3 (queries) and 4 (seed) can begin in parallel after Phase 2 checkpoint (T007 done).
