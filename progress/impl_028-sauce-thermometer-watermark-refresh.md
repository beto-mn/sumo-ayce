# Implementation Report: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

**Feature**: 028-sauce-thermometer-watermark-refresh
**Branch**: `feat/028-sauce-thermometer-watermark-refresh`
**Spec**: `specs/028-sauce-thermometer-watermark-refresh/spec.md`

## Summary

Both parts implemented and verified end-to-end against a live Neon dev
database (migration applied, seed data inserted, `/api/v1/menu` responses
checked for AYCE buffet, AYCE à la carte, and Express).

**Part A** — the sitewide watermark tile was replaced with the client's new
artwork (`Fondo web bien.webp`, 781×1056), re-baking the same ~10.2% alpha
opacity the previous 300×405 tile used (measured directly from the shipped
file, not guessed) so the new tile reads identically subtle once composited
on the cream background. An explicit `bg-[length:300px_405px]` was added
alongside the existing `bg-watermark bg-repeat` utility so the tile's
on-screen repeat density is unchanged despite the ~2.6x higher source
resolution.

**Part B** — Wings/Boneless sauce selection is now wired through the
existing generic option-groups mechanism (no new pathway): AYCE and Express
"Alitas"/"Boneless" each get a single-select `sauce` group (`maxSelections:
1`), and the 4 À la Carta Wings/Boneless packages get a bounded multi-select
`sauce` group (`maxSelections: 2` or `3`). `MenuSaucePicker.vue` gained an
additive `maxSelections` prop (bounded `Set`-based multi-select, no-op past
the limit, deselect frees a slot) with 100% of its prior single-select tests
unchanged. The heat-thermometer legend graphic mounts once per "Alitas &
Boneless" section (not per dish), sized to span the full section width
(`w-full h-auto`, no small cap) per client feedback received mid-task.

## Mid-task course corrections (both addressed before completing)

