# Feature Specification: Menu Database Schema & Migration

**Feature Branch**: `chore/011-menu-schema-db`  
**Feature ID**: 016  
**Created**: 2026-06-20  
**Status**: Draft  
**Input**: Add menu tables (menuCategories, dishes, sauces) + enums to the Drizzle/Neon schema, each with a file_name column for local image asset resolution. Includes migration to production Neon PostgreSQL, seed data, and query helpers.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Menu tables exist in the production DB (Priority: P1)

A developer runs the Drizzle migration against the production Neon PostgreSQL database and all three menu tables — `menu_categories`, `dishes`, and `sauces` — are created with their full column sets and indexes. No existing data or tables are affected.

**Why this priority**: All menu-page features (011, 012) depend on this schema being present. Nothing can be built on top without it.

**Independent Test**: After running `pnpm db:migrate`, connect to the database and verify the three tables exist with the correct columns, types, and constraints using `drizzle-kit studio` or a direct query.

**Acceptance Scenarios**:

1. **Given** the production Neon DB has migrations up to 0007 applied, **When** the developer runs `pnpm db:migrate`, **Then** tables `menu_categories`, `dishes`, and `sauces` are created with zero errors and all declared columns are present.
2. **Given** the tables already exist (migration already applied), **When** the developer runs `pnpm db:migrate` again, **Then** the command is a no-op and returns success.
3. **Given** `DATABASE_URL` is missing from `.env`, **When** the developer runs `pnpm db:migrate`, **Then** the command fails with a clear error identifying the missing variable before touching the database.
4. **Given** a dish references a `category_id` that does not exist, **When** the row is inserted, **Then** the database rejects it with a foreign key constraint error.
5. **Given** two rows in `menu_categories` have the same `key` value, **When** the second insert is attempted, **Then** the database rejects it with a unique constraint error.

---

### User Story 2 — Initial seed data populates all 13 categories (Priority: P2)

A developer runs the seed script and the database is populated with all 13 menu category records (entradas, burgers, sandwich, burritos, hotdogs, frio, caliente, dulce, postres, alitas, salsas, extras, bebidas) plus a representative set of dishes for each category. The seed is idempotent.

**Why this priority**: Without seed data, the menu page cannot be developed or previewed locally. The seed unblocks feature 011 immediately after this feature lands.

**Independent Test**: Run `pnpm db:seed`, then query `SELECT count(*) FROM menu_categories` and verify the result is 13. Query dishes and verify at least one dish exists per category.

**Acceptance Scenarios**:

1. **Given** empty `menu_categories` and `dishes` tables, **When** the developer runs `pnpm db:seed`, **Then** all 13 categories are inserted and at least one dish per category is present.
2. **Given** the seed has already been run once, **When** the developer runs `pnpm db:seed` again, **Then** no duplicates are created (upsert / on-conflict behavior).
3. **Given** a dish in the seed data belongs to `alitas` or `salsas`, **When** the seed runs, **Then** the sauce records in the `sauces` table are also populated.
4. **Given** a dish in the seed has `featured: true`, **When** the `getFeaturedDishes()` query is called, **Then** that dish is returned in the result.

---

### User Story 4 — GitHub Actions aplica migraciones pendientes en cada deploy a producción (Priority: P2)

Un nuevo commit llega a `master` con un archivo de migración nuevo. El workflow `production.yml` detecta que hay migraciones pendientes y las aplica automáticamente contra Neon **antes** de que el código nuevo se despliegue a Vercel. Si no hay migraciones pendientes, el paso es un no-op.

**Why this priority**: Sin esto, un deploy podría publicar código que espera columnas o tablas que aún no existen en la BD, causando errores en producción.

**Independent Test**: Agregar un archivo `.sql` de prueba a `server/db/migrations/`, hacer push a `master`, y verificar en los logs de GitHub Actions que el paso "Run DB migrations" se ejecuta y termina con exit code 0.

**Acceptance Scenarios**:

