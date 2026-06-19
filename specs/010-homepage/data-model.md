# Phase 1 Data Model: Homepage (`/`)

The homepage adds **no new persistent storage** of its own, but it reads from three sources (built state, reconciled 2026-06-20):

1. **Promotions** — from the WordPress `promociones` endpoint (read-only), validated and normalized by a Nitro content route. The page's only live network dependency.
2. **Featured dishes / drinks** — from a **static fixture** committed in the repo (`app/features/homepage/data/featured-dishes.ts`), consumed via `useFeaturedDishes` (route-compatible shape, swappable later). NO DB/Drizzle/Neon read in this feature.
3. **Reviews** — a static/hardcoded fixture committed in the repo (no fetch, no DB, no WordPress).

This document defines the **normalized view types** the page works with (shared in `types/content.ts`), the **WordPress upstream shape** (promotions) the content route validates, and the **static fixtures** (featured dishes + reviews).

## 1. Normalized view types (shared — `types/content.ts`)

These are the only shapes the Vue components and the homepage composables see. The content Nitro route maps WordPress `promociones` → `Promotion`; the featured-dishes and reviews fixtures are authored directly as `FeaturedDish[]` / `Review[]`.

```ts
/** A bilingual string pair; render the active locale, fall back to `es`. */
export interface Bilingual {
  es: string
  en: string
}

export type SumoType = 'all' | 'ayce' | 'express'

/** Featured dish/drink shown in the homepage rail (from a static fixture). */
export interface FeaturedDish {
  id: string
  name: string
  description: Bilingual
  imageUrl: string | null      // null → component renders a neutral "SUMO" placeholder
  badge: string | null
  category: string
}

/** Promotion (WordPress `promociones` endpoint). */
export interface Promotion {
  id: string
  badge: Bilingual
  title: Bilingual
  description: Bilingual
  validity: Bilingual
  color: 'orange' | 'pink' | 'blue' | 'yellow' | 'green'   // editor-set acf.color (default orange)
  type: SumoType                // acf.tipo — drives the decorative type-bar
  active: boolean
  publishedAt: string          // ISO date — used for "newest 3" ordering
  imageUrl: string | null      // flyer resolved from acf.imagen media ID; null → non-interactive card
}

/** Google review from a static/hardcoded fixture committed in the repo (swappable later). */
export interface Review {
  id: string
  authorName: string
  rating: number               // 1–5
  text: Bilingual              // ES original; EN may equal ES if untranslated
  source: 'google'
  reviewedAt: string | null
}

/** The aggregate the homepage renders, sourced from three places. */
export interface HomeContent {
  featuredDishes: FeaturedDish[]   // static fixture; [] → rail hides
  promotions: Promotion[]          // from WordPress; already selected+sorted to ≤ 3 active home promos
  reviews: Review[]                // static fixture; always present
}

/**
 * Dishes result — graceful-degradation state for the rail. As built it is produced
 * by `useFeaturedDishes` from the static fixture (`ok` always true). The shape is
 * kept route-compatible so a future `GET /api/v1/content/featured-dishes` is drop-in.
 */
export interface FeaturedDishesResult {
  dishes: FeaturedDish[]           // empty → rail hides
  ok: boolean                      // false reserved for a future route failure
}

/**
 * Promotions route result — graceful-degradation state for the WordPress-backed section.
 * Returned by `GET /api/v1/content/promotions`.
 */
export interface PromotionsResult {
  promotions: Promotion[]          // empty on upstream failure; already ≤ 3, filtered+sorted
  ok: boolean                      // false when WordPress was unreachable/invalid
}
```

### Configuration (not from WordPress)

```ts
/** Hero price, configurable without code change (env/runtime config). Default "$269". */
export interface HeroConfig {
  price: string // e.g. "$269"
}
```

## 2. Source shapes & mapping

### 2a. WordPress `promociones` — validated in `server/api/v1/content/validators.ts`

The promotions Nitro route validates the WordPress response with Zod before mapping. Unknown/extra fields are ignored; required fields missing → that item is dropped (not the whole response).

