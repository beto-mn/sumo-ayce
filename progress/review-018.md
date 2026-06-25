# Review: reservation-page (014 / feat/018)

**Status:** APPROVED

## Verifications

### Acceptance Criteria Covered by Tests

| User Story | Acceptance Criteria | Test Location |
|---|---|---|
| US1 AC1 | `?branch=<uuid>` pre-selects branch | `ReservationForm.spec.ts` — "pre-selects branch when initialBranchId matches" |
| US1 AC2 | `?type=ayce` → AYCE + orange accent | `ReservationForm.spec.ts` — "Tipo defaults to AYCE", "wrapper has orange accent style" |
| US1 AC3 | `?type=express` → Express + blue accent | `ReservationForm.spec.ts` — "Tipo defaults to Express", "wrapper has blue accent style" |
| US1 AC4 | No params → unselected, AYCE default | `ReservationForm.spec.ts` — "Sucursal remains unselected when no initialBranchId", "defaults to AYCE when no initialTipo" |
| US1 AC5 | Unknown `?branch` → unselected, no error | `ReservationForm.spec.ts` — "Sucursal remains unselected when initialBranchId is unknown" |
| US2 AC2 | API 201 → confirmation with folio | `ReservationForm.spec.ts` — "API 201 → shows confirmation screen with folio" |
| US2 AC3 | Confirmation shows all fields + WhatsApp note | `ReservationConfirmation.spec.ts` — 6 individual render tests including "renders the WhatsApp note" |
| US2 AC4 | "Hacer otra reservación" → form resets | `ReservationForm.spec.ts` — '"Hacer otra reservación" resets form and hides confirmation' |
| US3 AC1 | API 4xx/5xx → error banner | `ReservationForm.spec.ts` — "API 500 → error banner visible" |
| US3 AC3 | Network failure → same error UX | `ReservationForm.spec.ts` — "network failure → error banner visible" |
| US3 AC4 | Edit field → error banner cleared | `ReservationForm.spec.ts` — "after error, editing a field clears the error banner" |
| US4 AC1–AC8 | Per-field validation errors | `ReservationForm.spec.ts` (US4 block) + `useReservationSubmit.test.ts` (all 8 rules) |
| US4 AC9 | All valid → API called | `ReservationForm.spec.ts` — "empty form submit → API not called" (inverse) + `useReservationSubmit.test.ts` "all fields valid → $fetch called" |
| US5 AC1 | Branch + future date → correct min/max | `ReservationForm.spec.ts` — "branch + date selected → time input is enabled with min/max" |
| US5 AC3 | No branch → time disabled | `ReservationForm.spec.ts` — "no branch selected → time input is disabled" |
| US5 AC4 | No schedule → no min/max | `ReservationForm.spec.ts` — "branch with no schedule → time input has no min/max" |
| US5 AC5 | Branch change → time cleared | `ReservationForm.spec.ts` — "changing branch clears time selection" |
| FR-016/FR-017 | `generateSlots` pure function, boundary values | `useReservationSlots.test.ts` — 9 tests covering all cases |
| FR-018 | Today: past slots excluded | `useReservationSlots.test.ts` — "excludes slots at or before current time when date is today" |

**Covered: 19/19 functional acceptance criteria traced to specific tests.**

