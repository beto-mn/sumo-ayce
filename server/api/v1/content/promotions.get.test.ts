import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_WP_PROMOTIONS,
  HOME_WP_PROMOTIONS,
  MALFORMED_WP_RESPONSE,
  makeMediaResponse,
  SINGLE_WP_PROMOTION,
  VALID_WP_PROMOTIONS,
} from '../../../../tests/mocks/wordpress'

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))

vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return { ...actual, defineEventHandler: (fn: unknown) => fn }
})
vi.mock('../../../utils/env', () => ({
  env: { WORDPRESS_API_URL: 'https://cms.example.test' },
}))

vi.stubGlobal('$fetch', mockFetch)

import handler from './promotions.get'

type Result = { promotions: Array<Record<string, unknown>>; ok: boolean }
const run = () =>
  (handler as unknown as (event: unknown) => Promise<Result>)({} as unknown)

/**
 * Route mock: routes the `promociones` list URL by query —
 * `?…home=1…` → the PRIMARY (home-flagged) list; the plain `?activa=1` (no
 * `home=1`) → the FALLBACK list. Any `/wp/v2/media/<id>` URL returns the media
 * fixture. This mirrors the route's primary→fallback selection, then per-image
 * media resolution.
 *
 * Pass a single list to serve it for the home query (fallback unused unless the
 * home list is empty — then pass `fallback` explicitly).
 */
function mockUpstream(
  home: unknown,
  { fallback = home, media = makeMediaResponse() } = {}
) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/wp-json/wp/v2/media/')) {
      return Promise.resolve(media)
    }
    if (url.includes('home=1')) {
      return Promise.resolve(home)
    }
    return Promise.resolve(fallback)
  })
}

