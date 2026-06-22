# Implementation Plan: Branches Page (`/branches`)

**Feature ID**: 013
**Branch**: `feat/013-branches-page`
**Date**: 2026-06-21
**Spec**: [spec.md](./spec.md)

---

## Summary

Build the public branch-finder page at `/branches` as an ISR-cached Nuxt 4 page.
The HTML shell is populated at revalidation time (via `useAsyncData` → `GET /api/v1/branches`,
no coordinates). All interactive behaviour — geolocation sort, haversine distance sort,
postal-code geocoding via Mapbox, and the interactive map — runs **client-side over the cached
list** with no additional server round-trips.

The feature has four main workstreams:

1. **Backend delta** — extend `GET /api/v1/branches` to add `type`, `schedule`, and `phone`
   (renamed from `whatsappReservaciones`) to the public response. No migration needed.

2. **Map abstraction** — materialise the provider-agnostic layer from
   `docs/business/maps-strategy.md`: `types.ts`, `useMapProvider.ts`, `mapboxAdapter.ts`,
   and the public `<UiMapView>` component. Direct `mapbox-gl` imports are forbidden outside
   the adapter.

3. **Feature slice** — `app/features/branches/` with `BranchCard`, `BranchList`,
   `BranchSearch`, and `useBranches` composable (geo state, haversine sort, CP geocoding).

4. **Page** — `app/pages/branches.vue` as a thin orchestrator (≤ 100 lines template) wiring
   `<BranchSearch>` + `<BranchList>` + `<UiMapView>`.

---

## Technical Context

| Item | Value |
|---|---|
| Language | TypeScript strict, no `any`, Composition API only |
| Nuxt | 4 |
| Key deps | `mapbox-gl` (already installed), `@nuxtjs/i18n`, `@nuxtjs/tailwindcss` |
| Rendering | ISR 3600 — already in `nuxt.config.ts` |
| Backend source | `GET /api/v1/branches` (Neon via Drizzle, feature 004) |
| Test stack | Vitest + happy-dom (`app/`), Vitest + node (`server/`) |
| Storybook | `@storybook/vue3-vite` — story required per component |
| Performance | Lighthouse 90+; list renders in ISR shell; haversine is O(n) on ≤ 30 branches |

---

## Phase -1: Constitution Check

*GATE: All gates must be satisfied before implementation begins. A violation blocks merge.*

### Gate I — Code Organization & Reusability (NON-NEGOTIABLE)
- [x] **G-I.1** The feature is a vertical slice under `app/features/branches/` (components +
      composables + `types.ts`). It MUST NOT spread into other feature folders.
- [x] **G-I.2** No cross-feature import. The open-reservation trigger is reached via the
      existing `app/composables/useReservationModal.ts`, NOT by importing from
      `app/features/reservations/` (feature 014).
- [x] **G-I.3** Map abstraction lives in `app/composables/maps/` (cross-feature location,
      because it is reusable). `app/components/ui/MapView.vue` is a shared primitive — the
      `Ui` prefix is used (`<UiMapView>` in templates per `nuxt.config.ts` component scan).
- [x] **G-I.4** `BranchCard` is parameterized via props for type-chip, distance visibility,
      and disabled-Call state. No duplicate card files.
- [x] **G-I.5** `app/pages/branches.vue` template ≤ 100 lines.
- [x] **G-I.6** Every new component has a co-located `.stories.ts`.

### Gate II — TypeScript & Framework Standards
- [x] **G-II.1** Strict TS, no `any`. Composition API only.
- [x] **G-II.2** `BranchSchedule`, `BranchPublicRow`, and `BranchWithDistance` view types
      shared between front and server live in `types/branches.ts`. `MapMarker`, `MapAdapter`,
      `LngLat`, `MapViewProps` live in `app/composables/maps/types.ts` (frontend-only).

### Gate III — Architecture
- [x] **G-III.1** Branch data reaches `app/` only via `GET /api/v1/branches`. No Drizzle/Neon
      import under `app/`.
