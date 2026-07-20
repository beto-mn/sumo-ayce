# Quickstart: À La Carte Combo Notes & Menu Copy Refresh

## What this feature touches

**[Revised]** Part C's design changed after the spec_ready human review — see `research.md`'s R3
revision note. It is now a pure category split: new category rows + item reassignment + a
curated-set update, with **no query-layer change**.

- `server/db/schema.ts` — add 4 new values to the `menuCategoryKey` pgEnum: `burgers_carta`,
  `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`. No new column, no new table.
- `server/db/seeds/menuCategories.ts` — Part A rename (`rice.nameEs`) + Part C: 4 new `CATEGORIES`
  entries (the `_carta` variants), each carrying the combo note. The original `burgers`/
  `hot_dogs`/`cold_rolls`/`hot_rolls` entries are untouched.
- `server/db/seeds/alaCarta.ts` — Part B piece-count copy for `cold_rolls`, `hot_rolls`,
  `sweet_rolls` items. Part C: reassign every `BURGERS`/`HOT_DOGS`/`COLD_ROLLS`/`HOT_ROLLS` item's
  `categoryKey` to its `_carta` variant; update `requiredKeys`.
- `app/features/menu/menu-sets.ts` — Part C: swap the 4 keys in `AYCE_CARTA_SET` only (same
  positions); `AYCE_BUFFET_SET`/`EXPRESS_SET` unchanged.
- `server/utils/menu-queries.ts` — **NOT modified.** The existing `ayceModalityFilter()`/
  `groupByCategory()` logic already isolates à la carte items (`includedInAyce: false`) from
  buffet/Express items (`includedInAyce: true`), so once à la carte items point at the new
  `_carta` category rows, the combo note surfaces only in the AYCE à la carte modality for free.
- Tests: `tests/db/menu-seeds.test.ts` only (new/updated cases). No changes to
  `server/utils/menu-queries.test.ts`.

No UI component changes are expected — the `/menu` page's existing category-note rendering
(already live for `kids`/`wings` since feature 028) consumes `FullMenuCategory.note` exactly as
today, fed by an ordinary category row like any other.

## Local migration + reseed procedure

1. Write and review the Drizzle migration for the 4 new enum values:
   ```bash
   pnpm db:generate
   ```
   Confirm the generated SQL contains only 4× `ALTER TYPE "public"."menu_category_key" ADD VALUE
   IF NOT EXISTS '<key>'` statements (mirroring `0021_add_ensalada_arroces_category_keys.sql`/
   `0022_add_ramen_category_key.sql`) — no column, no table, no other type should be touched.
2. Apply the migration to the local dev DB:
   ```bash
   pnpm db:up        # start local Postgres if not running
   pnpm db:migrate
   ```
3. **Known risk before reseeding** — `server/db/seeds/drinkGroups.ts`'s `resetDrinkChildren()`
   has a pre-existing FK-order bug (documented in `progress/current.md`, surfaced during feature
   028): it can attempt to delete `menu_items` under a drink category before option groups that
   reference them are cleared, causing an FK violation on a full reseed against a DB that already
   has live option groups. This is unrelated to this feature's own categories, but the full
   delete-and-reseed cycle this feature requires goes through the same `server/db/seed.ts` entry
   point, so:
   - If seeding a **fresh/empty** DB (no existing option-group rows), this bug does not trigger.
   - If reseeding an **existing** DB with live data, verify option groups are cleared before
     drink items, or clear the DB via the project's established reset procedure rather than
     relying on `resetDrinkChildren()` alone. Do not attempt to fix this bug as part of this
     feature — only sanity-check that it does not silently corrupt this feature's own reseed.
4. Delete existing rows for the ten affected categories' data if doing a partial reseed (the six
   named in `spec.md` FR-013, plus the four new `_carta` rows), or run the full reseed:
   ```bash
   pnpm db:seed
   ```
5. Verify:
   - À la carte menu, Spanish: rice category chip reads "Arroces".
   - À la carte menu: Sushi Frío / Sushi Caliente / Sushi Dulce dish descriptions end with
     "10 Pzas." (ES) / "10 pcs." (EN).
   - À la carte menu: Hamburguesas, Hot Dogs, Sushi Frío, Sushi Caliente (backed by the new
     `_carta` category rows) show the new combo note.
   - AYCE buffet menu and Express menu: the same four category names (backed by the original,
     unsplit category rows) show NO combo note.
   - Kids and Wings notes render exactly as before in every modality.

## Test-first workflow (per constitution Article IV)

1. Add failing assertions to `tests/db/menu-seeds.test.ts` for: the new seed content (rice rename,
   the 4 new `_carta` category rows carrying the correct bilingual name + combo note, the shared
   `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls` rows remaining note-less, piece-count copy on à la
   carte rolls, every affected `alaCarta.ts` item's `categoryKey` pointing at its `_carta` variant,
   and the extended `menu-sets.ts` curated-set drift-guard assertions).
2. Implement the enum migration + seed edits + `menu-sets.ts` update until tests pass.
3. Run the full suite: `pnpm test` (or the project's equivalent Vitest command) before opening
   for review — including the pre-existing `server/utils/menu-queries.test.ts` suite, which
   should pass unmodified since that file is not touched.
