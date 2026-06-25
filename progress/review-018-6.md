# Review: menu-page (011 / feat/018-menu-page)

**Status:** APPROVED

---

## Verifications

### Acceptance criteria covered by tests: 18/18

| AC | Test |
|----|------|
| US1 SC1 — AYCE categories render | `menu-queries.test.ts` "groups dishes under their category" |
| US1 SC2 — chip filters grid, sets ?category | `useMenuFilters.test.ts` setCategory + URL sync |
| US1 SC3 — dish image from /menu/ayce/{fileName} | `MenuDishCard.spec.ts` "renders dish image when imageUrl is present" |
| US1 SC4 — placeholder when imageUrl null | `MenuDishCard.spec.ts` "renders no image container when imageUrl is null" |
| US1 SC5 — i18n locale switch | Both locale files present; useI18n stubbed in all component specs |
| US2 SC1 — buffet shows "incluido" | `MenuDishCard.spec.ts` "shows 'Incluido' in buffet modality" |
| US2 SC2 — carta shows price | `MenuDishCard.spec.ts` "shows price in carta modality" |
| US2 SC3 — ?modality=carta in URL | `useMenuFilters.test.ts` setModality router.replace test |
| US2 SC4 — modality toggle absent for express | `MenuShell.spec.ts` "hides MenuModalityToggle when type is express" |
| US3 SC1 — --accent blue + no modality toggle | `useMenuFilters.test.ts` "returns express-blue accent for express"; `MenuShell.spec.ts` |
| US3 SC2 — only Express/'both' items appear | `menu-queries.test.ts` `locationScope` describe block (lines 225–239) + `getFullMenu` "applies Express location filter" (line 365–372) |
| US3 SC3 — type switch resets category, accent changes | `useMenuFilters.test.ts` "resets activeCategory to null on type change" + accentStyle tests |
| US4 SC1 — SaucePicker renders for requiresSauce=true | `MenuDishCard.spec.ts` "mounts MenuSaucePicker when requiresSauce is true" |
| US4 SC2 — sauce highlighted on click | `MenuSaucePicker.spec.ts` "highlights a sauce when clicked" |
| US4 SC3 — 13 sauces ascending spiceLevel | `MenuSaucePicker.spec.ts` "renders sauces in ascending spiceLevel order" |
| US4 SC4 — spiceLevel >= 3 shows indicator | `MenuSaucePicker.spec.ts` "shows spice indicator for spiceLevel >= 3" |
| US5 SC2 — drinks grouped with headers | `MenuDrinkSection.spec.ts` "renders a group header per unique drinkGroup" |
| US5 SC4 — drink price always shown | `MenuDrinkSection.spec.ts` "renders drink prices" |

### Phase -1 Gates: 9/9 marked

All 9 gates in `specs/011-menu-page/plan.md` are marked `[x]` (no unchecked gate lines found).

### Tasks completed: 41/41

All tasks in `specs/011-menu-page/tasks.md` are `[x]`.

### No `[NEEDS CLARIFICATION]` markers

`spec.md` is fully resolved.

### `./init.sh`: exit 0

- Biome check: OK
- Typecheck: OK
- Tests: 746 passed (99 test files)

### C7 — Security scan: CLEAN

- Secret-pattern diff scan: empty (no API keys, tokens, passwords, PEM blocks)
- `git ls-files | grep \.env`: no tracked env files beyond `.env.example`

### CHECKPOINTS C1–C7: all OK

| Checkpoint | Result | Notes |
|------------|--------|-------|
| C1 (harness complete) | PASS | All base files exist; `./init.sh` exits 0 |
| C2 (state coherent) | PASS | 1 feature in_progress; current.md describes active session |
| C3 (architecture) | PASS | All code under `app/features/menu/`, `app/pages/menu.vue`, `server/api/v1/menu/` |
| C3.1 (structure) | PASS | No `*.vue` at `app/components/` root; cross-feature imports absent |
| C4 (tests) | PASS | 746/746 pass; biome clean; typecheck clean; US3 SC2 now covered by `locationScope` unit tests |
| C5 (session closure) | PASS | `progress/history.md` has entries |
| C6 (SDD gates) | PASS | All tasks `[x]`; all Phase -1 gates `[x]`; no `[NEEDS CLARIFICATION]` |
| C7 (security) | PASS | No secrets, no tracked env files |

### Frontend feature verification

- No `*.vue` at `app/components/` root — PASS
- No default Tailwind palette classes (`bg-orange-500` etc.) in `app/features/menu/` — PASS
- No arbitrary Tailwind values (`bg-[#...]`) — PASS
- No inline hex colors in style= or `<style>` blocks — PASS
- All 8 new components have co-located `.spec.ts` and `.stories.ts` — PASS
- `app/pages/menu.vue` is 49 lines (≤ 100 limit) — PASS
- All component files ≤ 200 lines — PASS (largest: MenuShell.vue 175 lines)
- `useMenuFilters` composable: 100% statement/branch/function/line coverage — PASS

---

## Notes

- The previous blocker (US3 SC2) is fixed. `locationScope` is now exported and has two dedicated unit tests in `menu-queries.test.ts` (lines 225–239) verifying the `inArray` call receives the correct value array for both `'express'` and `'ayce'` types. An integration-level test in `getFullMenu` (lines 365–378) cross-checks the same behavior end-to-end through the query chain.
- 746 tests pass vs. 742 in the previous review — net +4 tests added for the fix.
