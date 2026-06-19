# Contract: Homepage content endpoints + composables

> **Reconciled to built state 2026-06-20.** The homepage has **three content sources**:
> promotions (WordPress endpoint via a Nitro route — the only live source), featured
> dishes/drinks (**static fixture**, route-compatible shape), and reviews (static fixture).
> The earlier single bundled `GET /api/v1/content/home` + `useHomeContent` model is
> superseded; the earlier DB-backed `featured-dishes` Nitro route was **not built** — the
> rail is served from a static fixture (drop-in swappable for a real route later).

## Nitro route — `GET /api/v1/content/promotions`

Fetches the WordPress `promociones` endpoint server-side, validates, normalizes, selects the
top 3, and returns them. Read-only. No auth (public content).

**File**: `server/api/v1/content/promotions.get.ts` (kebab-case per Article VIII).

### Request

- Method: `GET`
- No query params, no body, no auth header.

### Response — 200 (always, even on upstream failure)

```jsonc
{
  "promotions": [
    { "id": "34", "badge": { "es": "2x1", "en": "2for1" }, "title": { "es": "...", "en": "..." },
      "description": { "es": "...", "en": "..." }, "validity": { "es": "...", "en": "..." },
      "color": "orange", "type": "ayce", "active": true, "publishedAt": "2026-06-10T00:00:00Z",
      "imageUrl": "https://cms.sumo.com.mx/.../flyer.webp" }
  ],
  "ok": true
}
```

### Behavior contract

| Rule | Expectation |
|------|-------------|
| Source | WordPress `promociones` endpoint (`/wp-json/wp/v2/promociones`, pretty-permalink), fetched server-side (origin = `https://cms.sumo.com.mx`). Raw shape typed in `types/wordpress.ts`; endpoint + queries documented in `docs/business/wordpress-endpoints.md`. |
| Timeouts | List fetch bounded to 4s, each media (image) fetch to 3s, so a slow/unreachable WordPress degrades gracefully instead of blocking the ISR render. |
| Validation | Validated with Zod (`validators.ts`) before mapping. Items failing validation are dropped individually; the response is still returned. `acf.color` accepts any string (normalized to a known token, default `orange`); `acf.tipo ∈ {all,ayce,express}`. |
| Selection | Two-step, max 3: (1) PRIMARY `?activa=1&home=1&per_page=100` (active promos flagged for the home) → cap to the 3 newest (publish-date desc). (2) FALLBACK if primary is empty: `?activa=1&per_page=100` (all active) → cap to the 3 newest. (3) If fallback is also empty → `{ promotions: [], ok: false }`, section does not render. Any type (AYCE/Express/all) is allowed. |
| Image resolution | Each `acf.imagen` (media **ID**) is resolved to `source_url` via `GET /wp-json/wp/v2/media/{id}`; on any failure the promo's `imageUrl` is `null` (degrades to a non-interactive text card). |
| Upstream failure | If WordPress is unreachable/5xx/invalid/timed-out: log via `server/utils/error-handler.ts` as `ExternalServiceError`, but return `{ promotions: [], ok: false }` with HTTP 200 so the page degrades gracefully. NEVER leak upstream error body/stack. |
| Caching | Relies on the page's ISR window (Nitro caches the SSR render). No per-user cache headers. |
| Data separation | MUST NOT import any Neon/Drizzle client. WordPress origin from validated env only. |

## Featured dishes — static fixture (NOT a route, as built)

Featured dishes/drinks are served from a **typed static fixture** committed in the repo
(`app/features/homepage/data/featured-dishes.ts`, `FeaturedDish[]`), consumed by
`useFeaturedDishes()`. There is **no** DB-backed Nitro route in this feature (the earlier
`GET /api/v1/content/featured-dishes` Drizzle route was not built). The composable returns the
route-compatible `{ dishes, ok, pending }` shape so the source can be swapped for a real data
source (e.g. a Nitro route) later with zero component change. The current fixture dishes have
`imageUrl: null` (each renders the neutral "SUMO" placeholder). No DB, no fetch, no Drizzle/Neon
import anywhere.

```jsonc
// FeaturedDish (fixture entry)
{ "id": "d1", "name": "Salmón Nigiri", "description": { "es": "...", "en": "..." },
  "imageUrl": null, "badge": "Top", "category": "frio" }
```

## Static fixture — reviews

