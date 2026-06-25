# Review: menu-page (011 / feat/018-menu-page)

**Status:** REJECTED

---

## Reasons

### R1 — All tasks in `tasks.md` are `[ ]` (BLOCKING)

All 41 tasks in `specs/011-menu-page/tasks.md` are unchecked. The reviewer protocol requires every task to be `[x]` before approval. The implementation files exist as uncommitted/untracked work but the task file was never updated.

### R2 — 9 tests failing: `server/utils/menu-queries.test.ts` mock missing `drinkSubGroups` (BLOCKING)

The `drinkSubGroups` table was added to `server/db/schema.ts` and is used in `server/utils/menu-queries.ts` (line 235). The `vi.mock('../db/schema')` in `server/utils/menu-queries.test.ts` does not expose the new `drinkSubGroups` export. This causes all 9 `getFullMenu` tests to throw:

```
Error: [vitest] No "drinkSubGroups" export is defined on the "../db/schema" mock.
```

Running `pnpm vitest run server/utils/menu-queries.test.ts`: 9 failed / 6 passed.
Running `pnpm test` (full suite): 1 file failed, 9 tests failed, 693 passed.

`./init.sh` step 6 shows: `Test Files 1 failed | 92 passed (93)`.

### R3 — TypeScript errors: `FullMenuDish.drinkSubGroup` required field not present in fixtures (BLOCKING)

`pnpm typecheck` (exit code 1) reports two errors:

- `app/features/menu/components/MenuDishCard.spec.ts:24` — `drinkSubGroup` typed as `DrinkSubGroup | null | undefined` but `FullMenuDish` requires `DrinkSubGroup | null` (not optional).
- `app/features/menu/components/MenuDishCard.stories.ts:15` — `drinkSubGroup` property missing from the `base` dish fixture.

Both files need `drinkSubGroup: null` added to every `FullMenuDish` literal.

### R4 — Missing `.stories.ts` for 4 new components (BLOCKING)

Constitution Article VII (NON-NEGOTIABLE) and CHECKPOINTS C3.1 require every new Vue component to have a co-located Storybook story. The following components have no `.stories.ts`:

- `app/features/menu/components/MenuCategoryChips.vue`
- `app/features/menu/components/MenuDishGrid.vue`
- `app/features/menu/components/MenuDrinkSection.vue`
- `app/features/menu/components/MenuShell.vue`

FR-028 only enumerates the 4 that were written (`MenuDishCard`, `MenuSaucePicker`, `MenuTypeToggle`, `MenuModalityToggle`), but the constitution requires ALL new components.

### R5 — Missing `.spec.ts` for 6 new components (BLOCKING)

The reviewer protocol (frontend feature verification) requires a co-located `Component.spec.ts` for every new `.vue` file under `app/features/*/components/`. The following have no spec:

- `app/features/menu/components/MenuCategoryChips.spec.ts`
- `app/features/menu/components/MenuDishGrid.spec.ts`
- `app/features/menu/components/MenuDrinkSection.spec.ts`
- `app/features/menu/components/MenuModalityToggle.spec.ts`
- `app/features/menu/components/MenuShell.spec.ts`
- `app/features/menu/components/MenuTypeToggle.spec.ts`

`MenuDishCard.spec.ts` and `MenuSaucePicker.spec.ts` are present (FR-030 covered).

### R6 — Missing i18n key `menu.category.empty` (BLOCKING)

`MenuDishGrid.vue` uses `t('menu.category.empty')` (line 38) to show an empty-state message. This key is absent from both `i18n/locales/es.json` and `i18n/locales/en.json`. The spec (Gate 8) requires all keys used in code to be present in both locales.

Both locales have 34 `menu.*` keys; Gate 8 requires 35. The missing key is `menu.category.empty`.

### R7 — FR-018 violation: `<img>` used instead of `<NuxtImg>` (BLOCKING)

FR-018 states: "Images MUST use `<NuxtImg>` (from `@nuxt/image`) with `loading="lazy"` and an explicit `alt` attribute."

The following components use a plain `<img>` element instead:
- `app/features/menu/components/MenuDishCard.vue` (line 41)
- `app/features/menu/components/MenuDrinkSection.vue` (lines 121, 153)

### R8 — Acceptance criterion traceability gaps (BLOCKING)

The following acceptance scenarios from `spec.md` have no covering test:

