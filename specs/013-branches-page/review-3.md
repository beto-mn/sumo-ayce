# Review: 013 — branches-page

**Status:** REJECTED

---

## R1 fixed — CONFIRMED

`app/features/branches/utils/haversine.ts` and `haversine.spec.ts` no longer exist. The
`utils/` directory is empty. Blocking issue from review-2 is resolved.

## R2 fixed — CONFIRMED

`.env.example` line 21 now reads `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN=`. The variable name
matches what `server/utils/env.ts` and `nuxt.config.ts` expect. Blocking issue from
review-2 is resolved.

---

## New blocking issue from review-2 observation O2

### R1 — US5-AC1 has no test that verifies `openReservation()` is called (C4, C6)

Spec US5-AC1 states: "Given the visitor activates 'Reservar', Then
`useReservationModal().openReservation()` is called; no error even without a mounted modal."

`app/features/branches/components/BranchList.spec.ts` (lines 87–95) is the only test that
triggers the Reserve button. It asserts only that `branch-select` is emitted — it does NOT
spy on `useReservationModal` or verify that `openReservation()` fires.

`BranchCard.spec.ts` does not test the full Reserve flow either; it only asserts the
`reserve` emit from the card itself.

There is no test anywhere in the tree that mocks `useReservationModal` and asserts
`openReservation` was called when the Reserve button is clicked.

CHECKPOINTS C4 ("at least one test per acceptance criterion") and C6 ("each acceptance
criterion in spec.md is covered by at least one concrete test") are both violated.

**Fix**: Add a test to `BranchList.spec.ts` (or a new `BranchCard.spec.ts` case) that
stubs `useReservationModal` with a `vi.fn()` spy and asserts `openReservation` was called
after the Reserve button is triggered. The `useState` stub is already in place; adding a
`vi.stubGlobal('useReservationModal', ...)` call is sufficient.

---

## New blocking issue from review-2 observation O1

### R2 — T046 falsely marked `[x]`: `fitBounds` is absent from `tests/mocks/mapbox.ts`

Task T046 states: "Update `tests/mocks/mapbox.ts` to cover all adapter method stubs used
by `MapView.spec.ts` and `useBranches.spec.ts`."

T046 is marked `[x]` in `tasks.md`. However:

- `MapAdapter` interface (`app/composables/maps/types.ts` line 38) declares
  `fitBounds(map, markers, padding?): void`.
- `MapView.vue` calls `adapter.fitBounds(...)` on lines 46, 70, and 107.
- `tests/mocks/mapbox.ts` does not include `fitBounds` in `mockMapboxAdapter`.

When the "calls addMarker once per marker" test mounts `MapView` with two markers,
`syncMarkers()` fires and calls `adapter.fitBounds(...)`, which is `undefined`. This throws
a `TypeError` that is silently swallowed by the `try/catch` in `initMap()`. The test passes
but the error path is hidden and `fitBounds` has zero test coverage.

CHECKPOINTS C4 ("Tests use real resources or consistent fixtures") is violated — the mock
is inconsistent with the interface it is supposed to satisfy. T046 cannot be considered
fulfilled.

**Fix**: Add `fitBounds: vi.fn()` to `mockMapboxAdapter` in `tests/mocks/mapbox.ts` and
update `resetMapboxMocks()` to reset it. Add at least one `MapView.spec.ts` assertion that
`fitBounds` was called when `markers` is non-empty.

---

## init.sh result

Exit 0. 449 tests pass. `pnpm check`, `pnpm typecheck` all clean.

---

## Observations (non-blocking — same as review-2 O3)

**O1 — Plan gates G-III.2 and G-V.3 text is stale**

Both gates are marked `[x]` but describe the old client-side-sort approach that was
reverted by the 2026-06-22 spec update. The implementation correctly follows the current
spec (API calls on geo/CP). The gate text should be annotated to reflect the current
approach before the feature is marked done, but this is not a blocking blocker in itself
since the gates are checked and the implementation is correct.

---

## Verifications that passed

| Check | Result |
|---|---|
| `./init.sh` | Exit 0, 449 tests pass |
| `pnpm check` (biome) | 0 errors, 0 warnings |
| `pnpm typecheck` | vue-tsc exit 0 |
| All tasks `[x]` in `tasks.md` | Yes (T046 text is satisfied on paper; blocked by R2 above) |
| All Phase -1 Gates `[x]` in `plan.md` | Yes (gate text stale — see O1 above) |
| No `[NEEDS CLARIFICATION]` in `spec.md` | Confirmed |
| haversine.ts / haversine.spec.ts deleted | Confirmed |
| `.env.example` uses `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Confirmed |
| No `mapbox-gl` imports outside adapter | Confirmed (grep zero matches) |
| No Tailwind default palette classes | Confirmed |
| No arbitrary Tailwind values `[]` | Confirmed |
| No inline hex colors in feature/page/layout files | Confirmed |
| No tracked `.env*` files | Confirmed |
| No hardcoded secrets or credentials | Confirmed |
| `app/components/` root: no stray `.vue` | Confirmed (empty) |
| Feature code lives under `app/features/branches/` | Yes |
| All components have `.stories.ts` | Yes |
| All components have `.spec.ts` | Yes |
| Page template ≤ 100 lines | Confirmed |
| Backend response includes `type`, `schedule`, `phone`; excludes `whatsappReservaciones` | Yes |
| Express accent used only in Express-scoped elements | Yes |

---

## Next step

Fix R1 (add `openReservation()` spy test for US5-AC1) and R2 (add `fitBounds: vi.fn()`
to `tests/mocks/mapbox.ts` and add a covering assertion in `MapView.spec.ts`), then
re-submit for review.