Reviews are **not** a route. They are a typed constant or local JSON committed in the repo
(e.g. `app/features/homepage/data/reviews.ts` / `reviews.json`), conforming to `Review[]`
from `types/content.ts`. The reviews section imports the fixture directly — no fetch, no
pending state, no failure path. The fixture is structured so a later feature can swap it for
a fetched source without changing the reviews component contract.

## Composable — `usePromotions`

**File**: `app/features/homepage/composables/usePromotions.ts` + `usePromotions.spec.ts`.

```ts
export function usePromotions(): {
  promotions: Ref<Promotion[]>   // empty on failure; already ≤ 3, filtered+sorted
  ok: Ref<boolean>
  pending: Ref<boolean>
}
```

### Behavior contract

| Rule | Expectation |
|------|-------------|
| Fetch | Uses `useFetch('/api/v1/content/promotions')` (server-side, Nitro-cached within ISR window). NOT `$fetch` per render. |
| Source separation | Touches the WordPress-backed promotions route only. MUST NOT import the featured-dishes composable, any Neon composable, or the DB. |
| Failure | When `ok === false`, exposes an empty array so the section self-hides; never throws to the component. |
| Types | Returns shapes from `types/content.ts`. |

## Composable — `useFeaturedDishes`

**File**: `app/features/homepage/composables/useFeaturedDishes.ts` + `useFeaturedDishes.spec.ts`.

```ts
export function useFeaturedDishes(): {
  dishes: Ref<FeaturedDish[]>   // empty on failure
  ok: Ref<boolean>
  pending: Ref<boolean>
}
```

### Behavior contract

| Rule | Expectation |
|------|-------------|
| Source | Reads the static fixture `app/features/homepage/data/featured-dishes.ts`. As built there is NO fetch and NO DB route; `ok` is always `true` and `pending` always `false`. (The `{ dishes, ok, pending }` shape is route-compatible so a future swap to a real `useFetch('/api/v1/content/featured-dishes')` is drop-in.) |
| Source separation | MUST NOT import Drizzle/Neon nor the promotions composable. |
| Failure | If the source ever becomes a route, an `ok === false` MUST expose an empty array so the rail self-hides; never throws to the component. |
| Types | Returns `FeaturedDish[]` from `types/content.ts`. |

## Cross-feature composable — `useReservationModal`

**File**: `app/composables/useReservationModal.ts` + `useReservationModal.spec.ts` (cross-feature, Article I — NOT inside a feature folder).

```ts
export function useReservationModal(): {
  isOpen: Ref<boolean>          // useState-backed, shared app-wide
  openReservation: () => void   // sets isOpen = true; no-op-safe with no mounted consumer
  closeReservation: () => void
}
```

### Behavior contract

| Rule | Expectation |
|------|-------------|
| No-op-safe | Calling `openReservation()` with no modal mounted (feature 014 not yet built) MUST NOT error. |
| No cross-feature import | Lives in `app/composables/`; the homepage imports it via `@/composables`. Feature 014 will subscribe to `isOpen`. |
| State | Backed by `useState` so it is SSR-safe and shared across components. |

## Env contract

| Var | Group | Notes |
|-----|-------|-------|
| `WORDPRESS_API_URL` | `WORDPRESS` (Article XIII) | Bare origin `https://cms.sumo.com.mx`. Read via `server/utils/env.ts` Zod schema; consumed by the promotions route only. |

> `DATABASE_URL` is **not consumed by this feature as built** (featured dishes are a static
> fixture). If a real dishes route is added later it would consume `DATABASE_URL` server-side only.

## PromoCard + Lightbox behavior (built)

| Surface | Behavior |
|---------|----------|
| Badge color | From `acf.color` (orange/pink/yellow/blue/green) mapped 1:1 to a `UiSticker` tone; unknown → orange. Independent of `tipo`. |
| Type-indicator bar | Small decorative bar from `acf.tipo`: express→`bg-blue`, ayce→`bg-orange`, all→`bg-ink`. Always rendered. Purely decorative (`aria-hidden`). |
| Validity | Neutral ink text (not accent-colored). |
| Flyer (`acf.imagen`) | NOT shown inline. A promo with a resolved `imageUrl` is interactive (role `button`, tabindex, Enter/Space, hover lift) and emits `open` with `{ src, alt }`; `HomePromotions` opens `UiLightbox`. A promo without a flyer is non-interactive. |
| `UiLightbox` | `app/components/ui/Lightbox.vue`. Teleported `role="dialog" aria-modal`; closes on Esc / backdrop click; focus moves to the close button and restores on close; body scroll locked while open. Shows the flyer `object-contain` at ≤90vw/90vh. |