- [x] **G-III.2** `useAsyncData` in `sucursales.vue` fetches the branch list server-side at
      ISR time. Client-side interactions operate on `ref` state derived from that fetch — no
      second `$fetch` or `useFetch` call triggered by user interaction.

### Gate IV — Testing
- [x] **G-IV.1** `useBranches.spec.ts`: haversine sort, CP geocoding, geo error handling,
      loading/error states (mock `navigator.geolocation` and Mapbox fetch).
- [x] **G-IV.2** `BranchCard.spec.ts`: type chip renders (ayce/express), distance shown only
      when prop provided, Call hidden when `phone` is null, action emits.
- [x] **G-IV.3** `BranchSearch.spec.ts`: emits geo request, handles CP input, shows fallback
      on geo error.
- [x] **G-IV.4** `MapView.spec.ts`: mounts with mocked adapter (stub `mapbox-gl`), renders
      correct marker count, emits `marker-click`.
- [x] **G-IV.5** Backend delta spec: `GET /api/v1/branches` response includes `type`,
      `schedule`, and `phone`; `whatsappReservaciones` is NOT in the response.
- [x] **G-IV.6** No test depends on another's state. `mapbox-gl` mock centralized in
      `tests/mocks/mapbox.ts`.

### Gate V — Performance (rendering strategy)
- [x] **G-V.1** `routeRules['/branches'] = { isr: 3600 }` is already present — MUST NOT be
      modified.
- [x] **G-V.2** No Drizzle/Neon import under `app/` (zero grep match).
- [x] **G-V.3** `useBranches` composable calls `GET /api/v1/branches` only once (at ISR time
      via `useAsyncData`); client-side interactions sort the `ref` in memory.

### Gate VI — Security
- [x] **G-VI.1** The backend delta MUST NOT expose `whatsappReservacionesBackup`, `createdAt`,
      `updatedAt` in the public response.
- [x] **G-VI.2** The Mapbox public token (`pk.*`) is `runtimeConfig.public` — safe to expose
      in the client bundle. Never use a secret (`sk.*`) token in `runtimeConfig.public`.
- [x] **G-VI.3** Directions link MUST use `rel="noopener noreferrer"`.

### Gate VII — UX Consistency & Component Documentation
- [x] **G-VII.1** Visual specifics follow `docs/business/overview.md` (tokens, type scale,
      component anatomy). No inline hex; Tailwind tokens only.
- [x] **G-VII.2** AYCE = orange (`--orange`) / Express = blue (`--blue`) via `--accent` swap.
      Blue is Express-exclusive — never appears on AYCE cards or non-Express elements.
- [x] **G-VII.3** Mobile-first; fully responsive at 880px / 520px; map hidden < 880px.
      Hit targets ≥ 44px.
- [x] **G-VII.4** Every new component ships Default + significant-variant + responsive
      Storybook stories.
- [x] **G-VII.5** `<UiMapView>` story uses a mocked adapter so Storybook does not require a
      live Mapbox token.

### Gate VIII — Clean Code Discipline
- [x] **G-VIII.1** Functions ≤ 30 lines; component files ≤ 200 lines; no dead code, no bare
      `console.log`.
- [x] **G-VIII.2** Composables: `use` prefix. Vue files: PascalCase. Server route: kebab-case.

### Gate IX — Quality Gates
- [x] **G-IX.1** Biome lint + format pass; `vue-tsc --noEmit` passes; Conventional Commits;
      pre-push tests pass. No `--no-verify`.

### Gate X — KISS
- [x] **G-X.1** No new library beyond `mapbox-gl` (already installed). Haversine is
      implemented as a pure utility function (< 30 lines, already in
      `server/utils/haversine.ts`). A client-side copy MUST be placed in
      `app/features/branches/utils/haversine.ts` (same pure function, no import from
      `server/utils/`).
- [x] **G-X.2** The Mapbox Geocoding call is a plain `$fetch` in `useBranches` — no dedicated
      geocoding library.