| View type | WordPress source (`acf.*`) | Key fields consumed |
|-----------|------------------|---------------------|
| `Promotion` | `promociones` endpoint, server-side filtered via `?activa=1` (+ `?home=1`) | `id`, `date` (ordering), `badge_{es,en}`, `titulo_{es,en}`, `descripcion_{es,en}`, `vigencia_{es,en}`, `color`, `tipo`, `activa`, `home` (query only), `imagen` (media ID → `imageUrl`) |

`acf.imagen` is a media **ID**; the route resolves it to a `source_url` via `GET /wp-json/wp/v2/media/{id}` (null on failure). The raw upstream shape is typed in `types/wordpress.ts`; runtime validation is the Zod schema in `validators.ts`.

### 2b. Featured dishes — static fixture (as built, no DB)

Featured dishes/drinks are authored directly as a typed `FeaturedDish[]` constant in `app/features/homepage/data/featured-dishes.ts` and exposed by `useFeaturedDishes()`. There is **no** DB read and **no** Drizzle/Neon import anywhere for this feature. The fixture + composable carry a `// TODO:` marker; the `{ dishes, ok, pending }` contract is route-compatible so a future real data source (e.g. a Nitro route) is a drop-in swap. Current fixture entries have `imageUrl: null`.

| View type | Source | Fields |
|-----------|-----------|---------------|
| `FeaturedDish` | static fixture | `id`, `name`, bilingual `description`, `imageUrl` (nullable; null in current fixture), `badge` (nullable), `category` |

### 2c. Reviews — static fixture (no validation route)

`Review[]` is authored directly as a committed constant or local JSON (e.g. `app/features/homepage/data/reviews.ts` / `reviews.json`). It is typed against the `Review` interface so a future feature can swap the fixture for a fetched source without changing the reviews component contract.

## 3. Derivation rules

- **Promotions selection** (in `promotions.get.ts`): two-step — PRIMARY `?activa=1&home=1&per_page=100` capped to the 3 newest (publish-date desc); FALLBACK `?activa=1&per_page=100` capped to 3 newest only if PRIMARY is empty; both empty → section hides. Any `tipo` admitted.
- **Promotions defensive pass** (`select-promotions.ts`, pure, page-side): `promotions.filter(p => p.active).sort(byPublishedAtDesc).slice(0, 3)` — stays correct even though the route already selected/sorted/sliced.
- **Featured dishes**: rendered as-is from the static fixture (preserve order); `[]` → rail hidden.
- **Reviews**: rendered as-is from the static fixture; always present.
- **Bilingual fallback**: when the active locale string is empty/missing, render `es`.
- **Image fallback**: dish `imageUrl === null` → neutral "SUMO" placeholder; promo without a resolved flyer → non-interactive text card; never a broken `<img>`.

## 4. State & lifecycle

- **Promotions fetch**: `usePromotions` → `useFetch('/api/v1/content/promotions')` at server render / ISR revalidation. Re-fetched at most once per 3600s window (ISR). The route's WordPress fetches are time-bounded (4s list / 3s media).
- **Featured dishes**: `useFeaturedDishes` reads the static fixture synchronously (`ok` always true, `pending` always false); no fetch, no DB.
- **Reviews**: imported synchronously from the static fixture; no fetch, no pending state.
- **Degradation**: on WordPress failure/timeout the promotions route returns `{ promotions: [], ok: false }` (HTTP 200; the error is logged via `error-handler.ts` as `ExternalServiceError`, never leaked); the promotions section hides when its array is empty. Static sections (hero, type selector, featured dishes, reviews, branches CTA) are unaffected.
- **Client-side reactive state**: `useReservationModal` exposes `isOpen` (`useState<boolean>`); `openReservation()` sets it true. No persistence.

## 5. Relationships

```
FeaturedDishesResult
└── FeaturedDish[]   (rail)        ← static fixture committed in repo (swappable later)

PromotionsResult
└── Promotion[]      (≤3 cards)    ← WordPress `promociones` endpoint (active, home-flagged → active fallback)

Review[]             (social proof)← static fixture committed in repo (swappable later)

HeroConfig (price)       ← useHeroConfig (config-driven), NOT WordPress
useReservationModal.isOpen ← client state (wired in SiteHeader), consumed later by feature 014
```

No database access at all in this feature — no Drizzle/Neon import, no schema, no writes, no migrations. The only live read is the WordPress promotions REST endpoint.
