/**
 * Shared content view types for the homepage and future content surfaces.
 *
 * These are the normalized shapes the Vue components and homepage composables
 * see. The promotions Nitro route maps WordPress `promociones` → `Promotion`;
 * the reviews fixture is authored directly as `Review[]`. Featured dishes are
 * normally mapped from a real data source later; for now they are provided by a
 * static fixture matching this `FeaturedDish` contract.
 */

/** A bilingual string pair; render the active locale, fall back to `es`. */
export interface Bilingual {
  es: string
  en: string
}

export type SumoType = 'all' | 'ayce' | 'express'

/** Featured dish/drink shown in the homepage rail. */
export interface FeaturedDish {
  id: string
  name: string
  description: Bilingual
  imageUrl: string | null // null → component renders a neutral placeholder
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
  color: 'orange' | 'pink' | 'blue' | 'yellow' | 'green'
  type: SumoType
  active: boolean
  publishedAt: string // ISO date — used for "top 3" ordering
  imageUrl: string | null // resolved from the `acf.imagen` media ID; null → no image
}

/** Google review from a static/hardcoded fixture committed in the repo. */
export interface Review {
  id: string
  authorName: string
  rating: number // 1–5
  text: Bilingual // ES original; EN may equal ES if untranslated
  source: 'google'
  reviewedAt: string | null
}

/** The aggregate the homepage renders, sourced from three places. */
export interface HomeContent {
  featuredDishes: FeaturedDish[] // [] → rail hides
  promotions: Promotion[] // already filtered+sorted to ≤ 3 active home promos
  reviews: Review[] // static fixture; always present
}

/** Dishes route/composable result — graceful-degradation state for the rail. */
export interface FeaturedDishesResult {
  dishes: FeaturedDish[] // empty on DB/route failure
  ok: boolean // false when the read failed
}

/** Promotions route result — graceful-degradation state for the WP section. */
export interface PromotionsResult {
  promotions: Promotion[] // empty on upstream failure; already ≤ 3, sorted
  ok: boolean // false when WordPress was unreachable/invalid
}

/** Hero price, configurable without code change. Default "$269". */
export interface HeroConfig {
  price: string // e.g. "$269"
}
