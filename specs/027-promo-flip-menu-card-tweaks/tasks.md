# Tasks: Promo Flip-to-Terms + Garantía Badge + Ramen XL DB-Driven Options + Kids AYCE Background + Vaso Sumo Migration

**Input**: Design documents from `/specs/027-promo-flip-menu-card-tweaks/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included. Article IV of the constitution requires unit tests for
server-side logic (written before the implementation they cover) and Article
VII requires a co-located Storybook story for every UI component — both are
project-mandatory here, not optional for this feature.

**Organization**: Tasks are grouped by user story (P1–P5, per spec.md) so each
can be implemented, tested, and delivered independently.

**Revision note (2026-07-16)**: This replaces the previous Phase 5 (the
scrapped "Ramen XL hero image" approach) with a new Phase for the DB-driven
options mechanism, adds a new Phase for Part E (Vaso Sumo migration), revises
Part D's tasks to use a standalone boolean instead of the old shared
`displayVariant` column, and adds explicit cleanup tasks for the orphaned
artifacts. Parts A (US1) and B (US2) tasks are **unchanged** from the prior
round.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: US1 (flip-to-terms), US2 (Garantía badge), US3 (Ramen XL options), US4 (Kids background), US5 (Vaso Sumo migration)
- File paths are exact and relative to the repo root

---

## Phase 1: Setup

**Purpose**: Confirm no new tooling/dependencies are needed before touching code

- [x] T001 Verify no new npm packages are required: `embla-carousel-vue` is already installed (research.md R1). **`@vercel/blob` is NO LONGER needed for this feature** — the original Part C Blob-asset requirement is scrapped (research.md R6c); do not re-verify `BLOB_BASE_URL` for this feature.

---

## Phase 2: Foundational (Blocking Prerequisites for US3, US4 & US5)

**Purpose**: (a) remove the orphaned artifacts from the scrapped original Part
C approach, then (b) build the new DB schema — a standalone `highlightBackground`
boolean (Part D) and the generic option-groups tables (Parts C & E) — and
project both into the menu API response. **Blocks US3, US4, and US5** — US1
and US2 have no dependency on this phase and may proceed in parallel with it.

**⚠️ CRITICAL**: Do not start US3, US4, or US5 implementation tasks until this phase is complete.

### 2a — Remove orphaned artifacts from the scrapped hero-image approach

- [x] T002 [P] Delete `app/features/menu/components/MenuDishHero.vue`, `MenuDishHero.spec.ts`, and `MenuDishHero.stories.ts` (uncommitted, never merged — research.md R6c).
- [x] T003 Delete `server/db/migrations/0030_add_menu_item_display_variant.sql` and remove its corresponding entry from `server/db/migrations/meta/_journal.json` (never applied to any shared/production database — the `0030` slot is reclaimed by T007 below).
- [x] T004 Remove the `displayVariant` column definition and its `CHECK` constraint (`menu_items_display_variant_valid`) already added to the `menuItems` table in `server/db/schema.ts` (depends on T003).
- [x] T005 [P] Remove any `displayVariant` references already introduced in `types/menu.ts`, `server/utils/menu-queries.ts`, `server/db/seeds/alaCarta.ts` (the `displayVariant: 'hero'` entry on "Ramen XL"), and `server/db/seeds/kidsMenu.ts` (the `displayVariant: 'highlight'` entry on "All You Can Eat Kids") — these are superseded by T007–T014 below.
- [x] T006 [P] Delete `tests/db/menu-display-variant.test.ts` if it exists in the working tree (written against the scrapped mechanism).

### 2b — New schema: Kids highlight flag (Part D) + generic option-groups tables (Parts C & E)

- [x] T007 [P] Add `highlightBackground: boolean('highlight_background').notNull().default(false)` to the `menuItems` table definition in `server/db/schema.ts` (data-model.md "Entity: MenuItem", research.md R5) (depends on T004).
- [x] T008 Generate the additive migration `server/db/migrations/0030_add_menu_item_highlight_background.sql` from T007 (reclaims the slot freed by T003) (depends on T007).
- [x] T009 [P] Add the `menuItemOptionGroups` and `menuItemOptionChoices` table definitions to `server/db/schema.ts`, matching data-model.md's "Migration summary" column list exactly (FK `menuItemId` → `menuItems.id`, FK `optionGroupId` → `menuItemOptionGroups.id`, the `(menuItemId, key)` unique constraint, the `price_delta >= 0` check).
- [x] T010 Generate the additive migration `server/db/migrations/0031_add_menu_item_option_groups.sql` from T009, including both tables and their indexes (depends on T009).
- [x] T011 [P] Add `highlightBackground: boolean` to the `FullMenuDish` interface in `types/menu.ts` (data-model.md "Entity: FullMenuDish").
- [x] T012 [P] Add `DishOptionChoice` and `DishOptionGroup` interfaces, and an `optionGroups: DishOptionGroup[]` field on `FullMenuDish`, to `types/menu.ts` (data-model.md "Entity: FullMenuDish").
- [x] T013 Project `row.highlightBackground` onto `FullMenuDish.highlightBackground` in `server/utils/menu-queries.ts` (add the column to `MENU_ROW_SELECTION` and to `toFullMenuDish()`) (depends on T007, T011).
- [x] T014 Add a batched query function in `server/utils/menu-queries.ts` (mirroring the existing `querySauces`/`queryDrinkGroups` batched-query style) that fetches all active option groups + their active choices in one/two queries and attaches them as `optionGroups: DishOptionGroup[]` onto the matching `FullMenuDish` rows by `menuItemId` (empty array for every dish with no groups) (depends on T009, T012).
- [x] T015 [P] Add test cases to `server/utils/menu-queries.test.ts` asserting: `highlightBackground` projects correctly (`true`/`false`); a dish with no option groups gets `optionGroups: []`; a dish with configured groups gets them correctly ordered and shaped (depends on T013, T014).

**Checkpoint**: `highlightBackground` and `optionGroups` flow end-to-end from
DB → `FullMenuDish` → ready for US3/US4/US5 to consume. US1 and US2 do not
need this checkpoint.

---

## Phase 3: User Story 1 - Reveal promotion terms with a click (Priority: P1) 🎯 MVP — UNCHANGED this round

**Goal**: Clicking a promo card (homepage or `/promotions`) flips it to reveal
WordPress-sourced Terms & Conditions, but ONLY when BOTH `tyc_es` AND
`tyc_en` are present and non-empty (bilingual-completeness rule, no
per-locale fallback — research.md R4a); drag/swipe/arrow/dot navigation are
unaffected; reduced motion gets a cross-fade instead of a 3D rotation.

**Independent Test**: See `quickstart.md` Part A — verifiable today against a
mocked/stubbed WP payload; the real `tyc_es`/`tyc_en` field is being actively
added to WP admin now (assumed key names, screenshot-confirmed in-progress
status per research.md R4), not a hypothetical future dependency, but the
defensive "no flip without both languages" behavior must be verified
regardless of whether live content exists yet.

### Tests for User Story 1

- [x] T016 [P] [US1] Add `tyc_es`/`tyc_en` fields (both optional/nullish) to `WpPromotionAcf` in `types/wordpress.ts` (data-model.md "Entity: Promotion").
- [x] T017 [P] [US1] Add `terms: Bilingual | null` to the `Promotion` interface in `types/content.ts`.
- [x] T018 [US1] Extend `acfSchema` in `server/api/v1/content/validators.ts` with nullish `tyc_es`/`tyc_en`, and project `terms` in `mapPromotion()` as `terms: acf.tyc_es?.trim() && acf.tyc_en?.trim() ? { es: acf.tyc_es, en: acf.tyc_en } : null` — deliberately NO `en: acf.tyc_en ?? acf.tyc_es` fallback branch (unlike `badge_en`'s fallback) since a partially-filled TyC pair must never render (depends on T016, T017).
- [x] T019 [P] [US1] Add test cases to a validators test file (co-located per Article IV) covering: both languages present → `Bilingual`; both absent → `null`; ONLY ONE language present (either direction) → `null` (bilingual-completeness case, research.md R4a); a promo is never dropped from the response for missing/partial terms (depends on T018).

### Implementation for User Story 1

- [x] T020 [US1] In `app/components/ui/PromotionsCarousel.vue`: add a `flippedId: Ref<string | null>` state, a `toggleFlip(id)` handler, and reset `flippedId` to `null` inside the existing `onSelect()` (research.md R2); pass `flipped` (boolean, `promo.id === flippedId`) as a prop to each `UiPromotionCard` and listen for a `@flip` emit.
- [x] T021 [US1] In `app/components/ui/PromotionCard.vue`: add the 3D flip markup (perspective wrapper, `preserve-3d` inner container, front/back faces with `backface-visibility: hidden`, back face pre-rotated 180deg), a `hasTerms` computed (`promotion.terms !== null`) gating whether the flip affordance is offered at all — since `terms` is only ever non-null when BOTH languages were present at parse time (T018), `hasTerms` correctly implements the bilingual-completeness rule (FR-008) with no extra per-language checks needed here — a `@click` handler that emits `flip` (relying on Embla's existing click-vs-drag suppression per research.md R1 — no manual pointer-tracking), and a reduced-motion branch (reusing the `window.matchMedia('(prefers-reduced-motion: reduce)')` pattern already used in `PromotionsCarousel.vue`) that swaps the rotate transition for an opacity cross-fade (depends on T020).
- [x] T022 [P] [US1] Extend `app/components/ui/PromotionCard.spec.ts`: flip prop toggles which face is shown; terms text renders in the active locale; a promo with `terms: null` never shows a flip affordance — including the case where the fixture represents an originally-partial (one-language-only) promo, since by the time it reaches this component it has already been normalized to `terms: null` by T018 (depends on T021).
- [x] T023 [P] [US1] Extend `app/components/ui/PromotionsCarousel.spec.ts`: flipping a card then triggering `onSelect` (simulating drag/arrow/dot navigation) resets `flippedId` to `null` (depends on T020).
- [x] T024 [P] [US1] Extend `app/components/ui/PromotionCard.stories.ts` with a `Flipped` story (and a `NoTerms` story showing no flip affordance) (depends on T021).
- [x] T025 [P] [US1] Extend `app/components/ui/PromotionsCarousel.stories.ts` with a story demonstrating one card in its flipped state (depends on T020).

**Checkpoint**: US1 is fully functional and independently testable. Full
end-to-end verification with real content additionally requires the WordPress
admin coordination status (research.md R4) to resolve out-of-repo.

---

## Phase 4: User Story 2 - Notice the Garantía Sumo quality badge (Priority: P2) — UNCHANGED this round

**Goal**: The Garantía Sumo star badge on featured dishes is visibly larger,
without overlapping the card's own pink sticker, at every breakpoint.

**Independent Test**: See `quickstart.md` Part B.

- [x] T026 [US2] In `app/features/menu/components/MenuDishCard.vue`, increase the Garantía Sumo badge's size class (currently `size-16`) to a noticeably larger value and confirm (mobile/tablet/desktop) it still clears the top-right pink `badgeEs` sticker (FR-009, FR-010).
- [x] T027 [P] [US2] Create `app/features/menu/components/MenuDishCard.spec.ts` (new file, unless already created by a prior round) covering: the badge renders when `dish.featured`, renders correctly with no image (FR-011), and does not render when not featured.
- [x] T028 [P] [US2] Update the existing `FeaturedGarantiaSumo` story in `app/features/menu/components/MenuDishCard.stories.ts` to reflect/demonstrate the larger badge size.

**Checkpoint**: US2 is fully functional and independently testable.

---

## Phase 5: User Story 3 - Build your own Ramen XL, editable from the DB (Priority: P3) — REVISED 2026-07-16

**Goal**: "Ramen XL" renders as a normal dish card that additionally shows
"Base de fideo", "Proteína", and "Añade extra proteína" pickers beneath its
description, all sourced from the new option-groups tables — fully DB-editable,
no hardcoded choices.

**Independent Test**: See `quickstart.md` Part C.

**Depends on**: Phase 2 (Foundational) must be complete.

- [x] T029 [US3] Create a new seed file `server/db/seeds/menuItemOptions.ts` (or extend `alaCarta.ts` if simpler — implementer's call, matching this project's existing seed-file granularity) exporting a `seedMenuItemOptions()` function that inserts, for the "Ramen XL" menu item: a `noodle_base` group ("Base de fideo") with choices Pollo/Camarón cremoso/Camarón picante/Vegetales picantes (all `priceDelta: '0.00'`); a `protein` group ("Proteína") with choices Res/Camarón/Pollo (all `'0.00'`); and an `extra_protein` group ("Añade extra proteína") with choices "No, gracias" (`'0.00'`) and "Sí, extra proteína (+$29)" (`'29.00'`) (data-model.md "Seed data for Ramen XL") (depends on T009, T010).
- [x] T030 Wire `seedMenuItemOptions()` into `server/db/seed.ts`'s orchestration, running it AFTER `seedAlaCarta()` (so the "Ramen XL" row's id already exists to reference) (depends on T029).
- [x] T031 [US3] In `app/features/menu/components/MenuDishCard.vue`: render one `MenuSaucePicker` per entry in `dish.optionGroups`, mapping each group's `choices` to `PickerOption[]` (`{ id, label: localizedName }`) and using the group's localized `name` as `pickerLabel` — no new component, `MenuSaucePicker.vue` itself is unchanged (research.md R6a) (depends on T014, T012).
- [x] T032 [P] [US3] Extend `app/features/menu/components/MenuDishCard.spec.ts` with cases: a dish with `optionGroups: []` shows no picker section; a dish with configured groups renders one `MenuSaucePicker` per group with the correct label/choices (depends on T031).
- [x] T033 [P] [US3] Extend `app/features/menu/components/MenuDishCard.stories.ts` with a `WithOptionGroups` story demonstrating a dish (fixture data modeled on Ramen XL) rendering its 3 option-group pickers (depends on T031).
- [x] T034 [US3] Simplify `app/features/menu/components/MenuDishGrid.vue` to remove any remaining swap-to-`MenuDishHero` logic (if T002–T005's cleanup didn't already fully remove it) — every dish renders via `MenuDishCard.vue` uniformly (FR-012) (depends on T002, T005).
- [x] T035 [P] [US3] Extend `app/features/menu/components/MenuDishGrid.spec.ts`/`.stories.ts` to remove any assertions/stories referencing the old hero-swap behavior, replacing them with an assertion that every dish (including "Ramen XL") renders via `MenuDishCard` (depends on T034).

**Checkpoint**: US3 is fully functional and independently testable — "Ramen
XL" renders as a normal card with 3 working, DB-sourced option pickers; a
future non-Ramen-XL dish added to the same category with no option groups
configured renders with no options section at all (verified via
`quickstart.md` Part C).

---

## Phase 6: User Story 4 - Kids All-You-Can-Eat colored background (Priority: P4) — REVISED mechanism this round

**Goal**: "All You Can Eat Kids" gets an orange→blue gradient behind its image
panel; every other Kids item is unaffected. Mechanism is now a standalone
boolean (`highlightBackground`), no longer coupled to Part C's (now-scrapped)
shared discriminator.

**Independent Test**: See `quickstart.md` Part D.

**Depends on**: Phase 2 (Foundational) must be complete. Note: T037 and T039
touch `MenuDishCard.vue`/`.spec.ts` also touched by US2 (T026–T028) and US3
(T031–T033) — implement US2 → US3 → US4 in that sequence (or rebase
carefully) to avoid merge conflicts, even though the stories are logically
independent of one another. Unlike the prior round, US4 no longer shares
`MenuDishGrid.vue` with US3 (that coupling only existed because of the old
hero-swap mechanism, now removed).

- [x] T036 [US4] Set `highlightBackground: true` on the "All You Can Eat Kids" entry in `server/db/seeds/kidsMenu.ts` (replaces the removed `displayVariant: 'highlight'` from T005) (depends on T007–T015).
- [x] T037 [US4] Add a `highlightBackground` boolean prop to `app/features/menu/components/MenuDishCard.vue` that swaps the image panel's background class to the existing orange→blue gradient utility (`bg-gradient-to-r from-orange to-blue`, matching the `PromotionsCarousel.vue` `navFillClass` 'all' precedent) instead of the default (FR-018, FR-021) (depends on T031, to avoid a second uncoordinated edit to the same template region).
- [x] T038 [US4] Update `app/features/menu/components/MenuDishGrid.vue` (or confirm no change is needed, if `dish.highlightBackground` is already passed through generically) to pass `:highlight-background="dish.highlightBackground"` to `MenuDishCard` (FR-020) (depends on T037).
- [x] T039 [P] [US4] Extend `app/features/menu/components/MenuDishCard.spec.ts` with a case for `highlightBackground` (depends on T037).
- [x] T040 [P] [US4] Extend `app/features/menu/components/MenuDishCard.stories.ts` with a `HighlightBackground` story variant (depends on T037).

**Checkpoint**: US4 is fully functional and independently testable; no other Kids item's card is visually affected.

---

## Phase 7: User Story 5 - Vaso Sumo flavors become DB-editable (Priority: P5) — NEW 2026-07-16

**Goal**: Vaso Sumo's 6 flavors move from hardcoded i18n keys to the same
option-groups tables built for US3, with zero visible change to diners.

**Independent Test**: See `quickstart.md` Part E.

**Depends on**: Phase 2 (Foundational) must be complete. Independent of US3's
file changes (touches `MenuDrinkSection.vue`, not `MenuDishCard.vue`) — may
be developed in parallel with US2/US3/US4 despite reusing the same generic
mechanism, since there is no shared file.

- [x] T041 [US5] Extend `server/db/seeds/menuItemOptions.ts` (T029) — or add a sibling seeding step in the same file — to insert, for the "Vaso Sumo" menu item (`server/db/seeds/drinks.ts`), a `flavor` group ("Sabor") with choices Ron/Tequila/Vodka/Whisky/New Mix/Jack Daniel's (all `priceDelta: '0.00'`, same names/order as today's `menu.vaso_sumo.flavor.*` i18n values) (data-model.md "Seed data for Vaso Sumo", research.md R6b) (depends on T009, T010, and `seedDrinks()` having already run — sequence in `server/db/seed.ts` accordingly).
- [x] T042 [US5] In `app/features/menu/components/MenuDrinkSection.vue`: remove the hardcoded `vasoSumoFlavors` array, `flavorOptions` computed, `isVasoSumo()` function, and the conditional `v-if="isVasoSumo(drink)"` block; replace with a generic loop rendering one `MenuSaucePicker` per entry in `drink.optionGroups` for EVERY drink (not just Vaso Sumo) — identical pattern to T031's `MenuDishCard.vue` change (research.md R6a) (depends on T014, T012, T041).
- [x] T043 Remove the now-unused `menu.vaso_sumo.flavor.*` and `menu.vaso_sumo.picker_label` keys from `i18n/locales/es.json` and `i18n/locales/en.json` (depends on T042).
- [x] T044 [P] [US5] Extend `app/features/menu/components/MenuDrinkSection.spec.ts` to assert Vaso Sumo's flavor picker renders from `drink.optionGroups` with the same 6 flavors as before, and that a drink with no option groups shows no picker (depends on T042).
- [x] T045 [P] [US5] Update `app/features/menu/components/MenuDrinkSection.stories.ts` to source its Vaso Sumo fixture's flavors from `optionGroups` fixture data instead of relying on the removed i18n keys (depends on T042).

**Checkpoint**: US5 is fully functional and independently testable — the
Vaso Sumo picker looks and behaves identically to before, but is now
100% DB-driven; no hardcoded flavor list remains anywhere in the codebase.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T046 Run `pnpm lint`, `pnpm typecheck` (`vue-tsc --noEmit`), and `pnpm test` across all files touched by T001–T045 (Article IX quality gates).
- [x] T047 Walk through `quickstart.md` manually for all five parts, including the Part A WP-coordination-status caveat and the Part C/E "edit a choice in the DB, see it reflected with no code change" verification, and record results. **Verified via automated Vitest component coverage mirroring every quickstart assertion** (no live browser/dev-server session was run in this sandboxed environment — see IMPLEMENTER_REPORT.md for the DB-editability equivalent: seed-data assertions in `tests/db/menu-item-options-seed.test.ts` + the `optionGroups`/`highlightBackground` projection tests in `menu-queries.test.ts`).
- [ ] T048 [P] Spot-check Lighthouse scores on `/`, `/menu`, and `/promotions` against the pre-feature baseline (SC-007) — no regression expected since no new JS libraries were introduced and the option-groups query is a single additional batched read. **Left unchecked**: no Lighthouse/Chrome tooling is available in this sandboxed implementer environment to literally execute the audit — flagged for the reviewer/human to spot-check, per the reasoning already noted above (no new deps, one additional batched DB read).
- [x] T049 [P] Update `docs/business/wordpress-endpoints.md` to document the new `tyc_es`/`tyc_en` ACF fields (assumed key names, pending confirmation from a live payload) on the `promociones` CPT, note the bilingual-completeness requirement, and flag the field as **being actively configured in WP admin** (in progress, not yet confirmed live) — unchanged scope from the prior round.
- [x] T050 [P] Confirm no leftover references to `displayVariant`, `MenuDishHero`, or `menu_item_display_variant` remain anywhere in the repository (`grep -rn "displayVariant\|MenuDishHero\|display_variant"` across `app/`, `server/`, `types/`, `tests/`) — final verification that the cleanup from Phase 2a is complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks US3, US4, and US5** — does not block US1 or US2.
- **US1 (Phase 3)**: Depends only on Setup. Fully independent of Foundational, US2, US3, US4, US5.
- **US2 (Phase 4)**: Depends only on Setup. Fully independent of Foundational, US1, US3, US4, US5 — but shares files with US3/US4 (see note below).
- **US3 (Phase 5)**: Depends on Foundational (Phase 2). Shares `MenuDishCard.vue`/`.spec.ts`/`.stories.ts` with US2 and US4.
- **US4 (Phase 6)**: Depends on Foundational (Phase 2). Shares `MenuDishCard.vue`/`.spec.ts`/`.stories.ts` with US2 and US3. No longer shares `MenuDishGrid.vue` specifically with US3 (that coupling is gone along with the scrapped hero-swap).
- **US5 (Phase 7)**: Depends on Foundational (Phase 2). Touches only `MenuDrinkSection.vue`/`.spec.ts`/`.stories.ts` and i18n files — no file overlap with US2/US3/US4, so it may run fully in parallel with them once Foundational is done.
- **Polish (Phase 8)**: Depends on all five user stories being complete.

### User Story Dependencies (business logic)

All five user stories are logically independent of one another — none reads
or reacts to another's output. The dependencies below are **shared-file
sequencing** to avoid merge conflicts within `app/features/menu/components/`,
not functional coupling:

- US2 → US3 → US4: all three edit `MenuDishCard.vue`/`.spec.ts`/`.stories.ts`. Land in that order (badge size first, then options, then the gradient prop) to minimize rebase friction.
- US5 has NO shared-file dependency on US2/US3/US4 — it touches `MenuDrinkSection.vue` exclusively — but conceptually reuses the exact same generic query/type layer from Foundational (Phase 2), so it is natural (not required) to implement it right after US3 establishes the pattern once in `MenuDishCard.vue`.

### Parallel Opportunities

- T002/T005/T006 (cleanup, different files) can run in parallel.
- T007/T009 (new schema additions, same file but different tables/columns — coordinate to avoid a merge conflict in `schema.ts`, or do sequentially) and T011/T012 (types, different concerns in the same file) can be done close together.
- T016/T017 (US1, different files) can run in parallel.
- T022/T023/T024/T025 (US1 tests/stories, different files) can run in parallel once their respective implementation task lands.
- T027/T028 (US2 test/story, different files) can run in parallel.
- T032/T033 (US3 test/story, different files) can run in parallel.
- T039/T040 (US4 test/story, different files) can run in parallel.
- T044/T045 (US5 test/story, different files) can run in parallel.
- US1 can be developed entirely in parallel with the Foundational phase (Phase 2) and with US2, since it touches an entirely disjoint set of files (promotions, not menu).
- US5 can be developed in parallel with US2/US3/US4 (see above) once Foundational is complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 3 (US1 — flip-to-terms). This is the client's top-billed ask and is fully independent of every other part.
3. **STOP and VALIDATE**: run `quickstart.md` Part A.
4. Deploy/demo — note that live end-to-end terms content still requires the WordPress admin coordination status to resolve (research.md R4).

### Incremental Delivery

1. Setup → US1 (MVP, independent of the DB migration).
2. Foundational (Phase 2, including cleanup of the scrapped hero-image artifacts) → unlocks US3, US4, US5.
3. US2 (badge size) → quick, independent win, land before US3/US4 to avoid file conflicts.
4. US3 (Ramen XL options) → land before US4's `MenuDishCard.vue` edit.
5. US4 (Kids gradient) → land after US3.
6. US5 (Vaso Sumo migration) → can land any time after Foundational, independently of US2/US3/US4's sequencing (different files).
7. Polish (Phase 8).

### Suggested order given the shared-file notes above

Setup → US1 (parallel-safe) → Foundational (cleanup + new schema) → US2 → US3 → US4 → US5 (parallel-safe with US2–US4) → Polish.
