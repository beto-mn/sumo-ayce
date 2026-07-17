# Tasks: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

**Input**: Design documents from `/specs/028-sauce-thermometer-watermark-refresh/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — Article IV of the constitution requires tests before
server-side/component logic; task order reflects tests-first where applicable.

**Organization**: Tasks are grouped by user story (US1 = watermark refresh,
US2 = single-sauce Wings/Boneless picker + thermometer, US3 = multi-select
À la Carta packages) per spec.md's priorities (US1/US2 = P1, US3 = P2).

**Revision note (2026-07-17)**: Phases 1-6 below describe the ORIGINAL
`df3a13c` implementation and are kept **as historical record — already
executed, already committed** (do not re-run them). The client has since
reversed course on Part B's sauce-selection half (spec.md "Revision
2026-07-17"). **Phase 7 below is the actual next round of work**: a revert of
specific, already-identified files — NOT a re-implementation from scratch.
Phase 3 (US1, watermark) and the thermometer-graphic portion of Phase 4 (T013,
T015 thermometer-only assertions) are UNAFFECTED and require no further
action. Ignore/do not re-run T011, T012, T014 (US2 sauce-picker wiring), and
all of Phase 5 (US3, multi-select) — those are exactly what Phase 7 reverts.

**Revision note (2026-07-18)**: Phases 1-7 are historical — already executed,
already committed, already reviewer-approved and shipped (feature was briefly
`done` before being reopened). **Phase 8 below is the actual next round of
work**: a small, additive, seed-data-only change (Part C, spec.md User Story
4 / FR-020 / FR-021) with no dependency on Phases 1-7 being re-run.

**Revision note (2026-07-18, second)**: Phase 8 (Part C) is itself now
historical — implemented, and immediately followed by a client-caught visual
issue in its own output. **Phase 9 below is the actual next round of work**:
a small, CSS-only fix (Part D, spec.md User Story 5 / FR-022) to the
`category-note` box's width, with no dependency on Phases 1-8 being re-run
beyond their end state already being in the working tree.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single Nuxt 4 repo: `app/`, `server/`, `types/`, `public/`, `tests/` at repo root
(see plan.md § Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the two client-supplied assets for production use.

- [x] T001 [P] Optimize and copy the new watermark tile from `specs/028-sauce-thermometer-watermark-refresh/assets/source/Fondo web bien.webp` to `public/patterns/sumo-watermark.webp` (replacing in place), re-baking the ~10-15% opacity into the exported file if the source isn't already pre-blended (matches the existing feature-024 asset convention)
- [x] T002 [P] Optimize and copy the thermometer reference graphic from `specs/028-sauce-thermometer-watermark-refresh/assets/source/Termometro salsas new.webp` to a new `public/menu/thermometer/sauce-heat-thermometer.webp` (optimized webp; used as-is per FR-012, no cropping of the acknowledged placeholder blank gutter)

---

## Phase 2: Foundational (Blocking Prerequisites for Part B — US2 & US3)

**Purpose**: Shared schema/type/query changes both Part B user stories depend on.

**⚠️ CRITICAL**: US2 and US3 cannot begin until this phase is complete. **US1 (watermark) has NO dependency on this phase and can proceed in parallel or first.**

- [x] T003 Add `maxSelections` (`max_selections integer NOT NULL DEFAULT 1`) column + `CHECK (max_selections >= 1)` constraint to `menuItemOptionGroups` in `server/db/schema.ts`
- [x] T004 Generate the additive migration `server/db/migrations/0032_add_menu_item_option_group_max_selections.sql` from the T003 schema change (no destructive changes, default backfills every existing row to `1`)
- [x] T005 [P] Add `maxSelections: number` to the `DishOptionGroup` interface in `types/menu.ts`
- [x] T006 [P] Add a failing `menu-queries.test.ts` case asserting `queryOptionGroupsByMenuItem` projects `maxSelections` (default `1` for existing Ramen XL/Vaso Sumo groups) onto `DishOptionGroup`
- [x] T007 Implement the `max_selections` column projection in `queryOptionGroupsByMenuItem` (`server/utils/menu-queries.ts`) so the T006 test passes (depends on T003, T005, T006)

**Checkpoint**: Foundation ready — US2 and US3 implementation can now begin.

---

## Phase 3: User Story 1 - Refreshed sitewide watermark artwork (Priority: P1) 🎯 MVP slice

**Goal**: Every page shows the new watermark artwork at the same low-opacity,
same on-screen tile density as the feature-024 baseline.

**Independent Test**: Load `/`, `/menu`, `/sucursales` and visually confirm the
new artwork renders at the same subtlety and tile size as before; run
`app/layouts/default.spec.ts` and confirm the existing contract still passes.

### Implementation for User Story 1

- [x] T008 [US1] Add explicit `background-size` sizing to the `watermark` `backgroundImage` token / its consuming utility so the new higher-resolution tile (781×1056) renders at the same on-screen footprint as the previous tile (300×405) in `tailwind.config.ts` (research.md R1) — no change to the `bg-bg bg-watermark bg-repeat` architecture in `app/layouts/default.vue`
- [x] T009 [P] [US1] Run `npx vitest run app/layouts/default.spec.ts` and confirm the existing contract (`bg-bg`, `bg-watermark`, `bg-repeat` classes present) still passes unmodified
- [x] T010 [US1] Manual visual QA across `/`, `/menu`, `/sucursales` per `quickstart.md` Part A — confirm new artwork, preserved density, no legibility regression, `prefers-reduced-motion` unaffected

**Checkpoint**: US1 fully functional and independently shippable — the watermark refresh can ship even if Part B is not yet complete.

---

## Phase 4: User Story 2 - Sauce picker + thermometer for single-sauce Wings/Boneless (Priority: P1)

**Goal**: AYCE/Express Wings/Boneless dishes get a real, working single-sauce
picker (12 sauces); the "Alitas & Boneless" section shows the heat thermometer
graphic once.

**Independent Test**: On `/menu` (AYCE and Express), open "Alitas & Boneless"
and confirm each dish shows an interactive single-sauce picker and the section
shows the thermometer graphic exactly once.

### Implementation for User Story 2

- [x] T011 [US2] Extend `DISH_OPTIONS_SEED` in `server/db/seeds/menuItemOptions.ts` with a `sauce` option group (`maxSelections: 1`) for "Alitas" and "Boneless" (both AYCE and Express seed rows), building each group's choices by reading the 12 rows already seeded in the `sauces` table (`nameEs`/`nameEn`, `priceDelta: '0.00'`) rather than re-hardcoding the sauce list a second time
- [x] T012 [US2] Run the seed script and confirm the 4 dishes' option groups are populated (depends on T011, T007)
- [x] T013 [US2] Update `MenuDishGrid.vue` to render the new thermometer image (from `public/menu/thermometer/sauce-heat-thermometer.webp`, `loading="lazy" decoding="async"`) once inside the `wings` ("Alitas & Boneless") category section, alongside the existing `category-note` block, gated on `category.key === 'wings'` (research.md R4/R5) — NOT rendered per-dish
- [x] T014 [P] [US2] Add a `MenuDishGrid.spec.ts` case asserting the thermometer image renders exactly once for the `wings` category and is absent for every other category
- [x] T015 [P] [US2] Add a `MenuDishGrid.stories.ts` story showing the "Alitas & Boneless" section with the thermometer graphic and a rendered `MenuSaucePicker`
- [x] T016 [US2] Manual QA per `quickstart.md` Part B step 6 (AYCE/Express single-sauce picker + section-level thermometer)

**Checkpoint**: US1 and US2 both independently functional — this is the MVP-complete slice for Part B (the previously-completely-missing sauce picker now exists).

---

## Phase 5: User Story 3 - Multi-sauce selection for À la Carta Wings/Boneless packages (Priority: P2)

**Goal**: À la Carta Wings/Boneless packages (2 or 3 sauces required) get a
bounded multi-select picker reusing the same component and thermometer.

**Independent Test**: On `/menu` → AYCE → À la Carta, open a Wings/Boneless
package and confirm the visitor can select exactly the required number of
sauces, with additional clicks beyond the limit being a no-op.

### Tests for User Story 3 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation (Article IV).

- [x] T017 [P] [US3] Add failing `MenuSaucePicker.spec.ts` cases for the new `maxSelections` prop: (a) selecting up to `maxSelections` options marks all of them active, (b) clicking an option beyond the limit is a no-op, (c) clicking an already-selected option deselects it and frees a slot

### Implementation for User Story 3

- [x] T018 [US3] Implement the additive `maxSelections?: number` prop (default `1`, preserving all existing single-active behavior/tests) in `MenuSaucePicker.vue`, switching internal state to a bounded `Set<string>` when `maxSelections > 1` (research.md R3), so the T017 tests pass
- [x] T019 [P] [US3] Add a `MultiSelect` story (mobile + desktop viewports) to `MenuSaucePicker.stories.ts`
- [x] T020 [US3] Update `MenuDishCard.vue`'s existing `optionGroups` rendering loop to pass `group.maxSelections` through to `MenuSaucePicker`
- [x] T021 [P] [US3] Extend `DISH_OPTIONS_SEED` in `server/db/seeds/menuItemOptions.ts` with `sauce` option groups (sourced the same way as T011) for the 4 À la Carta Wings/Boneless packages, with `maxSelections: 2` (individual packs) or `maxSelections: 3` (sharing packs) per `data-model.md`'s table
- [x] T022 [US3] Run the seed script and confirm the 4 À la Carta option groups are populated with the correct `maxSelections` (depends on T021, T007)
- [x] T023 [US3] Manual QA per `quickstart.md` Part B step 6 second bullet (À la Carta multi-select, no-op beyond limit)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across both parts.

- [x] T024 [P] Run the full Vitest suite (`npx vitest run`) and confirm the pre-existing Ramen XL/Vaso Sumo single-select assertions are unaffected by the additive `maxSelections` default of `1`
- [x] T025 [P] Run Storybook and visually confirm `MenuSaucePicker.stories.ts` (`MultiSelect`) and `MenuDishGrid.stories.ts` (wings + thermometer) render correctly at mobile and desktop viewports
- [x] T026 Run a Lighthouse pass on `/menu` and confirm no regression from the two new images (Article V performance budget)
- [x] T027 Execute the full `quickstart.md` validation (Parts A and B end-to-end)

---

## Phase 7: Part B Reversal — REVERT interactive picker + `sauces` table (NEW 2026-07-17)

**Purpose**: Undo the sauce-selection half of `df3a13c` per spec.md's Revision
2026-07-17 (FR-014 through FR-019) and plan.md's Amendment section. **This is
a targeted revert of a known diff, not a redesign** — every task below names
the exact file(s) to change. Part A (watermark) and the thermometer graphic
(`MenuDishGrid.vue`, `public/menu/thermometer/sauce-heat-thermometer.webp`,
i18n `menu.wings.thermometer_alt`) are OUT of scope for this phase — do not
touch them.

**Independent Test**: On `/menu` (AYCE, Express, À la Carta), open "Alitas &
Boneless" and confirm: (a) the thermometer graphic still renders exactly once
per section, unchanged; (b) no dish shows any interactive sauce-selection
control; (c) Ramen XL still shows its 3 option-group pickers and Vaso Sumo
still shows its flavor picker, unaffected. Separately, confirm `npx vitest
run` and `vue-tsc --noEmit` both pass, and that a fresh `SELECT * FROM
sauces` (or equivalent Drizzle introspection) fails because the table no
longer exists.

### 7a — Seed data: remove Wings/Boneless option groups

- [x] T028 In `server/db/seeds/menuItemOptions.ts`, remove `SAUCE_CHOICES`, `SINGLE_SAUCE_GROUP`, the `multiSauceGroup()` function, the `SAUCES` import, the 8 Wings/Boneless entries in `DISH_OPTIONS_SEED` (Alitas/Boneless × AYCE/Express, plus the 4 À la Carta packages), and the now-unneeded `locationType` disambiguation plumbing (`DishOptionsSeed.locationType`, `idByNameAndLocation`, `resolveMenuItemId()`, reverting `insertDishOptions`'s lookup back to a single `idByName` map) — leave the Ramen XL and Vaso Sumo entries and their `maxSelections: 1` fields exactly as they were pre-`df3a13c` (per T032/T033 below, `maxSelections` itself is also being removed, so these fields go too, but as part of T033, not this task).
- [x] T029 [P] In `tests/db/menu-item-options-seed.test.ts`, remove the entire "menu_item_option_groups seed data — Wings/Boneless sauce selection (feature 028)" describe block (the block asserting AYCE/Express single-sauce groups, the locationType disambiguation, and the 2-/3-sauce À la Carta packages) and its now-unused `SAUCES` import from `../../server/db/seeds/sauces` (the whole module is deleted in T030).

### 7b — Remove the `sauces` table and every reference to it

- [x] T030 Delete `server/db/seeds/sauces.ts` (the `SAUCES` catalog + `seedSauces()`).
- [x] T031 In `server/db/seed.ts`, remove the `seedSauces` import and its call.
- [x] T032 In `server/db/schema.ts`, remove the `sauces` table definition entirely AND the `requiresSauce`/`requires_sauce` column from the `menuItems` table (same cleanup pass — both are dead once the picker is gone; see spec.md FR-017).
- [x] T033 Generate a new additive-only migration (next sequential number) that `DROP TABLE sauces` and `ALTER TABLE menu_items DROP COLUMN requires_sauce` — do NOT edit migration `0016` (where `sauces` was created) or any other prior migration file.
- [x] T034 In `server/utils/menu-queries.ts`, remove `querySauces()`, the `SauceQueryRow` interface, the `sauces: FullMenuSauce[]` field from every `FullMenuResult`-shaped return (`getFullMenu()`'s two branches, `emptyMenuResult()`), and the `requiresSauce` projection (`MENU_ROW_SELECTION`/`toFullMenuDish()` or equivalent) (depends on T032).
- [x] T035 [P] In `types/menu.ts`, remove the `FullMenuSauce` interface, the `sauces: FullMenuSauce[]` field from `FullMenuResult`, and the `requiresSauce: boolean` field from `FullMenuDish`. Do NOT touch the unrelated `MenuCategoryKey = 'sauces'` union member (the "Salsas" category key) — different concept, out of scope (spec.md FR-018).
- [x] T036 [P] In `server/utils/menu-queries.test.ts`, remove every assertion referencing `result.sauces`/`querySauces` and every `requiresSauce` assertion (depends on T034).
- [x] T037 [P] Remove every `requiresSauce: false`/`requiresSauce: true` mock field from `*.spec.ts`/`*.stories.ts` fixtures across `app/features/menu/components/` (`MenuDishCard.spec.ts`, `MenuDishCard.stories.ts`, `MenuDishGrid.spec.ts`, `MenuDishGrid.stories.ts`, `MenuDrinkSection.spec.ts`, `MenuDrinkSection.stories.ts`, `MenuShell.spec.ts`, `MenuShell.stories.ts`) and `app/pages/menu.spec.ts`, and every `sauces: []` mock field on `FullMenuResult`-shaped fixtures in the same files (depends on T035).
- [x] T038 [P] Remove the `requiresSauce`/`requires_sauce` seed field from `server/db/seeds/ayceMenu.ts`, `expressMenu.ts`, `alaCarta.ts`, `kidsMenu.ts`, `desserts.ts`, `drinks.ts` (the per-item `requiresSauce?: boolean` type and its `requiresSauce: item.requiresSauce ?? false` mapping, or the hardcoded `requiresSauce: false` line, depending on the file) (depends on T032).

### 7c — Remove `maxSelections` (per spec.md Clarifications, Session 2026-07-17 Revision: dropped, not kept as bare infra)

- [x] T039 In `server/db/schema.ts`, remove the `maxSelections`/`max_selections` column and its `CHECK (max_selections >= 1)` constraint from `menuItemOptionGroups` — fold this into the SAME migration as T033 (one additive-only migration covering all three drops: `sauces` table, `requires_sauce` column, `max_selections` column).
- [x] T040 [P] In `types/menu.ts`, remove `maxSelections: number` from `DishOptionGroup`.
- [x] T041 In `server/utils/menu-queries.ts`, remove the `maxSelections` projection in `queryOptionGroupsByMenuItem` (depends on T039, T040).
- [x] T042 In `app/features/menu/components/MenuSaucePicker.vue`, remove the `maxSelections?: number` prop, `isMultiSelect`, `selectedIds`, `isSelected()`, and the multi-select branch in `select()` — reverting to the pre-`df3a13c` single-`selectedId` implementation.
- [x] T043 [P] In `app/features/menu/components/MenuDishCard.vue`, remove the `:max-selections="group.maxSelections"` binding on `MenuSaucePicker` (depends on T042).
- [x] T044 [P] In `app/features/menu/components/MenuSaucePicker.spec.ts` and `MenuSaucePicker.stories.ts`, remove the multi-select test cases and the `MultiSelect` story (depends on T042).
- [x] T045 [P] In `tests/db/menu-seeds.test.ts`, remove the "every existing (pre-feature-028) group has maxSelections=1" test case (depends on T039).

### 7d — Final validation

- [x] T046 Run `npx vitest run` and confirm the full suite passes with zero references to `sauces`, `querySauces`, `requiresSauce`, or `maxSelections` remaining anywhere in a test assertion (depends on T028-T045).
- [x] T047 Run `vue-tsc --noEmit` and confirm no type errors (the removed fields must not be referenced anywhere) (depends on T028-T045).
- [x] T048 Run a fresh repo-wide grep for `sauces`, `SAUCES`, `requiresSauce`, `requires_sauce`, and `maxSelections`/`max_selections` and manually confirm every remaining hit is either (a) the unrelated `MenuCategoryKey = 'sauces'` category key, (b) historical spec/plan/progress documentation, or (c) a migration file recording the DROP — no live application code reference should remain (depends on T028-T045).
- [x] T049 Manually confirm on `/menu` (AYCE, Express, À la Carta) that the "Alitas & Boneless" section still shows the thermometer graphic exactly once and no dish shows an interactive sauce control, and that Ramen XL/Vaso Sumo pickers are unaffected (depends on T046-T048).
- [x] T050 Run the DB migration against a scratch/dev database and confirm `sauces` and `menu_item_option_groups.max_selections`/`menu_items.requires_sauce` are gone with no FK errors (depends on T033, T039).

**Checkpoint**: Part B fully reverted to thermometer-only; `sauces` table and every dead field removed; Part A and the thermometer graphic unaffected throughout.

---

## Phase 8: Part C — Wings/Boneless instructional note (NEW 2026-07-18)

**Purpose**: Add the "Escoge tu salsa favorita" / "Choose your favorite
sauce" note to the "Alitas & Boneless" category, per spec.md User Story 4 /
FR-020 / FR-021 and plan.md's "AMENDMENT 2026-07-18". This is a pure seed-data
addition — no schema change, no new component, no layout change. Independent
of Phases 1-7 (no re-run required); depends only on the current working tree
already matching the Phase 7 end state (thermometer graphic + reverted
sauces/option-groups already shipped).

**Independent Test**: On `/menu` (AYCE, Express, and À la Carta), open
"Alitas & Boneless" and confirm the note "Escoge tu salsa favorita" (ES) /
"Choose your favorite sauce" (EN) renders exactly once, directly below the
section title and directly above the thermometer graphic; confirm no other
category shows this note; confirm `npx vitest run` passes.

- [x] T051 [P] In `server/db/seeds/menuCategories.ts`, add `noteEs: 'Escoge tu salsa favorita'` and `noteEn: 'Choose your favorite sauce'` to the `wings` entry in `CATEGORIES` (~lines 116-122), mirroring the existing `kids` entry's `noteEs`/`noteEn` fields exactly (same object shape, same upsert path via `seedMenuCategories()`).
- [x] T052 In `tests/db/menu-seeds.test.ts`, update the `'leaves every non-kids category without a note'` test (~lines 205-211) to also exclude `wings` from the null-note assertion loop, and add a new `'carries the sauce-choice note (bilingual) on the wings category'` test asserting `wings?.noteEs` contains `'salsa favorita'` and `wings?.noteEn` contains `'favorite sauce'` (mirroring the existing kids-note test at ~lines 197-203) (depends on T051).
- [x] T053 [P] In `app/features/menu/components/MenuDishGrid.spec.ts`, add a case asserting that when a `wings`-keyed category has a non-null `note`, the rendered `category-note` block appears before the `wings-thermometer` image in the section's HTML (extending the existing kids-only "renders the category note at the TOP of the section when present" pattern to also cover the wings+thermometer combination) — no `MenuDishGrid.vue` code change is expected to make this pass, since the render order already exists.
- [x] T054 Run the seed script (`pnpm db:seed` or project equivalent) against the target database and confirm the `wings` category row's `note_es`/`note_en` columns are populated (depends on T051). Done by the leader directly against the real Neon dev DB (`sumo_ayce_db`): `pnpm db:seed` upserts `menu_categories` before the known unrelated `resetDrinkChildren()` FK bug halts the rest of the script; verified via psql — `wings.note_es = 'Escoge tu salsa favorita'`, `wings.note_en = 'Choose your favorite sauce'`.
- [x] T055 Manually confirm on `/menu` (AYCE, Express, À la Carta) that the "Alitas & Boneless" section shows the new note exactly once, positioned between the section title and the thermometer graphic, in both `es` and `en` locales, and that no other category shows it (depends on T052-T054). Done by the leader: local dev server hit against the re-seeded DB — `GET /api/v1/menu?type=ayce`, `?type=express`, and `?type=ayce&modality=carta` all return `wings.note` populated bilingually; the rendered `/menu/` page's SSR payload contains `"Escoge tu salsa favorita"`/`"Choose your favorite sauce"` exactly once each, attached to the `wings` category object, confirming no duplication or leakage to other categories.
- [x] T056 Run `npx vitest run` and confirm the full suite passes, including the updated/added T052 and T053 cases (depends on T051-T055 — ran against the code/test changes from T051-T053; T054/T055's DB-dependent manual QA is separately tracked above).

**Checkpoint**: Part C shipped — "Alitas & Boneless" shows the sauce-choice
instructional note above the thermometer graphic; every other category and
Parts A/B remain unaffected.

---

## Phase 9: Part D — Category note box content-width fix (NEW 2026-07-18)

**Purpose**: Fix the `category-note` box (Part C's own output) so it sizes to
its text content instead of always stretching full-width, per spec.md User
Story 5 / FR-022 and plan.md's "AMENDMENT 2026-07-18 — Part D". CSS-only —
no template structure change, no new component, no schema/DB involvement.
Independent of Phases 1-8 being re-run; depends only on the current working
tree already matching the Phase 8 end state (wings note already shipped).

**Independent Test**: On `/menu`, open "Alitas & Boneless" and confirm the
"Escoge tu salsa favorita" note box visually hugs its short text (no large
empty space to its right). Open "Combo Infantil" ("kids") and confirm its
longer note still reads exactly as before — fully visible, wraps naturally,
not clipped or oddly narrow. Repeat both checks at a 360px mobile viewport.
Confirm `npx vitest run` passes.

- [x] T057 In `app/features/menu/components/MenuDishGrid.vue`, add `w-fit max-w-full` to the `category-note` block's class list (~line 50), appending to the existing classes (`mb-6 rounded-pop border-pop border-ink bg-yellow px-4 py-3 font-disp font-extrabold text-kicker shadow-pop-sm`) — no other class removed or changed, no template structure change.
- [x] T058 [P] In `app/features/menu/components/MenuDishGrid.spec.ts`, add a test asserting the `category-note` element's class list contains `w-fit` and does NOT contain `w-full` (or any other full-width-forcing class), extending the existing "renders the category note at the TOP of the section when present" test fixture (depends on T057).
- [x] T059 [P] In `app/features/menu/components/MenuDishGrid.stories.ts`, add a code-comment / story-level note (on the existing `KidsList` and a new or existing wings-note story) flagging both cases for manual visual QA: the short "Escoge tu salsa favorita" note (wings) should render as a compact, content-hugging box, and the longer "kids" inclusions note should render unchanged (fully readable, natural wrapping) — no new story variant strictly required if an existing story already covers both category notes, but the visual-check callout itself must be added.
- [x] T060 Run `npx vitest run` and confirm the full suite passes, including the new T058 case (depends on T057-T058).
- [x] T061 Manually confirm in Storybook and/or local dev (`/menu`) at both desktop and a 360px mobile viewport that: (a) the wings note box hugs its short text with no large empty trailing space; (b) the kids note box is unchanged — fully readable, wraps naturally, not clipped (depends on T057, T059).

**Checkpoint**: Part D shipped — the wings note box hugs its short text, the
kids note box is visually unchanged, and no other visual property of either
box (color/border/shadow/font) or any other Part A/B/C functionality is
affected.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001/T002 can start immediately and in parallel.
- **Foundational (Phase 2)**: No dependency on Phase 1. **Blocks US2 and US3 only** — US1 has zero dependency on Phase 2.
- **US1 (Phase 3)**: Depends only on T001 (Setup). Fully independent of Phase 2/US2/US3.
- **US2 (Phase 4)**: Depends on Phase 2 (T007) and T002 (Setup).
- **US3 (Phase 5)**: Depends on Phase 2 (T007) and benefits from US2's `MenuDishGrid.vue` thermometer change existing first (not a hard blocker — the multi-select prop change in `MenuSaucePicker.vue` is independent of the thermometer mount), plus T002.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on any other story — ship independently at any time.
- **US2 (P1)**: Depends on Foundational (Phase 2). No dependency on US1 or US3.
- **US3 (P2)**: Depends on Foundational (Phase 2). Extends the same `MenuSaucePicker.vue` component US2 uses, but is additive (`maxSelections` defaults to `1`) so US2's dishes are unaffected by US3 landing later or not at all.

### Parallel Opportunities

- T001 and T002 (Setup) run in parallel.
- T005 and T006 (Foundational) run in parallel once T003 lands.
- US1 (Phase 3) can run entirely in parallel with Foundational/US2/US3 — different files, no shared dependency.
- T014 and T015 (US2) run in parallel once T013 lands.
- T017 (US3 test) can be written in parallel with US2 work; T019 and T021 run in parallel once T018/T007 land respectively.
- T024 and T025 (Polish) run in parallel.

---

## Parallel Example: Foundational + User Story 1 simultaneously

```bash
# One track: Foundational (Part B shared infra)
Task: "Add maxSelections column + CHECK constraint to menuItemOptionGroups in server/db/schema.ts"
Task: "Add maxSelections: number to DishOptionGroup in types/menu.ts"

