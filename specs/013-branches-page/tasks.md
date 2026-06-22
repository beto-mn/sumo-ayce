---
description: "Task list for feature 013 — Branches Page (/branches)"
---

# Tasks: Branches Page (`/branches`)

**Feature ID**: 013
**Input**: Design documents from `specs/013-branches-page/`
**Prerequisites**: spec.md, plan.md, data-model.md, contracts/api.md

**Tests**: REQUIRED. Constitution Article IV mandates unit tests for every composable and
server route delta; Article VII mandates Storybook coverage for every UI component. Server-side
logic is TDD (tests written first, implementation makes them pass).

**Organization**: Grouped by workstream. Each workstream is independently deliverable.

## Format: `[ID] [P?] [WS] Description`

- **[P]**: Can run in parallel (no file dependency on other P-marked tasks in the same phase).
- **[WS]**: Workstream — `BACKEND` | `MAP` | `FEAT` | `PAGE` | `POLISH`.

---

## Phase 1: Setup

- [x] T001 [BACKEND] Verify `routeRules['/branches'] = { isr: 3600 }` is unchanged in
      `nuxt.config.ts` (Gate V.1). Do NOT modify it.
- [x] T002 [P] [MAP] Add `runtimeConfig.public.mapboxAccessToken: ''` to `nuxt.config.ts`
      (reads from `NUXT_PUBLIC_MAPBOX_TOKEN`). Document in `.env.example` comment that this
      token must start with `pk.` and be obtained from Mapbox dashboard → Access tokens.
      (Gate XIII.1, FR-015)
- [x] T003 [P] [FEAT] Create feature slice folders: `app/features/branches/components/`,
      `app/features/branches/composables/`, `app/features/branches/utils/`. (Article I)
- [x] T004 [P] [MAP] Create map composable folders: `app/composables/maps/adapters/`.
      (Article I)

---

## Phase 2: Shared Types (blocks all workstreams)

- [x] T005 [BACKEND] Define `BranchScheduleSlot`, `BranchSchedule`, `BranchPublicRow`,
      `BranchWithDistance`, `SearchContext`, `BranchesResponse`, `BranchesWithDistanceResponse`
      in `types/branches.ts` (per data-model.md §3). Strict TS, no `any`. (Gate II.2)
- [x] T006 [P] [MAP] Define `LngLat`, `MapMarker`, `MapViewProps`, `MapAdapter` interfaces
      in `app/composables/maps/types.ts` (per data-model.md §4 and maps-strategy.md).
      (FR-010)
- [x] T007 [P] [FEAT] Define `SortedBranch`, `GeoState`, `CpState` in
      `app/features/branches/types.ts` (per data-model.md §5). Re-export
      `BranchPublicRow` from `@/types/branches`. (Gate II.2)

**Checkpoint**: All shared types compile cleanly. No workstream can proceed without T005.

---

## Phase 3: Backend Delta (workstream BACKEND — TDD)

- [x] T008 Write failing test cases in the existing branches API spec (or a new
      `server/api/v1/branches/index.spec.ts` delta section): response includes `type`,
      `schedule`, `phone`; `whatsappReservaciones` and `whatsappReservacionesBackup` are
      NOT present. (Gate IV.5, contracts/api.md test table)
- [x] T009 Update `PUBLIC_FIELDS` in `server/api/v1/branches/index.get.ts` to add
      `type: branches.type`, `schedule: branches.schedule`, and
      `phone: branches.whatsappReservaciones`. Update `BranchRow` type to match
      `BranchPublicRow` from `types/branches.ts`. Remove `stripInternalFields` (superseded
      by explicit whitelist). Make T008 pass. (FR-005, FR-006, Gate VI.1)
- [x] T010 Confirm all pre-existing feature 004 tests still pass. No regressions.

---

## Phase 4: Map Abstraction (workstream MAP — can proceed after T005/T006)

- [x] T011 [P] Write failing `app/components/ui/MapView.spec.ts` (happy-dom + mocked
      `mapboxAdapter`): mounts with props, renders correct marker count, emits
      `marker-click` when a marker's `onClick` fires, shows fallback slot when adapter
      throws on `createMap`. Tests MUST fail first. (Gate IV.4, FR-013)
- [x] T012 Implement `app/composables/maps/adapters/mapboxAdapter.ts` implementing
      `MapAdapter` using `mapbox-gl`. Reads token from
      `useRuntimeConfig().public.mapboxAccessToken`. Maps semantic styles to Mapbox style
      URLs (`streets-v12`, `light-v11`, `dark-v11`). Implements `createMap`, `addMarker`,
      `removeMarker`, `setCenter`, `setZoom`, `flyTo`, `destroy`. File ≤ 200 lines,
      functions ≤ 30 lines. (FR-012, Gate X.1)
