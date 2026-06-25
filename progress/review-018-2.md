# Review: reservation-page (014 / feat/018) — Second Review

**Status:** REJECTED

---

## Reasons

- [ ] **R1 — Article VIII violation: `submit()` function exceeds 30 lines**
  File: `app/features/reservation/composables/useReservationSubmit.ts`
  Lines 53–95 = 43 lines. Constitution Article VIII: "No function MAY exceed 30 lines — if it does, it MUST be decomposed." The fix is to extract `buildPayload(draft, branches)` and `applyValidationErrors(errors, result)` (or similar) as separate named functions, reducing `submit()` to ≤ 30 lines.

- [ ] **R2 — Article VIII violation: `generateSlots()` function exceeds 30 lines**
  File: `app/features/reservation/composables/useReservationSlots.ts`
  Lines 13–45 = 33 lines. Same rule. The fix is to extract the today-min computation (lines 32–35) and the slot-array loop body into a helper such as `filterPastSlots(slots, isToday, currentMin)` or `buildSlotArray(openMin, lastSlotMin, isToday, currentMin)`, reducing `generateSlots` to ≤ 30 lines.

---

## All Other Checks — PASS

### Acceptance Criteria Covered by Tests: 19/19

All user story acceptance criteria from `spec.md` are traceable to specific tests in
`ReservationForm.spec.ts`, `ReservationConfirmation.spec.ts`,
`useReservationSlots.test.ts`, and `useReservationSubmit.test.ts`.
(Detail retained from first review — no changes to test coverage detected.)

### Phase -1 Gates: 9/9 marked [x]

| Gate | Result |
|------|--------|
| Gate 1 — `/reserve: { ssr: true }` in `nuxt.config.ts` line 88 | PASS |
| Gate 2 — No DB client under `app/` | PASS |
| Gate 3 — Feature folder under `app/features/reservation/` | PASS |
| Gate 4 — Page template ≤ 100 lines (reserve.vue = 76 lines) | PASS |
| Gate 5 — Storybook stories for all 5 components | PASS |
| Gate 6 — Biome + vue-tsc clean | PASS |
| Gate 7 — Composable coverage 96.77% stmt / 80.95% branch / 100% fn | PASS |
| Gate 8 — i18n keys: 35 keys in both es.json and en.json | PASS |
| Gate 9 — rendering-strategy.md §4 table includes /reserve row | PASS |

### Tasks: 39/39 marked [x]

No incomplete tasks in `tasks.md`.

### `init.sh` exit code: 0

93 test files, 702 tests pass. Biome clean. vue-tsc clean.

### Sensitive Data Scan (C7)

- Secret-pattern scan (api_key, token, password, AKIA, BEGIN, postgres://) on
  `076099b..97433c5` diff: no real secrets found. `pk.test` in `branches.spec.ts`
  is a synthetic test fixture, not a real Mapbox token.
- No `.env` files tracked.
- Test fixtures use synthetic values: `5512345678`, `SUMO-1234`, `Juan Pérez`.

### CHECKPOINTS C1–C7

- **C1**: All harness files present. `init.sh` exits 0. PASS.
- **C2**: 1 feature in_progress. PASS.
- **C3**: No stray debug prints or uncontexted TODOs. PASS.
- **C3.1**: All feature code under `app/features/reservation/`. `find app/components -maxdepth 1 -name '*.vue'` returns empty. No cross-feature imports. `reserve.vue` = 76 lines. PASS.
- **C4**: 702 tests pass. `pnpm check` passes. `pnpm typecheck` passes. PASS.
- **C5**: Not gated on this review.
- **C6**: spec.md / plan.md / tasks.md all present. No `[NEEDS CLARIFICATION]` markers. All Phase -1 gates marked. All tasks `[x]`. PASS (blocked only by R1/R2 which are Article VIII, not C6).
- **C7**: No hardcoded secrets. PASS.

### Frontend Checks

- No default Tailwind palette classes (`bg-orange-500` etc.) — zero matches.
- No arbitrary Tailwind values (`bg-[#...]`) — zero matches.
- No inline hex colors in components — zero matches.
- Every `.vue` has a co-located `.spec.ts` — PASS.
- Every `.vue` has a co-located `.stories.ts` — PASS.
- `ReservationForm.vue` = 184 lines (≤ 200). `ReservationConfirmation.vue` = 96 lines. PASS.
- `--accent` swap via `:style` binding on wrapper (FR-021). PASS.
- No cross-feature imports. PASS.

---

## Next Step

The implementer must:

1. In `useReservationSubmit.ts`: decompose `submit()` (43 lines) into ≤ 30 lines by
   extracting at minimum one helper function (e.g., `buildPayload(draft, branches)` +
   separate error-assign block, or `applyConfirmation(result, draft, branch)`).

2. In `useReservationSlots.ts`: decompose `generateSlots()` (33 lines) into ≤ 30 lines
   by extracting the loop body or the "isToday / currentMin" guard into a named helper.

Tests and all other quality gates do not need to change — the fix is purely structural
decomposition with no behaviour change.
