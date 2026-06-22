# Data Model: Branches Page (`/sucursales`)

**Feature ID**: 013
**Date**: 2026-06-21

---

## 1. No schema migration required

All columns needed by this feature already exist in the `branches` table. This feature only
exposes previously-hidden columns (`type`, `schedule`, `whatsappReservaciones`) in the public
API response.

---

## 2. Database table: `branches` (existing, unchanged)

Columns used by this feature that were previously excluded from `PUBLIC_FIELDS`:

| Column | DB type | TS type (Drizzle) | Notes |
|--------|---------|-------------------|-------|
| `type` | `varchar` | `'ayce' \| 'express'` | Branch category. Was missing from public response. |
| `schedule` | `jsonb` | `unknown \| null` | Operating hours. Was missing from public response. |
| `whatsappReservaciones` | `varchar(20)` | `string \| null` | Renamed to `phone` in public response. |

Previously-included public columns (unchanged):

| Column | DB type | TS type (Drizzle) | Notes |
|--------|---------|-------------------|-------|
| `id` | `uuid` | `string` | PK |
| `name` | `varchar(100)` | `string` | Branch display name |
| `address` | `text` | `string` | Street address |
| `lat` | `decimal(10,8)` | `string \| null` | Drizzle returns decimal as string |
| `lng` | `decimal(11,8)` | `string \| null` | Drizzle returns decimal as string |
| `isActive` | `boolean` | `boolean` | Soft-active filter |

Still excluded from public response (unchanged):

| Column | Reason |
|--------|--------|
| `whatsappReservacionesBackup` | Internal backup number |
| `postalCode` | Not needed by frontend |
| `createdAt`, `updatedAt` | Audit fields |

---

## 3. Shared TypeScript types (`types/branches.ts`)

```typescript
// types/branches.ts

export interface BranchScheduleSlot {
  open: string   // e.g. "12:00"
  close: string  // e.g. "22:00"
}

export interface BranchSchedule {
  weekdays?: BranchScheduleSlot
  weekends?: BranchScheduleSlot
}

/** Public branch row returned by GET /api/v1/branches */
export interface BranchPublicRow {
  id: string
  name: string
  address: string
  lat: string | null
  lng: string | null
  isActive: boolean
  type: 'ayce' | 'express'
  schedule: BranchSchedule | null
  phone: string | null   // whatsappReservaciones renamed
}

/** Branch with client-computed distance (only when coordinates are provided) */
export interface BranchWithDistance extends BranchPublicRow {
  distanceKm: number
}

/** SearchContext included in the response when coordinates are provided (feature 004) */
export interface SearchContext {
  radiusUsed: number
  expanded: boolean
  noResults: boolean
}

/** Response from GET /api/v1/branches without coordinates */
export interface BranchesResponse {
  data: BranchPublicRow[]
  error: null
  meta: null
}

/** Response from GET /api/v1/branches with coordinates */
export interface BranchesWithDistanceResponse {
  data: BranchWithDistance[]
  error: null
  meta: null
  searchContext: SearchContext
}
```

---

## 4. Frontend-only types (`app/composables/maps/types.ts`)

These interfaces are used by `<UiMapView>` and `mapboxAdapter`. They are **not** shared
with the server — they live under `app/` and are frontend-only.

```typescript
// app/composables/maps/types.ts

/** [longitude, latitude] — Mapbox/GeoJSON convention */
export type LngLat = [longitude: number, latitude: number]

export interface MapMarker {
  id: string
  position: LngLat
  color: 'orange' | 'blue'   // brand tokens: AYCE / Express
  popupContent?: string       // HTML or sanitized text shown in popup
  onClick?: (marker: MapMarker) => void
}

export interface MapViewProps {
  center: LngLat
  zoom: number
  markers: MapMarker[]
  style?: 'streets' | 'light' | 'dark'  // semantic, not provider-specific
  interactive?: boolean                  // default true
}

/** Contract every map adapter must implement */
export interface MapAdapter {
  createMap(container: HTMLElement, options: {
    center: LngLat
    zoom: number
    style: string   // resolved provider URL
    accessToken?: string
  }): Promise<unknown>           // opaque map instance
  addMarker(map: unknown, marker: MapMarker): void
  removeMarker(map: unknown, id: string): void
  setCenter(map: unknown, position: LngLat): void
  setZoom(map: unknown, zoom: number): void
  flyTo(map: unknown, position: LngLat, zoom?: number): void
  destroy(map: unknown): void
}
```

---

## 5. Feature-local types (`app/features/branches/types.ts`)

```typescript
// app/features/branches/types.ts

import type { BranchPublicRow, BranchWithDistance } from '@/types/branches'

export type { BranchPublicRow, BranchWithDistance }

export type SortedBranch = BranchPublicRow & { distanceKm?: number }

export interface GeoState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'unsupported'
  errorMessage: string | null
  userLat: number | null
  userLng: number | null
}

export interface CpState {
  value: string       // raw input
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage: string | null
}
```

---

## 6. Backend delta — `PUBLIC_FIELDS` change in `index.get.ts`

The `PUBLIC_FIELDS` object in `server/api/v1/branches/index.get.ts` is extended:

```typescript
// BEFORE (feature 004)
const PUBLIC_FIELDS = {
  id: branches.id,
  name: branches.name,
  address: branches.address,
  lat: branches.lat,
  lng: branches.lng,
  isActive: branches.isActive,
}

// AFTER (this feature)
const PUBLIC_FIELDS = {
  id: branches.id,
  name: branches.name,
  address: branches.address,
  lat: branches.lat,
  lng: branches.lng,
  isActive: branches.isActive,
  type: branches.type,
  schedule: branches.schedule,
  phone: branches.whatsappReservaciones,   // renamed in response
}
```

The `BranchRow` type is updated to match. The `stripInternalFields` function is removed (it
is superseded by the explicit `PUBLIC_FIELDS` whitelist approach, which is cleaner). If
`whatsappReservacionesBackup` is ever added to `PUBLIC_FIELDS` in the future, it requires an
explicit decision — it is NOT included by default.

---

## 7. Mapbox token configuration

| Location | Key | Value |
|---|---|---|
| `.env.example` | `NUXT_PUBLIC_MAPBOX_TOKEN` | Already declared (empty) |
| `nuxt.config.ts` | `runtimeConfig.public.mapboxAccessToken` | Must be added (reads from `NUXT_PUBLIC_MAPBOX_TOKEN`) |
| Vercel | Environment Variables → Production + Preview | `NUXT_PUBLIC_MAPBOX_TOKEN=pk.ey...` |
| Mapbox dashboard | Access tokens | Create a public token with `styles:read`, `tiles:read` scopes |

Token format: MUST start with `pk.` (public token). Secret tokens (`sk.`) MUST NOT be used
in `runtimeConfig.public`.