- [x] T013 Implement `app/composables/maps/useMapProvider.ts` exporting `useMapProvider()`
      returning `mapboxAdapter`. (FR-011)
- [x] T014 Implement `app/components/ui/MapView.vue` — provider-agnostic component accepting
      `MapViewProps`. Uses `useMapProvider()` internally. Rendered client-side only
      (`<ClientOnly>` wrapper or `onMounted` dynamic mount). Emits `marker-click(id: string)`.
      Exposes a `#fallback` slot shown when the adapter fails or the map container is
      not ready. NO `mapbox-gl` import in this file (Gate VI of maps abstraction, FR-013,
      FR-014). File ≤ 200 lines.
- [x] T015 Make T011 tests pass.
- [x] T016 [P] Add `app/components/ui/MapView.stories.ts`: Default (mocked adapter,
      3 markers), AYCE-only pins, Express-only pins, mixed pins, fallback state,
      Responsive (mobile hides map, desktop shows). (Gate VII.5)
- [x] T017 Run the mapbox-gl import grep:
      `grep -rEn "from ['\"]mapbox-gl['\"]" app/ --include='*.vue' --include='*.ts' | grep -v 'composables/maps/adapters/'`
      Result MUST be zero matches. (SC-008, FR-014)

---

## Phase 5: Feature Slice (workstream FEAT — after T005/T007)

### Client-side haversine utility

- [x] T018 [P] Write failing `app/features/branches/utils/haversine.spec.ts`: known
      coordinate pairs with expected distances (< ±100 m tolerance). Tests MUST fail first.
- [x] T019 Implement `app/features/branches/utils/haversine.ts` — pure function
      `haversineKm(lat1, lng1, lat2, lng2): number`. ≤ 20 lines. Make T018 pass.
      (Gate X.1 — cannot import from `server/utils/haversine.ts`)

### `useBranches` composable

- [x] T020 [P] Write failing `app/features/branches/composables/useBranches.spec.ts`
      (happy-dom): haversine sort reorders branches correctly; CP geocoding calls Mapbox
      Geocoding API with correct URL and resolves to lat/lng; geolocation error → `GeoState`
      becomes `'error'` + `errorMessage`; geolocation unsupported → `'unsupported'`;
      `sortedBranches` is alphabetical before any sort; loading states are correct.
      Mock `navigator.geolocation` and Mapbox fetch via `tests/mocks/mapbox.ts`.
      Tests MUST fail first. (Gate IV.1)
- [x] T021 Implement `app/features/branches/composables/useBranches.ts`:
      - Accepts `branches: Ref<BranchPublicRow[]>` from `useAsyncData` in the page.
      - Manages `GeoState` and `CpState` as reactive refs.
      - `requestGeolocation()`: calls `navigator.geolocation.getCurrentPosition`, on success
        sets `userLat/userLng` and calls `sortByDistance()`, on error sets `GeoState.status`
        to `'error'`.
      - `sortByDistance(lat, lng)`: haversine sort on `branches.value`, returns
        `SortedBranch[]` with `distanceKm`.
      - `geocodePostalCode(cp: string)`: calls Mapbox Geocoding API client-side via `$fetch`,
        on success calls `sortByDistance()`, on error sets `CpState.status` to `'error'`.
      - `sortedBranches: ComputedRef<SortedBranch[]>`: computed from current sort state.
      - `highlightedBranchId: Ref<string | null>`: selected branch for map↔list cross-link.
      Functions ≤ 30 lines; file ≤ 200 lines. (FR-017/018/019/020/021/022)
- [x] T022 Make T020 tests pass.

### `BranchSearch` component

- [x] T023 [P] Write failing `app/features/branches/components/BranchSearch.spec.ts`:
      emits `request-geo` when the "Find nearest" button is clicked; shows CP input;
      emits `cp-submit` with the typed value when submitted; shows geo-error message
      when `geoState.status === 'error'`; hides geo button when `geoState.status ===
      'unsupported'`; shows CP error when `cpState.status === 'error'`. (Gate IV.3)