- **US1 SC2** (chip click scrolls to category section) — not tested; implementation filters instead of scrolls.
- **US2 SC3** (URL updates to `?modality=carta`, shallow replace) — `useMenuFilters.test.ts` covers URL sync for `setModality` but there is no test verifying the URL does not cause a full page reload.
- **US3 SC1** (Express: `--accent` set to blue, modality toggle absent) — `useMenuFilters.test.ts` covers `accentStyle` for express, but there is no component-level test confirming `MenuShell` renders `v-if="showModalityToggle"` correctly.
- **US3 SC2** (only Express/both items appear for type=express) — no test.
- **US5 SC1** (Bebidas section appears in any page type) — no test covering `MenuDrinkSection`.
- **US5 SC2** (drinks grouped by `drinkGroup` with group headers) — no test covering `MenuDrinkSection`.

Per C4: "There is at least one test per acceptance criterion."

### R9 — Category chips filter instead of scroll (spec violation, FR-014) (BLOCKING)

The spec clarification states: "Clicking a chip **scrolls** to the corresponding section (anchor behavior). The full dish grid for the active type/modality is always rendered; chips are navigation anchors."

The implementation in `MenuShell.vue` calls `setCategory(key)` which sets `visibleFoodCategories` to show only the selected category (filtering, not scrolling). FR-014 requires `<section id="{key}">` anchors with scroll behavior, not a filter. FR-015 requires IntersectionObserver to track the active chip on scroll. Neither is implemented.

---

## Summary of blocking issues by checkpoint

| Checkpoint | Result | Reason |
|------------|--------|--------|
| C4 (tests passing) | FAIL | R2: 9 tests fail in menu-queries.test.ts |
| C4 (typecheck) | FAIL | R3: 2 TypeScript errors |
| C4 (test coverage per AC) | FAIL | R8: 6 acceptance criteria uncovered |
| C6 (all tasks `[x]`) | FAIL | R1: 41/41 tasks unchecked |
| C6 (i18n keys complete) | FAIL | R6: `menu.category.empty` missing |
| C3/C7 storybook | FAIL | R4: 4 components missing stories |
| Frontend spec coverage | FAIL | R5: 6 components missing spec.ts |
| FR-018 | FAIL | R7: `<img>` instead of `<NuxtImg>` |
| FR-014/FR-015 | FAIL | R9: filter instead of scroll-anchor |

---

## What passes

- All 41 tasks exist and the implementation files are present (untracked but implemented).
- No hardcoded secrets — secret-pattern scan clean; no `.env` files tracked (C7 PASS).
- No default Tailwind palette classes; no arbitrary values; no inline hex colors (token discipline PASS).
- No `app/components/*.vue` root-level misplaced files (C3.1 PASS).
- No `drizzle-orm` / `@neondatabase` imports under `app/` (Gate 2 PASS).
- `nuxt.config.ts` contains `'/menu': { isr: 3600 }` (Gate 1 PASS).
- `app/pages/menu.vue` is 49 lines total (Gate 4 PASS).
- `useMenuFilters.test.ts`: 17 tests pass; 100% coverage (Gate 7 PASS).
- 4 required stories exist: `MenuDishCard`, `MenuSaucePicker`, `MenuTypeToggle`, `MenuModalityToggle`.
- All component files are under 200 lines; no file is over 175 lines (Article VIII PASS).
- No `[NEEDS CLARIFICATION]` markers in spec.md (C6 PASS for this item).
- `bg-orange`, `bg-blue`, `bg-pink`, `bg-yellow`, `text-orange` are project design tokens, not default Tailwind palette (token compliance PASS).

---

## Next steps for the implementer

1. Mark all 41 tasks `[x]` in `specs/011-menu-page/tasks.md`.
2. Update `server/utils/menu-queries.test.ts` mock to include `drinkSubGroups` from the schema using `importOriginal` pattern.
3. Add `drinkSubGroup: null` to every `FullMenuDish` literal in `MenuDishCard.spec.ts` and `MenuDishCard.stories.ts`.
4. Add `.stories.ts` for `MenuCategoryChips`, `MenuDishGrid`, `MenuDrinkSection`, `MenuShell`.
5. Add `.spec.ts` for `MenuCategoryChips`, `MenuDishGrid`, `MenuDrinkSection`, `MenuModalityToggle`, `MenuShell`, `MenuTypeToggle`. Each must include at minimum a default-render assertion.
6. Add `menu.category.empty` key to both `i18n/locales/es.json` and `en.json`.
7. Replace `<img>` with `<NuxtImg>` in `MenuDishCard.vue` and `MenuDrinkSection.vue`.
8. Implement scroll-to-section behavior in `MenuCategoryChips.vue` (FR-014) and IntersectionObserver for active-chip tracking (FR-015); revert `MenuShell.vue` to always render all categories.
9. Add tests covering the 6 acceptance criteria listed in R8.