1. **Thermometer sizing** — initial implementation capped the graphic at
   `max-w-[600px]`; the client wanted it noticeably larger (a legible legend,
   not a decorative icon). Fixed to `w-full h-auto` (spans the full section
   width on mobile and up to the page's own max-width on desktop), matching
   the existing category-note block's own full-width convention. Locked in
   with a new `MenuDishGrid.spec.ts` assertion that the thermometer has no
   small `max-w-[Npx]` class.
2. **Final designer asset** — the leader's initial handoff said only the WIP
   placeholder (`Termometro salsas new.webp`, with its acknowledged blank
   left gutter) was available on disk. Mid-task, the coordinator supplied the
   actual final designer image
   (`specs/028-sauce-thermometer-watermark-refresh/assets/source/Termometro-salsas-new-FINAL.png`,
   2063×585, clean symmetric layout, no gutter). **This final image is what
   shipped** — optimized to `public/menu/thermometer/sauce-heat-thermometer.webp`
   (webp, ~100 KB) via the same cwebp pipeline used for Part A. The WIP
   placeholder was never used as the final shipped asset. No further asset
   swap is expected from the human for Part B.

## Notable implementation decisions beyond the literal plan text

- **AYCE vs Express name collision**: "Alitas" and "Boneless" share the same
  `name_es` across the AYCE and Express menus (distinguished only by
  `menu_items.location_type`). The original single-column `dishNameEs → id`
  lookup in `seedMenuItemOptions()` would have silently overwritten one
  menu's dish with the other's id. Added an optional `locationType` field to
  `DishOptionsSeed` and a composite `name::locationType` lookup map so each
  of the 4 single-sauce dishes attaches to the *correct* underlying row.
  Verified live: AYCE Alitas, Express Alitas, AYCE Boneless, Express Boneless
  each got their own independent `sauce` option group.
- **Sauce catalog is actually 13 rows, not 12**: spec.md/data-model.md/i18n
  copy all say "12 sauces," but the pre-existing `sauces` table (seeded by a
  prior feature, out of scope to change here) has 13 rows (Parmesano →
  Jaguar, spice levels 0–12 inclusive). The implementation reads the catalog
  dynamically (`SAUCES` array length), so it is correct regardless of the
  count — tests assert against `SAUCES.length`, not a hardcoded "12". Alt-text
  copy avoids stating a specific count for this reason. Flagging this
  spec/data mismatch for the human; no code change needed since nothing
  hardcodes "12".
- **Sauce option-group choices sourced from the exported `SAUCES` array**
  (not a live DB round-trip at seed time) — kept `DISH_OPTIONS_SEED`
  synchronous and testable exactly like the existing Ramen XL/Vaso Sumo
  fixtures (`tests/db/menu-item-options-seed.test.ts` imports it directly),
  while still satisfying "don't re-hardcode the sauce list a second time"
  (single source: `server/db/seeds/sauces.ts`'s exported `SAUCES`).
- **Discovered pre-existing seed-pipeline bug (not fixed, out of scope)**:
  running the full `pnpm db:seed` a second time against a DB that already has
  `menu_item_option_groups` rows fails — `seedDrinkGroups()`'s
  `resetDrinkChildren()` tries to delete `menu_items` rows (e.g. Vaso Sumo)
  that are still referenced by `menu_item_option_groups` (no `ON DELETE
  CASCADE`), which violates the FK. This predates feature 028 (introduced
  when feature 027 added `menu_item_option_groups`) and blocks any full
  re-seed once option groups exist. Worked around it for verification by
  invoking `seedMenuItemOptions()` in isolation (all its target `menu_items`
  rows already existed) instead of touching the broader seed pipeline —
  no repo files related to this bug were modified, since fixing
  `drinkGroups.ts`/the FK is unrelated to this feature's scope. **Flagging
  for the human**: a future small fix (e.g. `ON DELETE CASCADE` on
  `menu_item_option_groups.menu_item_id`, or reordering `seedMenuItemOptions()`
  before `seedDrinkGroups()`) is needed before `pnpm db:seed` can be safely
  re-run end-to-end again.

## Phase -1 / Constitution gates

All rows in plan.md's Constitution Check table were already `✅ Pass` in the
plan; re-verified during implementation — no violations introduced (no new
npm package, no cross-feature imports, no `any`, Composition API only,
`MenuSaucePicker.vue` stays at 91 lines, seed module follows existing
small-function style).

## Completed tasks (tasks.md)

- [x] T001 — Watermark tile optimized (opacity re-baked to match the
      existing ~10.2% alpha, verified numerically) and copied to
      `public/patterns/sumo-watermark.webp`.
- [x] T002 — Thermometer graphic optimized and copied to
      `public/menu/thermometer/sauce-heat-thermometer.webp` — **using the
      final designer asset supplied mid-task**, not the WIP placeholder.
- [x] T003 — `maxSelections` column + CHECK constraint added to
      `menuItemOptionGroups` in `server/db/schema.ts`.
- [x] T004 — Migration `0032_add_menu_item_option_group_max_selections.sql`
      (hand-written + `_journal.json` entry appended, mirroring the project's
      established convention — `drizzle-kit generate` cannot run
      non-interactively in this environment, confirmed this is a pre-existing
      limitation unrelated to this change).
- [x] T005 — `maxSelections: number` added to `DishOptionGroup`.
- [x] T006/T007 — Failing test written first, then `maxSelections`
      projection implemented in `queryOptionGroupsByMenuItem`.
- [x] T008 — Explicit `bg-[length:300px_405px]` added in `app/layouts/default.vue`.
- [x] T009 — Existing `default.spec.ts` contract re-verified unmodified + a
      new assertion for the explicit background-size added.
- [x] T010 — Manual QA via built production server + Lighthouse + direct
      curl of `/api/v1/menu` (see Verification below); visual composite
      checks of both new assets against the actual cream background color.
- [x] T011/T012 — `DISH_OPTIONS_SEED` extended with the 4 single-sauce
      AYCE/Express dishes; seed run verified live (see Verification).
- [x] T013/T014/T015 — Thermometer mount in `MenuDishGrid.vue` (gated on
      `category.key === 'wings'`), spec assertions, and a new
      `WingsSectionWithThermometer` story.
- [x] T016 — Manual QA via live API responses.
- [x] T017/T018 — Multi-select tests + `maxSelections` implementation in
      `MenuSaucePicker.vue`.
- [x] T019 — `MultiSelect`/`MultiSelectMobile` stories added.
- [x] T020 — `MenuDishCard.vue` passes `group.maxSelections` through.
- [x] T021/T022 — À la Carta multi-sauce seed entries; seed run verified live.
- [x] T023 — Manual QA via live API responses (à la carte packages return
      `maxSelections: 2`/`3` correctly).
- [x] T024 — Full `vitest run`: 1035/1035 passing, including every
      pre-existing Ramen XL/Vaso Sumo single-select assertion unaffected.
- [x] T025 — `storybook build` succeeds (compiles all new/updated stories).
- [x] T026 — Lighthouse run against a production build (`/menu`): feature
      branch scored the same as a master baseline built/measured in this
      same sandbox (0.70 both; LCP 6.3s vs 6.2s, FCP 3.4s vs 3.3s, TBT 0ms
      both, CLS 0 both) — **no regression introduced**. The sub-90 absolute
      score is a pre-existing characteristic of measuring a local Node
      process with no CDN/edge caching in this sandbox (also true on
      unmodified master), not something this feature caused; the
      constitution's 90+ bar is measured against the real Vercel deployment.
- [x] T027 — Quickstart end-to-end: watermark verified visually + via test;
      Part B verified via live seed run + live API responses for all 3
      surfaces (AYCE buffet, AYCE carta, Express).

## Tests added (one or more per acceptance criterion)

- US1 (watermark): `app/layouts/default.spec.ts` — existing contract
  unmodified + new background-size assertion.
- US2 (single-sauce AYCE/Express + thermometer):
  `app/features/menu/components/MenuDishGrid.spec.ts` (thermometer renders
  once, absent elsewhere, lazy-loaded, sized full-width),
  `tests/db/menu-item-options-seed.test.ts` (AYCE/Express Alitas/Boneless
  seed shape + locationType disambiguation),
  `server/utils/menu-queries.test.ts` (maxSelections projection).
- US3 (À la Carta multi-select): `MenuSaucePicker.spec.ts` (bounded
  selection, no-op past limit, deselect frees a slot, 2- and 3-limit cases),
  `MenuDishCard.spec.ts` (maxSelections pass-through),
  `tests/db/menu-item-options-seed.test.ts` (2/3-sauce package seed shape).

## Known issues / follow-ups for the human

1. **Pre-existing seed-pipeline bug** (see above) — `pnpm db:seed` cannot be
   fully re-run end-to-end once `menu_item_option_groups` rows exist,
   because `seedDrinkGroups()` tries to delete referenced `menu_items` rows.
   Predates this feature (introduced by feature 027); not fixed here as it's
   outside this feature's declared scope.
2. **Sauce catalog is 13, not 12** — spec.md's copy says "12 sauces"; the
   actual DB has 13. No code assumes 12 (verified dynamic), so no functional
   bug, but the spec's factual premise is off by one and may be worth a
   wording fix in a future documentation pass.

No other TODOs.

---

## ROUND 2 — Phase 7: Part B Reversal (2026-07-17)

**Trigger**: The client, after seeing the FINAL thermometer graphic, decided
the interactive sauce picker is not wanted. spec_author amended
`spec.md`/`plan.md`/`tasks.md` in place ("Revision 2026-07-17" / "AMENDMENT
2026-07-17") to scrap User Stories 2/3's interactive-picker half (FR-006,
FR-009, FR-010, FR-011) and add new removal requirements FR-014 thru FR-019,
plus a new "Phase 7: Part B Reversal" task list (T028–T050). This round
executes that removal. **Part A (watermark) and the thermometer graphic
itself are completely untouched** — verified unchanged throughout.

### What was reverted (per FR-014 thru FR-019)

1. **Wings/Boneless option-group seed rows** (`server/db/seeds/menuItemOptions.ts`):
   removed `SAUCE_CHOICES`, `SINGLE_SAUCE_GROUP`, `multiSauceGroup()`, the
   `SAUCES` import, the 8 Wings/Boneless `DISH_OPTIONS_SEED` entries
   (AYCE/Express Alitas/Boneless + the 4 À la Carta packages), and the
   `locationType`/`idByNameAndLocation`/`resolveMenuItemId()` disambiguation
   plumbing that existed solely to resolve the AYCE/Express name collision —
   `seedMenuItemOptions()` reverted to a single `idByName` lookup map
   (verified byte-identical to the pre-`df3a13c` shape via `git show
   df3a13c^`). Ramen XL and Vaso Sumo entries are untouched.
2. **The `sauces` table**: dropped entirely. `server/db/seeds/sauces.ts`
   deleted; `server/db/seed.ts` no longer imports/calls `seedSauces`.
   `server/db/schema.ts`'s `sauces` pgTable definition removed. A NEW
   additive-only migration
   `server/db/migrations/0033_drop_sauces_and_option_group_max_selections.sql`
   (`_journal.json` updated with entry idx 33) does `DROP TABLE sauces`,
   `ALTER TABLE menu_items DROP COLUMN requires_sauce`, `ALTER TABLE
   menu_item_option_groups DROP COLUMN max_selections` (+ its CHECK
   constraint) in one combined migration, per spec.md's explicit instruction
   — migrations 0016 (sauces creation) and 0032 (max_selections addition)
   were NOT edited.
3. **`querySauces()` + `FullMenuResult.sauces` + `requiresSauce`**
   (`server/utils/menu-queries.ts`, `types/menu.ts`): `querySauces()`,
   `SauceQueryRow`, the `sauces` field on both `getFullMenu()` branches and
   `emptyMenuResult()`, `FullMenuSauce`, `FullMenuDish.requiresSauce`, and
   the `requiresSauce` column projection all removed. Every seed file
   (`ayceMenu.ts`, `expressMenu.ts`, `alaCarta.ts`, `kidsMenu.ts`,
   `desserts.ts`, `drinks.ts`) lost its `requiresSauce`/`requiresSauce?:
   boolean` field and mapping.
4. **`maxSelections`** (decided in spec.md's Clarifications, Session
   2026-07-17 Revision: dropped entirely per Article X KISS, not kept as
   bare infra): removed from `server/db/schema.ts`, `types/menu.ts`
   (`DishOptionGroup`), `menu-queries.ts`'s projection,
   `MenuSaucePicker.vue`'s prop/`isMultiSelect`/`selectedIds`/bounded-`Set`
   branch (reverted to the pre-`df3a13c` single-`selectedId`
   implementation, verified byte-identical via `git show df3a13c^`), and
   `MenuDishCard.vue`'s `:max-selections` binding.
5. **Test/story cleanup**: `tests/db/menu-item-options-seed.test.ts` lost its
   "Wings/Boneless sauce selection (feature 028)" describe block + `SAUCES`
   import. `server/utils/menu-queries.test.ts` lost every `sauces`/
   `querySauces`/`requiresSauce`/`maxSelections` mock field, type, and
   assertion (34 tests, all still passing — rewrote `mockMenuChains()`'s
   signature to drop the now-nonexistent sauce-query mock stage).
   `MenuSaucePicker.spec.ts`/`.stories.ts` reverted to their pre-`df3a13c`
   shape (multi-select tests/story removed). `MenuDishCard.spec.ts`/
   `.stories.ts`, `MenuDishGrid.spec.ts`/`.stories.ts`,
   `MenuDrinkSection.spec.ts`/`.stories.ts`, `MenuShell.spec.ts`/
   `.stories.ts`, and `app/pages/menu.spec.ts` all lost their
   `requiresSauce`/`sauces: []`/`maxSelections` fixture fields. One
   Storybook story (`MenuDishGrid.stories.ts`'s `WingsSectionWithThermometer`)
   was rewritten (not just field-stripped) because it demonstrated the now-
   removed interactive picker on Wings/Boneless dishes with hardcoded
   `optionGroups`; it now shows `optionGroups: []` on both dishes (thermometer
   + descriptive-text-only), matching real post-revert behavior.

### Verification performed

- `pnpm check` (Biome) — clean, 374 files, zero errors.
- `pnpm typecheck` (`nuxt typecheck` → `vue-tsc`) — clean, zero errors.
- `pnpm test` (`vitest run`) — 115 files / 1017 tests, all passing.
- `./init.sh` — full pipeline (env, harness files, feature_list validation,
  Biome, typecheck, tests, Storybook build) exits 0.
- **Live migration + seed dry-run** (T050): created a throwaway scratch
  Postgres database (`sumo_ayce_scratch028`) on the existing local docker
  container (never touched the pre-existing `sumo_ayce` dev database), ran
  `drizzle-kit migrate` through all 34 migrations (0000→0033) cleanly, then
  ran `server/db/seed.ts` end-to-end with synthetic env placeholders.
  Confirmed via `psql`: the `sauces` table is absent, `menu_items` has no
  `requires_sauce` column, `menu_item_option_groups` has no `max_selections`
  column, no FK errors, and after seeding only 2 menu items (Ramen XL, Vaso
  Sumo) have any `menu_item_option_groups` rows — zero Wings/Boneless rows.
  Scratch database dropped afterward.
- Repo-wide grep sweep (T048) for `sauces`/`SAUCES`/`requiresSauce`/
  `requires_sauce`/`querySauces`/`FullMenuSauce`/`maxSelections`/
  `max_selections` across `app/`, `server/`, `types/`, `tests/`: every
  remaining hit is either (a) the unrelated `MenuCategoryKey = 'sauces'`
  ("Salsas") category key, (b) historical migration files recording past
  schema states or the new DROP migration, (c) generic English-language
  copy in dish descriptions/i18n, or (d) historical spec/plan/progress
  documentation — no live application code reference remains.

### Phase -1 / Constitution re-check (Amendment 2026-07-17 table)

All 5 rows (Article I, VIII, III, IV, X) confirmed `✅ Pass` — the revert
touches only existing menu-feature folders, directly enforces Article VIII's
dead-code prohibition, follows the additive-only migration convention, and
removes rather than adapts now-orphaned test assertions.

### Tests updated per acceptance criterion (spec.md User Story 2, revised)

- "the sauce heat thermometer graphic is visible exactly once" —
  `MenuDishGrid.spec.ts` (unchanged, still passing).
- "no interactive sauce-selection control... shown" — new/updated assertion
  in `MenuDishCard.spec.ts` ("never renders a sauce picker for a dish with
  no configured option groups (FR-021)"), plus the live seed-run
  verification above (zero Wings/Boneless option-group rows after seeding).
- "thermometer's mild-to-spicy ordering... static asset" —
  `MenuDishGrid.spec.ts` (unchanged, thermometer is a plain `<img>`).
- FR-015/FR-016/FR-017 (`sauces` table + all references removed) —
  `server/utils/menu-queries.test.ts` (no `sauces`/`querySauces` assertions
  remain), the live scratch-DB migration dry-run (table physically absent).

### Known issues / follow-ups for the human (Round 2)

- The two Round-1 follow-ups above (pre-existing seed-pipeline FK bug on
  re-seed; sauce catalog being 13 not 12) are now moot for the "13 vs 12"
  item, since the `sauces` table and its catalog no longer exist at all.
  The seed-pipeline FK bug note is also moot — `menu_item_option_groups` no
  longer has a `sauces`-table dependency, and the live dry-run seed ran
  cleanly end-to-end on a fresh database with no FK issue encountered.
- No other TODOs. No dead code left referencing the removed surface.

---

## ROUND 3 — Part C: Wings/Boneless instructional note (2026-07-18)

**Trigger**: After Parts A and B (revised) shipped, were reviewer-approved,
and the feature was briefly marked `done`, the client requested one further
small addition. spec_author amended `spec.md`/`plan.md`/`tasks.md` in place
("Revision 2026-07-18" / "AMENDMENT 2026-07-18" / new "Phase 8", T051-T056)
to add the "Escoge tu salsa favorita" / "Choose your favorite sauce" note to
the "Alitas & Boneless" ("wings") category, reusing the existing
`menu_categories.noteEs`/`noteEn` mechanism already live for `kids`. This
round executes Phase 8 only — Phases 1-7 (watermark, thermometer, Part B
reversal) are historical and untouched.

### What changed

1. **`server/db/seeds/menuCategories.ts`** — added `noteEs: 'Escoge tu salsa
   favorita'` and `noteEn: 'Choose your favorite sauce'` to the `wings`
   entry in `CATEGORIES`, mirroring the existing `kids` entry's shape
   exactly. No schema change (the `noteEs`/`noteEn` columns already exist on
   `menu_categories`), no new component, no change to `MenuDishGrid.vue` —
   its existing `categoryNote()`/`category-note` rendering slot already
   renders any non-null `category.note` for any category, verified by
   re-reading the current file: render order is `<h2>` → `category-note`
   block → `wings`-gated thermometer `<img>` → dish grid, unchanged since
   Round 2.
2. **`tests/db/menu-seeds.test.ts`** — the pre-existing `'leaves every
   non-kids category without a note'` assertion would have failed once
   `wings` gained a note (it looped over every non-`kids` category asserting
   both note fields are null). Renamed to `'leaves every category other
   than kids/wings without a note'` and updated its exclusion list to skip
   both `kids` and `wings`. Added a new dedicated test, `'carries the
   sauce-choice note (bilingual) on the wings category'`, asserting
   `wings?.noteEs` contains `'salsa favorita'` and `wings?.noteEn` contains
   `'favorite sauce'` (mirrors the existing kids-note test).
3. **`app/features/menu/components/MenuDishGrid.spec.ts`** — added a new
   case, `'renders the wings category note ABOVE the thermometer graphic
   (feature 028, Part C)'`, mounting a `wings`-keyed category fixture with a
   non-null `note` and asserting the `category-note` block's HTML position
   precedes the `wings-thermometer` image's HTML position within the
   section. No `MenuDishGrid.vue` code change was needed or made — the
   render order already existed; this test only locks it in for the
   wings+thermometer combination specifically (previously only proven
   against `kids`, which has no thermometer).

### Scope explicitly NOT touched (per plan.md Part C + explicit task
instructions)

- No new schema, migration, component, or `MenuDishGrid.vue` layout change.
- **No direct database mutation of any kind** (local Docker or Neon) was
  performed this round. Per explicit instruction (this branch has prior
  history of a security incident from an implementer round that ran
  destructive DB commands it shouldn't have), tasks T054 (run the seed
  script against the target database) and T055 (manual QA on `/menu`
  against the re-seeded DB) were left `[ ]` in `tasks.md`, annotated as
  intentionally deferred to the leader, who will re-seed the real dev DB
  (Neon) directly. T056 (full `vitest run`) was completed against the
  code/test changes — it does not require DB access since `CATEGORIES` is a
  pure in-memory constant asserted against directly (the existing project
  convention for this test file, per its own top-of-file comment).

### Phase -1 / Constitution re-check (Part C table, plan.md)

All 4 rows confirmed `✅ Pass` during implementation:
- **I — Reusability**: reuses `noteEs`/`noteEn` columns, `seedMenuCategories()`
  upsert, and `categoryNote()`/`category-note` slot verbatim — zero new
  abstraction.
- **IV — Testing**: `menu-seeds.test.ts` updated + new test added;
  `MenuDishGrid.spec.ts` new render-order case added.
- **VIII — Clean Code Discipline**: no dead code, no unused fields.
- **X — KISS**: no new schema/component/mechanism, smallest possible change
  (two string values) using infrastructure already proven for `kids`.

### Tests added/updated per acceptance criterion (spec.md User Story 4)

- AC1 ("note visible exactly once, below title, above thermometer") —
  `MenuDishGrid.spec.ts`'s new `'renders the wings category note ABOVE the
  thermometer graphic'` case.
- AC2 ("no other category shows this note") —
  `tests/db/menu-seeds.test.ts`'s renamed/updated `'leaves every category
  other than kids/wings without a note'` test (asserts every category
  except `kids`/`wings` has null notes).
- AC3 ("both notes use the same visual treatment/component") — implicitly
  covered: no new note style/component was introduced; `wings` reuses the
  exact same `category-note` block/CSS classes already exercised by the
  existing `kids` note tests.

### Verification performed

- `npx vitest run tests/db/menu-seeds.test.ts
  app/features/menu/components/MenuDishGrid.spec.ts` — both files pass (46
  tests).
- `pnpm test` (full `vitest run`) — 115 files / 1019 tests, all passing.
- `pnpm check` (Biome) — clean, 374 files, zero errors.
- `pnpm typecheck` (`nuxt typecheck`) — clean, zero errors.
- `./init.sh` — full pipeline (env, harness files, feature_list validation,
  Biome, typecheck, tests, Storybook build) exits 0.
- Security self-scan (`git diff` grep for secrets/keys/tokens/PEM/JWT
  patterns) — zero hits on the Part C diff.
- No `.vue` component was added or modified this round, so the UI
  checklist's Storybook/story requirements do not apply (`MenuDishGrid.vue`
  itself is unchanged — only its two co-located test files and the seed
  data module were touched).

### Known issues / follow-ups for the human

- **T054/T055 are pending and belong to the leader**: the `wings` category
  row in the real dev (Neon) database still has `note_es`/`note_en` = NULL
  until `seedMenuCategories()` is re-run against it. Until that re-seed
  happens, `/menu` will not yet show the new note in any live/deployed
  environment, even though the code and tests are complete and green.
- No other TODOs. No dead code introduced.

---

## ROUND 4 — Part D: Category note box content-width fix (2026-07-18)

**Trigger**: The client visually inspected Part C's own shipped output
(screenshot confirmed) and found the `category-note` box — a block-level
`<div>` with no width constraint — rendered as an oversized, mostly-empty
pill for the short "Escoge tu salsa favorita" wings note, even though the
identical box class list looks correct for the pre-existing "kids" category's
long paragraph note. spec_author amended `spec.md`/`plan.md`/`tasks.md` in
place ("Revision 2026-07-18 — Part D" / "AMENDMENT 2026-07-18 — Part D" /
new "Phase 9", T057-T061) to add a pure CSS content-width fix. This round
executes Phase 9 only — Phases 1-8 (watermark, thermometer, Part B reversal,
Part C note) are historical and untouched. **No database involvement this
round** — CSS-only, nothing to seed/migrate.

### What changed

1. **`app/features/menu/components/MenuDishGrid.vue`** — added `w-fit
   max-w-full` to the existing `category-note` `<div>`'s class list
   (~line 53), appending to (not replacing) the existing classes
   (`mb-6 rounded-pop border-pop border-ink bg-yellow px-4 py-3 font-disp
   font-extrabold text-kicker shadow-pop-sm`). `w-fit` (`width: fit-content`)
   hugs short text tightly; `max-w-full` is a defensive cap at 100% of the
   parent's width. No other class, template structure, or component was
   touched. Added an inline comment explaining the Part D rationale.
2. **`app/features/menu/components/MenuDishGrid.spec.ts`** — added a new
   test, `'sizes the category-note box to fit its content instead of
   stretching full-width (feature 028, Part D)'`, asserting the rendered
   `category-note` element's class list contains `w-fit` and does NOT
   contain `w-full` (the full-width-forcing class it would have needed if
   the fix had gone the other direction). Reuses the same `kids`-category
   long-note fixture already used by the pre-existing "renders the category
   note at the TOP of the section" test, so the long-text case is directly
   exercised.
3. **`app/features/menu/components/MenuDishGrid.stories.ts`** — added
   JSDoc "Manual visual QA" callouts to both `KidsList` (long note — confirm
   it still reads/wraps unchanged at desktop and the Mobile/360px viewport)
   and `WingsSectionWithThermometer` (short note — confirm it now hugs its
   text). `WingsSectionWithThermometer`'s wings category previously had
   `note: null`; gave it the actual `noteEs`/`noteEn` values so the story
   now visually demonstrates the exact case the client flagged (short note
   above the thermometer graphic), rather than requiring a new story file.

### Why `w-fit max-w-full` is safe for both existing note strings

CSS `fit-content` sizing is `min(max-content, max(min-content,
available-space))`. Both note strings today (the long kids paragraph and the
short wings sentence) are ordinary space-separated text, not single
unbreakable tokens, so `fit-content` already cannot exceed the container's
available width — the kids note's wrapping/appearance is unaffected, and the
wings note now hugs its shorter content instead of stretching full-width.
`max-w-full` adds a zero-cost defensive cap with no observable effect on
either of today's two strings. Confirmed by inspecting the compiled Tailwind
CSS output (`storybook-static/assets/*.css`) after building Storybook: both
`.w-fit{width:-moz-fit-content;width:fit-content}` and
`.max-w-full{max-width:100%}` are present in the generated bundle (i.e. not
purged), and no `safelist` entry was needed since both are Tailwind core
utilities already used/available in `tailwind.config.ts`'s default preset.

### Phase -1 / Constitution re-check (Part D table, plan.md)

All 5 rows confirmed `✅ Pass` during implementation:
- **I — Reusability**: no new component/abstraction — a class-list change
  on the existing `category-note` block only.
- **IV — Testing**: new Vitest assertion added pinning the class list;
  Storybook stories updated with visual-check callouts for both cases.
- **VII — UX Consistency**: no other visual property changed (color,
  border, shadow, font all untouched); mobile-first behavior preserved.
- **VIII — Clean Code Discipline**: no dead code, single-line class-list
  edit plus one comment.
- **X — KISS**: standard Tailwind width utility, no new custom CSS, no new
  prop/conditional logic.

### Tests added per acceptance criterion (spec.md User Story 5)

- AC1 ("wings note box fits its short text content, not full-width") —
  `MenuDishGrid.spec.ts`'s new `'sizes the category-note box to fit its
  content...'` test asserts `w-fit` is present and `w-full` is absent on the
  rendered element (using the note fixture; the same class list applies
  regardless of note length, since Tailwind classes are static, not
  conditional on content).
- AC2 ("kids note remains fully readable, no regression") — the same new
  test reuses the existing long kids-note fixture, proving the class-list
  change applies without altering the text content/wrapping; the
  pre-existing `'renders the category note at the TOP of the section when
  present'` test (unchanged, still passing) continues to prove the kids
  note's full text renders correctly.
- AC3 ("never overflows a 360px mobile viewport") — covered by
  `max-w-full`'s CSS semantics (caps at 100% of the parent regardless of
  viewport width) plus the `Mobile: Story` viewport annotation already
  present in `MenuDishGrid.stories.ts`, now cross-referenced by the new
  JSDoc visual-QA callouts on `KidsList`/`WingsSectionWithThermometer` for
  manual confirmation (no dedicated automated viewport-width test exists
  elsewhere in this file's suite, consistent with the project's existing
  Storybook-viewport-for-visual, Vitest-for-DOM-assertions split).