- [x] T024 Implement `app/features/branches/components/BranchSearch.vue`:
      - Props: `geoState: GeoState`, `cpState: CpState`.
      - Emits: `request-geo`, `cp-submit(cp: string)`.
      - Shows "Find nearest" button (hidden when `geoState.status === 'unsupported'`).
      - Shows loading state while `geoState.status === 'loading'`.
      - Shows inline geo-error message + reveals CP input when `geoState.status === 'error'`.
      - CP input: 5-digit validation, submit on Enter or button click.
      - Uses `UiButton`, `UiInput` from design system. Tokens only, no inline hex.
      File ≤ 200 lines. (FR-018/019/020/021/022, FR-036/037)
- [x] T025 Make T023 tests pass.
- [x] T026 [P] Add `app/features/branches/components/BranchSearch.stories.ts`: Default
      (idle), loading, geo-error-with-cp, cp-error, unsupported, responsive.

### `BranchCard` component

- [x] T027 [P] Write failing `app/features/branches/components/BranchCard.spec.ts`:
      renders type chip with correct label and accent class (`ayce` → orange, `express` →
      blue); shows `distanceKm` formatted when provided, hidden when absent; renders
      hours summary from `schedule`; shows "Horarios no disponibles" when `schedule` is
      null; Call button hidden when `phone` is null; emits `reserve`, `directions`,
      `call` on button clicks; highlighted state applies a visible ring class. (Gate IV.2)
- [x] T028 Implement `app/features/branches/components/BranchCard.vue`:
      - Props: `branch: SortedBranch`, `highlighted?: boolean`.
      - Emits: `reserve`, `directions(url: string)`, `call(phone: string)`.
      - Type chip: orange for AYCE, blue for Express (`--accent` swap, Article VII).
      - Distance: shown only when `branch.distanceKm` is defined.
      - Hours: computed from `branch.schedule` (weekdays/weekends slots or fallback text).
      - Call button hidden when `branch.phone` is null/empty.
      - Highlighted: adds a visible focus-style ring (accessible, not just color).
      - Uses `UiButton`, `UiCard`, `UiChip`. Tokens only. File ≤ 200 lines. (FR-029–FR-032)
- [x] T029 Make T027 tests pass.
- [x] T030 [P] Add `app/features/branches/components/BranchCard.stories.ts`: AYCE card,
      Express card, with distance, without distance, with schedule, without schedule,
      phone null (Call hidden), highlighted state, responsive.

### `BranchList` component

- [x] T031 [P] Write failing `app/features/branches/components/BranchList.spec.ts`:
      renders a `BranchCard` per branch; empty state message when `branches` is empty;
      forwards `highlight` prop correctly; emits `branch-select(id)`.
- [x] T032 Implement `app/features/branches/components/BranchList.vue`:
      - Props: `branches: SortedBranch[]`, `highlightedId?: string`.
      - Emits: `branch-select(id: string)`.
      - Renders `BranchCard` per branch with `:highlighted="branch.id === highlightedId"`.
      - Empty state: "No encontramos sucursales" (i18n). Self-hides the card list.
      - File ≤ 200 lines. (FR-029)
- [x] T033 Make T031 tests pass.
- [x] T034 [P] Add `app/features/branches/components/BranchList.stories.ts`: Default
      (full list), empty, highlighted card, responsive (mobile single-column, desktop
      two-column).

---

## Phase 6: Page Assembly (workstream PAGE — after Phase 3–5)

- [x] T035 Write failing `app/pages/branches.spec.ts` (happy-dom): page fetches branches
      via `useAsyncData`; passes correct props to `BranchSearch`, `BranchList`, `UiMapView`;
      map↔list cross-link wiring (clicking list emits `branch-select` → `highlightedBranchId`
      updates; `UiMapView` emits `marker-click` → `highlightedBranchId` updates); map hidden
      on mobile (< 880px class check). Tests MUST fail first.
- [x] T036 Implement `app/pages/branches.vue`:
      - `useAsyncData('branches', () => $fetch('/api/v1/branches'))` — server-side fetch at
        ISR time, no coordinates. Typed to `BranchesResponse`.
      - Passes `branches.data` into `useBranches()`.
      - Template: `<BranchSearch>` + side-by-side layout at ≥ 880px (`<BranchList>` +
        `<ClientOnly><UiMapView .../></ClientOnly>`).
      - `UiMapView` receives `markers` computed from `sortedBranches` (lat/lng → `LngLat`,
        type → `color`).
      - Map `marker-click` event → sets `highlightedBranchId` + scrolls list card into view.
      - `BranchList` `branch-select` event → sets `highlightedBranchId` + calls
        `UiMapView` exposed `highlightPin(id)` method.
      - SEO meta via `useSeoMeta` (bilingual title + description).
      - Template ≤ 100 lines. No inline hex. (FR-001–FR-004, FR-033–FR-035)
