# Feature Specification: Branches Page (`/sucursales`)

**Feature ID**: 013
**Feature Branch**: `feat/013-branches-page`
**Created**: 2026-06-21
**Status**: spec_ready
**Depends on**: 004 (branch finder API, done), 007 (design system, done), 008 (test setup, done)
**Blocks**: 014 (reservation modal — Reserve button emits open intent)

---

## Overview

The Branches Page (`/sucursales`) is the public branch-finder UI. It surfaces the full list of
SUMO locations — AYCE (orange) and Express (blue) — on an interactive map and a sortable card
list. The page is served as an ISR-cached HTML shell (revalidated every 3600 s per
`docs/business/rendering-strategy.md`). All interactive behaviour — geolocation, haversine
sorting, postal-code geocoding, and the Mapbox map — runs **client-side over that cached list**
with no additional API call triggered by user interaction.

This feature also:
1. Materializes the **provider-agnostic map abstraction** specified in
   `docs/business/maps-strategy.md` (`MapView`, `MapAdapter`, `useMapProvider`,
   `mapboxAdapter`).
2. Extends the existing `GET /api/v1/branches` response to expose `type`, `schedule`, and
   `phone` (renamed from `whatsappReservaciones`) — a **small backend delta** with no schema
   migration needed (all columns already exist).

---

## Clarifications

### Session 2026-06-21

- **Q: What phone field is exposed for the "Call" action?**
  A: `whatsappReservaciones` is renamed to `phone` in the public response. No new DB column is
  added. The name change is purely in `PUBLIC_FIELDS` / the response mapping in the route.

- **Q: Reserve button behaviour while feature 014 (reservation modal) is unbuilt?**
  A: The Reserve button emits an open-reservation intent via the existing cross-feature
  composable `useReservationModal` (created in feature 010). It is no-op-safe with no mounted
  consumer — same pattern as the homepage CTA.

- **Q: How does postal-code geocoding work?**
  A: The user types a 5-digit Mexican postal code (CP). The client calls the Mapbox Geocoding
  API (`https://api.mapbox.com/geocoding/v5/mapbox.places/{CP}.json?country=MX&types=postcode&access_token=...`)
  to resolve lat/lng. The returned coordinates are then used for haversine sort on the cached
  branch list. No server round-trip.

- **Q: What happens on mobile where the map is not shown?**
  A: On viewports < 880px the map panel is hidden (CSS `hidden`). The list is the primary
  surface on mobile. The map appears as a side panel at ≥ 880px.

- **Q: Does the map need SSR?**
  A: No. `mapbox-gl` manipulates the DOM directly and must only mount client-side. The
  `<MapView>` component is wrapped in `<ClientOnly>` (Nuxt convention) or uses
  `onMounted` / dynamic import to prevent SSR.

- **Q: Is `routeRules['/sucursales']` already present?**
  A: Yes — verified in `nuxt.config.ts` line 81: `'/sucursales': { isr: 3600 }`. No change
  needed.

- **Q: Is `NUXT_PUBLIC_MAPBOX_TOKEN` already declared?**
  A: Yes — present in `.env.example`. It must also be added to `nuxt.config.ts >
  runtimeConfig.public.mapboxAccessToken` and to Vercel environment variables.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse branches (default state) (Priority: P1)

A visitor arrives at `/sucursales` on any device. Without doing anything, they see a list of all
active branches sorted alphabetically, each with its type chip (AYCE/Express), address, and
action buttons. On a desktop viewport (≥ 880px) a map with all pins is visible beside the list.

**Why this priority**: The page must be functional and readable even if geolocation is never
granted and the map never loads. The cached HTML shell alone must be a complete, usable branch
directory.

**Independent Test**: Load `/sucursales` in a browser with JavaScript disabled. Confirm all
branch cards render with name, type chip, address, and action buttons. No map, no geolocation
prompt — just the static list from the ISR shell.

**Acceptance Scenarios**:

1. **Given** a visitor loads `/sucursales` without interacting, **When** the page renders,
   **Then** all active branches are listed alphabetically, each card showing name, type chip
   (orange "AYCE" or blue "Express"), and address.
