# Maps strategy

> Architectural rule for any feature that renders a geographic map (currently
> only feature 012 `/sucursales`, but the same constraint applies to anything
> future that might use one).

## Principle

The application MUST be agnostic to the map provider. The current default is
**Mapbox GL JS**, but the codebase must allow swapping the renderer, tile
provider, geocoding, or directions service without cascading changes through
the UI, pages, or business logic.

Reasons:

- Mapbox GL JS is proprietary (Mapbox TOS) since v2.0. Pricing or terms can
  change unilaterally.
- Future scale may justify self-hosted tiles or switching to MapLibre + a paid
  tile provider (MapTiler, Stadia).
- Marketing/branding may at some point prefer Google Maps for "Cómo llegar"
  integrations or familiarity.
- Vendor lock-in on a non-core concern (the visual mapping layer) is avoidable
  with one extra abstraction layer.

## What gets abstracted

A "map" is actually four independent services. Each MUST have its own
interface so they can be swapped independently:

| Capability | Interface | Default impl |
|---|---|---|
| Renderer (the JS lib that draws the map on a canvas) | `MapRenderer` | `mapbox-gl` |
| Tiles (the raster/vector data behind the map) | bound to the renderer's style URL | Mapbox tiles (paid) |
| Geocoding (address → lat/lng, lat/lng → address) | `Geocoder` | Mapbox Geocoding API |
| Directions (route from A to B) | `DirectionsProvider` | External link to Google Maps (no provider needed in-app) |

The current product only needs the **Renderer** in-app — directions go to an
external Google Maps URL via `https://www.google.com/maps/dir/?api=1&...`.
Geocoding for branch lookup runs server-side (feature 004 already shipped) and
is decoupled from the frontend map.

## File layout (to materialize in feature 012)

```
app/components/ui/MapView.vue                  ← Public, provider-agnostic component
                                                  Props: center, zoom, markers, style, onMarkerClick

app/composables/maps/
  ├── types.ts                                 ← Shared interfaces (LngLat, MapMarker, MapStyle, etc.)
  ├── useMapProvider.ts                        ← Composable that returns the active adapter
  └── adapters/
      ├── mapboxAdapter.ts                     ← Default, ships now
      ├── maplibreAdapter.ts                   ← (future) — implement when switching
      └── googleMapsAdapter.ts                 ← (future) — implement if marketing requests

types/maps.ts                                   ← (optional) re-export of common types if used outside app/
```

## Public API contract (the only surface pages and features import)

```ts
// app/composables/maps/types.ts
export type LngLat = [longitude: number, latitude: number]

export interface MapMarker {
  id: string
  position: LngLat
  color: 'orange' | 'blue'                     // peer brand tokens (AYCE / Express)
  popupContent?: string                        // HTML or sanitized text
  onClick?: (marker: MapMarker) => void
}

export interface MapViewProps {
  center: LngLat
  zoom: number
  markers: MapMarker[]
  style?: 'streets' | 'light' | 'dark'         // semantic, not provider-specific
  interactive?: boolean                         // default true; false = static preview
}
```

Pages and feature code MUST only import from `app/composables/maps/types.ts`
and `app/components/ui/MapView.vue`. Direct imports of `mapbox-gl` outside
`app/composables/maps/adapters/mapboxAdapter.ts` are FORBIDDEN.

## Adapter contract

Each adapter exports a single function:

```ts
// app/composables/maps/adapters/mapboxAdapter.ts
import type { MapAdapter } from '../types'

export const mapboxAdapter: MapAdapter = {
  async createMap(container, options) { /* mapbox-gl specific */ },
  addMarker(map, marker) { /* mapbox-gl specific */ },
  removeMarker(map, id) { /* mapbox-gl specific */ },
  setCenter(map, position) { /* mapbox-gl specific */ },
  setZoom(map, zoom) { /* mapbox-gl specific */ },
  destroy(map) { /* mapbox-gl specific */ },
}
```

Switching providers is then a one-line change in `useMapProvider.ts`:

```ts
import { mapboxAdapter } from './adapters/mapboxAdapter'
// import { maplibreAdapter } from './adapters/maplibreAdapter'

export const useMapProvider = () => mapboxAdapter
```

(Or driven by an env var / runtime config if A/B testing providers.)

## Provider-agnostic semantic styles

Each adapter MUST map the three semantic styles (`'streets' | 'light' | 'dark'`)
to its provider-specific style URL or config:

| Semantic | Mapbox | MapLibre + MapTiler | Google Maps |
|---|---|---|---|
| `streets` | `mapbox://styles/mapbox/streets-v12` | `https://api.maptiler.com/maps/streets/style.json?key=...` | `roadmap` |
| `light` | `mapbox://styles/mapbox/light-v11` | `https://api.maptiler.com/maps/basic-v2-light/style.json?key=...` | `silver` |
| `dark` | `mapbox://styles/mapbox/dark-v11` | `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=...` | `night` |

The page using `<MapView>` never sees the provider's style URL — only the
semantic name.

## Tokens / env vars

Each adapter reads its own credentials from `runtimeConfig.public`. The
key name is provider-specific (`mapboxAccessToken`, `maptilerApiKey`,
`googleMapsApiKey`), but only ONE is required at a time — the one matching
the active adapter.

Public tokens go in `app.config.ts` or `nuxt.config.ts` `runtimeConfig.public`.
Secret tokens (e.g., Mapbox's `sk.*` server-side token, used only for backend
geocoding) live in `.env` and are never exposed to the client.

## Where this constraint is enforced

- **Feature 007 (scaffold)**: installs `mapbox-gl` as a dependency. No client
  is instantiated. No abstraction is built yet — the renderer is install-only.
- **Feature 012 (`/sucursales`)**: MUST materialize the file layout above and
  ship the public `<MapView>` + the `mapboxAdapter`. The spec for feature 012
  will reference this document.
- **Reviewer agent**: rejects any direct import of `mapbox-gl` outside
  `app/composables/maps/adapters/`. Future provider migrations don't trigger
  cascading changes outside the adapter folder.

## Cost / billing of the default provider

Mapbox free tier as of 2026-06-17:

- 50,000 map loads/month (each page view with a rendered map = 1 load).
- 100,000 geocoding requests/month.
- 100,000 directions requests/month (not used in-app; we deep-link to Google Maps).

At SUMO's expected `/sucursales` traffic this is comfortably within the free
tier. When usage approaches the threshold, the abstraction makes migration to
MapLibre + MapTiler (free up to 100k tile loads/month) a one-file change.

## Open follow-ups (NOT for feature 007)

These belong to feature 012's spec or later:

- Implement `mapboxAdapter` against the public `MapAdapter` interface.
- Define the `MapAdapter` TypeScript interface in `app/composables/maps/types.ts`.
- Build `<MapView>` so it consumes only the interface, never `mapbox-gl` directly.
- Add reviewer-agent rule: `grep -rEn "from ['\"]mapbox-gl['\"]" app/ --include='*.vue' --include='*.ts' | grep -v 'composables/maps/adapters/' && exit 1`.
- Document the env var the active adapter requires (`NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN` today).
