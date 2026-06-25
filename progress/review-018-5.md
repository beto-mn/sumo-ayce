# Review: menu-page (011 / feat/018-menu-page)

**Status:** REJECTED

---

## Reasons

### R1 — US3 SC2 has no covering test (BLOCKING)

Acceptance criterion US3 SC2: "**Given** `/menu?type=express`, **When** the dish grid renders, **Then** only Express and 'both' items appear; AYCE-only items do not appear."

The test labeled "US3 SC2 coverage" in `app/features/menu/components/MenuDishGrid.spec.ts:87` tests an empty-category empty-state message — not location-type filtering. It does not cover this AC.

The filtering is enforced by `locationScope()` in `server/utils/menu-queries.ts:260-262`, which builds `WHERE location_type IN (locationType, 'both')`. The unit tests for `getFullMenu` in `server/utils/menu-queries.test.ts` mock the entire DB chain, so this WHERE clause is never executed. The test at line 275-284 passes an AYCE-row to an express query but does not verify the filter logic.

Per C4: "There is at least one test per acceptance criterion." US3 SC2 has no test that verifies AYCE-only items are excluded for `type=express`.

**Fix**: Add a unit test to `menu-queries.test.ts` that asserts `locationScope('express')` produces `inArray(menuItems.locationType, ['express', 'both'])` — either by spying on the where call, or by testing that a row with `locationType: 'ayce'` is not returned when querying express (requires adjusting the mock to simulate the filter). Alternatively, a dedicated test for the `locationScope` helper function in isolation would suffice.

---

## What passes

- All 41 tasks are marked `[x]` in `tasks.md` (R1 from previous review: fixed).
- `server/utils/menu-queries.test.ts` uses `importOriginal` and exposes `drinkSubGroups` (R2: fixed).
- `drinkSubGroup: null` present in `MenuDishCard.spec.ts` and `MenuDishCard.stories.ts` (R3: fixed).
- Stories exist for all 8 new components: `MenuDishCard`, `MenuSaucePicker`, `MenuTypeToggle`, `MenuModalityToggle`, `MenuCategoryChips`, `MenuDishGrid`, `MenuDrinkSection`, `MenuShell` (R4: fixed).
- Specs exist for all 8 new components (R5: fixed).
- `menu.category.empty` present in both `es.json` and `en.json` (R6: fixed).
- `<NuxtImg>` used in `MenuDishCard.vue` and `MenuDrinkSection.vue` (R7: fixed).
- `useMenuFilters.test.ts` now covers: setCategory URL sync, setModality resets category, chip toggle-off emits null (R8 partially fixed — 5 of 6 ACs now covered).
- Spec updated: category chips filter behavior (not scroll-anchor) is now the spec (R9: fixed).
- `./init.sh` exits 0 — 99 test files, 742 tests, all pass.
- `pnpm biome check .` passes (exit 0).
- `pnpm vue-tsc --noEmit` passes (exit 0).
- `useMenuFilters` composable: 100% statement/branch/function/line coverage.
- `app/pages/menu.vue`: 49 lines (Gate 4 PASS).
- All 8 component files ≤ 200 lines (largest: `MenuShell.vue` at 175 lines).
- 35 `menu.*` keys in both `es.json` and `en.json` (Gate 8 PASS).
- `public/menu/{ayce,ala-carta,drinks,kids,desserts}` all non-empty (Gate 9 PASS).
- `'/menu': { isr: 3600 }` present in `nuxt.config.ts` (Gate 1 PASS).
- No `drizzle-orm` / `@neondatabase` imports under `app/` (Gate 2 PASS).
- No default Tailwind palette classes, no arbitrary values, no inline hex colors.
- No misplaced `*.vue` files at `app/components/` root.
- No hardcoded secrets — secret-pattern scan clean; no `.env` files tracked (C7 PASS).

## Checkpoint summary

| Checkpoint | Result | Reason |
|------------|--------|--------|
| C1 (harness complete) | PASS | All base files exist; `./init.sh` exits 0 |
| C2 (state coherent) | PASS | 1 feature in_progress; current.md valid |
| C3 (architecture) | PASS | All code under correct feature folder |
| C3.1 (structure) | PASS | No misplaced components; correct folder layout |
| C4 (tests pass) | PASS | 742/742 tests pass |
| C4 (typecheck) | PASS | `pnpm typecheck` clean |
| C4 (AC coverage) | FAIL | US3 SC2 has no covering test |
| C5 (session closure) | PASS | Progress history updated |
| C6 (SDD gates) | PASS | All tasks `[x]`, no `[NEEDS CLARIFICATION]` |
| C7 (security) | PASS | No secrets, no tracked env files |

## Next step

Fix R1: add a test covering US3 SC2 (locationScope filtering — AYCE-only items excluded when querying Express type).