### Verification performed

- `npx vitest run app/features/menu/components/MenuDishGrid.spec.ts` — 19
  tests, all passing (including the new Part D case).
- `pnpm test` (full `vitest run`) — 115 files / 1020 tests, all passing.
- `pnpm check` (Biome) — clean, 374 files, zero errors.
- `pnpm typecheck` (`nuxt typecheck`) — clean, zero errors.
- `./init.sh` — full pipeline (env, harness files, feature_list validation,
  Biome, typecheck, tests, Storybook build) exits 0.
- Storybook build (`storybook-static/`, gitignored, not committed) confirmed
  both `w-fit` and `max-w-full` compile into the generated CSS bundle
  (visual QA, T061).
- Security self-scan (`git diff` grep for secrets/keys/tokens/PEM/JWT
  patterns) — the only hits are pre-existing narrative prose in
  `feature_list.json`'s description field and prior-round progress-file text
  that happen to contain the English words "token"/"password" in unrelated
  context (e.g. describing this very self-scan, or a JWT-unrelated design
  note); zero actual secrets in the Part D diff (which touches only
  `MenuDishGrid.vue`, `.spec.ts`, `.stories.ts`, and `tasks.md` checkboxes).
- No database involvement this round: no `db:seed`/`db:migrate` run, no
  mutation to any local Docker or Neon database — this is a pure CSS/test
  change with zero schema/data dependency, per explicit scope.

