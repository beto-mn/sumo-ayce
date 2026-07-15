import { defineEventHandler, getQuery } from 'h3'
import type { Promotion, PromotionsResult } from '@/types/content'
import { env } from '../../../utils/env'
import { ExternalServiceError, handleError } from '../../../utils/error-handler'
import { logger } from '../../../utils/logger'
import { type ParsedPromotion, parsePromotions } from './validators'

/**
 * All-active query (pretty-permalink form). BOTH the homepage and the
 * promotions page (`?all=1`) use this: `?activa=1` returns every active promo
 * with its CURRENT media IDs. The former `home=1`-flagged primary query was
 * removed — no promo is home-flagged and WordPress served a STALE/broken cache
 * for that filter (old deleted media IDs), so unifying on `activa=1` keeps the
 * two surfaces consistent and correct. Home-flag curation, if wanted later, is
 * a separate feature once the WP caching is sorted.
 */
const activePromocionesUrl = () =>
  `${env.WORDPRESS_API_URL}/wp-json/wp/v2/promociones?activa=1&per_page=100`
/**
 * Batched media query: resolve MANY attachment IDs in ONE request via the WP
 * `include` param, instead of one `/media/{id}` request per image. This turns
 * ~15 fragile parallel calls (3 per promo × 5) into a single reliable call.
 */
const mediaBatchUrl = (ids: number[]) =>
  `${env.WORDPRESS_API_URL}/wp-json/wp/v2/media?include=${ids.join(',')}&per_page=100`

/**
 * Per-request timeouts (ms) for the WordPress fetches. These bound the
 * WordPress dependency so the ISR/SSR render degrades gracefully instead of
 * blocking if WordPress is slow or unreachable. The media batch gets a larger
 * budget than a single item since it returns every image at once.
 */
const LIST_FETCH_TIMEOUT_MS = 4000
const MEDIA_FETCH_TIMEOUT_MS = 6000

/** Sort ACTIVE promos of any `tipo` most-recent-first (no cap). */
function sortActiveNewest(promotions: ParsedPromotion[]): ParsedPromotion[] {
  return promotions
    .filter(p => p.active)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}

/** A single WP media item from the batch endpoint. */
interface WpMediaItem {
  id?: unknown
  source_url?: unknown
}

/**
 * Resolve every distinct media ID referenced by the parsed promos in ONE
 * batched WP request → a `Map<id, source_url>`. On any transient failure the
 * map is empty (logged at WARN, never ERROR) and callers degrade gracefully.
 */
async function resolveMediaMap(
  parsed: ParsedPromotion[]
): Promise<Map<number, string>> {
  const ids = collectMediaIds(parsed)
  const map = new Map<number, string>()
  if (ids.length === 0) return map
  try {
    const items = await $fetch<WpMediaItem[]>(mediaBatchUrl(ids), {
      timeout: MEDIA_FETCH_TIMEOUT_MS,
    })
    if (Array.isArray(items)) {
      for (const item of items) {
        if (
          typeof item?.id === 'number' &&
          typeof item.source_url === 'string'
        ) {
          map.set(item.id, item.source_url)
        }
      }
    }
  } catch (error) {
    // Transient media unavailability: log at WARN and return an empty map so
    // the promos still render (image-less) rather than the whole call failing.
    logger.warn(
      { err: error, count: ids.length },
      '[promotions] media batch fetch failed'
    )
  }
  return map
}

/** Distinct positive media IDs across desktop/tablet/mobile of all promos. */
function collectMediaIds(parsed: ParsedPromotion[]): number[] {
  const set = new Set<number>()
  for (const promo of parsed) {
    for (const id of [
      promo.desktopMediaId,
      promo.tabletMediaId,
      promo.movilMediaId,
    ]) {
      if (id !== null) set.add(id)
    }
  }
  return [...set]
}

/**
 * Build the final `Promotion` from a parsed promo + the resolved media map.
 * Each size falls back to the desktop URL when its own ID is null/unresolved;
 * desktop itself falls back to whichever size DID resolve, so a promo with any
 * resolvable image still renders full-bleed.
 */
function projectPromotion(
  parsed: ParsedPromotion,
  media: Map<number, string>
): Promotion {
  const { desktopMediaId, tabletMediaId, movilMediaId, ...rest } = parsed
  const urlOf = (id: number | null) =>
    id === null ? null : (media.get(id) ?? null)

  const desktop = urlOf(desktopMediaId)
  const tablet = urlOf(tabletMediaId)
  const movil = urlOf(movilMediaId)
  // Baseline: prefer the desktop image, else any size that DID resolve.
  const baseline = desktop ?? tablet ?? movil

  return {
    ...rest,
    imageDesktopUrl: desktop ?? baseline,
    imageTabletUrl: tablet ?? baseline,
    imageMovilUrl: movil ?? baseline,
  }
}

/**
 * Resolve images for all promos via a single batched media fetch, then keep
 * every promo that HAS at least one configured image media ID. A promo is only
 * dropped when it has NO media IDs at all (nothing to show in an image-only
 * carousel) — NOT merely because a fetch timed out. Skips are quiet (one debug
 * line), never a per-promo warning.
 */
async function resolveImages(parsed: ParsedPromotion[]): Promise<Promotion[]> {
  const hasConfiguredImage = (p: ParsedPromotion) =>
    p.desktopMediaId !== null ||
    p.tabletMediaId !== null ||
    p.movilMediaId !== null
  const withIds = parsed.filter(hasConfiguredImage)
  const skipped = parsed.length - withIds.length
  if (skipped > 0) {
    logger.debug(
      { skipped, kept: withIds.length },
      '[promotions] skipped promos with no configured image'
    )
  }
  const media = await resolveMediaMap(withIds)
  return withIds.map(promo => projectPromotion(promo, media))
}

/**
 * GET /api/v1/content/promotions — select promotions from the live WordPress
 * `promociones` endpoint, validate the ACF shape, and resolve each promotion's
 * three responsive image media IDs (desktop/tablet/mobile) to URLs via a SINGLE
 * batched media request. Every returned promo occupies a full-bleed carousel
 * slide, so promos are ordered newest-first with NO cap on either surface.
 *
 * BOTH surfaces use the SAME `?activa=1` query (all active, newest-first, no
 * cap) so the homepage and the promotions page render an identical full-bleed
 * carousel. The `?all=1` flag is retained only to distinguish the two callers.
 *
 * Always HTTP 200: on any upstream failure it logs an `ExternalServiceError`
 * (WARN via the error handler) and returns `{ promotions: [], ok: false }` so
 * the surface degrades gracefully.
 */
export default defineEventHandler(async (event): Promise<PromotionsResult> => {
  const { all } = getQuery(event)
  const source =
    all === '1' ? 'WordPress promociones (all)' : 'WordPress promociones'

  try {
    const payload = await $fetch<unknown>(activePromocionesUrl(), {
      timeout: LIST_FETCH_TIMEOUT_MS,
    })
    const parsed = sortActiveNewest(parsePromotions(payload))
    if (parsed.length === 0) return { promotions: [], ok: false }
    const promotions = await resolveImages(parsed)
    return { promotions, ok: true }
  } catch (error) {
    handleError(new ExternalServiceError(source, error))
    return { promotions: [], ok: false }
  }
})
