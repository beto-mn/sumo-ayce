import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DISTINCT_IMAGES_WP_PROMOTION,
  EMPTY_WP_PROMOTIONS,
  HOME_WP_PROMOTIONS,
  HOME_WP_PROMOTIONS_NO_IMAGES,
  MALFORMED_WP_RESPONSE,
  MIXED_IMAGE_WP_PROMOTIONS,
  makeMediaBatchResponse,
  SINGLE_WP_PROMOTION,
  VALID_WP_PROMOTIONS,
} from '../../../../tests/mocks/wordpress'
import { logger } from '../../../utils/logger'

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))

vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    getQuery: (event: { _query?: Record<string, string> }) =>
      event._query ?? {},
  }
})
vi.mock('../../../utils/env', () => ({
  env: { WORDPRESS_API_URL: 'https://cms.example.test' },
}))

vi.stubGlobal('$fetch', mockFetch)

import handler from './promotions.get'

type Result = { promotions: Array<Record<string, unknown>>; ok: boolean }
const run = (query: Record<string, string> = {}) =>
  (handler as unknown as (event: unknown) => Promise<Result>)({
    _query: query,
  } as unknown)

const runAll = () => run({ all: '1' })

/** True for the batched media collection URL (`/wp/v2/media?include=…`). */
const isMediaBatch = (url: string) => url.includes('/wp/v2/media?include=')

/**
 * Route mock: serves the single `?activa=1` promociones list (both surfaces use
 * it now — the `home=1` primary was removed) and the batched media collection
 * URL. Each requested media ID maps to a deterministic per-ID URL.
 */
function mockUpstream(list: unknown) {
  mockFetch.mockImplementation((url: string) => {
    if (isMediaBatch(url)) {
      return Promise.resolve(makeMediaBatchResponse(url))
    }
    return Promise.resolve(list)
  })
}

describe('GET /api/v1/content/promotions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ALL active promos (no cap), sorted by date desc — same as ?all=1', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const res = await run()
    expect(res.ok).toBe(true)
    // All 5 active image-bearing promos (10,11,12,13,15); inactive 14 + invalid
    // 16 excluded. Newest-first: 13(06-20) 15(06-19) 11(06-15) 12(06-10) 10(06-01).
    expect(res.promotions.map(p => p.id)).toEqual([
      '13',
      '15',
      '11',
      '12',
      '10',
    ])
  })

  it('queries ONLY the activa=1 list — never the stale home=1 filter', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    await run()
    const listUrls = mockFetch.mock.calls
      .map(call => String(call[0]))
      .filter(url => url.includes('/wp-json/wp/v2/promociones'))
    expect(listUrls).toHaveLength(1)
    expect(listUrls[0]).not.toContain('home=1')
    expect(listUrls[0]).toContain('activa=1')
  })

  it('returns { promotions: [], ok: false } when the activa=1 list is empty', async () => {
    mockUpstream(EMPTY_WP_PROMOTIONS)
    expect(await run()).toEqual({ promotions: [], ok: false })
  })

  it('never includes inactive promotions but does include active express', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const promos = (await run()).promotions as Array<{
      active: boolean
      type: string
    }>
    expect(promos.every(p => p.active)).toBe(true)
    expect(promos.some(p => p.type === 'express')).toBe(true)
  })

  it('drops individually invalid items but keeps the valid ones', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    const ids = (await run()).promotions.map(p => p.id)
    expect(ids).not.toContain('16')
  })

  it('projects badge {es,en}, decoded title string, type and color', async () => {
    mockUpstream(SINGLE_WP_PROMOTION)
    const res = await run()
    expect(res.promotions).toHaveLength(1)
    const promo = res.promotions[0] as {
      title: string
      badge: { es: string; en: string }
      type: string
      color: string
    }
    expect(promo.title).toBe('2×1 en sushi')
    expect(promo.badge).toEqual({ es: '2x1', en: '2for1' })
    expect(promo.type).toBe('ayce')
    expect(promo.color).toBe('orange')
  })

  // ── Batched media resolution ────────────────────────────────────────────────

  it('resolves all media in a SINGLE batched request (not one per image)', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    await run()
    const mediaCalls = mockFetch.mock.calls
      .map(call => String(call[0]))
      .filter(url => url.includes('/wp/v2/media'))
    expect(mediaCalls).toHaveLength(1)
    expect(mediaCalls[0]).toContain('/wp/v2/media?include=')
    expect(mediaCalls[0]).toContain('per_page=100')
    // No per-item /media/<id> requests.
    expect(mediaCalls[0]).not.toMatch(/\/media\/\d+/)
  })

  it('resolves three distinct media IDs to three distinct URLs', async () => {
    mockUpstream(DISTINCT_IMAGES_WP_PROMOTION)
    const promo = (await run()).promotions[0] as {
      imageDesktopUrl: string
      imageTabletUrl: string
      imageMovilUrl: string
    }
    expect(promo.imageDesktopUrl).toBe('https://cdn.test/media/100.jpg')
    expect(promo.imageTabletUrl).toBe('https://cdn.test/media/200.jpg')
    expect(promo.imageMovilUrl).toBe('https://cdn.test/media/300.jpg')
  })

  it('falls back tablet/mobile to the desktop URL when IDs are identical', async () => {
    mockUpstream(SINGLE_WP_PROMOTION)
    const promo = (await run()).promotions[0] as {
      imageDesktopUrl: string
      imageTabletUrl: string
      imageMovilUrl: string
    }
    expect(promo.imageDesktopUrl).toBe('https://cdn.test/media/29.jpg')
    expect(promo.imageTabletUrl).toBe('https://cdn.test/media/29.jpg')
    expect(promo.imageMovilUrl).toBe('https://cdn.test/media/29.jpg')
  })

  it('falls back tablet/mobile to desktop when their media ID is null', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (isMediaBatch(url)) return Promise.resolve(makeMediaBatchResponse(url))
      return Promise.resolve(
        HOME_WP_PROMOTIONS.map(p => ({
          ...(p as Record<string, unknown>),
          acf: {
            ...(p as { acf: Record<string, unknown> }).acf,
            imagen_desktop: 50,
            imagen_tablet: null,
            imagen_movil: null,
          },
        }))
      )
    })
    const promo = (await run()).promotions[0] as {
      imageDesktopUrl: string
      imageTabletUrl: string
      imageMovilUrl: string
    }
    expect(promo.imageDesktopUrl).toBe('https://cdn.test/media/50.jpg')
    expect(promo.imageTabletUrl).toBe('https://cdn.test/media/50.jpg')
    expect(promo.imageMovilUrl).toBe('https://cdn.test/media/50.jpg')
  })

  // ── Robustness: promos with IDs are NOT dropped on transient media failure ──

  it('KEEPS promos that have configured image IDs even if the media batch FAILS', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    mockFetch.mockImplementation((url: string) => {
      if (isMediaBatch(url)) return Promise.reject(new Error('media timeout'))
      return Promise.resolve(VALID_WP_PROMOTIONS)
    })
    const res = await run()
    // Promos are retained (not permanently dropped) despite the media timeout.
    expect(res.ok).toBe(true)
    expect(res.promotions.map(p => p.id)).toEqual([
      '13',
      '15',
      '11',
      '12',
      '10',
    ])
    // Transient media failure logs at WARN, never ERROR.
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('SKIPS only promos with NO configured image IDs at all, quietly', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    mockUpstream(MIXED_IMAGE_WP_PROMOTIONS)
    const res = await run()
    // Promo 60 has an image ID → kept; promo 58 has all-null IDs → skipped.
    expect(res.promotions.map(p => p.id)).toEqual(['60'])
    expect(res.ok).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('returns [] when ALL promos have no configured image (surface hides)', async () => {
    mockUpstream(HOME_WP_PROMOTIONS_NO_IMAGES)
    const res = await run()
    expect(res.promotions).toHaveLength(0)
    expect(res.ok).toBe(true)
  })

  // ── URL shape + degradation ────────────────────────────────────────────────

  it('requests the pretty-permalink list URL with activa=1&per_page=100 (no home=1)', async () => {
    mockUpstream(VALID_WP_PROMOTIONS)
    await run()
    const listUrl = mockFetch.mock.calls
      .map(call => String(call[0]))
      .find(url => url.includes('/wp-json/wp/v2/promociones'))
    expect(listUrl).toBe(
      'https://cms.example.test/wp-json/wp/v2/promociones?activa=1&per_page=100'
    )
  })

  it('returns { promotions: [], ok: false } and HTTP 200 on upstream failure', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED secret-host'))
    expect(await run()).toEqual({ promotions: [], ok: false })
  })

  it('never leaks the upstream error body on failure', async () => {
    mockFetch.mockRejectedValue(new Error('500 internal: db password leaked'))
    expect(JSON.stringify(await run())).not.toContain('password')
  })

  it('returns { promotions: [], ok: false } for a malformed (non-array) payload', async () => {
    mockUpstream(MALFORMED_WP_RESPONSE)
    expect(await run()).toEqual({ promotions: [], ok: false })
  })
})