### Gate XI — Absolute Imports
- [x] **G-XI.1** All imports use aliases (`@/components`, `@/composables`, `@/features`,
      `@/types`, `@/utils`); no `../` except same-directory.

### Gate XII — Error Handling
- [x] **G-XII.1** Geolocation and Mapbox Geocoding errors MUST be caught in `useBranches` and
      exposed as user-facing state (no `console.error` only, no unhandled rejection).
- [x] **G-XII.2** A missing/invalid Mapbox token MUST be caught in `mapboxAdapter.ts`; the
      `<UiMapView>` component MUST render a fallback slot/message.

### Gate XIII — Environment Validation
- [x] **G-XIII.1** `NUXT_PUBLIC_MAPBOX_TOKEN` is already in `.env.example`. It MUST be mapped
      to `runtimeConfig.public.mapboxAccessToken` in `nuxt.config.ts`.
- [x] **G-XIII.2** The `mapboxAdapter` reads the token from `useRuntimeConfig().public.mapboxAccessToken`.
      A missing or empty token MUST produce a clear error (adapter throws; `<UiMapView>`
      catches and shows fallback).

---

## Project Structure

### Documentation (this feature)

```text
specs/013-branches-page/
├── spec.md            # This feature's specification
├── plan.md            # This file
├── data-model.md      # Type definitions and backend delta
├── tasks.md           # Atomic tasks
└── contracts/
    └── api.md         # Frontend-facing API contract delta from feature 004
```

### Source Code

```text
app/
├── pages/
│   └── sucursales.vue                              # Route page — thin orchestrator (≤100 lines)
│
├── features/
│   └── branches/
│       ├── components/
│       │   ├── BranchCard.vue + .spec.ts + .stories.ts
│       │   ├── BranchList.vue + .spec.ts + .stories.ts
│       │   └── BranchSearch.vue + .spec.ts + .stories.ts
│       ├── composables/
│       │   └── useBranches.ts + .spec.ts
│       ├── utils/
│       │   └── haversine.ts + .spec.ts             # Client-side haversine (pure fn)
│       └── types.ts
│
├── components/ui/
│   └── MapView.vue + .spec.ts + .stories.ts        # NEW — provider-agnostic map
│
└── composables/maps/
    ├── types.ts                                    # NEW — LngLat, MapMarker, MapViewProps, MapAdapter
    ├── useMapProvider.ts                           # NEW — returns active adapter
    └── adapters/
        └── mapboxAdapter.ts                        # NEW — mapbox-gl implementation

server/
└── api/v1/branches/
    └── index.get.ts                                # MODIFIED — add type, schedule, phone to PUBLIC_FIELDS

types/
└── branches.ts                                     # NEW — BranchPublicRow, BranchWithDistance,
                                                    #       BranchSchedule, BranchesResponse

i18n/locales/
├── es.json                                         # + branches.* keys
└── en.json                                         # + branches.* keys

tests/mocks/
└── mapbox.ts                                       # NEW — centralized mapbox-gl mock

.env.example                                        # NUXT_PUBLIC_MAPBOX_TOKEN already present
nuxt.config.ts                                      # ADD runtimeConfig.public.mapboxAccessToken
```

---

## Complexity Tracking

No constitutional violations. The map abstraction layer is explicitly mandated by
`docs/business/maps-strategy.md` and satisfies Article X (KISS): the abstraction exists
because the strategy document names a concrete future use case (MapLibre migration), making
it a justified design pattern. The client-side-only map (no SSR) is not over-engineering —
it is required by `mapbox-gl`'s DOM dependency.

| Potential Violation | Assessment | Decision |
|---|---|---|
| Map abstraction layer (`useMapProvider`, adapter) | Mandated by `docs/business/maps-strategy.md` | Justified — concrete future migration path |
| Client-side haversine copy | `server/utils/haversine.ts` cannot be imported under `app/` (Article I boundary) | Necessary — pure function, < 20 lines |
| `<ClientOnly>` wrap on `<UiMapView>` | `mapbox-gl` requires DOM — SSR is impossible | Required, not complexity |