describe('GET /api/v1/content/promotions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the home-flagged promos capped at 3, sorted by date desc', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const res = await run()
    expect(res.ok).toBe(true)
    expect(res.promotions).toHaveLength(3)
    const ids = res.promotions.map(p => p.id)
    // any active type: 13(06-20) > 15-express(06-19) > 11(06-15); inactive(14)
    // excluded; invalid(16) dropped during validation; 12/10 fall outside top 3.
    expect(ids).toEqual(['13', '15', '11'])
  })

  it('returns the PRIMARY home=1 set (capped 3) without a fallback fetch', async () => {
    mockUpstream(HOME_WP_PROMOTIONS)
    const res = await run()
    expect(res.ok).toBe(true)
    // both home-flagged promos, newest first (22:06-18 > 21:06-17).
    expect(res.promotions.map(p => p.id)).toEqual(['22', '21'])
    // only the home=1 query was issued (plus media); no activa=1 fallback.
    const listUrls = mockFetch.mock.calls
      .map(call => String(call[0]))
      .filter(url => url.includes('/wp-json/wp/v2/promociones'))
    expect(listUrls).toHaveLength(1)
    expect(listUrls[0]).toContain('home=1')
  })

  it('FALLS BACK to activa=1 when the home=1 query returns []', async () => {
    mockUpstream(EMPTY_WP_PROMOTIONS, { fallback: VALID_WP_PROMOTIONS })
    const res = await run()
    expect(res.ok).toBe(true)
    // fallback (all active) capped to the 3 newest active.
    expect(res.promotions.map(p => p.id)).toEqual(['13', '15', '11'])
    // both list queries were issued: home=1 (empty) then activa=1 fallback.
    const listUrls = mockFetch.mock.calls
      .map(call => String(call[0]))
      .filter(url => url.includes('/wp-json/wp/v2/promociones'))
    expect(listUrls.some(url => url.includes('home=1'))).toBe(true)
    expect(listUrls.some(url => !url.includes('home=1'))).toBe(true)
  })

  it('returns { promotions: [], ok: false } when both home=1 and activa=1 are empty', async () => {
    mockUpstream(EMPTY_WP_PROMOTIONS, { fallback: EMPTY_WP_PROMOTIONS })
    const res = await run()
    expect(res).toEqual({ promotions: [], ok: false })
  })

  it('never includes inactive promotions but does include active express', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const res = await run()
    const promos = res.promotions as Array<{ active: boolean; type: string }>
    expect(promos.every(p => p.active)).toBe(true)
    // express(15) is active and recent enough to appear in the top 3.
    expect(promos.some(p => p.type === 'express')).toBe(true)
  })

  it('drops individually invalid items but keeps the valid ones', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const res = await run()
    const ids = res.promotions.map(p => p.id)
    expect(ids).not.toContain('16')
  })

  it('maps the bilingual ACF fields into { es, en } view shapes', async () => {
    mockUpstream(SINGLE_WP_PROMOTION)
    const res = await run()
    expect(res.promotions).toHaveLength(1)
    const promo = res.promotions[0] as {
      title: { es: string; en: string }
      badge: { es: string; en: string }
      validity: { es: string; en: string }
      type: string
      color: string
    }
    expect(promo.title).toEqual({ es: 'Martes 2x1', en: 'Tuesday 2for1' })
    expect(promo.badge).toEqual({ es: '2x1', en: '2for1' })
    expect(promo.validity).toEqual({ es: 'Solo martes', en: 'Tuesdays only' })
    expect(promo.type).toBe('ayce')
    expect(promo.color).toBe('orange')
  })

  it('resolves acf.imagen media ID to a source_url', async () => {
    mockUpstream(SINGLE_WP_PROMOTION)
    const res = await run()
    expect(res.promotions[0]?.imageUrl).toBe(
      'https://cms.sumo.com.mx/wp-content/uploads/promo.jpg'
    )
  })

  it('degrades to imageUrl=null when media resolution fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/wp-json/wp/v2/media/')) {
        return Promise.reject(new Error('404 not found'))
      }
      return Promise.resolve(SINGLE_WP_PROMOTION)
    })
    const res = await run()
    expect(res.ok).toBe(true)
    expect(res.promotions[0]?.imageUrl).toBeNull()
  })

  it('uses imageUrl=null without a media fetch when no image is attached', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const res = await run()
    expect(res.promotions.every(p => p.imageUrl === null)).toBe(true)
  })

  it('returns { promotions: [], ok: false } and HTTP 200 on upstream failure', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED secret-host'))
    const res = await run()
    expect(res).toEqual({ promotions: [], ok: false })
  })

  it('never leaks the upstream error body on failure', async () => {
    mockFetch.mockRejectedValue(new Error('500 internal: db password leaked'))
    const res = await run()
    expect(JSON.stringify(res)).not.toContain('password')
  })

  it('requests the pretty-permalink PRIMARY URL with activa=1&home=1&per_page=100', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    await run()
    const listUrl = mockFetch.mock.calls
      .map(call => String(call[0]))
      .find(url => url.includes('/wp-json/wp/v2/promociones'))
    expect(listUrl).toBe(
      'https://cms.example.test/wp-json/wp/v2/promociones?activa=1&home=1&per_page=100'
    )
    expect(listUrl).not.toContain('rest_route')
  })

  it('requests the pretty-permalink FALLBACK URL with activa=1&per_page=100', async () => {
    mockUpstream(EMPTY_WP_PROMOTIONS, { fallback: VALID_WP_PROMOTIONS })
    await run()
    const fallbackUrl = mockFetch.mock.calls
      .map(call => String(call[0]))
      .find(
        url =>
          url.includes('/wp-json/wp/v2/promociones') && !url.includes('home=1')
      )
    expect(fallbackUrl).toBe(
      'https://cms.example.test/wp-json/wp/v2/promociones?activa=1&per_page=100'
    )
    expect(fallbackUrl).not.toContain('rest_route')
  })

  it('resolves media via the pretty-permalink media URL', async () => {
    mockUpstream(SINGLE_WP_PROMOTION)
    await run()
    const mediaCall = mockFetch.mock.calls
      .map(call => String(call[0]))
      .find(url => url.includes('/wp/v2/media/'))
    expect(mediaCall).toBe('https://cms.example.test/wp-json/wp/v2/media/29')
    expect(mediaCall).not.toContain('rest_route')
  })

  it('returns { promotions: [], ok: false } for a malformed (non-array) payload', async () => {
    // A non-array payload parses to [] for BOTH the primary and the fallback
    // (the fallback is served the same malformed body), so the section hides.
    mockUpstream(MALFORMED_WP_RESPONSE)
    const res = await run()
    expect(res).toEqual({ promotions: [], ok: false })
  })
})
