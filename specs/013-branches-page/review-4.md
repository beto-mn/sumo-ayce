# Review: 013 — branches-page

**Status:** APPROVED

---

## Fixes verified from review-3

### R1 — `openReservation` spy test for US5-AC1

`app/features/branches/components/BranchList.spec.ts` lines 10–13 now set up
`mockOpenReservation = vi.fn()` and mock `@/composables/useReservationModal` to
return it. Lines 102–109 add the test "calls openReservation when Reserve button is
clicked (US5-AC1)" which mounts `BranchList` with one branch, triggers the reserve
button, and asserts `mockOpenReservation` was called once. US5-AC1 is now covered.

### R2 — `fitBounds: vi.fn()` in mock and covering assertion in MapView.spec.ts

`tests/mocks/mapbox.ts` line 16 now includes `fitBounds: vi.fn()` in
`mockMapboxAdapter`, and `resetMapboxMocks()` resets it via the `Object.values` loop.

`app/components/ui/MapView.spec.ts` lines 142–158 add the test "calls fitBounds after
markers are synced on mount" which mounts `MapView` with two markers and asserts
`mockMapboxAdapter.fitBounds` was called once. T046 is now fully satisfied.

---

## init.sh result

Exit 0. 74 test files, 451 tests pass (up from 449 in review-3).
`pnpm check` (biome): OK. `pnpm typecheck` (vue-tsc): OK.

---

## Verifications

| Check | Result |
|---|---|
| `./init.sh` | Exit 0, 451 tests pass |
| `pnpm check` (biome) | 0 errors |
| `pnpm typecheck` | vue-tsc exit 0 |
| All tasks `[x]` in `tasks.md` | Confirmed (unchanged from review-3) |
| All Phase -1 Gates `[x]` in `plan.md` | Confirmed (unchanged from review-3) |
| No `[NEEDS CLARIFICATION]` in `spec.md` | Confirmed |
| US5-AC1 covered by `openReservation` spy test | CONFIRMED — BranchList.spec.ts line 102 |
| T046: `fitBounds` in mock + covering assertion | CONFIRMED — mapbox.ts line 16 + MapView.spec.ts line 142 |
| No Tailwind default palette classes | Confirmed |
| No arbitrary Tailwind values `[]` | Confirmed |
| No inline hex colors in feature/page/layout files | Confirmed |
| No tracked `.env*` files | Confirmed |
| No hardcoded secrets or credentials | Confirmed |
| All components have `.stories.ts` | Confirmed |
| All components have `.spec.ts` | Confirmed |
| Page template ≤ 100 lines | Confirmed |

---

## Observations (non-blocking, same as review-3 O1)

Plan gates G-III.2 and G-V.3 text describes the old client-side-sort approach that was
reverted. The gates are checked `[x]` and the implementation correctly follows the
current spec (API calls on geo/CP). Gate text should be annotated before the feature is
marked done, but this is not a blocker.

---

## Next step

The implementer may mark the feature `done` in `feature_list.json`.