1. **Given** hay una migración nueva en `server/db/migrations/` que no ha sido aplicada, **When** el workflow `production.yml` se ejecuta, **Then** el paso "Run DB migrations" corre `pnpm db:migrate` y lo aplica antes del paso de deploy a Vercel.
2. **Given** todas las migraciones ya están aplicadas, **When** el workflow `production.yml` se ejecuta, **Then** el paso "Run DB migrations" corre `pnpm db:migrate`, no modifica la BD, y termina con exit code 0 (no-op idempotente).
3. **Given** `DATABASE_URL` no está configurado como secret en el repositorio de GitHub, **When** el workflow intenta correr `pnpm db:migrate`, **Then** el step falla con un error claro antes de tocar Vercel.
4. **Given** la migración falla (ej. SQL inválido o conflicto), **When** el step de migración termina con exit code distinto de 0, **Then** el workflow se cancela y el deploy a Vercel NO se ejecuta.

---

### User Story 3 — Query helpers return structured menu data (Priority: P3)

A backend developer calls `getFeaturedDishes()` and `getFullMenu()` from `server/db/queries/menu.ts` and receives correctly typed, category-joined results without writing raw SQL.

**Why this priority**: These helpers are the direct data layer that the menu server route will call. Without them, the menu page (feature 011) must re-implement the same logic.

**Independent Test**: In a Vitest unit test (against the real Neon DB or a seeded test DB), call `getFeaturedDishes()` and verify the returned array contains only dishes where `featured = true` AND `is_active = true`, each with their associated category.

**Acceptance Scenarios**:

1. **Given** the DB has seeded dishes with `featured = true` and `is_active = true`, **When** `getFeaturedDishes()` is called, **Then** only featured active dishes are returned, each including their category's `key`, `nameEs`, and `nameEn`.
2. **Given** a dish has `featured = true` but `is_active = false`, **When** `getFeaturedDishes()` is called, **Then** that dish is NOT included in the result.
3. **Given** the DB has dishes with different `locationType` values, **When** `getFullMenu({ locationType: 'ayce' })` is called, **Then** only dishes where `locationType = 'ayce'` or `'both'` are returned.
4. **Given** `getFullMenu()` is called with no filter, **When** the result is examined, **Then** all active dishes are returned grouped by their category.

---

### Edge Cases

