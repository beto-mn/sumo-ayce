/**
 * Centralized WordPress `promociones` upstream fixtures + mocks (NEW model).
 *
 * Shape mirrors the LIVE WordPress endpoint
 * (`GET /wp-json/wp/v2/promociones`): top-level WP fields (including
 * `title.rendered`, the source of the promo title) plus an `acf` group holding
 * `badge_es`/`badge_en`, `color`, `tipo`, `activa`, `home`, and three responsive
 * image media IDs (`imagen_desktop`/`imagen_tablet`/`imagen_movil`). The
 * promotions Nitro route validates these with Zod, drops `activa === false`,
 * HTML-entity-decodes the title, and resolves each media ID to a URL via
 * `/wp/v2/media/<id>` (desktop fallback). Single source of WordPress test data
 * (Gate IV.3).
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
      color: 'orange',
      tipo: 'ayce',
      activa: true,
      // "Show on homepage" flag (live ACF boolean). Default false; the
      // home-flagged fixtures set this to true explicitly.
      home: false,
      // Three responsive image media IDs. Default 0 (none) → no image resolved.
      imagen_desktop: 0,
      imagen_tablet: 0,
      imagen_movil: 0,
      ...acfOverrides,
    },
    ...overrides,
  }
}

/**
 * A mixed valid WordPress response mirroring the live ACF shape: active promos
 * (sortable by date), one inactive, one express-typed, and one structurally
 * invalid item. Active items carry a desktop image (`imagen_desktop = id`) so
 * they survive the image-only-carousel filter; the resolver in the tests maps
 * `/media/<id>` → a URL.
 */
export const VALID_WP_PROMOTIONS: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 10, date: '2026-06-01T00:00:00Z' },
    { tipo: 'all', imagen_desktop: 10 }
  ),
  makeRawPromotion(
    { id: 11, date: '2026-06-15T00:00:00Z' },
    { tipo: 'ayce', imagen_desktop: 11 }
  ),
  makeRawPromotion(
    { id: 12, date: '2026-06-10T00:00:00Z' },
    { tipo: 'all', imagen_desktop: 12 }
  ),
  makeRawPromotion(
    { id: 13, date: '2026-06-20T00:00:00Z' },
    { tipo: 'ayce', imagen_desktop: 13 }
  ),
  makeRawPromotion({ id: 14, date: '2026-06-18T00:00:00Z' }, { activa: false }),
  makeRawPromotion(
    { id: 15, date: '2026-06-19T00:00:00Z' },
    { tipo: 'express', color: 'blue', imagen_desktop: 15 }
  ),
  // Invalid item: missing acf entirely and bad tipo — must be dropped.
  { id: 16, acf: { color: 'rainbow', tipo: 'rainbow', activa: true } },
]

/**
 * Home-flagged set returned by the PRIMARY `?activa=1&home=1` query: a small
 * subset of active promos explicitly chosen for the homepage (`acf.home: true`).
 * Both carry a desktop image so they survive the image-only-carousel filter.
 */
export const HOME_WP_PROMOTIONS: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 21, date: '2026-06-17T00:00:00Z' },
    { tipo: 'ayce', home: true, imagen_desktop: 21 }
  ),
  makeRawPromotion(
    { id: 22, date: '2026-06-18T00:00:00Z' },
    { tipo: 'all', home: true, imagen_desktop: 22 }
  ),
]

/**
 * Home-flagged set with NO images at all — every promo has null image fields.
 * Used to assert the image-only carousel filter excludes them (surface hides).
 */
export const HOME_WP_PROMOTIONS_NO_IMAGES: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 41, date: '2026-06-17T00:00:00Z' },
    { tipo: 'ayce', home: true, imagen_desktop: null }
  ),
  makeRawPromotion(
    { id: 42, date: '2026-06-18T00:00:00Z' },
    { tipo: 'all', home: true, imagen_desktop: null }
  ),
]

/**
 * A single active promotion with all three image IDs pointing at the SAME media
 * ID (the current placeholder situation) — used to assert the dedup/fallback
 * resolves all three sizes to the desktop URL with a single media fetch.
 */
export const SINGLE_WP_PROMOTION: RawWpPromotion[] = [
  makeRawPromotion(
    {
      id: 29,
      date: '2026-06-19T00:00:00Z',
      title: { rendered: '2&#215;1 en sushi' },
    },
    {
      tipo: 'ayce',
      color: 'orange',
      home: true,
      imagen_desktop: 29,
      imagen_tablet: 29,
      imagen_movil: 29,
    }
  ),
]

/**
 * A single active promotion with three DISTINCT image media IDs — used to
 * assert each responsive size resolves independently.
 */
export const DISTINCT_IMAGES_WP_PROMOTION: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 30, date: '2026-06-19T00:00:00Z' },
    {
      tipo: 'ayce',
      imagen_desktop: 100,
      imagen_tablet: 200,
      imagen_movil: 300,
    }
  ),
]

/**
 * Two active promos: one WITH an image, one whose three image fields are `null`
 * (editor hasn't uploaded artwork yet). Mirrors the live regression (ids 58/59).
 * The imageless one must PARSE but then be excluded from the resolved list —
 * quietly, with no per-promo warning.
 */
export const MIXED_IMAGE_WP_PROMOTIONS: RawWpPromotion[] = [
  makeRawPromotion(
    { id: 60, date: '2026-07-10T00:00:00Z', slug: 'has-image' },
    { tipo: 'ayce', home: true, imagen_desktop: 60 }
  ),
  makeRawPromotion(
    { id: 58, date: '2026-07-11T00:00:00Z', slug: 'eat-drink' },
    {
      tipo: 'all',
      home: true,
      imagen_desktop: null,
      imagen_tablet: null,
      imagen_movil: null,
    }
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

/**
 * Parse the `include=<csv>` param from a batched `/wp/v2/media?include=…` URL
 * and return one `{ id, source_url }` item per requested ID, mapping each ID to
 * a deterministic per-ID URL (`https://cdn.test/media/<id>.jpg`). Mirrors the
 * WordPress media collection endpoint the route now uses.
 */
export function makeMediaBatchResponse(
  url: string
): Array<{ id: number; source_url: string }> {
  const include = new URL(url).searchParams.get('include') ?? ''
  return include
    .split(',')
    .map(part => Number(part))
    .filter(id => Number.isFinite(id) && id > 0)
    .map(id => ({ id, source_url: `https://cdn.test/media/${id}.jpg` }))
}
