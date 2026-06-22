# Review: 013 — branches-page

**Status:** REJECTED

---

## Reasons

### R1 — Dead code: `app/features/branches/utils/haversine.ts` (Article VIII)

`haversine.ts` is never imported by any production code path. The only file that imports it is its own spec (`haversine.spec.ts`). Constitution Article VIII: _"Dead code… MUST NOT exist in the main branch."_ The updated spec (FR-003, 2026-06-22) explicitly forbids client-side haversine sort, making this file a purposeless artifact. Both `haversine.ts` and `haversine.spec.ts` must be removed from the tree before merge. Tasks T018/T019 that mandated the file predate the spec update; the spec supersedes those tasks.

Files to remove:
- `app/features/branches/utils/haversine.ts`
- `app/features/branches/utils/haversine.spec.ts`

### R2 — Wrong env var name in `.env.example` (Constitution Article XIII, CHECKPOINTS C7)

The runtimeConfig key `mapboxAccessToken` in `nuxt.config.ts` is automatically populated by Nuxt 4 from the env var `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. The Zod schema in `server/utils/env.ts` (line 21) also validates `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. However, `.env.example` (line 21) documents `NUXT_PUBLIC_MAPBOX_TOKEN` — a different name that does not match what the code reads. A developer following `.env.example` would fail to configure Mapbox and the `server/utils/env.ts` startup validation would also fail.

Article XIII requires the `.env.example` to contain the correct variable names. The nuxt.config.ts comment (line 56) correctly says "set `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN`" — `.env.example` must be updated to match.

Fix: change `.env.example` line 21 from `NUXT_PUBLIC_MAPBOX_TOKEN=` to `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN=`.

---

## Other findings (non-blocking — fix before next review)

### O1 — `tests/mocks/mapbox.ts` is missing `fitBounds` stub

`MapView.vue` calls `adapter.fitBounds(mapInstance.value, props.markers)` inside `syncMarkers()` and in the `markers` watcher. The centralized mock at `tests/mocks/mapbox.ts` does not stub `fitBounds`. When the "calls addMarker once per marker" test passes two markers, `syncMarkers()` fires, hits undefined `fitBounds`, and the resulting `TypeError` is silently swallowed by the `try/catch` in `initMap()`. Tests pass but the error path is hidden and the coverage for `fitBounds` is zero. Add `fitBounds: vi.fn()` to `mockMapboxAdapter` in `tests/mocks/mapbox.ts` and add a test that verifies `fitBounds` is called when markers are non-empty.

### O2 — `BranchList.spec.ts` does not verify `openReservation()` is called (FR-030 / US5 AC1)

The spec requires: _"Given the visitor activates 'Reservar', Then `useReservationModal().openReservation()` is called."_ The test at line "emits branch-select with branch id when a card emits reserve" only asserts that `branch-select` is emitted. It does not verify that `openReservation()` fired. The composable is available (useState is stubbed globally), so a spy on it is feasible. Add a test that mocks `useReservationModal` and asserts `openReservation` was called when the Reserve button is clicked.

### O3 — Plan gates G-III.2 and G-V.3 text is stale after the 2026-06-22 spec update

Plan.md gate G-III.2 still reads: _"Client-side interactions operate on ref state derived from that fetch — no second `$fetch` or `useFetch` call triggered by user interaction."_ Gate G-V.3 says: _"client-side interactions sort the `ref` in memory."_ Both are marked `[x]` but describe the old approach that the spec update explicitly reverted. The implementation correctly follows the current spec (API calls on geolocation/CP). The gates are misleadingly checked. Update the gate text to reflect the API-call approach (or add an amendment note) before closing the feature.

---

## Verifications that passed

| Check | Result |
|---|---|
| `./init.sh` | Exit 0, 455 tests pass |
| `pnpm check` | 0 errors, 0 warnings |
| `pnpm typecheck` | `vue-tsc` exit 0 |
| All tasks `[x]` in `tasks.md` | Yes |
| All Phase -1 Gates `[x]` in `plan.md` | Yes (gate text stale — see O3) |
| No `[NEEDS CLARIFICATION]` in `spec.md` | Confirmed |
| No `mapbox-gl` imports outside adapter | Confirmed (grep zero matches) |
| No Tailwind default palette classes | Confirmed |
| No arbitrary Tailwind values `[]` | Confirmed |
| No inline hex colors in feature/page/layout files | Confirmed |
| No tracked `.env*` files | Confirmed |
| No hardcoded secrets or credentials | Confirmed |
| `app/components/` root: no stray `.vue` | Confirmed (empty) |
| Feature code lives under `app/features/branches/` | Yes |
| Cross-feature composable via `app/composables/useReservationModal` | Yes |
| Map abstraction in `app/composables/maps/` | Yes |
| All components have `.stories.ts` | Yes (BranchCard, BranchSearch, BranchList, MapView) |
| All components have `.spec.ts` | Yes |
| Page template ≤ 100 lines | 91 lines (lines 119–209) |
| `routeRules['/branches'] = { isr: 3600 }` unchanged | Yes |
| Backend response includes `type`, `schedule`, `phone`; excludes `whatsappReservaciones` | Yes |
| Acceptance criteria AC coverage | Partial — see R1, O2 |
| Express accent used only in Express-scoped elements | Yes (`scope-express` on type chip span only) |

---

## Next step

Fix R1 (remove `haversine.ts` + `haversine.spec.ts`) and R2 (correct `.env.example` var name) then re-submit for review. Address O1 and O2 as part of the same pass.