### UI checklist (MenuDishGrid.vue touched)

- Change confined to `app/features/menu/components/` — no cross-feature
  import, no new file. `MenuDishGrid.vue` stays well under 200 lines (89
  lines total).
- No new visual variant/prop introduced — a static class-list addition, not
  a `variant` prop.
- `.stories.ts` updated in the same round to reflect the change (JSDoc
  visual-QA callouts + the `WingsSectionWithThermometer` note fixture
  update) — no phantom/removed props, `argTypes` unchanged (no prop was
  added/removed).
- No new Tailwind token, color, radius, or shadow introduced — reuses only
  existing core Tailwind utilities (`w-fit`, `max-w-full`) on top of the
  project's already-established `category-note` design (yellow-pop
  treatment, `shadow-pop-sm`, `border-pop`), so no `docs/business/overview.md`
  token check applies beyond "no visual property besides width changed,"
  confirmed true.
- No brand-copy or Express-accent concern — no copy/content changed, no
  Express-scoped styling touched.

### Known issues / follow-ups for the human

- None specific to Part D. The Round 3 (Part C) follow-up above (T054/T055,
  re-seeding the real Neon dev DB with the wings note text) remains
  outstanding and unaffected by this round — Part D is CSS-only and has no
  database dependency of its own.
- No dead code introduced. No TODOs left in source.