- [x] T037 Make T035 tests pass.
- [x] T038 Wire `Reserve` from `BranchCard` → `useReservationModal().openReservation()`.
      Confirm no error when modal is not mounted (FR-030, Gate I.2).

---

## Phase 7: i18n (workstream FEAT — can start after T003)

- [x] T039 [P] Add `branches.*` keys to `i18n/locales/es.json`:
      `page.title`, `page.description`, `search.geoButton`, `search.geoLoading`,
      `search.geoError`, `search.cpPlaceholder`, `search.cpError`, `card.reserve`,
      `card.directions`, `card.call`, `card.distance`, `card.hoursUnavailable`,
      `list.empty`, `map.unavailable`, `type.ayce`, `type.express`.
- [x] T040 [P] Add the same keys to `i18n/locales/en.json` with English translations.

---

## Phase 8: Polish & Cross-Cutting

- [x] T041 [P] [POLISH] Reduced-motion pass: `MapView` calls `adapter.flyTo` only when
      `!prefersReducedMotion`; falls back to `adapter.setCenter`. List transitions are
      instant. (FR-028, FR-036)
- [x] T042 [P] [POLISH] Accessibility pass: map `aria-label` = "Mapa de sucursales SUMO";
      branch cards have `aria-label` with branch name; all buttons keyboard-operable;
      hit targets ≥ 44px. (FR-037/038)
- [x] T043 [P] [POLISH] No-inline-hex grep over new files:
      `grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' app/features/branches/ app/pages/branches.vue app/components/ui/MapView.vue app/composables/maps/`
      Result MUST be zero.
- [x] T044 [P] [POLISH] Mapbox import guard grep (SC-008):
      `grep -rEn "from ['\"]mapbox-gl['\"]" app/ --include='*.vue' --include='*.ts' | grep -v 'composables/maps/adapters/'`
      Result MUST be zero.
- [x] T045 [POLISH] Run `pnpm check && pnpm typecheck && pnpm test && pnpm build`; all
      green. New spec files counted. (Gate IX)
- [x] T046 [POLISH] Update `tests/mocks/mapbox.ts` to cover all adapter method stubs
      used by `MapView.spec.ts` and `useBranches.spec.ts`. Centralized mock — no
      ad-hoc `vi.mock('mapbox-gl')` scattered across test files. (Gate IV.6)

---

## Dependencies & Execution Order

### Phase dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Shared Types)         [T005 blocks all below]
        ├─→ Phase 3 (Backend Delta)  [T008–T010, independent of MAP/FEAT]
        ├─→ Phase 4 (Map Abstraction)[T011–T017, needs T006]
        └─→ Phase 5 (Feature Slice)  [T018–T034, needs T007]
              └─→ Phase 6 (Page)     [T035–T038, needs Phase 3 + 4 + 5]
                    └─→ Phase 8 (Polish)

Phase 7 (i18n) — can start after Phase 1, parallel with Phase 3/4/5.
```

### Within each phase

- Tests written and FAILING before implementation (Article IV).
- TDD order per task group: spec → implement → pass.
- P-marked tasks within the same phase share no file dependencies.
- `index.vue` (T036) is written after all components (T021–T034) are done.

### Parallel opportunities

- T002/T003/T004 in parallel (Phase 1).
- T005/T006/T007 in parallel (Phase 2, different files).
- Phase 3, 4, 5 can run in parallel streams once T005 is done.
- T018/T020/T023/T027/T031 (failing specs) all in parallel within Phase 5.
- T039/T040 (i18n) parallel with all of Phase 3/4/5.
- T041/T042/T043/T044/T046 (polish) parallel within Phase 8.

---

## Notes

- **[P]** = different files, no same-file dependency. Tasks touching `sucursales.vue` are
  sequential.
- Every new component ships `.vue` + `.spec.ts` + `.stories.ts` — no merge without a story
  (Gate VII.5).
- Verify each spec FAILS before implementing.
- Commit per task or logical group; Conventional Commits format (Gate IX).
- NEVER import `mapbox-gl` directly outside `mapboxAdapter.ts` (FR-014, SC-008).
- NEVER import Drizzle/Neon under `app/` (Gate V.2, FR-004).
- The client-side haversine (`app/features/branches/utils/haversine.ts`) is a separate copy
  from `server/utils/haversine.ts` — cross-boundary imports are forbidden (Article I).
