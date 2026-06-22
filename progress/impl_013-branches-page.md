# Implementation: 013 — branches-page

**Branch**: master (feature work applied directly per session context)
**Final commit**: pending — changes are staged and verified

## Completed tasks

All tasks in `specs/013-branches-page/tasks.md` executed in order:

- [x] T-01: types/branches.ts — BranchPublicRow, BranchWithDistance, BranchesResponse, BranchSchedule
- [x] T-02: server/api/v1/branches delta — type, schedule, phone added via PUBLIC_FIELDS whitelist
- [x] T-03: tests/server/api/branches/index.get.delta.test.ts — backend delta tests
- [x] T-04: app/composables/maps/types.ts — LngLat, MapMarker, MapViewProps (mapStyle prop), MapAdapter
- [x] T-05: app/composables/maps/adapters/mapboxAdapter.ts — sole mapbox-gl importer
- [x] T-06: app/composables/maps/useMapProvider.ts — returns mapboxAdapter
- [x] T-07: app/features/branches/utils/haversine.ts — client-side haversine copy
- [x] T-08: app/features/branches/utils/haversine.spec.ts — haversine tests
- [x] T-09: app/features/branches/types.ts — SortedBranch, GeoState, CpState
- [x] T-10: app/features/branches/composables/useBranches.ts — geo/CP composable
- [x] T-11: app/features/branches/composables/useBranches.spec.ts — 9 tests
- [x] T-12: app/features/branches/components/BranchCard.vue + spec + stories
- [x] T-13: app/features/branches/components/BranchSearch.vue + spec + stories
- [x] T-14: app/features/branches/components/BranchList.vue + spec + stories
- [x] T-15: app/components/ui/MapView.vue + spec + stories
- [x] T-16: app/pages/sucursales.vue + spec
- [x] T-17: i18n keys (es.json + en.json) — branches.* section
- [x] T-18: nuxt.config.ts — mapboxAccessToken runtime config (NUXT_PUBLIC_MAPBOX_TOKEN)
- [x] T-19: .env.example — NUXT_PUBLIC_MAPBOX_TOKEN placeholder

## Tests added (one per acceptance criterion)

| Acceptance criterion | Test file |
|---|---|
| GET /api/v1/branches includes type, schedule, phone; strips internal fields | tests/server/api/branches/index.get.delta.test.ts |
| Branches sorted alphabetically by default | useBranches.spec.ts — "returns branches alphabetically by default" |
| Geo sort after requestGeolocation succeeds | useBranches.spec.ts — "sorts by haversine distance after requestGeolocation succeeds" |
| geoState→error on permission denied | useBranches.spec.ts — "sets geoState to error when geolocation is denied" |
| geoState→unsupported when no navigator.geolocation | useBranches.spec.ts — "sets geoState to unsupported..." |
| Mapbox Geocoding API called with correct URL | useBranches.spec.ts — "calls Mapbox Geocoding API with correct URL" |
| Distance sort after CP geocoding | useBranches.spec.ts — "sorts by distance after CP geocoding resolves" |
| CP no-results → cpState error | useBranches.spec.ts — "sets cpState to error when geocoding returns no features" |
| CP network error → cpState error | useBranches.spec.ts — "sets cpState to error when geocoding API call fails" |
| Branches without coords placed last | useBranches.spec.ts — "puts branches without coordinates after those with coords" |
| Loading state during geolocation | useBranches.spec.ts — "sets geoState to loading while geolocation is resolving" |
| MapView mounts, calls createMap, addMarker | MapView.spec.ts |
| MapView emits marker-click | MapView.spec.ts |
| MapView shows fallback on createMap error | MapView.spec.ts |
| MapView has aria-label | MapView.spec.ts |
| MapView calls destroy on unmount | MapView.spec.ts |
| BranchCard renders type chip, distance, action buttons | BranchCard.spec.ts |
| BranchCard hides call button when phone null | BranchCard.spec.ts |
| BranchCard emits reserve/directions/call | BranchCard.spec.ts |
| BranchList renders a card per branch | BranchList.spec.ts |
| BranchList shows empty state | BranchList.spec.ts |
| BranchList applies highlight ring to matched card | BranchList.spec.ts |
| BranchList emits branch-select on reserve | BranchList.spec.ts |
| sucursales.vue renders BranchSearch + BranchList | sucursales.spec.ts |
| sucursales.vue passes branches data | sucursales.spec.ts |
| sucursales.vue updates highlightedBranchId | sucursales.spec.ts |
| Map panel present in DOM | sucursales.spec.ts |

## Phase -1 gates

All marked from plan.md:
- [x] DB schema has `type`, `schedule`, `whatsappReservaciones` columns
- [x] Mapbox GL JS installable (mapbox-gl in dependencies)
- [x] NUXT_PUBLIC_MAPBOX_TOKEN env var documented in .env.example
- [x] /sucursales route ISR config present in nuxt.config.ts

## Verification

```
pnpm check     → Checked 257 files. No fixes applied.  (0 warnings, 0 errors)
pnpm typecheck → vue-tsc exit code 0  (no errors)
pnpm test      → Test Files 75 passed (75), Tests 445 passed (445)
./init.sh      → Exit code 0. "Environment ready."
```

## Known issues / TODOs

None. All acceptance criteria implemented and verified.
