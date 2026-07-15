---
description: "Task list for Menu Experience Overhaul (021)"
---

# Tasks: Menu Experience Overhaul (data + UI)

**Input**: Design documents from `specs/021-menu-experience-overhaul/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/menu-api.md, contracts/i18n-keys.md

> **Reconciled 2026-07-14.** The task list below is preserved as the implementation record. As
> delivered, the feature grew beyond the original three-way scope: the primary nav became FOUR-way
> (AYCE|Express pill + standalone Bebidas + Kids), a dedicated **Kids** view was added
> (`menu-sets.ts` KIDS_SET + `MenuShell` two-section split + `queryKidsRows`), category/drink-group
> **labels moved into the DB** (removing the `menu.category.*`/`menu.drink_group.*` i18n keys), and
> **two further migrations** shipped: 0028 (`drink_group.name_es/en`) and 0029
> (`menu_categories.note_es/en`), in addition to 0027. Vaso Sumo consolidated to SIX bases
> (Jack Daniel's added). Robustness landed: `db-retry.ts`, `DatabaseUnavailableError` → graceful
> empty menu, and `resolveImageUrl` cache-busting. Where a task line still says "3-way" it should be
> read as the delivered 4-way; the extra migrations/labels/Kids/robustness are captured in the
> updated spec.md, plan.md, data-model.md, and contracts.

**Tests**: Included — Article IV requires tests-before-implementation for server-side query/seed
logic and co-located Vitest specs for every changed component/composable.

**Organization**: Grouped by phase; user-story phases (US1–US3) map to spec.md stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on incomplete tasks)
- **[Story]**: US1/US2/US3 for user-story phases only

## Path Conventions

Web app (single Nuxt repo): frontend `app/`, backend `server/`, shared `types/`, locales `i18n/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare types, schema, and the migration that everything else builds on.

- [x] T001 [P] `DrinkGroup` union: rename `beers_spirits`→`beers`, add `'destilados'`, remove `non_alcoholic` (folds into `sodas`) in `types/menu.ts`; add `DrinkGroupMeta` and widen `FullMenuResult` (`drinkGroups[]`, category `note`, `locationType` incl. `kids`) — FR-014, FR-009a.
- [x] T002 Add `displayOrder`, `nameEs`/`nameEn` to `drinkGroups` and `noteEs`/`noteEn` to `menuCategories` in `server/db/schema.ts` — data-model §1, FR-007/FR-009a/FR-007a.
- [x] T003 THREE hand-written additive migrations + journal entries (drizzle-kit generate needs a TTY; repo snapshots stale past 0019 → project hand-writes): `0027_add_drink_group_display_order.sql`, `0028_add_drink_group_name.sql`, `0029_add_menu_category_note.sql` — all applied to production Neon and reseeded — plan.md migration flag.
- [x] T004 Whole-card hover-zoom (`hover:scale-105` + `motion-reduce:transform-none`, hover-capable only) — research D8, FR-022.

**Checkpoint**: schema + types compile (`pnpm typecheck`); migration file exists and is additive.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Curated-set config + query surface that US1/US2/US3 all depend on. MUST complete first.

- [x] T005 [P] Create `app/features/menu/menu-sets.ts`: FOUR-way `PrimarySelection` (`ayce|express|drinks|kids`); typed ordered sets (AYCE_BUFFET 8, AYCE_CARTA **11** (Kids removed), EXPRESS 8, DRINKS 6, KIDS_SET `['kids']`) + defaults + `getCuratedSet`/`getDefaultKey`/`resolveActiveKey`; asymmetries encoded literally — data-model §4, FR-004..FR-009.
- [x] T006 [P] `app/features/menu/menu-sets.spec.ts` — tests asserting membership + order + defaults + fallback (incl. Kids) — SC-002, SC-001.
- [x] T007 Rewrote `tests/db/menu-queries.test.ts` onto the live `server/utils/menu-queries.ts`: drink-group displayOrder ordering, group-level Destilados promo once, buffet-vs-carta incluido/price — Article IV, contracts/menu-api.md.
- [x] T008 Extended `server/utils/menu-queries.ts` with `queryDrinkGroups` (order + group promo); no second fetch; `ayceModalityFilter` unchanged — research D3, FR-015.
- [x] T009 `FullMenuResult.drinkGroups: DrinkGroupMeta[]` added in `types/menu.ts` — Article II.

**Checkpoint**: menu-sets tested; query exposes group order+promo; existing menu tests still green.

---

## Phase 3: User Story 1 — Curated three-way navigation + deep-linking (Priority: P1) 🎯 MVP

**Goal**: 3-way primary selector (AYCE | Express | Bebidas), AYCE modality, curated ordered sets,
single default category on load, and full URL deep-linking/restore.