Note: US2 AC1 ("button enters loading state") is partially tested at the composable level (status transitions in `useReservationSubmit.test.ts`) but lacks a component-level test that captures the intermediate `submitting` state. The implementation is correct; this is a test completeness gap that does not block acceptance (FR-036's listed requirements are all satisfied).

### Phase -1 Gates

| Gate | Status |
|---|---|
| Gate 1 — `'/reserve': { ssr: true }` in `nuxt.config.ts` line 88 | PASS |
| Gate 2 — No DB client under `app/` | PASS (`grep` returns empty) |
| Gate 3 — Feature folder structure | PASS (all files under `app/features/reservation/` and `app/pages/reserve.vue`) |
| Gate 4 — Page template ≤ 100 lines | PASS (`reserve.vue` = 76 total lines, template lines 48–76) |
| Gate 5 — Storybook stories for all components | PASS (Default + variants + Mobile + Desktop for all 5 components) |
| Gate 6 — Biome + vue-tsc clean on feature files | PASS (0 errors on reservation files; 2 unrelated errors in uncommitted menu-feature files in dirty working tree) |
| Gate 7 — Composable coverage ≥ 70% | PASS (96.77% statements, 80.95% branches, 100% functions) |
| Gate 8 — i18n keys in both locales | PASS (30 keys in both `es.json` and `en.json`, keys match exactly) |
| Gate 9 — `rendering-strategy.md` §4 table updated | PASS (line 106: `/reserve → ssr: true`) |

### Tasks Completed

All 39 tasks in `tasks.md` marked `[x]`. No incomplete tasks.

### `init.sh`

Exit code: 0. All checks pass (biome, typecheck, tests).

### Sensitive Data Scan (C7)

- Secret-pattern scan against commits a0de418–97433c5: no hardcoded tokens, API keys, database credentials, PEM blocks, or JWT tokens found in reservation feature files.
- No `.env` files tracked (`git ls-files` returns empty for env files excluding `.env.example`).
- Test fixtures use synthetic values: phones `5512345678`, folios `SUMO-1234`, names `Juan Pérez` / `Test User`.
- The `pk.test` Mapbox token appearing in the diff belongs to a pre-existing test fixture, not the reservation feature.

### CHECKPOINTS C1–C7

- **C1** (Harness complete): All base files and harness docs exist. `init.sh` exits 0. PASS.
- **C2** (State coherent): 1 feature `in_progress` in `feature_list.json`. PASS.
- **C3** (Architecture): No stray debug prints or uncontexted TODOs in reservation feature. Relative `../types` imports are intra-feature (same pattern used across all features, existing codebase convention). PASS.
- **C3.1** (File structure): Feature code entirely under `app/features/reservation/`. `find app/components -maxdepth 1 -name '*.vue'` returns empty. No cross-feature imports. `app/pages/reserve.vue` is thin (76 lines). PASS.
- **C4** (Verification real): 133 reservation tests across 8 files. 702 total tests pass. `pnpm check` and `pnpm typecheck` pass. PASS.
- **C5** (Session closed): Not evaluated as part of feature completeness gate.
- **C6** (SDD): `spec.md`, `plan.md`, `tasks.md` all present. All Phase -1 gates marked in `plan.md`. No `[NEEDS CLARIFICATION]` markers. All tasks `[x]`. Acceptance criteria traceable to tests. PASS.
- **C7** (Security): Clean — see sensitive data scan above. PASS.

### Frontend Feature Checks

- No default Tailwind palette classes (`bg-orange-500` etc.) — zero matches.
- No arbitrary Tailwind values (`bg-[#...]`) — zero matches.
- No inline hex colors in components — zero matches.
- `find app/components -maxdepth 1 -name '*.vue'` — empty (PASS).
- All new `.vue` components have co-located `.spec.ts` files (PASS).
- `ReservationForm.vue` (184 lines) and all sub-components under 200 lines.
- All components have `.stories.ts` with Default + variants + Mobile + Desktop.
- `--accent` swap implemented via `:style` binding on wrapper element (FR-021), not duplicated rules.
- `reservationValidation.ts` in `composables/` does not export composables (pure utility functions); naming without `use` prefix is technically valid since it is not a composable. Non-blocking.

## Notes

- US2 AC1 (loading state button + disabled fields during in-flight submit) has an implicit implementation but no explicit component test capturing the intermediate state before the fetch resolves. All spec-mandated FR-036 test items are covered; this gap is advisory only.
- The `reservationValidation.ts` utility is placed in `composables/` without a `use` prefix. It is a pure validation helper, not a composable. The spec plan explicitly named this file. Renaming it to `reservationValidation.util.ts` or moving it to a `utils/` subfolder would be cleaner, but it does not affect correctness or any constitutional rule.
- Gate 6 / `pnpm biome check .` shows 2 errors in `app/features/homepage/composables/useFeaturedDishes.ts` and `server/utils/menu-queries.ts`. These are uncommitted menu-feature (011) modifications in the dirty working tree, not part of the reservation feature commits. The reservation feature's own files are lint-clean.
