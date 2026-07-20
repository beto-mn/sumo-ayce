# Implementation Plan: À La Carte Combo Notes & Menu Copy Refresh

**Branch**: `feat/029-alacarta-combo-notes-menu-copy` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/029-alacarta-combo-notes-menu-copy/spec.md`

## Summary

Three independent, DB-seed-only copy/data changes to the SUMO AYCE bilingual menu: (A) rename the
shared `rice` category's Spanish name `'Arroz'` → `'Arroces'`; (B) append bilingual piece-count
copy (`"10 Pzas."` / `"10 pcs."`) to every à la carte Sushi Frío/Caliente/Dulce dish description;
(C) add à-la-carte-only combo notes to Hamburguesas, Hot Dogs, Sushi Frío and Sushi Caliente,
visible only in the AYCE à la carte modality. Research (see `research.md`) confirmed the four
Part C categories are shared across AYCE-buffet, Express, and à la carte, so the existing
modality-agnostic `menu_categories.noteEs`/`noteEn` mechanism (used by `kids`/`wings`) cannot be
reused as-is without leaking the combo copy into buffet/Express.

**[Revised — client-mandated, see `research.md` R3 revision]** The technical approach is a
**category split**, not a shared-row/two-note-column-pairs extension: each of the four affected
categories gets a second, à la carte-only category record (same displayed bilingual name, distinct
key with a `_carta` suffix, e.g. `burgers_carta`) that carries the combo note; the affected à la
carte menu items are reassigned from the shared category key to the new one, and the curated
`AYCE_CARTA_SET` (`app/features/menu/menu-sets.ts`, feature 023) is updated to reference the new
keys while `AYCE_BUFFET_SET`/`EXPRESS_SET` keep referencing the original shared keys unchanged.
This requires only a minimal, additive enum-value migration (four new values on the existing
`menu_category_key` Postgres enum, following the exact precedent already in this codebase —
`0021_add_ensalada_arroces_category_keys.sql`, `0022_add_ramen_category_key.sql`) — **no new
column, no new table, and no change whatsoever to `server/utils/menu-queries.ts`**: the existing
`includedInAyce`/`locationType` item-filtering already isolates à la carte items from
buffet/Express items, so the new category records naturally only ever surface in the AYCE à la
carte modality with zero query-layer branching. Delivered via one minimal migration + seed edits
(new category rows + item reassignment) + a curated-set update + a full delete-and-reseed cycle.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node 20 (Vercel runtime)
**Primary Dependencies**: Nuxt 4, Drizzle ORM. No new npm packages.
**Storage**: Neon PostgreSQL — one additive migration extending the existing `menu_category_key`
enum with 4 new values (`burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`),
via `ALTER TYPE ... ADD VALUE IF NOT EXISTS` (no column, no table, no constraint/index change);
seed-data edits adding 4 new `menu_categories` rows and reassigning the affected à la carte
`menu_items` rows' `categoryId` to point at them.
**Testing**: Vitest, existing seed-assertion suite (`tests/db/menu-seeds.test.ts`) only — no
changes to `server/utils/menu-queries.test.ts` are needed since the query layer is untouched, per
Article IV.
**Target Platform**: Vercel edge/serverless (Nitro), rendered client in evergreen browsers.
**Project Type**: Web application (Nuxt 4 frontend + server routes, single repo).
**Performance Goals**: No new routes, no new or additional columns projected in the existing
menu query (`MENU_ROW_SELECTION`/`queryMenuRows` are entirely unchanged) — no N+1, no Lighthouse
impact expected, and no additional query-layer surface to regress.
**Constraints**: No new npm packages (Article X KISS). No new Vue component and no query-layer
change at all — the existing category-`note` rendering surface (live since feature 028 for
kids/wings) and the existing `groupByCategory()`/`ayceModalityFilter()` mechanism are reused
completely unmodified; the new à la carte-only category records simply flow through them as
ordinary category rows, isolated by the pre-existing `includedInAyce`/`locationType` item filter.
No changes to AYCE-buffet or Express item rows, category rows, or descriptions/notes. No price
changes (the client flyers' stated combo price for cold_rolls/hot_rolls, $179, does not match the
current à la carte item price, $119 — flagged as a pre-existing, out-of-scope discrepancy, not
touched by this feature).
**Scale/Scope**: 1 minimal additive enum migration (4 new enum values, 1 existing enum, 0 columns,
0 tables); seed edits across 3 files (`menuCategories.ts` — 4 new category rows, `alaCarta.ts` —
categoryKey reassignment on ~19 items, `menu-sets.ts` — 4 key swaps in one array); 0 query-layer
changes; new/updated Vitest cases in 1 existing test file (`tests/db/menu-seeds.test.ts`); 1 full
reseed cycle.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Article | Rule | Status |
|---------|------|--------|
| I — Code Organization & Reusability | This feature touches only `server/db/` and `app/features/menu/menu-sets.ts`, both explicitly cross-feature/shared infra per the existing structure (not a vertical feature slice) — no new `server/api/v1/<feature>/` folder, no changes to `server/utils/menu-queries.ts` at all. The Part C solution reuses the existing category-`note` rendering component/prop shape (`FullMenuCategory.note`) and the existing curated-set mechanism (feature 023) completely unmodified — the new à la carte-only category records are ordinary rows flowing through both, not a new code path. | ✅ Pass |
| II — TypeScript & Framework Standards | The 4 new category keys are added to the existing `menuCategoryKey` Drizzle `pgEnum` (`server/db/schema.ts`) and to the local `CategoryKey` union types in `menuCategories.ts`/`alaCarta.ts`, matching the existing style (no `any`, no new types). `FullMenuCategory.note`/`MenuCategoryKey` types are extended, not restructured. | ✅ Pass |
| III — Architecture | Neon-only change (Drizzle enum + seeds) — no WordPress involvement, single Nuxt 4 repo, one deploy. | ✅ Pass |
| IV — Testing | New/updated Vitest cases added only to `tests/db/menu-seeds.test.ts`: the 4 new category rows carry the correct bilingual name/note; the shared `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls` rows remain note-less; every affected à la carte item's `categoryKey` points to its `_carta` variant; `AYCE_CARTA_SET` references the `_carta` keys and `AYCE_BUFFET_SET`/`EXPRESS_SET` reference the original shared keys (drift-guard extension). No changes needed to `server/utils/menu-queries.test.ts` since that layer is untouched. Tests are written before the seed/schema implementation per the TDD rule. | ✅ Pass (tracked in tasks.md) |
| V — Performance | No new route; `/menu` keeps its existing rendering rule; `server/utils/menu-queries.ts` — including `MENU_ROW_SELECTION` and `queryMenuRows` — is entirely untouched, so there is zero risk of a new N+1 or added round trip. | ✅ Pass |
| VI — Security | No new public endpoint; no change to `/api/v1/menu`'s query/response code at all — the new category rows surface through the existing, unmodified response shape. No new user input accepted. | ✅ Pass |
| VII — UX Consistency & Component Docs | No new UI component — the existing category-note rendering component (documented/covered by Storybook stories under feature 028) is reused as-is; no new story required since no new prop/variant is introduced (the split lives entirely in seed data + the curated-set mapping, both upstream of the component). | ✅ Pass |
| VIII — Clean Code Discipline | No new function, no new branch, no new file in the query layer at all. Seed edits follow the existing array-literal style of `menuCategories.ts`/`alaCarta.ts`; the `menu-sets.ts` edit is a like-for-like key swap within an existing array literal. | ✅ Pass |
| IX — Quality Gates | No change to Biome/Husky/commitlint config. Standard gates apply. | ✅ Pass |
| X — KISS (strengthened by this revision) | Zero new columns, zero new tables, zero query-layer branching — strictly simpler than the originally-planned two-nullable-columns-plus-modality-branch design (previously reviewed and rejected by the client precisely because a hidden per-modality flag on a shared row is less legible than distinct, independently manageable category records). The only schema footprint is 4 new enum values via the exact `ALTER TYPE ... ADD VALUE IF NOT EXISTS` pattern this codebase already uses twice (`0021_add_ensalada_arroces_category_keys.sql`, `0022_add_ramen_category_key.sql`) — not a new abstraction, a repeat of an established one. Rejected alternatives (shared-row + note-column-pair + query-layer branch; a separate per-modality-notes join table; an all-or-nothing boolean flag) are documented in `research.md`'s R3 revision. | ✅ Pass |
| XI — Absolute Imports | No new imports required beyond the existing `@/` aliases already used in `menu-sets.ts`/the seed files. | ✅ Pass |
| XII — Error Handling | No new API error paths — `getFullMenu()`'s existing try/catch and `DatabaseUnavailableError` handling is completely unaffected since the query layer does not change. Seed script continues to use its existing `console.log`/`onConflictDoUpdate` pattern; no new error handling needed for the additive enum migration. | ✅ Pass |
| XIII — Environment Validation | No new env vars. | ✅ Pass |

**Post-design re-check**: Confirmed after Phase 1 (`data-model.md`, `research.md`) — the 4 new
enum values and 4 new category rows introduce no new constitution violation, and the removal of
the query-layer branch (superseded per the client's requested revision) further strengthens the
Article X pass. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/029-alacarta-combo-notes-menu-copy/
├── plan.md              ← this file
├── spec.md              ← feature spec
├── research.md           ← Phase 0 output
├── data-model.md         ← Phase 1 output
├── quickstart.md         ← Phase 1 output
├── assets/source/
│   ├── category-note-example-kids-style.png   ← style reference (existing kids note box)
│   ├── burger-combo-flyer.png                 ← Part C combo copy source
│   ├── hotdog-combo-flyer.png                 ← Part C combo copy source
│   ├── sushi-frio-combo-flyer.png             ← Part B + C copy source
│   └── sushi-caliente-combo-flyer.png         ← Part B + C copy source
├── checklists/requirements.md
└── tasks.md              ← Phase 2 output (/speckit.tasks)
```