- What happens when `pnpm db:migrate` is run against a DB that already has a partial migration applied?
- What happens when `pnpm db:seed` is run before the migration (tables don't exist)?
- What happens when a dish has `drinkGroup` set but its category is not `bebidas`?
- What happens when `file_name` is null for a dish — does the frontend fallback gracefully?
- What happens when `price` is null for a dish that has `included_in_ayce = false`?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a `menu_categories` table with the following columns: `id` (UUID PK), `key` (enum of 13 fixed values, unique), `name_es` (varchar 80), `name_en` (varchar 80), `display_order` (non-negative integer), `is_active` (boolean, default true), `file_name` (text, nullable), `created_at`, `updated_at`.
- **FR-002**: The system MUST create a `menu_items` table (covers both food and drinks) with the following columns: `id` (UUID PK), `category_id` (FK to `menu_categories`), `name_es` (varchar 120), `name_en` (varchar 120), `description_es` (text, default empty), `description_en` (text, default empty), `location_type` (enum: ayce/express/both, default both), `price` (decimal, nullable), `included_in_ayce` (boolean, default true), `file_name` (text, nullable — local project image filename), `badge` (varchar 40, nullable), `featured` (boolean, default false), `drink_group` (enum, nullable — only for bebidas items), `requires_sauce` (boolean, default false), `is_active` (boolean, default true), `display_order` (non-negative integer, default 0), `created_at`, `updated_at`.
- **FR-003**: The system MUST create a `sauces` table with: `id` (UUID PK), `name_es` (varchar 60), `name_en` (varchar 60), `is_active` (boolean, default true), `display_order` (non-negative integer, default 0), `created_at`, `updated_at`. Sauces do NOT have an image column.
- **FR-004**: The system MUST define three PostgreSQL enums: `menu_location_type` (ayce/express/both), `menu_category_key` (13 fixed category slugs), `drink_group` (6 drink sub-group identifiers).
- **FR-005**: The `file_name` column on `menu_categories` and `menu_items` MUST store only the filename (e.g., `alitas-bbq.jpg`) without any path prefix. The frontend resolves the full path as `public/images/menu/<file_name>`.
- **FR-006**: The migration MUST be applied to the production Neon PostgreSQL database via `pnpm db:migrate`. No Docker dependency — credentials come from `.env`.
- **FR-007**: A seed script at `server/db/seed.ts` MUST insert all 13 menu categories (matching the 13 `menu_category_key` enum values) with bilingual names and display order. It MUST also insert a representative set of dishes (at minimum one per category) and all sauces (12 total for the wings/boneless picker).
- **FR-008**: The seed script MUST be idempotent — running it multiple times MUST NOT create duplicates (use upsert with on-conflict).
- **FR-009**: A query helper file at `server/db/queries/menu.ts` MUST export `getFeaturedDishes()` which returns `featured = true AND is_active = true` dishes joined with their category.
- **FR-010**: The query helper file MUST export `getFullMenu(options?)` which returns all `is_active = true` dishes joined with their category, filterable by `locationType` ('ayce' | 'express').
- **FR-011**: The migration file name is `0008_flat_blindfold` (pre-assigned tag from the stash draft). The generated SQL MUST include the `file_name` columns on `menu_categories` and `menu_items`.
- **FR-012**: The GitHub Actions workflow `production.yml` MUST include a "Run DB migrations" step that executes `pnpm db:migrate` using `DATABASE_URL` from GitHub Secrets, **before** the Vercel deploy step. The command is idempotent — if no pending migrations exist, it exits 0 without modifying the DB. If the migration step fails, the workflow MUST cancel and the deploy MUST NOT proceed.

### Key Entities

- **MenuCategory**: Represents a logical grouping of menu items (e.g., Entradas, Burgers, Bebidas). Has a fixed code key that is referenced in frontend category chips. Includes a `file_name` for the category image shown in the UI.
- **MenuItem**: A single item on the SUMO AYCE or Express menu — covers both food and drinks (bebidas). Belongs to exactly one category. Has bilingual name/description, location applicability (AYCE-only, Express-only, or both), an optional à la carte price, and a `file_name` for the local project image. Drink items additionally have a `drink_group` for sub-section grouping.
- **Sauce**: One of the 12 sauce options the customer picks when ordering Wings or Boneless. Has bilingual names only — no image column.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three menu tables and three enums are present in the production DB within one migration run (zero manual SQL required).
- **SC-002**: `pnpm db:seed` populates all 13 categories and at least 1 dish per category in under 10 seconds.
- **SC-003**: Running `pnpm db:seed` a second time produces zero new rows (idempotent).
- **SC-004**: `getFeaturedDishes()` returns only featured active dishes with category data — verifiable in a test that inserts a non-featured dish and confirms it is absent from the result.
- **SC-005**: `getFullMenu({ locationType: 'ayce' })` excludes Express-only dishes — verifiable by seeding one Express-only dish and confirming it does not appear in the AYCE result.
- **SC-006**: The migration does not alter or drop any existing tables (branches, customers, reservations, loyalty, staff) — confirmed by running the migration and checking existing row counts before/after.
- **SC-007**: A push to `master` that includes a new migration file triggers the "Run DB migrations" step in `production.yml` before the Vercel deploy step, and both steps complete with exit code 0.

---

## Assumptions

- The production Neon PostgreSQL connection string is available in `.env` as `DATABASE_URL`. No Docker or local Postgres instance is required.
- Migration tag `0008_flat_blindfold` was pre-assigned in the stash draft journal; the generated SQL MUST keep this tag to avoid journal divergence.
- The 13 category keys are fixed code values referenced by frontend category chips — they MUST NOT be changed without a coordinated frontend update.
- The 12 sauce records correspond to the sauce picker in the Wings & Boneless section of the menu UI. Their `name_es` / `name_en` values are definitive for the UI.
- `file_name` is the only image field on `menu_items` and `menu_categories`. It stores the local project asset filename; the frontend resolves the full path. Sauces have no image field.
- The stash draft was applied and migration 0008 was generated and applied to Neon. Subsequent schema changes (rename dishes→menu_items, drop image_url, drop file_name from sauces, rename indexes) require a new migration 0009.
- `DATABASE_URL` must be added as a GitHub Secret (repo Settings → Secrets → Actions) for the GitHub Actions migration step to work.
- The `db:seed` script uses the `DATABASE_URL` from `.env` (same as migration). The `db:seed` npm script already has `--env-file-if-exists=.env.local` in `package.json` (from the stash patch).
- Soft-delete is not used for menu entities; instead `is_active = false` deactivates a row.