# Another track, fully independent: User Story 1 (watermark)
Task: "Add explicit background-size sizing to the watermark backgroundImage token in tailwind.config.ts"
Task: "Run npx vitest run app/layouts/default.spec.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (Setup) — both assets ready.
2. Ship **US1** (watermark) independently — it has no dependency on Part B at all.
3. Complete Phase 2 (Foundational) — required before any Part B story.
4. Complete **US2** (single-sauce picker + thermometer) — this is the P1 MVP slice for Part B, closing the previously-completely-missing sauce-selection gap.
5. **STOP and VALIDATE**: both P1 stories (US1, US2) deliver value independently — deploy/demo here if desired.

### Incremental Delivery

1. Setup + Foundational → foundation ready for Part B; US1 ships whenever ready (no blocker).
2. Add US2 → test independently → deploy/demo (Part B MVP).
3. Add US3 (multi-select À la Carta) → test independently → deploy/demo.
4. Add Polish (Phase 6) → final cross-cutting validation.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- US1 is intentionally decoupled from Foundational/US2/US3 — the watermark
  refresh (Part A) and the sauce-selection wiring (Part B) are explicitly
  independent per the feature description; do not introduce an artificial
  dependency between them.
- Verify tests (T006, T017) fail before implementing (T007, T018) per Article IV.
- Commit after each task or logical group.
- Avoid: hardcoding the 12-sauce list a second time in the option-groups seed
  (T011, T021 must read from the already-seeded `sauces` table); vague tasks;
  same-file conflicts.
- **(2026-07-17) Phases 1-6 are historical** — already implemented and
  committed as `df3a13c`. **Phase 7 is the current, actionable work.** It has
  no dependency on Phases 1-6 being re-run (they already happened); its only
  prerequisite is the current working tree matching `df3a13c`'s state. Tasks
  within Phase 7 sections 7a/7b/7c can mostly proceed in parallel across
  sections (different files), but T033 (the single combined migration) must
  wait for T032 and T039 (both schema.ts edits) to land first, and 7d (final
  validation) waits for all of 7a-7c.
- **(2026-07-18) Phases 1-7 are historical** — already implemented, committed,
  reviewer-approved, and briefly marked `done` before being reopened. **Phase
  8 is the current, actionable work.** It has no dependency on Phases 1-7
  being re-run; its only prerequisite is the current working tree already
  reflecting the Phase 7 end state (thermometer graphic shipped, sauces table
  and option-groups removal already applied). T051 (seed data) blocks T052
  (its dependent test) and T054/T055 (seeding/QA); T053 (component spec case)
  is independent of T051/T052 and can run in parallel — it only needs a
  category fixture with a non-null `note`, not the real seed data.