**Independent test**: Load `/menu` → lands on AYCE·All You Can Eat·Entradas; switch each
selection/modality and verify the exact curated sets + order + asymmetries; load each deep-link
form and verify restore + default + invalid-key fallback.

### Tests (write first — Article IV)

- [x] T010 [P] [US1] Rewrote `useMenuFilters.test.ts`: default category, 3-way type incl. bebidas, all four deep-link forms, omitted-category default, out-of-set fallback, replace semantics — 21 tests, FR-010..FR-013d, SC-009, SC-012.

### Implementation

- [x] T011 [US1] Reworked `useMenuFilters.ts`: 4-way `activeSelection` (`ayce|express|drinks|kids`), `isKids`/`isDrinks`/`showCategoryChips`/accent computeds, `activeCategory` defaults to set-first (never null), reset on switch, modality forced buffet for non-AYCE, `resolveActiveKey` fallback, `drinks`→`type=bebidas` serialisation, `router.replace` sync — FR-002,003,010..013d.
- [x] T012 [P] [US1] `types.ts` re-exports `PrimarySelection` (`MenuPrimarySelection`) + `PickerOption` — Article II.
- [x] T013 [US1] `MenuTypeToggle.vue` = AYCE|Express segmented pill + standalone Bebidas + Kids buttons + AYCE modality slot between them; responsive (stacked phone / wrap tablet / row desktop); accent + cursor-pointer per selection — FR-001,001a,001b.
- [x] T014 [US1] `MenuModalityToggle.vue` AYCE-only (shell-gated), reads `menu.modality.carta` — FR-002,003,023.
- [x] T015 [US1] `MenuCategoryChips.vue` renders the ordered set with single active (no null); labels DB-driven (hidden entirely for Kids) — FR-009,009a,010,013b.
- [x] T016 [US1] `MenuShell.vue` orchestrates 4-way + curated set, DB labels, Kids two-section split (by `includedInAyce`, DB note), always ONE active category/group (no show-all), template ≤100 lines — FR-010,007a,009a.
- [x] T017 [US1] `MenuDishGrid.vue` renders only the single active category / the Kids sections passed by the shell — FR-010.
- [x] T018 [P] [US1] i18n: `menu.modality.carta`="Carta"/"Menu"; added `menu.type.drinks`/`kids`/`selector_label`, `menu.kids.*`, `menu.guarantee_alt`, `menu.unavailable`; REMOVED `menu.category.*` (kept `empty`) + `menu.drink_group.*` (labels now DB) — FR-023,009a.

### Stories & specs (Article VII + IV)

- [x] T019 [P] [US1] `MenuTypeToggle` stories + spec: 3-way, each active state, ES/EN, mobile.
- [x] T020 [P] [US1] `MenuModalityToggle` stories + spec: Carta/Menu label ES/EN.
- [x] T021 [P] [US1] `MenuCategoryChips` stories + spec: each curated set, single-active.
- [x] T022 [P] [US1] `MenuShell` stories + spec: each selection/modality + default landing + Bebidas; mobile.
- [x] T023 [P] [US1] `MenuDishGrid` spec: single active category render.

**Checkpoint**: `/menu` navigates by the 3-way model, lands on the default, and all deep-links
restore/fall back correctly. MVP is demonstrable.

---

## Phase 4: User Story 2 — Accurate, de-duplicated drinks catalogue (Priority: P2)

**Goal**: Destilados its own group; 2x1 note once; Caguamón first; Café image-first; one Vaso Sumo
flavour-selector card.

**Independent test**: Open Bebidas → Destilados separate button, single promo note, Caguamón first,
coffee image-first, one Vaso Sumo card with a working flavour selector.

### Tests (write first — Article IV)

- [x] T024 [P] [US2] `tests/db/menu-seeds.test.ts` asserts destilados group + order, spirit sub-groups re-parented, caguamon first, per-spirit promo NULLed, group-level promo once, one Vaso Sumo row, image-first coffee — FR-014..FR-019, SC-003, SC-004.

### Data / seed implementation