// ── ?all=1 code path ──────────────────────────────────────────────────────────

describe('GET /api/v1/content/promotions?all=1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all 5 active promos (no cap) when all=1, newest-first', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (isMediaBatch(url)) return Promise.resolve(makeMediaBatchResponse(url))
      return Promise.resolve(VALID_WP_PROMOTIONS)
    })
    const res = await runAll()
    expect(res.ok).toBe(true)
    expect(res.promotions).toHaveLength(5)
    const ids = res.promotions.map(p => p.id)
    for (const id of ['10', '11', '12', '13', '15']) {
      expect(ids).toContain(id)
    }
    expect(ids).not.toContain('14')
    expect(ids).not.toContain('16')
  })

  it('resolves all media in ONE batched request with all=1', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (isMediaBatch(url)) return Promise.resolve(makeMediaBatchResponse(url))
      return Promise.resolve(VALID_WP_PROMOTIONS)
    })
    await runAll()
    const mediaCalls = mockFetch.mock.calls
      .map(call => String(call[0]))
      .filter(url => url.includes('/wp/v2/media'))
    expect(mediaCalls).toHaveLength(1)
    expect(mediaCalls[0]).toContain('/wp/v2/media?include=')
  })

  it('returns { promotions: [], ok: false } when WP returns an error with all=1', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
    expect(await runAll()).toEqual({ promotions: [], ok: false })
  })

  it('does NOT issue a home=1 query when all=1 is set', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (isMediaBatch(url)) return Promise.resolve(makeMediaBatchResponse(url))
      return Promise.resolve(VALID_WP_PROMOTIONS)
    })
    await runAll()
    const listUrls = mockFetch.mock.calls
      .map(call => String(call[0]))
      .filter(url => url.includes('/wp-json/wp/v2/promociones'))
    expect(listUrls).toHaveLength(1)
    expect(listUrls[0]).not.toContain('home=1')
    expect(listUrls[0]).toContain('activa=1')
  })
})