2. **Given** a ≥ 880px viewport, **When** the page renders, **Then** an interactive Mapbox map
   is visible beside the list with one pin per branch (orange = AYCE, blue = Express).
3. **Given** a < 880px viewport, **When** the page renders, **Then** the map panel is hidden
   and only the list is shown.
4. **Given** the default language is Spanish, **When** the page first renders, **Then** all UI
   copy is in Spanish.

---

### User Story 2 — Find nearest branch via geolocation (Priority: P1)

A visitor taps "Find nearest" (or the browser prompts automatically). The browser's
`navigator.geolocation` API is called. On permission granted the list re-sorts by distance
(closest first) and the map re-centers on the user's position.

**Why this priority**: Distance-sorting is the primary value proposition of the branch finder.

**Independent Test**: Grant geolocation permission. Confirm the list reorders by distance
(closest card first), each card shows a formatted distance ("1.2 km"), and the map re-centers
on the user pin.

**Acceptance Scenarios**:

1. **Given** the visitor grants geolocation, **When** the position is resolved, **Then** branch
   cards re-sort by `distanceKm` ascending, each card shows the computed distance.
2. **Given** the visitor grants geolocation, **When** the position is resolved, **Then** the
   map re-centers on the user's coordinates and adds a user-location pin.
3. **Given** the visitor denies geolocation or the browser throws an error, **When** the error
   is caught, **Then** a graceful inline message is shown (e.g. "Enable location to sort by
   distance") and the postal code input becomes visible; the list remains usable in alphabetical
   order.
4. **Given** geolocation is not supported by the browser, **When** the page loads, **Then**
   the geolocation button is hidden and the postal code fallback is shown immediately.

---

### User Story 3 — Find nearest branch via postal code (Priority: P1)

The visitor types a 5-digit Mexican postal code. The client geocodes it via the Mapbox
Geocoding API and sorts the list by distance from the resolved coordinates.

**Why this priority**: Geolocation is often blocked on first visit or unavailable in WebViews.
Postal-code fallback is the backup path for the majority of mobile users.

**Independent Test**: Type "11560" (Polanco CP). Confirm the list re-sorts with the nearest
branch first, and each card shows the computed distance.

**Acceptance Scenarios**:

1. **Given** the visitor types a valid 5-digit CP, **When** Mapbox resolves it, **Then** the
   list re-sorts by distance from the resolved coordinates, cards show distance.
2. **Given** the visitor types an invalid or unrecognised CP, **When** Mapbox returns no
   result, **Then** an inline validation message is shown and the list stays in its prior order.
3. **Given** the Mapbox Geocoding API is unreachable, **When** the call fails, **Then** an
   inline error message is shown; the list stays usable and no unhandled error surfaces.

---

### User Story 4 — Interact with map and list (Priority: P2)

Pins on the map are clickable; list cards are clickable. Clicking a pin highlights the
corresponding card in the list (scrolls into view, adds a highlight ring). Clicking a card
highlights the corresponding pin.

**Why this priority**: Map–list cross-linking is a secondary interaction. The page is fully
functional without it, but it substantially improves usability on desktop.

**Independent Test**: Click a map pin and confirm the corresponding branch card scrolls into
view with a visible highlight. Then click a different card and confirm its pin becomes
highlighted on the map.

**Acceptance Scenarios**:

1. **Given** the map is visible, **When** the visitor clicks a pin, **Then** the corresponding
   branch card scrolls into view and gains a highlight ring (focus-style outline).
2. **Given** the list is visible, **When** the visitor clicks a branch card, **Then** the map
   pan/zooms to that branch and its pin is highlighted.

---

### User Story 5 — Take action from a branch card (Priority: P1)

Each branch card has three action buttons: Reserve, Directions, Call.

**Why this priority**: These are the terminal actions of the entire branch-finder flow.

**Independent Test**: Verify Reserve triggers `openReservation()` without error; Directions
opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` in a new tab; Call
opens `tel:{phone}`.

**Acceptance Scenarios**:

1. **Given** the visitor activates "Reservar" on a card, **When** clicked, **Then**
   `useReservationModal().openReservation()` is called; no error even without a mounted modal.
2. **Given** the visitor activates "Cómo llegar" on a card, **When** clicked, **Then** the
   browser navigates to
   `https://www.google.com/maps/dir/?api=1&destination={branch.lat},{branch.lng}` in a new tab.
3. **Given** the visitor activates "Llamar" on a card, **When** clicked, **Then** the browser
   attempts `tel:{branch.phone}`.
4. **Given** a branch has no phone, **When** the card renders, **Then** the "Llamar" button is
   disabled or hidden.

---

### Edge Cases

- **Empty branch list**: If the API returns zero active branches the page shows an empty-state
  message rather than a blank list.
- **Branch without coordinates**: A branch with `lat: null` or `lng: null` renders in the list
  but is excluded from map pins and from haversine sorting; if sorted, it appears after branches
  with coordinates.
- **Branch without phone**: The Call button is hidden/disabled (not shown as broken).
- **Mapbox token missing/invalid**: The map mounts but immediately fires an error; the error is
  caught, the map container shows a fallback message ("Map unavailable"), the list remains
  fully functional.
- **Geolocation timeout**: Treated the same as a permission denial — graceful fallback message
  + postal code input.
- **Very long branch name**: Text wraps within the card; no horizontal overflow at 360px.
- **Reduced motion**: Map fly/pan animations are disabled; list transitions are instant.
- **Both geolocation and CP used**: The last-applied sort wins; each replaces the prior sort
  without stacking.
- **Stale ISR content**: A branch created/deactivated in the DB will appear/disappear within
  the 3600 s revalidation window. Acceptable.

---

## Requirements *(mandatory)*

### Functional Requirements

**Page composition & rendering**

- **FR-001**: The system MUST serve the branch-finder page at the route `/sucursales` requiring
  no authentication.
- **FR-002**: The page MUST be rendered with ISR at a 3600-second revalidation interval.
  `routeRules['/sucursales'] = { isr: 3600 }` is already present in `nuxt.config.ts` — it
  MUST NOT be modified.
- **FR-003**: The ISR HTML shell MUST include the full branch list (all active branches fetched
  at revalidation time via `useAsyncData` calling `GET /api/v1/branches` with no coordinates).
  Client-side distance sorting MUST operate on this cached list — no additional API call is
  triggered by user geolocation or CP input.
- **FR-004**: NO Drizzle/Neon client may be imported anywhere under `app/`. The branch data
  reaches the page exclusively via `GET /api/v1/branches`.

**Backend delta (small, within this feature's scope)**

- **FR-005**: `server/api/v1/branches/index.get.ts` MUST be updated to add `type` and
  `schedule` to `PUBLIC_FIELDS` and to expose `whatsappReservaciones` as `phone` in the
  response. The internal field name (`whatsappReservaciones`) MUST NOT appear in the public
  response.
- **FR-006**: The updated `BranchRow` type MUST reflect the three new fields: `type: 'ayce' |
  'express'`, `schedule: BranchSchedule | null`, `phone: string | null`.
- **FR-007**: `BranchSchedule` MUST be defined as `{ weekdays?: { open: string, close: string
  }, weekends?: { open: string, close: string } }` and exported from `types/branches.ts`.
- **FR-008**: No schema migration is needed; `type` and `schedule` columns already exist in
  `server/db/schema.ts`. No new env vars are needed.
- **FR-009**: Existing tests for `GET /api/v1/branches` MUST pass after the delta. New tests
  MUST cover the `type`, `schedule`, and `phone` fields in the response.

**Map abstraction (materialises `docs/business/maps-strategy.md`)**

- **FR-010**: `app/composables/maps/types.ts` MUST define `LngLat`, `MapMarker`, `MapViewProps`,
  and `MapAdapter` as specified in `docs/business/maps-strategy.md`.
- **FR-011**: `app/composables/maps/useMapProvider.ts` MUST export `useMapProvider()` returning
  the active adapter (currently `mapboxAdapter`).
- **FR-012**: `app/composables/maps/adapters/mapboxAdapter.ts` MUST implement `MapAdapter`
  using `mapbox-gl`. It MUST read `useRuntimeConfig().public.mapboxAccessToken` for the Mapbox
  public token.
- **FR-013**: `app/components/ui/MapView.vue` MUST be a provider-agnostic component accepting
  `MapViewProps` as props. It MUST NOT import `mapbox-gl` directly. It MUST be rendered
  client-side only (wrapped in `<ClientOnly>` or dynamically imported).
- **FR-014**: Direct imports of `mapbox-gl` outside
  `app/composables/maps/adapters/mapboxAdapter.ts` are FORBIDDEN. Any reviewer grep
  (`grep -rEn "from ['\"]mapbox-gl['\"]" app/ --include='*.vue' --include='*.ts' |
  grep -v 'composables/maps/adapters/'`) must return zero matches.
- **FR-015**: `nuxt.config.ts > runtimeConfig.public.mapboxAccessToken` MUST be set (empty
  string default, populated in production via Vercel Environment Variables from
  `NUXT_PUBLIC_MAPBOX_TOKEN`). The token MUST start with `pk.` and be obtained from the
  Mapbox dashboard → Access tokens → Create a token.

**Branch list & geolocation**

- **FR-016**: The default state (no coordinates) MUST display branches alphabetically.
- **FR-017**: After geolocation permission is granted, `useBranches` MUST sort the cached list
  by haversine distance (closest first) without making a new API call. Each card MUST show
  the computed distance.
- **FR-018**: If geolocation is denied, errors, or times out, the page MUST show a graceful
  inline message and reveal the postal code input. The list MUST remain fully usable.
- **FR-019**: If `navigator.geolocation` is not available, the geolocation button MUST be
  hidden and the postal code fallback shown immediately.

**Postal-code fallback**

- **FR-020**: The user MAY type a 5-digit Mexican postal code. The client MUST call the Mapbox
  Geocoding API (`/geocoding/v5/mapbox.places/{CP}.json?country=MX&types=postcode`) using the
  public token. On success, lat/lng from the first feature result are used to sort the cached
  list via haversine. No server round-trip.
- **FR-021**: An invalid or unrecognized CP MUST show an inline validation message; the list
  stays in its prior order.
- **FR-022**: A Mapbox Geocoding API failure (network error, 4xx/5xx) MUST show an inline error
  message; no unhandled rejection surfaces.

**Map behaviour**

- **FR-023**: The map MUST show one pin per branch that has valid coordinates. Pin color:
  orange (`#F37021`) = AYCE, blue (`#2B3990`) = Express.
- **FR-024**: Clicking a map pin MUST highlight the corresponding branch card in the list
  (scroll into view + highlight ring).
- **FR-025**: Clicking a branch card MUST highlight the corresponding pin on the map (pan/zoom
  to branch).
- **FR-026**: After geolocation succeeds, the map MUST re-center on the user's position and
  add a user-location marker (distinct from branch pins).
- **FR-027**: If the Mapbox token is missing or invalid, the map container MUST show a fallback
  message ("Mapa no disponible"); the list MUST remain fully functional.
- **FR-028**: Map fly/pan animations MUST be disabled when `prefers-reduced-motion: reduce` is
  set.

**Branch card actions**

- **FR-029**: Each branch card MUST display: name, type chip (AYCE/Express), address, distance
  (only when coordinates are available), hours summary (from `schedule` field), Reserve button,
  Directions button, Call button.
- **FR-030**: Reserve button MUST call `useReservationModal().openReservation()`. No error if
  the modal is not mounted (cross-feature composable is no-op-safe).
- **FR-031**: Directions button MUST open
  `https://www.google.com/maps/dir/?api=1&destination={branch.lat},{branch.lng}` in a new tab
  (`target="_blank"`, `rel="noopener noreferrer"`).
- **FR-032**: Call button MUST trigger `tel:{branch.phone}`. If `phone` is null/empty the
  button MUST be hidden.

**Layout & responsiveness**

- **FR-033**: On viewports < 880px, the map is hidden; the branch list is the primary surface.
- **FR-034**: On viewports ≥ 880px, the map appears as a side panel alongside the list.
- **FR-035**: The page template MUST NOT exceed 100 lines. Section-specific markup lives in
  feature components.

**Internationalisation**

- **FR-036**: All UI copy (button labels, error messages, distance format, empty state) MUST be
  available in Spanish (default) and English via `@nuxtjs/i18n`, switchable without a full
  reload.

**Accessibility**

- **FR-037**: All interactive elements (cards, buttons, map pins) MUST be keyboard-operable
  with visible focus indicators. Hit targets ≥ 44px.
- **FR-038**: The map MUST have a descriptive `aria-label`. Branch cards MUST have accessible
  names including the branch name.

### Key Entities

- **Branch**: Active SUMO location. Public attributes: `id`, `name`, `address`, `lat`, `lng`,
  `isActive`, `type` (`'ayce' | 'express'`), `schedule` (`BranchSchedule | null`), `phone`
  (`string | null`). Source: `GET /api/v1/branches`, cached at ISR time.
- **BranchSchedule**: `{ weekdays?: { open: string, close: string }, weekends?: { open: string,
  close: string } }`. Derived from the `schedule` JSONB column in the `branches` table.
- **MapMarker**: `{ id: string, position: LngLat, color: 'orange' | 'blue', popupContent?:
  string, onClick?: fn }`. Interface defined in `app/composables/maps/types.ts`.
- **UserPosition**: Transient client-side state. `{ lat: number, lng: number }`. Never
  persisted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The page HTML shell is served from the ISR cache (no DB query on visitor
  requests). The `GET /api/v1/branches` call happens only at revalidation time.
- **SC-002**: The Lighthouse score on `/sucursales` is ≥ 90 on all four metrics (Performance,
  Accessibility, Best Practices, SEO).
- **SC-003**: The branch list renders correctly at 360px with no horizontal overflow.
- **SC-004**: Geolocation distance sort re-orders the list within 200 ms of coordinates
  being resolved (haversine on ≤ 30 branches is negligible CPU).
- **SC-005**: CP geocoding resolves and re-sorts the list within the round-trip time of the
  Mapbox Geocoding API call (~200–500 ms).
- **SC-006**: Geolocation denial or Mapbox token error never surfaces an unhandled exception
  to the visitor; the list remains usable in both failure cases.
- **SC-007**: A branch deactivated in the DB appears/disappears from the page within 3600 s.
- **SC-008**: Zero direct `mapbox-gl` imports exist outside the adapter file (verified by
  grep in CI).
- **SC-009**: All card action buttons (Reserve, Directions, Call) work correctly per their
  acceptance scenarios.

## Assumptions

- **Feature 004 backend is done**: `GET /api/v1/branches` is implemented and tested. This
  feature extends it (adds `type`, `schedule`, `phone`) but does not re-implement it.
- **`mapbox-gl` is already installed**: Feature 007 (scaffold) installed it as a dependency
  (install-only, no usage). This feature builds the abstraction layer on top.
- **`routeRules['/sucursales'] = { isr: 3600 }` is present**: Verified in `nuxt.config.ts`.
- **`NUXT_PUBLIC_MAPBOX_TOKEN` is declared**: Present in `.env.example`. Still needs to be
  added to `nuxt.config.ts > runtimeConfig.public.mapboxAccessToken` and Vercel.
- **`useReservationModal` composable exists**: Created in feature 010. The Reserve button
  reuses it. No new cross-feature composable is needed.
- **Branch data is the DB source of truth**: The page does NOT read from WordPress CPT
  `sucursales`. The DB (via `GET /api/v1/branches`) is the single authoritative source of
  branch data for this feature.
- **Reservation modal (feature 014) is not yet built**: The Reserve button emits an open
  intent only; the modal shell is a future feature.
- **29 branches in seed data**: The `sumo_ayce.json` seed covers all currently known branches.
  Three are Express (Buenavista, Portal Centro, Tepepan). The rest are AYCE.
- **`schedule` JSON shape**: Assumed to follow `{ weekdays?: { open, close }, weekends?: { open,
  close } }` based on `docs/business/features.md` §4. If a branch has null/malformed schedule,
  the hours summary renders "Horarios no disponibles".