- [x] T025 [US2] `drinkGroups.ts`: `beers_spirits`→`beers` rename + NEW `destilados` group; `name_es/en` (DB labels) + displayOrder 0..5; group-level 2x1 promo + spirit subtitle on `destilados`; legacy `beers_spirits`+`non_alcoholic` deleted (Sin Alcohol folds into `sodas`); FK-safe child reset — FR-014,015,007,009a.
- [x] T026 [US2] `drinkSubGroups.ts`: spirit sub-groups re-parented to `destilados`; beers under `beers`; `caguamon` first (order 0); per-spirit subtitle/promo NULLed — FR-015,016.
- [x] T027 [US2] `drinks.ts`: 5 Vaso Sumo → 1 canonical `sumo_cup.webp` row (SIX bases incl. Jack Daniel's via picker); Tropical Sumo + Cantarito Fest separate rows; spirit items → `destilados`, beers → `beers`, non_alcoholic → `sodas`; Café image-first (carajillos before text-only) — FR-017,018.
- [x] T028 [US2] Migrate (0027/0028/0029) + reseed applied to production Neon — DONE (seed data also verified by tests).

### UI implementation

- [x] T029 [US2] `MenuSaucePicker.vue` parameterized to generic `PickerOption[]` + `pickerLabel` (single-active; sauces OR Vaso Sumo bases) — NO new component — FR-019.
- [x] T030 [US2] `MenuDrinkSection.vue` rewritten: single active group with DB-driven `groupName`, group-level promo ONCE, sub-groups by displayOrder (Caguamón first), Vaso Sumo SIX-base picker via reused component; extracted `MenuDrinkCard`; half-width no-image cards — FR-014,015,018,019,024,009a.
- [x] T031 [P] [US2] i18n `menu.vaso_sumo.*` (six bases incl. `jack_daniels` + `picker_label`) in es/en; drink-group labels are DB-driven (no `menu.drink_group.*` keys) — contracts/i18n-keys.md.

### Stories & specs

- [x] T032 [P] [US2] `MenuDrinkSection` stories + spec: destilados single promo, caguamón-first, half-width cards, Vaso Sumo selector; extracted `MenuDrinkCard` ships with BOTH `MenuDrinkCard.stories.ts` AND co-located `MenuDrinkCard.spec.ts` (7 tests: default render, price/badge conditionals, image full-width + hover-zoom, no-image half-width case, slot).
- [x] T033 [P] [US2] `MenuSaucePicker` stories + spec: sauce mode + flavour mode.

**Checkpoint**: Drinks view is de-duplicated and correctly grouped/ordered.

---

## Phase 5: User Story 3 — Polished dish cards + curated featured rail (Priority: P3)

**Goal**: Hover-zoom (hover-capable only), half-width no-image drink cards, no sauce picker on
wings, and the exact 11 Garantías Sumo featured dishes.

**Independent test**: Hover a dish image on desktop (zoom) vs touch (no zoom); no-image drink cards
half width (6/row); wings have no sauce picker; homepage rail shows exactly the 11 dishes.

### Tests (write first — Article IV)

- [x] T034 [P] [US3] `tests/db/menu-featured.test.ts`: the 11 named dishes featured on ALL their location rows, deduped by name to 11 unique in rail order (0..10), Sumo Fries not Sumo Bites — FR-020, SC-005.
- [x] T035 [P] [US3] `MenuDishCard.spec.ts`: whole-card hover-zoom (`hover:scale-105` + `motion-reduce:transform-none`); Garantía star badge for featured; NEVER renders a sauce picker (removed from wings) — FR-020a, FR-021, FR-022, SC-006.
- [x] T036 [P] [US3] `MenuDrinkSection.spec.ts`/`MenuDrinkCard.spec.ts` half-span test: image card `col-span-2`, no-image `col-span-1` on the 6-track grid — FR-024, SC-007.

### Implementation

- [x] T037 [US3] Set `featured=true` + explicit `featuredOrder` on the 11 across ALL their location/modality rows (so the star shows in every view; homepage dedupes by name); cleared all prior featured (Kid Burger, Sumo Bites, etc.); wings `requiresSauce=false` — FR-020, FR-021.
- [x] T038 [US3] `GET /api/v1/menu/featured` returns the 11 unique dishes (dedupe by name in `getFeaturedDishes`) — verified against production reseed.
- [x] T039 [US3] `MenuDishCard.vue`: whole-card `hover:scale-105` transform-zoom (hover-capable) + `motion-reduce:transform-none`; Garantía star badge (`/brand/garantia-sumo.webp`, `size-16`, top-left); sauce-picker block removed; file ≤200 lines — FR-020a, FR-021, FR-022.
- [x] T040 [US3] `MenuDrinkSection.vue`: mobile-first grid `grid-cols-2 sm:grid-cols-4 md:grid-cols-6`; image cards `col-span-2` (3/row desktop), no-image `col-span-1` (6/row) — FR-024, research D9.

### Stories & specs

- [x] T041 [P] [US3] `MenuDishCard.stories.ts`: hover-zoom note, WingsWithoutSaucePicker, ES/EN, mobile.
- [x] T042 [P] [US3] Homepage rail is DB-driven via `useFeaturedDishes` → `/api/v1/menu/featured` (returns the seeded 11 in displayOrder); `HomeFeaturedRail` story uses a documented placeholder fixture (component is generic, out of the menu slice) — SC-005.

**Checkpoint**: All visual polish + featured rail correct.

---

## Phase 5b: Delivered-scope additions (Kids view + DB labels + robustness)

> Added post-hoc to record the client-approved scope growth captured during reconciliation.

- [x] T049 Kids view seed `kidsMenu.ts`: 7 items under `kids` (`locationType='both'`) — 1 "All You Can Eat Kids" ($179, `includedInAyce=true`) + 6 combos ($149, `includedInAyce=false`); combo inclusion note on the `kids` `menu_categories` row (0029) — FR-007a.
- [x] T050 `queryKidsRows` in `menu-queries.ts` (category=`kids`, any location/modality) + `getFullMenu` `kids` branch (always `carta` pricing); `MenuShell` splits into two DB-note-aware sub-sections — FR-007a.
- [x] T051 DB-driven labels: `queryDrinkGroups` returns `{ key, name, displayOrder, promo }`; `FullMenuCategory.note`; `MenuShell`/`MenuCategoryChips`/`MenuDrinkSection` read labels from the DB; `menu.category.*`/`menu.drink_group.*` i18n keys removed — FR-009a.
- [x] T052 Robustness: `server/utils/db-retry.ts` (`withDbRetry`/`isTransientDbError`); `DatabaseUnavailableError` (503, WARN) wrapped in `getFullMenu`/`getFeaturedDishes`; `/menu` route → `emptyMenuResult` (`menu.unavailable`); `resolveImageUrl` `?v=MENU_IMAGE_VERSION` cache-busting — FR-024a, FR-024b.

---

## Phase 6: Cleanup (Cross-cutting)

- [x] T043 Deleted the orphaned `server/db/queries/menu.ts` AND its now-subjectless test `tests/db/menu-queries.test.ts`. The live module is already covered by the co-located `server/utils/menu-queries.test.ts` (extended with drink-group order/promo tests) — Article I DRY, Article VIII dead code.

---

## Phase 7: Polish & Quality Gates (NON-NEGOTIABLE)

- [x] T044 [P] ES↔EN i18n key parity verified (Python key-set diff = 0 after all additions incl. `menu.type.drinks`, `menu.modality.carta`, `menu.drink_group.destilados/beers`, `menu.vaso_sumo.*`) — FR-027.
- [x] T045 `/menu` route rule left UNCHANGED (`ssr: true` as it already was — NOT isr:3600; the plan's expectation was stale). No new route added; no `drizzle-orm`/`@neondatabase/serverless` import under `app/**` (grep = 0) — Article V, SC-011.
- [x] T046 Full gate green: `pnpm check` (Biome), `pnpm typecheck` (vue-tsc), `pnpm test` (789/789). `pnpm build` not in init.sh; storybook:build run separately.
- [x] T047 `pnpm storybook:build` completed successfully; no story file exceeds 200 lines (max 156).
- [x] T048 Phase -1 gates in plan.md marked `[x]`; behaviours covered by automated specs (default landing, curated sets + asymmetries, deep-links, Destilados single promo, Caguamón-first, one Vaso Sumo card, wings no picker, 11 featured, hover-zoom, half-width cards, Carta/Menu label) — SC-001..SC-012.

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** must complete before any user story.
- **US1 (P1)** is the MVP and depends only on Phase 1–2. Deliverable on its own.
- **US2 (P2)** depends on Phase 1–2 (types/schema/query) and is independent of US1 UI but shares
  `MenuDrinkSection`/`MenuSaucePicker`; sequence US1 first to avoid component churn.
- **US3 (P3)** depends on Phase 1–2; `MenuDrinkSection` half-width work (T040) coordinates with
  US2 T030 (same file) — do T030 then T040.
- **Cleanup (Phase 6)** after US1–US3 query work settles (T008/T043 touch the same query area).
- **Gates (Phase 7)** last.

### Parallel opportunities

- Setup: T001 ∥ T004 (T002→T003 sequential).
- Foundational: T005 ∥ T006 (T007→T008→T009 sequential).
- US1: T010 first (test); T012 ∥ T018 ∥ story tasks T019–T023 once their components land.
- US2: T024 first; T031 ∥ T032 ∥ T033; seed tasks T025→T026→T027→T028 sequential (shared DB).
- US3: T034 ∥ T035 ∥ T036 (tests); T041 ∥ T042.
- Same-file conflicts (NOT parallel): T030 & T040 (`MenuDrinkSection.vue`); T008 & T043
  (query layer); seed files touched by multiple tasks.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + US1** (curated 3-way navigation + deep-linking). Ship, verify, then
layer US2 (drinks data), US3 (polish + featured), cleanup, and gates. Every server-side/seed change
is test-first; every changed component ships with an updated story + spec.

**Task count**: 52 (48 original + 4 delivered-scope additions T049–T052).