No `contracts/` directory: `/api/v1/menu`'s route code is **not touched at all** by this revision.
Its response shape is unchanged; it simply returns one additional ordinary category object
(`categories[]` gains an entry for each new `_carta` key, alongside the existing ones) as a
consequence of the seed-data change, not a code change — documented directly in `data-model.md`.

### Source Code (repository root)

```text
server/
  db/
    schema.ts                            ← ADD 4 new values to the `menuCategoryKey` pgEnum: `burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta` (no column/table change)
    migrations/
      00XX_add_ala_carte_category_keys.sql   ← NEW minimal additive migration: 4× `ALTER TYPE "public"."menu_category_key" ADD VALUE IF NOT EXISTS '<key>'` (implementer names per drizzle-kit's next sequence number; mirrors 0021/0022)
    seeds/
      menuCategories.ts                  ← Part A: `rice.nameEs` 'Arroz' → 'Arroces'. Part C: extend the local `CategoryKey` union with the 4 new keys and ADD 4 new entries to `CATEGORIES` (`burgers_carta`, `hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta` — same `nameEs`/`nameEn` as their shared counterparts, `noteEs`/`noteEn` per `data-model.md`, `isActive: true`, next available `displayOrder` values) — NO changes to the existing `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls` entries themselves
      alaCarta.ts                        ← Part B: append "10 Pzas." (descriptionEs) / "10 pcs." (descriptionEn) to every item in `COLD_ROLLS`, `HOT_ROLLS`, `SWEET_ROLLS`. Part C: extend the local `CategoryKey` union with the 4 new keys; reassign every item's `categoryKey` in `BURGERS`, `HOT_DOGS`, `COLD_ROLLS`, `HOT_ROLLS` from the shared key to its `_carta` variant; update `requiredKeys` accordingly

app/
  features/
    menu/
      menu-sets.ts                       ← Part C: in `AYCE_CARTA_SET` only, replace `'burgers'`/`'hot_dogs'`/`'cold_rolls'`/`'hot_rolls'` with `'burgers_carta'`/`'hot_dogs_carta'`/`'cold_rolls_carta'`/`'hot_rolls_carta'` (same array positions); `AYCE_BUFFET_SET`/`EXPRESS_SET` unchanged

tests/
  db/
    menu-seeds.test.ts                   ← ADD cases: rice category `nameEs === 'Arroces'` and `nameEn === 'Rice'` (unchanged); the 4 new `_carta` categories carry the correct bilingual name (matching their shared counterpart) and non-null bilingual combo note; the shared `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls`/`sweet_rolls` rows (and every other category) remain note-less; every `alaCarta.ts` BURGERS/HOT_DOGS/COLD_ROLLS/HOT_ROLLS item's `categoryKey` is its `_carta` variant; à la carte cold_rolls/hot_rolls/sweet_rolls item descriptions end with the correct bilingual piece-count copy; `AYCE_CARTA_SET` contains the 4 `_carta` keys (not the shared ones), `AYCE_BUFFET_SET`/`EXPRESS_SET` contain the shared keys (not any `_carta` key) — extending the existing feature-023 drift-guard block, which already asserts every curated-set key has a matching active `menu_categories` entry

types/menu.ts                            ← `MenuCategoryKey` gains the 4 new keys (`FullMenuCategory.note` type itself stays `Bilingual | null`, unchanged)

server/utils/menu-queries.ts             ← UNCHANGED (no query-layer branch introduced by this revision)
```

**Structure Decision**: Single Nuxt 4 repo (Article III). This feature stays entirely within
`server/db/` (schema + seeds) plus one small, existing-file edit in `app/features/menu/` (the
curated-set mapping) — both shared cross-feature infrastructure per Article I's folder
boundaries — with zero query-layer and zero UI/component changes, since the rendering surface for
`FullMenuCategory.note` and the item-filtering that isolates modalities already exist and need no
modification.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty. This revision removes the
query-layer branch and new-column footprint of the originally-planned design, making this an even
stronger Article X (KISS) pass than the prior draft.*
