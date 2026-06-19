/**
 * Centralized WordPress `promociones` upstream fixtures + mocks.
 *
 * Shape mirrors the LIVE WordPress endpoint
 * (`GET /wp-json/wp/v2/promociones`): top-level WP fields plus an `acf` group
 * holding bilingual `*_es` / `*_en` editorial fields, `tipo`, `color`, `activa`,
 * and `imagen` (a media ID). The promotions Nitro route validates these with
 * Zod, drops `activa === false`, and resolves `acf.imagen` to a URL via
 * `/wp/v2/media/<id>`. Single source of WordPress test data (Gate IV.3).
 */

/** A single raw WordPress promociones item (loosely typed — the route validates). */
export type RawWpPromotion = Record<string, unknown>

/** ACF overrides helper type. */
type AcfOverrides = Partial<Record<string, unknown>>

/** A valid raw promo item with all required fields under `acf`. */
export function makeRawPromotion(
  overrides: Partial<Record<string, unknown>> = {},
  acfOverrides: AcfOverrides = {}
): RawWpPromotion {
  return {
    id: 1,
    date: '2026-06-10T00:00:00Z',
    slug: 'martes-2x1',
    status: 'publish',
    title: { rendered: 'Martes 2x1' },
    featured_media: 0,
    acf: {
      badge_es: '2x1',
      badge_en: '2for1',
      titulo_es: 'Martes 2x1',
      titulo_en: 'Tuesday 2for1',
      descripcion_es: 'Trae a un amigo gratis.',
      descripcion_en: 'Bring a friend for free.',
      vigencia_es: 'Solo martes',
      vigencia_en: 'Tuesdays only',
      color: 'orange',
      tipo: 'ayce',
      activa: true,
      // "Show on homepage" flag (live ACF boolean). Default false; the
      // home-flagged fixtures set this to true explicitly.
      home: false,
      imagen: 0,
      ...acfOverrides,
    },
    ...overrides,
  }
}

/**
 * A mixed valid WordPress response mirroring the live ACF shape: 4 active home
 * promos (sortable by date), one inactive, one express-typed, and one
 * structurally invalid item.
 */
export const VALID_WP_PROMOTIONS: RawWpPromotion[] = [
  makeRawPromotion({ id: 10, date: '2026-06-01T00:00:00Z' }, { tipo: 'all' }),
  makeRawPromotion({ id: 11, date: '2026-06-15T00:00:00Z' }, { tipo: 'ayce' }),
  makeRawPromotion({ id: 12, date: '2026-06-10T00:00:00Z' }, { tipo: 'all' }),
  makeRawPromotion({ id: 13, date: '2026-06-20T00:00:00Z' }, { tipo: 'ayce' }),
  makeRawPromotion({ id: 14, date: '2026-06-18T00:00:00Z' }, { activa: false }),
  makeRawPromotion(
    { id: 15, date: '2026-06-19T00:00:00Z' },
    { tipo: 'express', color: 'blue' }
  ),
  // Invalid item: missing acf entirely and bad color — must be dropped.
  { id: 16, acf: { color: 'rainbow', tipo: 'ayce', activa: true } },
]

/**
 * Home-flagged set returned by the PRIMARY `?activa=1&home=1` query: a small
 * subset of active promos explicitly chosen for the homepage (`acf.home: true`).
 * Two items so the route can still cap/sort; both active.
 */
export const HOME_WP_PROMOTIONS: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 21, date: '2026-06-17T00:00:00Z' },
    { tipo: 'ayce', home: true }
  ),
  makeRawPromotion(
    { id: 22, date: '2026-06-18T00:00:00Z' },
    { tipo: 'all', home: true }
  ),
]

/**
 * The single active promotion that exists upstream today (used to assert the
 * grid still looks correct with exactly one promo). Has a real image media ID.
 */
export const SINGLE_WP_PROMOTION: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 29, date: '2026-06-19T00:00:00Z' },
    { tipo: 'ayce', color: 'orange', imagen: 29, home: true }
  ),
]

/** An empty WordPress response (zero promotions). */
export const EMPTY_WP_PROMOTIONS: RawWpPromotion[] = []

/** A fully invalid (non-array) upstream payload. */
export const MALFORMED_WP_RESPONSE = { error: 'unexpected' }

/** A media attachment response as returned by `/wp/v2/media/<id>`. */
export function makeMediaResponse(
  sourceUrl = 'https://cms.sumo.com.mx/wp-content/uploads/promo.jpg'
): { source_url: string } {
  return { source_url: sourceUrl }
}
