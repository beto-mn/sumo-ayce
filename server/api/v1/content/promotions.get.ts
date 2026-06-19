import { defineEventHandler } from 'h3'
import type { Promotion, PromotionsResult } from '@/types/content'
import { env } from '../../../utils/env'
import { ExternalServiceError, handleError } from '../../../utils/error-handler'
import { type ParsedPromotion, parsePromotions } from './validators'

/** Max promotions rendered in the homepage section. */
const HOME_PROMOTIONS_LIMIT = 3

/**
 * Primary homepage query (pretty-permalink form): active promos explicitly
 * flagged for the home (`acf.home === true`). WordPress filters server-side via
 * `activa=1` + `home=1`; `per_page=100` is a safe upper bound (the flagged set
 * is small) — we still cap to {@link HOME_PROMOTIONS_LIMIT} newest in code, as
 * the query does NOT guarantee ≤3.
 */
const homePromocionesUrl = () =>
  `${env.WORDPRESS_API_URL}/wp-json/wp/v2/promociones?activa=1&home=1&per_page=100`
/**
 * Fallback query (pretty-permalink form): all active promos regardless of the
 * home flag. Used only when the primary `home=1` query returns ZERO promos, so
 * the section still shows something. Same `per_page=100` + in-code cap.
 */
const activePromocionesUrl = () =>
  `${env.WORDPRESS_API_URL}/wp-json/wp/v2/promociones?activa=1&per_page=100`
/** WordPress REST URL for a single media attachment (pretty-permalink form). */
const mediaUrl = (id: number) =>
  `${env.WORDPRESS_API_URL}/wp-json/wp/v2/media/${id}`

/**
 * Per-request timeouts (ms) for the WordPress fetches. These bound the
 * WordPress dependency so the ISR/SSR render degrades gracefully (empty promos
 * / no image) instead of blocking if WordPress is slow or unreachable.
 */
const LIST_FETCH_TIMEOUT_MS = 4000
const MEDIA_FETCH_TIMEOUT_MS = 3000

/**
 * Cap a parsed list to the {@link HOME_PROMOTIONS_LIMIT} newest ACTIVE promos
 * of any `tipo` (`all`/`ayce`/`express`), most-recent first. The `?activa=1`
 * query already filters server-side, but the `p.active` filter is kept as a
 * defensive guard in case the query semantics ever change. Express promos are
 * included too — the card color-codes them.
 */
function capActiveNewest(promotions: ParsedPromotion[]): ParsedPromotion[] {
  return promotions
    .filter(p => p.active)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, HOME_PROMOTIONS_LIMIT)
}

/**
 * Resolve a WordPress media ID to its `source_url`. Returns null on any failure
 * so an individual card degrades gracefully (renders without an image) rather
 * than failing the whole response.
 */
async function resolveMediaUrl(id: number): Promise<string | null> {
  try {
    const media = await $fetch<{ source_url?: unknown }>(mediaUrl(id), {
      timeout: MEDIA_FETCH_TIMEOUT_MS,
    })
    return typeof media?.source_url === 'string' ? media.source_url : null
  } catch {
    return null
  }
}

/** Resolve image media IDs (in parallel) and produce final `Promotion[]`. */
async function resolveImages(parsed: ParsedPromotion[]): Promise<Promotion[]> {
  return Promise.all(
    parsed.map(async ({ imageMediaId, ...rest }): Promise<Promotion> => {
      const imageUrl =
        imageMediaId === null ? null : await resolveMediaUrl(imageMediaId)
      return { ...rest, imageUrl }
    })
  )
}

/**
 * GET /api/v1/content/promotions — select the homepage promotions from the live
 * WordPress `promociones` endpoint (primary → fallback), validate the ACF shape,
 * resolve each `acf.imagen` media ID to an image URL, and return them.
 *
 * Selection logic (both queries capped to the 3 newest active in code):
 *   1. PRIMARY — `?activa=1&home=1`: active promos flagged for the home.
 *   2. FALLBACK — `?activa=1`: if the primary yields ZERO promos, fall back to
 *      all active promos so the section still shows something.
 *   3. If the fallback is ALSO empty → `{ promotions: [], ok: false }` (section
 *      self-hides).
 *
 * The fallback fires only when the primary returns an EMPTY array. A thrown /
 * timed-out primary skips the fallback and hits the outer catch instead.
 *
 * Always HTTP 200: on any upstream failure it logs an `ExternalServiceError` and
 * returns `{ promotions: [], ok: false }` so the section degrades gracefully
 * without leaking the upstream error.
 */
export default defineEventHandler(async (): Promise<PromotionsResult> => {
  try {
    const homePayload = await $fetch<unknown>(homePromocionesUrl(), {
      timeout: LIST_FETCH_TIMEOUT_MS,
    })
    let selected = capActiveNewest(parsePromotions(homePayload))
    // Fallback: only when the home-flagged query returned NOTHING.
    if (selected.length === 0) {
      const activePayload = await $fetch<unknown>(activePromocionesUrl(), {
        timeout: LIST_FETCH_TIMEOUT_MS,
      })
      selected = capActiveNewest(parsePromotions(activePayload))
    }
    if (selected.length === 0) return { promotions: [], ok: false }
    const promotions = await resolveImages(selected)
    return { promotions, ok: true }
  } catch (error) {
    handleError(new ExternalServiceError('WordPress promociones', error))
    return { promotions: [], ok: false }
  }
})
